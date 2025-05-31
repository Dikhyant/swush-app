import { NETWORK_ENDPOINTS } from '../constants';

interface NetworkEndpoints {
  [key: string]: readonly string[];
}

export class EndpointProvider {
  private static instance: EndpointProvider;
  private endpoints: NetworkEndpoints;
  private currentIndex: Record<string, number> = {};
  private blacklistedEndpoints: Set<string> = new Set();

  private constructor() {
    // Use endpoints from constants
    this.endpoints = NETWORK_ENDPOINTS;

    // Initialize current index for each network
    Object.keys(this.endpoints).forEach(network => {
      this.currentIndex[network] = 0;
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
    const availableEndpoints = networkEndpoints.filter(endpoint => 
      !this.blacklistedEndpoints.has(endpoint)
    );

    // If all endpoints are blacklisted, clear the blacklist and start over
    if (availableEndpoints.length === 0) {
      console.warn(`All endpoints blacklisted for ${network}, clearing blacklist`);
      this.clearBlacklist(network);
      return networkEndpoints[0];
    }

    // Simple round-robin among available endpoints
    const currentIdx = this.currentIndex[network] % availableEndpoints.length;
    const endpoint = availableEndpoints[currentIdx];
    
    // Move to next endpoint for next call
    this.currentIndex[network] = (this.currentIndex[network] + 1) % availableEndpoints.length;
    
    return endpoint;
  }

  public markEndpointFailed(network: string, endpoint: string): void {
    this.blacklistedEndpoints.add(endpoint);
    console.warn(`Blacklisted endpoint for session: ${endpoint}`);
  }

  public clearBlacklist(network?: string): void {
    if (network) {
      // Clear blacklist for specific network
      const networkEndpoints = this.endpoints[network] || [];
      networkEndpoints.forEach(endpoint => {
        this.blacklistedEndpoints.delete(endpoint);
      });
    } else {
      // Clear all blacklisted endpoints
      this.blacklistedEndpoints.clear();
    }
  }

  public getEndpointStatus(network: string): { total: number; available: number; blacklisted: string[] } {
    const networkEndpoints = this.endpoints[network] || [];
    const blacklisted = networkEndpoints.filter(endpoint => this.blacklistedEndpoints.has(endpoint));
    
    return {
      total: networkEndpoints.length,
      available: networkEndpoints.length - blacklisted.length,
      blacklisted
    };
  }
} 