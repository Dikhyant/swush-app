import { TypedApi } from 'polkadot-api';
import { polkadot_asset_hub } from '@polkadot-api/descriptors';
import { ApiPromise } from '@polkadot/api';
import { EndpointProvider } from './EndpointProvider';
import { ConnectionFactory, AssetHubConnection, ConnectionEventCallback } from './ConnectionFactory';
import { CONNECTION_HEALTH_CHECK_INTERVAL, NETWORKS_SUPPORTED } from '../constants';

interface NetworkConnection {
    connection: AssetHubConnection | ApiPromise | null;
    isReady: boolean;
    isConnecting: boolean;
    lastConnected: Date | null;
    consecutiveFailures: number;
    lastError: Error | null;
}

interface ConnectionHealth {
    isHealthy: boolean;
    lastCheck: Date;
    responseTime: number;
}

export class ConnectionManager {
    private static instance: ConnectionManager;
    private connections: Map<string, NetworkConnection> = new Map();
    private connectionHealth: Map<string, ConnectionHealth> = new Map();
    private endpointProvider: EndpointProvider;
    private initialized: boolean = false;
    private isShuttingDown: boolean = false;
    private healthCheckInterval: NodeJS.Timeout | null = null;
    private reconnectionTimeouts: Map<string, NodeJS.Timeout> = new Map();

    private constructor() {
        this.endpointProvider = EndpointProvider.getInstance();
        this.initializeConnections();
        this.setupHealthChecking();
    }

    private initializeConnections(): void {
        Object.values(NETWORKS_SUPPORTED).forEach(network => {
            this.connections.set(network, {
                connection: null,
                isReady: false,
                isConnecting: false,
                lastConnected: null,
                consecutiveFailures: 0,
                lastError: null
            });
            
            this.connectionHealth.set(network, {
                isHealthy: false,
                lastCheck: new Date(0),
                responseTime: 0
            });
        });
    }

    private setupHealthChecking(): void {
        // Simple periodic health check
        this.healthCheckInterval = setInterval(async () => {
            if (!this.isShuttingDown && this.initialized) {
                await this.performHealthChecks();
            }
        }, CONNECTION_HEALTH_CHECK_INTERVAL); // Check every minute
    }

    private async performHealthChecks(): Promise<void> {
        const promises = Array.from(this.connections.keys()).map(async (network) => {
            const connection = this.connections.get(network);
            if (!connection?.isReady || !connection.connection) return;

            try {
                const startTime = Date.now();
                const isValid = await ConnectionFactory.validateConnection(connection.connection, network);
                
                if (!isValid) {
                    throw new Error('Connection validation failed');
                }
                
                const responseTime = Date.now() - startTime;
                
                this.connectionHealth.set(network, {
                    isHealthy: true,
                    lastCheck: new Date(),
                    responseTime
                });
            } catch (error) {
                console.warn(`Health check failed for ${network}:`, error);
                this.connectionHealth.set(network, {
                    isHealthy: false,
                    lastCheck: new Date(),
                    responseTime: 0
                });
                
                // If health check fails, mark connection as not ready and attempt reconnection
                connection.isReady = false;
                this.scheduleReconnection(network);
            }
        });

        await Promise.allSettled(promises);
    }

    // Connection event handler for immediate reconnection
    private handleConnectionEvent: ConnectionEventCallback = (network, event, error) => {
        const connection = this.connections.get(network);
        if (!connection) return;

        switch (event) {
            case 'connected':
                console.log(`${network} connection established`);
                connection.consecutiveFailures = 0;
                connection.lastError = null;
                this.connectionHealth.set(network, {
                    isHealthy: true,
                    lastCheck: new Date(),
                    responseTime: 0
                });
                break;

            case 'disconnected':
                console.warn(`⚠️ ${network} connection lost - scheduling immediate reconnection`);
                connection.isReady = false;
                this.connectionHealth.set(network, {
                    isHealthy: false,
                    lastCheck: new Date(),
                    responseTime: 0
                });
                // Immediate reconnection attempt for disconnections
                this.scheduleReconnection(network, 1000); // 1 second delay
                break;

            case 'error':
                console.error(`❌ ${network} connection error:`, error);
                connection.lastError = error || new Error('Unknown connection error');
                connection.isReady = false;
                this.connectionHealth.set(network, {
                    isHealthy: false,
                    lastCheck: new Date(),
                    responseTime: 0
                });
                // Schedule reconnection with backoff for errors
                this.scheduleReconnection(network);
                break;
        }
    };

