import { TypedApi, PolkadotClient, ChainDefinition } from 'polkadot-api';
import { 
    polkadot_asset_hub,
    hydration 
} from '@polkadot-api/descriptors';
import { NETWORKS_SUPPORTED } from '../constants';
import { ApiPromise } from '@polkadot/api';

// Define chain descriptors mapping
export const CHAIN_DESCRIPTORS: {
    [NETWORKS_SUPPORTED.ASSET_HUB]: typeof polkadot_asset_hub,
    [NETWORKS_SUPPORTED.HYDRA_DX]: typeof hydration
} = {
    [NETWORKS_SUPPORTED.ASSET_HUB]: polkadot_asset_hub,
    [NETWORKS_SUPPORTED.HYDRA_DX]: hydration,
} as const;

// Define supported chains type from descriptors
export type SupportedChains = typeof CHAIN_DESCRIPTORS[keyof typeof CHAIN_DESCRIPTORS];

// Define network type from NETWORKS_SUPPORTED
export type NetworkType = typeof NETWORKS_SUPPORTED[keyof typeof NETWORKS_SUPPORTED];

export interface PapiConnection<T extends ChainDefinition = SupportedChains> {
    api: TypedApi<T>;
    client: PolkadotClient;
}

// Type guard
export function isPapiConnection(result: unknown): result is PapiConnection {
    return Boolean(result && typeof result === 'object' && 'api' in result && 'client' in result);
}

// Generic connection creator
export function createConnection<T extends NetworkType>(
    connection: { api: TypedApi<any>; client: PolkadotClient }
): PapiConnection<typeof CHAIN_DESCRIPTORS[T]> {
    return {
        api: connection.api as TypedApi<typeof CHAIN_DESCRIPTORS[T]>,
        client: connection.client
    };
}

// Note: Connection functions moved to ConnectionFactory
// This file now only contains type definitions


