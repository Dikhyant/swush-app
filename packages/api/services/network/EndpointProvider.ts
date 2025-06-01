import { NETWORK_ENDPOINTS } from '../constants';

interface NetworkEndpoints {
  [key: string]: readonly string[];
}

interface EndpointState {
  lastUsed: Date;
  failureCount: number;
  isBlacklisted: boolean;
}

export class EndpointProvider {
  private static instance: EndpointProvider;
  private endpoints: NetworkEndpoints;
  private currentIndex: Record<string, number> = {};
  private endpointStates: Map<string, EndpointState> = new Map();
  private lastEndpointUsed: Record<string, string> = {};

  private constructor() {
    // Use endpoints from constants
    this.endpoints = NETWORK_ENDPOINTS;

    // Initialize current index and endpoint states for each network
    Object.keys(this.endpoints).forEach(network => {
      this.currentIndex[network] = 0;
      this.lastEndpointUsed[network] = '';
      
      // Initialize endpoint states
      this.endpoints[network].forEach(endpoint => {
        this.endpointStates.set(endpoint, {
          lastUsed: new Date(0),
          failureCount: 0,
          isBlacklisted: false
        });
      });
    });
  }

  public static getInstance(): EndpointProvider {
    if (!EndpointProvider.instance) {
      EndpointProvider.instance = new EndpointProvider();
    }
    return EndpointProvider.instance;
  }

  public getEndpoint(network: string): string {
    const networkEndpoints = this.endpoints[network];
    if (!networkEndpoints || networkEndpoints.length === 0) {
      throw new Error(`No endpoints configured for network: ${network}`);
    }

    // Get available (non-blacklisted) endpoints
    const availableEndpoints = networkEndpoints.filter(endpoint => {
      const state = this.endpointStates.get(endpoint);
      return !state?.isBlacklisted;
    });

    // If all endpoints are blacklisted, find the one with oldest failure and retry it
    if (availableEndpoints.length === 0) {
      console.warn(`All endpoints blacklisted for ${network}, finding oldest failure to retry`);
      const oldestFailure = this.findOldestFailedEndpoint(network);
      if (oldestFailure) {
        this.resetEndpointState(oldestFailure);
        console.log(`Retrying previously failed endpoint: ${oldestFailure}`);
        return oldestFailure;
      }
      // Fallback: clear all blacklists and use first endpoint
      this.clearBlacklist(network);
      return networkEndpoints[0];
    }

    // Smart endpoint selection: avoid recently used endpoints if possible
    let selectedEndpoint: string;
    
    if (availableEndpoints.length === 1) {
      selectedEndpoint = availableEndpoints[0];
    } else {
      // Try to avoid the last used endpoint if we have alternatives
      const lastUsed = this.lastEndpointUsed[network];
      const alternativeEndpoints = availableEndpoints.filter(ep => ep !== lastUsed);
      
      if (alternativeEndpoints.length > 0) {
        // Use round-robin among alternatives
        const idx = this.currentIndex[network] % alternativeEndpoints.length;
        selectedEndpoint = alternativeEndpoints[idx];
        this.currentIndex[network] = (this.currentIndex[network] + 1) % alternativeEndpoints.length;
      } else {
        // All alternatives exhausted, use round-robin on all available
        const idx = this.currentIndex[network] % availableEndpoints.length;
        selectedEndpoint = availableEndpoints[idx];
        this.currentIndex[network] = (this.currentIndex[network] + 1) % availableEndpoints.length;
      }
    }

    // Update last used tracking
    this.lastEndpointUsed[network] = selectedEndpoint;
    const state = this.endpointStates.get(selectedEndpoint);
    if (state) {
      state.lastUsed = new Date();
    }

    return selectedEndpoint;
  }

  public markEndpointFailed(network: string, endpoint: string): void {
    const state = this.endpointStates.get(endpoint);
    if (state) {
      state.failureCount++;
      state.isBlacklisted = true;
      state.lastUsed = new Date();
      console.warn(`Blacklisted endpoint for session: ${endpoint} (failure count: ${state.failureCount})`);
    }
  }

  private findOldestFailedEndpoint(network: string): string | null {
    const networkEndpoints = this.endpoints[network] || [];
    let oldestEndpoint: string | null = null;
    let oldestTime = new Date();

    for (const endpoint of networkEndpoints) {
      const state = this.endpointStates.get(endpoint);
      if (state?.isBlacklisted && state.lastUsed < oldestTime) {
        oldestTime = state.lastUsed;
        oldestEndpoint = endpoint;
      }
    }

    return oldestEndpoint;
  }

  private resetEndpointState(endpoint: string): void {
    const state = this.endpointStates.get(endpoint);
    if (state) {
      state.isBlacklisted = false;
      state.lastUsed = new Date(0);
      // Keep failure count for statistics but allow retry
    }
  }

  public clearBlacklist(network?: string): void {
    if (network) {
      // Clear blacklist for specific network
      const networkEndpoints = this.endpoints[network] || [];
      networkEndpoints.forEach(endpoint => {
        const state = this.endpointStates.get(endpoint);
        if (state) {
          state.isBlacklisted = false;
          state.lastUsed = new Date(0);
        }
      });
    } else {
      // Clear all blacklisted endpoints
      this.endpointStates.forEach(state => {
        state.isBlacklisted = false;
        state.lastUsed = new Date(0);
      });
    }
  }

  public getEndpointStatus(network: string): { 
    total: number; 
    available: number; 
    blacklisted: string[];
    endpointDetails: Record<string, { failureCount: number; lastUsed: string; isBlacklisted: boolean }>;
  } {
    const networkEndpoints = this.endpoints[network] || [];
    const blacklisted = networkEndpoints.filter(endpoint => {
      const state = this.endpointStates.get(endpoint);
      return state?.isBlacklisted;
    });
    
    const endpointDetails: Record<string, { failureCount: number; lastUsed: string; isBlacklisted: boolean }> = {};
    networkEndpoints.forEach(endpoint => {
      const state = this.endpointStates.get(endpoint);
      endpointDetails[endpoint] = {
        failureCount: state?.failureCount || 0,
        lastUsed: state?.lastUsed.toISOString() || 'never',
        isBlacklisted: state?.isBlacklisted || false
      };
    });
    
    return {
      total: networkEndpoints.length,
      available: networkEndpoints.length - blacklisted.length,
      blacklisted,
      endpointDetails
    };
  }
} 