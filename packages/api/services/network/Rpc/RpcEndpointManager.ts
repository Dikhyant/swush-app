import { NetworkConfig, DEFAULT_RPC_CONFIG, RpcEndpoint } from './rpc-config';
import { HEALTH_CHECK } from '../../constants';
import EventEmitter from 'events';
import WebSocket from 'ws';

interface EndpointEvent {
  network: string;
  url: string;
  error?: string;
  nextUrl?: string;
}

interface EndpointHealth {
  lastCheck: Date;
  isHealthy: boolean;
  consecutiveFailures: number;
  lastError?: string;
}

export class RpcEndpointManager extends EventEmitter {
  private static instance: RpcEndpointManager;
  private networkConfigs: Record<string, NetworkConfig>;
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private endpointHealth: Map<string, EndpointHealth> = new Map();
  private isShuttingDown: boolean = false;

  private constructor(config?: Record<string, NetworkConfig>) {
    super();
    this.networkConfigs = config || DEFAULT_RPC_CONFIG;
    this.initializeEndpointHealth();
    this.setupHealthChecks();
  }

  private initializeEndpointHealth(): void {
    Object.entries(this.networkConfigs).forEach(([_, config]) => {
      config.endpoints.forEach(endpoint => {
        this.endpointHealth.set(endpoint.url, {
          lastCheck: new Date(0),
          isHealthy: true,
          consecutiveFailures: 0
        });
      });
    });
  }

  public static getInstance(config?: Record<string, NetworkConfig>): RpcEndpointManager {
    if (!RpcEndpointManager.instance) {
      RpcEndpointManager.instance = new RpcEndpointManager(config);
    }
    return RpcEndpointManager.instance;
  }

  private setupHealthChecks(): void {
    Object.entries(this.networkConfigs).forEach(([network, config]) => {
      const interval = setInterval(() => {
        if (!this.isShuttingDown) {
          this.checkEndpointsHealth(network).catch(console.error);
        }
      }, config.healthCheck.interval);
      
      this.healthCheckIntervals.set(network, interval);
    });
  }

  private async checkEndpointsHealth(network: string): Promise<void> {
    const config = this.networkConfigs[network];
    if (!config) return;

    for (const endpoint of config.endpoints) {
      const health = this.endpointHealth.get(endpoint.url);
      if (!health) continue;

      // Skip check if it's too soon (prevent hammering)
      const timeSinceLastCheck = Date.now() - health.lastCheck.getTime();
      if (timeSinceLastCheck < config.healthCheck.interval * 0.8) continue;

      try {
        await this.checkSingleEndpoint(endpoint.url);
        
        // Reset health on success
        health.isHealthy = true;
        health.consecutiveFailures = 0;
        health.lastError = undefined;
        health.lastCheck = new Date();

        // Emit recovery if it was previously unhealthy
        if (health.consecutiveFailures > 0) {
          this.emit('endpointRecovered', {
            network,
            url: endpoint.url
          });
        }
      } catch (error) {
        health.isHealthy = false;
        health.consecutiveFailures++;
        health.lastError = error instanceof Error ? error.message : 'Unknown error';
        health.lastCheck = new Date();

        this.emit('endpointError', {
          network,
          url: endpoint.url,
          error: health.lastError
        });
      }
    }
  }

  private async checkSingleEndpoint(url: string): Promise<void> {
    const ws = new WebSocket(url);
    let isConnectionClosed = false;

    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (!isConnectionClosed) {
            ws.close();
            reject(new Error('Health check timeout'));
          }
        }, HEALTH_CHECK.TIMEOUT);

        ws.onopen = () => {
          ws.send(JSON.stringify({
            id: 1,
            jsonrpc: '2.0',
            method: 'system_health',
            params: []
          }));
        };

        ws.onmessage = (event) => {
          try {
            const response = JSON.parse(event.data.toString());
            if (response.result || response.error) {
              clearTimeout(timeout);
              isConnectionClosed = true;
              ws.close();
              resolve();
            }
          } catch (error) {
            clearTimeout(timeout);
            isConnectionClosed = true;
            ws.close();
            reject(new Error('Invalid response from node'));
          }
        };

        ws.onerror = (event) => {
          clearTimeout(timeout);
          isConnectionClosed = true;
          ws.close();
          reject(new Error(event.message || 'WebSocket connection failed'));
        };

        ws.onclose = (event) => {
          if (!isConnectionClosed) {
            clearTimeout(timeout);
            isConnectionClosed = true;
            reject(new Error(`Connection closed with code ${event.code}: ${event.reason || 'Unknown reason'}`));
          }
        };
      });
    } finally {
      if (!isConnectionClosed) {
        try {
          ws.close();
        } catch (error) {
          console.warn('Error closing WebSocket:', error);
        }
      }
    }
  }

  public getEndpoint(network: string): string {
    const config = this.networkConfigs[network];
    if (!config) {
      throw new Error(`No configuration found for network: ${network}`);
    }

    // Get healthy endpoints sorted by priority
    const healthyEndpoints = config.endpoints
      .filter(e => {
        const health = this.endpointHealth.get(e.url);
        return health?.isHealthy;
      })
      .sort((a, b) => a.priority - b.priority);

    if (healthyEndpoints.length > 0) {
      return healthyEndpoints[0].url;
    }

    // If no healthy endpoints, try the highest priority one
    const fallbackEndpoint = [...config.endpoints]
      .sort((a, b) => a.priority - b.priority)[0];

    if (!fallbackEndpoint) {
      throw new Error(`No endpoints available for network: ${network}`);
    }

    return fallbackEndpoint.url;
  }

  public cleanup(): void {
    this.isShuttingDown = true;
    
    // Clear all health check intervals
    for (const interval of this.healthCheckIntervals.values()) {
      clearInterval(interval);
    }
    this.healthCheckIntervals.clear();
    
    // Reset health states
    this.endpointHealth.clear();
    this.initializeEndpointHealth();
    
    this.isShuttingDown = false;
  }
} 