export const CACHE_KEYS = {
  ASSET_HUB_ASSETS: 'asset_hub_assets',
  MERGED_ASSETS: 'merged_assets',
  TOKEN_GRAPH: 'token_graph',
  ASSET_HUB_ROUTER: 'asset_hub_router'
};

export const NETWORKS_SUPPORTED = {
  ASSET_HUB: 'asset_hub',
  HYDRA_DX: 'hydra_dx'
} as const;

// Network endpoints configuration
export const NETWORK_ENDPOINTS = {
  [NETWORKS_SUPPORTED.ASSET_HUB]: [
    'wss://polkadot-asset-hub-rpc.polkadot.io',
    'wss://asset-hub-polkadot.dotters.network',
    'wss://sys.ibp.network/asset-hub-polkadot'
  ],
  [NETWORKS_SUPPORTED.HYDRA_DX]: [
    'wss://rpc.hydradx.cloud',
    'wss://hydradx.api.onfinality.io/public-ws',
    'wss://hydradx-rpc.dwellir.com'
  ]
} as const;

export const NUMBER_FORMAT_OPTIONS = { round: 2, trim: true, commify: false };

// Time constants in milliseconds
export const HEALTH_CHECK = {
  INTERVAL: 60 * 1000,        // Check every 1 minute for more responsive health monitoring
  TIMEOUT: 10000,             // 10 seconds timeout for health checks
  REACTIVATION: 2 * 60 * 1000 // Reactivate after 2 minutes for faster recovery
} as const;

// Connection management constants
export const CONNECTION_CONFIG = {
  MAX_RECONNECT_ATTEMPTS: 5,     // Reasonable number of attempts
  BASE_RECONNECT_DELAY: 2000,    // 2 seconds base delay
  MAX_RECONNECT_DELAY: 30000,    // 30 seconds max delay
  ATTEMPT_RESET_TIMEOUT: 120000, // 2 minutes reset period
  CONNECTION_TIMEOUT: 45000      // 45 seconds for initial connection (increased from 30s)
} as const;

// Legacy RPC configuration for frontend compatibility - TODO: Remove when frontend is updated
export const RPC_ENDPOINTS = {
  [NETWORKS_SUPPORTED.ASSET_HUB]: {
    endpoints: [
      { url: 'wss://polkadot-asset-hub-rpc.polkadot.io', priority: 1, isActive: true },
    ],
    currentIndex: 0,
    healthCheck: {
      interval: HEALTH_CHECK.INTERVAL,
      timeout: HEALTH_CHECK.TIMEOUT,
    },
  },
  [NETWORKS_SUPPORTED.HYDRA_DX]: {
    endpoints: [
      { url: 'wss://rpc.hydradx.cloud', priority: 1, isActive: true },
    ],
    currentIndex: 0,
    healthCheck: {
      interval: HEALTH_CHECK.INTERVAL,
      timeout: HEALTH_CHECK.TIMEOUT,
    },
  },
}; 