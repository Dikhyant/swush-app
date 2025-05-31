import { TypedApi, PolkadotClient, createClient } from 'polkadot-api';
import { polkadot_asset_hub } from '@polkadot-api/descriptors';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { getWsProvider } from 'polkadot-api/ws-provider/node';
import { withPolkadotSdkCompat } from 'polkadot-api/polkadot-sdk-compat';
import { NETWORKS_SUPPORTED, CONNECTION_TIMEOUT } from '../constants';

export interface AssetHubConnection {
  api: TypedApi<typeof polkadot_asset_hub>;
  client: PolkadotClient;
}

// Callback type for connection events
export type ConnectionEventCallback = (network: string, event: 'connected' | 'disconnected' | 'error', error?: Error) => void;

export class ConnectionFactory {
  
  public static async createAssetHubConnection(
    endpoint: string, 
    onConnectionEvent?: ConnectionEventCallback
  ): Promise<AssetHubConnection> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), CONNECTION_TIMEOUT);
    });

    const connectionPromise = async (): Promise<AssetHubConnection> => {
      try {
        const wsProvider = getWsProvider(endpoint);
        const client = createClient(withPolkadotSdkCompat(wsProvider));
        const api = client.getTypedApi(polkadot_asset_hub);

        // Basic validation
        if (!api || !client) {
          throw new Error('Failed to create API or client');
        }

        // Set up connection event monitoring for PAPI
        if (onConnectionEvent) {
          // PAPI doesn't have direct connection events, but we can monitor the client
          // We'll rely on health checks and validation for PAPI connections
          onConnectionEvent(NETWORKS_SUPPORTED.ASSET_HUB, 'connected');
        }

        return { api, client };
      } catch (error) {
        if (onConnectionEvent) {
          onConnectionEvent(NETWORKS_SUPPORTED.ASSET_HUB, 'error', error instanceof Error ? error : new Error('Unknown error'));
        }
        throw new Error(`Failed to create Asset Hub connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    return Promise.race([connectionPromise(), timeoutPromise]);
  }

  public static async createHydradxConnection(
    endpoint: string,
    onConnectionEvent?: ConnectionEventCallback
  ): Promise<ApiPromise> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), CONNECTION_TIMEOUT);
    });

    const connectionPromise = async (): Promise<ApiPromise> => {
      try {
        const provider = new WsProvider(endpoint, 2000);
        
        const api = await ApiPromise.create({
          provider,
          throwOnConnect: true,
          noInitWarn: true,
        });

        await api.isReady;

        // Set up connection event listeners for Polkadot.js
        if (onConnectionEvent) {
          api.on('connected', () => {
            console.log(`HydraDX connected to ${endpoint}`);
            onConnectionEvent(NETWORKS_SUPPORTED.HYDRA_DX, 'connected');
          });

          api.on('disconnected', () => {
            console.warn(`HydraDX disconnected from ${endpoint}`);
            onConnectionEvent(NETWORKS_SUPPORTED.HYDRA_DX, 'disconnected');
          });

          api.on('error', (error: Error) => {
            console.error(`HydraDX connection error on ${endpoint}:`, error);
            onConnectionEvent(NETWORKS_SUPPORTED.HYDRA_DX, 'error', error);
          });

          // Initial connected event
          onConnectionEvent(NETWORKS_SUPPORTED.HYDRA_DX, 'connected');
        }

        return api;
      } catch (error) {
        if (onConnectionEvent) {
          onConnectionEvent(NETWORKS_SUPPORTED.HYDRA_DX, 'error', error instanceof Error ? error : new Error('Unknown error'));
        }
        throw new Error(`Failed to create HydraDX connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    return Promise.race([connectionPromise(), timeoutPromise]);
  }

  public static async validateConnection(connection: any, network: string): Promise<boolean> {
    try {
      if (network === NETWORKS_SUPPORTED.ASSET_HUB) {
        // For Asset Hub (PAPI), check if AssetConversionApi is accessible
        const assetHubConn = connection as AssetHubConnection;
        if (!assetHubConn?.api?.apis?.AssetConversionApi) {
          return false;
        }
        return true;
      } 
      
      if (network === NETWORKS_SUPPORTED.HYDRA_DX) {
        // For HydraDX (Polkadot.js), check if connected
        const hydraApi = connection as ApiPromise;
        return hydraApi?.isConnected === true;
      }

      return false;
    } catch (error) {
      console.warn(`Connection validation failed for ${network}:`, error);
      return false;
    }
  }

  public static async disconnectAssetHub(connection: AssetHubConnection): Promise<void> {
    try {
      await Promise.race([
        connection.client?.destroy(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Disconnect timeout')), 5000))
      ]);
    } catch (error) {
      console.warn('Error disconnecting Asset Hub connection:', error);
    }
  }

  public static async disconnectHydradx(connection: ApiPromise): Promise<void> {
    try {
      await Promise.race([
        connection?.disconnect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Disconnect timeout')), 5000))
      ]);
    } catch (error) {
      console.warn('Error disconnecting HydraDX connection:', error);
    }
  }
} 