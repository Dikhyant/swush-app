import { TypedApi, PolkadotClient } from 'polkadot-api';
import { polkadot_asset_hub } from '@polkadot-api/descriptors';
import { ApiPromise } from '@polkadot/api';
import { connectPapi, connectPolkadotjs } from './types';
import { RpcEndpointManager } from './Rpc/RpcEndpointManager';
import { NETWORKS_SUPPORTED, CONNECTION_CONFIG } from '@/constants';

type NetworkConnections = {
    assetHub: { api: TypedApi<typeof polkadot_asset_hub>; client: PolkadotClient } | null;
    hydradx: ApiPromise | null;
};

type ConnectionState = {
    isConnecting: boolean;
    lastError?: Error;
    lastAttempt?: Date;
    consecutiveFailures: number;
};

export class ConnectionManager {
    private static instance: ConnectionManager;
    private connections: NetworkConnections = {
        assetHub: null,
        hydradx: null
    };
    private initialized: boolean = false;
    private rpcManager: RpcEndpointManager;
    private connectionStates: Map<string, ConnectionState> = new Map();
    private reconnectTimeouts: Record<string, NodeJS.Timeout> = {};
    private isShuttingDown: boolean = false;

    private constructor() {
        this.rpcManager = RpcEndpointManager.getInstance();
        this.initializeConnectionStates();
        
        // Listen for RPC endpoint events
        this.rpcManager.on('endpointError', async (event) => {
            if (!this.initialized || this.isShuttingDown) return;
            
            const state = this.connectionStates.get(event.network);
            if (!state || state.isConnecting) return; // Prevent recursive handling
            
            console.warn(`RPC endpoint error for ${event.network}: ${event.error}`);
            await this.handleEndpointFailure(event.network, new Error(event.error));
        });

        this.rpcManager.on('endpointRecovered', (event) => {
            const state = this.connectionStates.get(event.network);
            if (state) {
                state.consecutiveFailures = 0;
                state.lastError = undefined;
            }
        });
    }

    private initializeConnectionStates(): void {
        Object.values(NETWORKS_SUPPORTED).forEach(network => {
            this.connectionStates.set(network, {
                isConnecting: false,
                consecutiveFailures: 0
            });
        });
    }

    private shouldAttemptReconnect(network: string): boolean {
        const state = this.connectionStates.get(network);
        if (!state) return false;

        // Check if we're in a circuit breaker state
        if (state.consecutiveFailures >= CONNECTION_CONFIG.MAX_RECONNECT_ATTEMPTS) {
            const lastAttempt = state.lastAttempt?.getTime() || 0;
            const timeSinceLastAttempt = Date.now() - lastAttempt;
            
            // Only retry after the reset timeout
            return timeSinceLastAttempt >= CONNECTION_CONFIG.ATTEMPT_RESET_TIMEOUT;
        }

        return true;
    }

    private calculateBackoff(failures: number): number {
        const baseDelay = CONNECTION_CONFIG.BASE_RECONNECT_DELAY;
        const maxDelay = CONNECTION_CONFIG.MAX_RECONNECT_DELAY;
        const jitter = 0.5 + Math.random() * 0.5; // 50-100% jitter

        return Math.min(
            baseDelay * Math.pow(2, failures) * jitter,
            maxDelay
        );
    }

    private async handleEndpointFailure(network: string, error: Error): Promise<void> {
        const state = this.connectionStates.get(network);
        if (!state || state.isConnecting) return;

        state.lastError = error;
        state.lastAttempt = new Date();
        state.consecutiveFailures++;

        // Clear any existing reconnection timeout
        if (this.reconnectTimeouts[network]) {
            clearTimeout(this.reconnectTimeouts[network]);
        }

        if (this.shouldAttemptReconnect(network)) {
            const delay = this.calculateBackoff(state.consecutiveFailures);
            console.log(`Scheduling reconnection for ${network} in ${delay}ms (attempt ${state.consecutiveFailures})`);
            
            this.reconnectTimeouts[network] = setTimeout(async () => {
                if (this.isShuttingDown) return;
                await this.reconnectNetwork(network);
            }, delay);
        } else {
            console.error(`Max reconnection attempts reached for ${network}, circuit breaker engaged`);
            // Reset after the timeout
            setTimeout(() => {
                const currentState = this.connectionStates.get(network);
                if (currentState) {
                    currentState.consecutiveFailures = 0;
                    this.reconnectNetwork(network).catch(console.error);
                }
            }, CONNECTION_CONFIG.ATTEMPT_RESET_TIMEOUT);
        }
    }

