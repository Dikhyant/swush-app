import type { Asset } from '@swush/api';
import { NETWORKS_SUPPORTED } from '@/services/constants';

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || 'localhost';
const API_VERSION = 'v1';
const API_PORT = '3001';
const API_BASE_URL = `http://${API_HOST}:${API_PORT}/api/${API_VERSION}`;

interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  errors?: Array<{
    message: string;
  }>;
}

export interface AssetWithId extends Asset {
  id: string;
}

// New types for route finding and balances
export interface RouteQuote {
  path: string[];
  expectedOutput: {
    raw: string;
    decimal: string;
  };
  hops: {
    from: string;
    to: string;
    amountIn: string;
    amountOut: string;
  }[];
  dex: typeof NETWORKS_SUPPORTED.ASSET_HUB | typeof NETWORKS_SUPPORTED.HYDRA_DX;
}

export interface Balance {
  balance: number;
  status: string;
  reason: string;
  extra: any;
}

export interface BatchBalanceResponse {
  status: 'success' | 'error';
  request: { 
    address: string; 
    assetId: string; 
  };
  data?: Balance;
  error?: string;
}

export const api = {
  assets: {
    getAll: async (forceRefresh = false): Promise<AssetWithId[]> => {
      const response = await fetch(
        `${API_BASE_URL}/assets${forceRefresh ? '?forceRefresh=true' : ''}`
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch assets');
      }

      const result: ApiResponse<AssetWithId[]> = await response.json();
      
      if (result.status === 'error' || !result.data) {
        throw new Error(result.message || 'Failed to fetch assets');
      }

      return result.data;
    },

    findRoute: async (params: {
      fromAsset: string;
      toAsset: string;
      amountIn: string;
    }): Promise<RouteQuote> => {
      const response = await fetch(`${API_BASE_URL}/assets/find-route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to find route');
      }

      const result: ApiResponse<RouteQuote> = await response.json();
      
      if (result.status === 'error' || !result.data) {
        throw new Error(result.message || 'Failed to find route');
      }

      return result.data;
    }
  },

  // Balance methods now import from the local BalanceService
  // They're kept here for API compatibility
  balances: {
    get: async (address: string, assetId: string): Promise<Balance> => {
      // Importing here to avoid circular dependencies
      const { BalanceService } = await import('../services/balances/BalanceService');
      const balanceService = BalanceService.getInstance();
      
      try {
        return await balanceService.getBalance({ address, assetId });
      } catch (error) {
        console.error('Error fetching balance:', error);
        throw error;
      }
    },

    batch: async (params: {
      requests: Array<{ address: string; assetId: string; }>;
    }): Promise<BatchBalanceResponse[]> => {
      // Importing here to avoid circular dependencies
      const { BalanceService } = await import('../services/balances/BalanceService');
      const balanceService = BalanceService.getInstance();

      try {
        const results = await balanceService.getBalances(params.requests);
        
        // Convert to the expected format
        return params.requests.map(req => {
          const key = `${req.address}-${req.assetId}`;
          const balanceData = results[key];
          
          if (!balanceData) {
            return {
              status: 'error',
              request: req,
              error: 'Failed to fetch balance'
            };
          }
          
          return {
            status: 'success',
            request: req,
            data: balanceData
          };
        });
      } catch (error) {
        console.error('Error fetching balances:', error);
        throw error;
      }
    }
  }
}; 