    private scheduleReconnection(network: string, customDelay?: number): void {
        // Clear any existing reconnection timeout
        const existingTimeout = this.reconnectionTimeouts.get(network);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        const connectionState = this.connections.get(network);
        if (!connectionState || connectionState.isConnecting || this.isShuttingDown) return;

        // Use custom delay or calculate exponential backoff
        const delay = customDelay || Math.min(
            1000 * Math.pow(2, connectionState.consecutiveFailures),
            30000 // Max 30 seconds
        );

        console.log(`🔄 Scheduling reconnection for ${network} in ${delay}ms (attempt ${connectionState.consecutiveFailures + 1})`);
        
        const timeout = setTimeout(async () => {
            this.reconnectionTimeouts.delete(network);
            if (this.isShuttingDown) return;
            
            try {
                // Clean up existing connection
                await this.cleanupConnection(network);
                // Attempt new connection
                await this.connectToNetwork(network);
            } catch (error) {
                console.error(`Reconnection failed for ${network}:`, error);
                // Will be retried on next health check or connection event
            }
        }, delay);

        this.reconnectionTimeouts.set(network, timeout);
    }

    private async connectToNetwork(network: string): Promise<void> {
        const connectionState = this.connections.get(network);
        if (!connectionState || connectionState.isConnecting) return;

        connectionState.isConnecting = true;
        connectionState.isReady = false;

        try {
            const endpoint = this.endpointProvider.getEndpoint(network);
            console.log(`🔌 Connecting to ${network} via ${endpoint}`);

            let connection: AssetHubConnection | ApiPromise;
            
            switch (network) {
                case NETWORKS_SUPPORTED.ASSET_HUB:
                    connection = await ConnectionFactory.createAssetHubConnection(endpoint, this.handleConnectionEvent);
                    break;
                case NETWORKS_SUPPORTED.HYDRA_DX:
                    connection = await ConnectionFactory.createHydradxConnection(endpoint, this.handleConnectionEvent);
                    break;
                default:
                    throw new Error(`Unsupported network: ${network}`);
            }

            // Validate the connection before marking as ready
            const isValid = await ConnectionFactory.validateConnection(connection, network);
            if (!isValid) {
                throw new Error('Connection validation failed');
            }

            connectionState.connection = connection;
            connectionState.isReady = true;
            connectionState.lastConnected = new Date();
            connectionState.consecutiveFailures = 0;
            connectionState.lastError = null;

            this.connectionHealth.set(network, {
                isHealthy: true,
                lastCheck: new Date(),
                responseTime: 0
            });

            console.log(`Successfully connected to ${network}`);
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Unknown connection error');
            connectionState.consecutiveFailures++;
            connectionState.lastError = err;
            
            // Mark endpoint as failed for this session
            try {
                const failedEndpoint = this.endpointProvider.getEndpoint(network);
                this.endpointProvider.markEndpointFailed(network, failedEndpoint);
            } catch (endpointError) {
                // Ignore endpoint errors here
            }
            
            console.error(`❌ Failed to connect to ${network}:`, err.message);
            throw err;
        } finally {
            connectionState.isConnecting = false;
        }
    }

    private async reconnectNetwork(network: string): Promise<void> {
        // This method is now replaced by scheduleReconnection
        this.scheduleReconnection(network);
    }

    private async cleanupConnection(network: string): Promise<void> {
        const connectionState = this.connections.get(network);
        if (!connectionState?.connection) return;

        try {
            if (network === NETWORKS_SUPPORTED.ASSET_HUB) {
                const connection = connectionState.connection as AssetHubConnection;
                await ConnectionFactory.disconnectAssetHub(connection);
            } else if (network === NETWORKS_SUPPORTED.HYDRA_DX) {
                const api = connectionState.connection as ApiPromise;
                await ConnectionFactory.disconnectHydradx(api);
            }
        } catch (error) {
            console.warn(`Error cleaning up ${network} connection:`, error);
        } finally {
            connectionState.connection = null;
            connectionState.isReady = false;
        }
    }

