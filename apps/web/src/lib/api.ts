import type { Asset } from '@swush/core';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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
    }
  }
}; 