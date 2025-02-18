import { z } from 'zod';

// Time constants in milliseconds
export const HEALTH_CHECK = {
  INTERVAL: 4 * 60 * 1000,    // Check every 4 minutes if RPC endpoint is healthy
  TIMEOUT: 10 * 1000,         // 10 seconds timeout for health checks if RPC doesn't respond then we consider it unhealthy
  REACTIVATION: 10 * 60 * 1000 // Reactivate after 10 minutes, wait for time to recover
} as const;

export const RpcEndpointSchema = z.object({
  url: z.string().url(),
  priority: z.number().int().min(1),
  isActive: z.boolean().default(true),
  lastError: z.string().optional(),
  lastChecked: z.date().optional(),
});

export const NetworkConfigSchema = z.object({
  endpoints: z.array(RpcEndpointSchema),
  currentIndex: z.number().int().min(0).default(0),
  healthCheck: z.object({
    interval: z.number().int().min(1000).default(HEALTH_CHECK.INTERVAL),
    timeout: z.number().int().min(1000).default(HEALTH_CHECK.TIMEOUT),
  }).default({
    interval: HEALTH_CHECK.INTERVAL,
    timeout: HEALTH_CHECK.TIMEOUT,
  }),
});

export type RpcEndpoint = z.infer<typeof RpcEndpointSchema>;
export type NetworkConfig = z.infer<typeof NetworkConfigSchema>;

// Default configuration for different networks
export const DEFAULT_RPC_CONFIG: Record<string, NetworkConfig> = {
  assetHub: {
    endpoints: [
      // Primary endpoints (major providers)
      { url: 'wss://polkadot-asset-hub-rpc.polkadot.io', priority: 1, isActive: true }, // Parity (Official)
      
      // Secondary endpoints (reliable providers)
      { url: 'wss://asset-hub-polkadot.dotters.network', priority: 2, isActive: true }, // IBP2
      { url: 'wss://sys.ibp.network/asset-hub-polkadot', priority: 3, isActive: true }, // IBP1
      { url: 'wss://rpc-asset-hub-polkadot.luckyfriday.io', priority: 4, isActive: true }, // LuckyFriday

      // Tertiary endpoints (additional providers)
       { url: 'wss://asset-hub-polkadot-rpc.dwellir.com', priority: 5, isActive: true }, // Dwellir (Main)
    //   { url: 'wss://statemint-rpc-tn.dwellir.com', priority: 6, isActive: true },       // Dwellir Tunisia
    //   { url: 'wss://statemint.public.curie.radiumblock.co/ws', priority: 7, isActive: true } // RadiumBlock
    ],
    currentIndex: 0,
    healthCheck: {
      interval: HEALTH_CHECK.INTERVAL,
      timeout: HEALTH_CHECK.TIMEOUT,
    },
  },
  hydradx: {
    endpoints: [
      // Primary endpoints (major providers)
      { url: 'wss://rpc.hydradx.cloud', priority: 1, isActive: true },          // Galactic Council (Official)
      { url: 'wss://hydradx-rpc.dwellir.com', priority: 2, isActive: true },    // Dwellir
      
      // Secondary endpoints (reliable providers)
      { url: 'wss://hydradx.paras.ibp.network', priority: 3, isActive: true },  // IBP1
      { url: 'wss://hydration.dotters.network', priority: 4, isActive: true },   // IBP2
      
      // Tertiary endpoint
      { url: 'wss://rpc.helikon.io/hydradx', priority: 5, isActive: true }      // Helikon
    ],
    currentIndex: 0,
    healthCheck: {
      interval: HEALTH_CHECK.INTERVAL,
      timeout: HEALTH_CHECK.TIMEOUT,
    },
  },
}; 