    private async reconnectNetwork(network: string): Promise<void> {
        const state = this.connectionStates.get(network);
        if (!state || state.isConnecting || this.isShuttingDown) return;

        try {
            state.isConnecting = true;
            
            // Get a new endpoint, potentially different from the failed one
            const endpoint = this.rpcManager.getEndpoint(network);
            console.log(`Attempting to reconnect to ${network} using endpoint ${endpoint}`);
            
            // Cleanup existing connection
            await this.cleanupConnection(network);
            
            switch (network) {
                case NETWORKS_SUPPORTED.ASSET_HUB:
                    this.connections.assetHub = await connectPapi(endpoint, NETWORKS_SUPPORTED.ASSET_HUB);
                    break;
                case NETWORKS_SUPPORTED.HYDRA_DX:
                    this.connections.hydradx = await connectPolkadotjs(endpoint);
                    break;
            }
            
            // Reset state on successful connection
            state.consecutiveFailures = 0;
            state.lastError = undefined;
            console.log(`Successfully reconnected to ${network} using endpoint ${endpoint}`);
        } catch (error) {
            console.error(`Failed to reconnect to ${network}:`, error);
            if (error instanceof Error) {
                await this.handleEndpointFailure(network, error);
            }
        } finally {
            state.isConnecting = false;
        }
    }

    private async cleanupConnection(network: string): Promise<void> {
        try {
            switch (network) {
                case NETWORKS_SUPPORTED.ASSET_HUB:
                    if (this.connections.assetHub?.client) {
                        await this.connections.assetHub.client.destroy();
                        this.connections.assetHub = null;
                    }
                    break;
                case NETWORKS_SUPPORTED.HYDRA_DX:
                    if (this.connections.hydradx) {
                        await this.connections.hydradx.disconnect();
                        this.connections.hydradx = null;
                    }
                    break;
            }
        } catch (error) {
            console.warn(`Error during connection cleanup for ${network}:`, error);
        }
    }

    public static getInstance(): ConnectionManager {
        if (!ConnectionManager.instance) {
            ConnectionManager.instance = new ConnectionManager();
        }
        return ConnectionManager.instance;
    }

    public isInitialized(): boolean {
        return this.initialized;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Initialize Asset Hub connection
            const assetHubEndpoint = this.rpcManager.getEndpoint(NETWORKS_SUPPORTED.ASSET_HUB);
            try {
                this.connections.assetHub = await connectPapi(assetHubEndpoint, NETWORKS_SUPPORTED.ASSET_HUB);
            } catch (error) {
                console.error('Failed to connect to primary Asset Hub endpoint:', error);
                // Try next endpoint
                const nextAssetHubEndpoint = this.rpcManager.getEndpoint(NETWORKS_SUPPORTED.ASSET_HUB);
                this.connections.assetHub = await connectPapi(nextAssetHubEndpoint, NETWORKS_SUPPORTED.ASSET_HUB);
            }
            
            // Initialize HydraDX connection
            const hydradxEndpoint = this.rpcManager.getEndpoint(NETWORKS_SUPPORTED.HYDRA_DX);
            try {
                this.connections.hydradx = await connectPolkadotjs(hydradxEndpoint);
            } catch (error) {
                console.error('Failed to connect to primary HydraDX endpoint:', error);
                // Try next endpoint
                const nextHydradxEndpoint = this.rpcManager.getEndpoint(NETWORKS_SUPPORTED.HYDRA_DX);
                this.connections.hydradx = await connectPolkadotjs(nextHydradxEndpoint);
            }
            
            this.initialized = true;
            console.log('All network connections initialized');
        } catch (error) {
            console.error('Failed to initialize connections:', error);
            throw error;
        }
    }

    public getAssetHubApi(): TypedApi<typeof polkadot_asset_hub> | null {
        return this.connections.assetHub?.api || null;
    }

    public getHydradxApi(): ApiPromise | null {
        return this.connections.hydradx;
    }

    public async disconnect(): Promise<void> {
        this.isShuttingDown = true;

        try {
            // Clear all reconnection timeouts
            Object.values(this.reconnectTimeouts).forEach(timeout => clearTimeout(timeout));
            this.reconnectTimeouts = {};

            // Cleanup all connections
            await Promise.all(
                Object.values(NETWORKS_SUPPORTED).map(network => this.cleanupConnection(network))
            );
            
            this.rpcManager.cleanup();
            this.initialized = false;
            this.initializeConnectionStates();
        } catch (error) {
            console.error('Error during disconnect:', error);
            throw error;
        } finally {
            this.isShuttingDown = false;
        }
    }
} 