    public static getInstance(): ConnectionManager {
        if (!ConnectionManager.instance) {
            ConnectionManager.instance = new ConnectionManager();
        }
        return ConnectionManager.instance;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        console.log('Initializing ConnectionManager...');
        
        try {
            // Connect to all networks in parallel
            const connectionPromises = Object.values(NETWORKS_SUPPORTED).map(network => 
                this.connectToNetwork(network)
            );

            await Promise.all(connectionPromises);
            
            this.initialized = true;
            console.log('All network connections initialized successfully');
        } catch (error) {
            console.error('Failed to initialize all connections:', error);
            // Don't throw - some connections might have succeeded
            this.initialized = true; // Mark as initialized even with partial failures
        }
    }

    public async waitForConnection(network: string, timeoutMs: number = 10000): Promise<boolean> {
        const connectionState = this.connections.get(network);
        if (!connectionState) return false;

        // If already ready, return immediately
        if (connectionState.isReady && connectionState.connection) {
            return true;
        }

        // If not connecting, start connection
        if (!connectionState.isConnecting) {
            this.connectToNetwork(network).catch(console.error);
        }

        // Wait for connection with timeout
        const startTime = Date.now();
        while (Date.now() - startTime < timeoutMs) {
            if (connectionState.isReady && connectionState.connection) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return false;
    }

    public getAssetHubApi(): TypedApi<typeof polkadot_asset_hub> | null {
        const connection = this.connections.get(NETWORKS_SUPPORTED.ASSET_HUB);
        if (!connection?.isReady || !connection.connection) {
            return null;
        }
        
        const assetHubConnection = connection.connection as AssetHubConnection;
        return assetHubConnection.api;
    }

    public getHydradxApi(): ApiPromise | null {
        const connection = this.connections.get(NETWORKS_SUPPORTED.HYDRA_DX);
        if (!connection?.isReady || !connection.connection) {
            return null;
        }
        
        return connection.connection as ApiPromise;
    }

    public async getAssetHubApiWithRetry(timeoutMs: number = 5000): Promise<TypedApi<typeof polkadot_asset_hub> | null> {
        // Try to get immediate connection
        const api = this.getAssetHubApi();
        if (api) return api;

        // Wait for connection to become available
        const isReady = await this.waitForConnection(NETWORKS_SUPPORTED.ASSET_HUB, timeoutMs);
        return isReady ? this.getAssetHubApi() : null;
    }

    public async getHydradxApiWithRetry(timeoutMs: number = 5000): Promise<ApiPromise | null> {
        // Try to get immediate connection
        const api = this.getHydradxApi();
        if (api) return api;

        // Wait for connection to become available
        const isReady = await this.waitForConnection(NETWORKS_SUPPORTED.HYDRA_DX, timeoutMs);
        return isReady ? this.getHydradxApi() : null;
    }

    public getConnectionStatus(): Record<string, { isReady: boolean; isHealthy: boolean; lastError: string | null; endpointStatus?: any; consecutiveFailures?: number }> {
        const status: Record<string, { isReady: boolean; isHealthy: boolean; lastError: string | null; endpointStatus?: any; consecutiveFailures?: number }> = {};
        
        for (const [network, connection] of this.connections) {
            const health = this.connectionHealth.get(network);
            const endpointStatus = this.endpointProvider.getEndpointStatus(network);
            
            status[network] = {
                isReady: connection.isReady,
                isHealthy: health?.isHealthy || false,
                lastError: connection.lastError?.message || null,
                endpointStatus,
                consecutiveFailures: connection.consecutiveFailures
            };
        }
        
        return status;
    }

    public isInitialized(): boolean {
        return this.initialized;
    }

    public async disconnect(): Promise<void> {
        this.isShuttingDown = true;
        
        // Clear health check interval
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }

        // Clear all reconnection timeouts
        for (const timeout of this.reconnectionTimeouts.values()) {
            clearTimeout(timeout);
        }
        this.reconnectionTimeouts.clear();

        try {
            // Cleanup all connections
            const cleanupPromises = Array.from(this.connections.keys()).map(network => 
                this.cleanupConnection(network)
            );
            await Promise.all(cleanupPromises);
            
            this.initialized = false;
            console.log('ConnectionManager disconnected successfully');
        } catch (error) {
            console.error('Error during ConnectionManager disconnect:', error);
            throw error;
        } finally {
            this.isShuttingDown = false;
        }
    }
} 