import { TypedApi, PolkadotClient } from 'polkadot-api';
import { polkadot_asset_hub } from '@polkadot-api/descriptors';
import { ApiPromise } from '@polkadot/api';
import { connectPapi, connectPolkadotjs } from './types';
import { RpcEndpointManager } from './Rpc/RpcEndpointManager';
import { NETWORKS_SUPPORTED } from 'services/constants';

type NetworkConnections = {
    assetHub: { api: TypedApi<typeof polkadot_asset_hub>; client: PolkadotClient } | null;
    hydradx: ApiPromise | null;
};

export class ConnectionManager {
    private static instance: ConnectionManager;
    private connections: NetworkConnections = {
        assetHub: null,
        hydradx: null
    };
    private initialized: boolean = false;
    private rpcManager: RpcEndpointManager;

    private constructor() {
        this.rpcManager = RpcEndpointManager.getInstance();
        
        // Listen for RPC endpoint events
        this.rpcManager.on('endpointError', async (event) => {
            console.warn(`RPC endpoint error for ${event.network}: ${event.error}`);
            if (this.initialized) {
                await this.reconnectNetwork(event.network);
            }
        });
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

    private async reconnectNetwork(network: string): Promise<void> {
        try {
            const endpoint = this.rpcManager.getEndpoint(network);
            
            switch (network) {
                case NETWORKS_SUPPORTED.ASSET_HUB:
                    this.connections.assetHub = await connectPapi(endpoint, NETWORKS_SUPPORTED.ASSET_HUB);
                    break;
                case NETWORKS_SUPPORTED.HYDRA_DX:
                    this.connections.hydradx = await connectPolkadotjs(endpoint);
                    break;
            }
            
            console.log(`Reconnected to ${network} using endpoint ${endpoint}`);
        } catch (error) {
            console.error(`Failed to reconnect to ${network}:`, error);
            if (error instanceof Error) {
                this.rpcManager.markEndpointError(network, this.rpcManager.getEndpoint(network), error);
            }
        }
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Initialize Asset Hub connection
            const assetHubEndpoint = this.rpcManager.getEndpoint(NETWORKS_SUPPORTED.ASSET_HUB);
            try {
                this.connections.assetHub = await connectPapi(assetHubEndpoint, NETWORKS_SUPPORTED.ASSET_HUB);
            } catch (error) {
                if (error instanceof Error) {
                    this.rpcManager.markEndpointError('assetHub', assetHubEndpoint, error);
                }
                // Try next endpoint
                const nextAssetHubEndpoint = this.rpcManager.getEndpoint(NETWORKS_SUPPORTED.ASSET_HUB);
                this.connections.assetHub = await connectPapi(nextAssetHubEndpoint, NETWORKS_SUPPORTED.ASSET_HUB);
            }
            
            // Initialize HydraDX connection
            const hydradxEndpoint = this.rpcManager.getEndpoint(NETWORKS_SUPPORTED.HYDRA_DX);
            try {
                this.connections.hydradx = await connectPolkadotjs(hydradxEndpoint);
            } catch (error) {
                if (error instanceof Error) {
                    this.rpcManager.markEndpointError(NETWORKS_SUPPORTED.HYDRA_DX, hydradxEndpoint, error);
                }
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
        try {
            if (this.connections.assetHub) {
                await this.connections.assetHub.client.destroy();
                this.connections.assetHub = null;
            }
            if (this.connections.hydradx) {
                await this.connections.hydradx.disconnect();
                this.connections.hydradx = null;
            }
            
            this.rpcManager.cleanup();
            this.initialized = false;
        } catch (error) {
            console.error('Error during disconnect:', error);
            throw error;
        }
    }
} 