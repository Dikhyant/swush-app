# Network and RPC Architecture

## Overview
The network module provides a robust and fault-tolerant system for managing connections to multiple blockchain networks (Asset Hub, HydraDX) using both Polkadot-JS API and PAPI (Polkadot API). The architecture is designed to handle various failure scenarios, network interruptions, and system events while maintaining connection stability.

## Architecture Components

### 1. Connection Manager (`ConnectionManager.ts`)
The central orchestrator for all network connections, implementing:
- Singleton pattern for global connection management
- Connection state tracking for multiple networks
- Automatic reconnection with exponential backoff
- Error handling and recovery strategies

```typescript
// Usage example
const manager = ConnectionManager.getInstance();
await manager.initialize(); // Sets up connections to all networks
const api = manager.getHydradxApi(); // Get HydraDX connection
```

### 2. RPC Connection (`Rpc/RpcConnection.ts`)
Handles individual RPC connections with:
- Support for both Polkadot-JS and PAPI implementations
- Connection lifecycle management
- Timeout handling
- Event-based connection monitoring

### 3. RPC Endpoint Manager (`Rpc/RpcEndpointManager.ts`)
Manages multiple RPC endpoints per network:
- Health checking of endpoints
- Round-robin endpoint rotation
- Priority-based endpoint selection
- Automatic failover to healthy endpoints

### 4. Type System (`types.ts`)
Provides type safety and runtime validation:
- Network type definitions
- Chain descriptor mappings
- Type guards for connection types
- Generic connection creators

## Connection Flow

1. **Initialization**
   ```
   ConnectionManager
   ├─> Initialize endpoints
   ├─> Setup health checks
   └─> Establish initial connections
   ```

2. **Health Monitoring**
   ```
   RpcEndpointManager
   ├─> Regular health checks
   ├─> Endpoint status updates
   └─> Automatic failover
   ```

3. **Error Recovery**
   ```
   Connection Error
   ├─> Attempt reconnection
   ├─> Exponential backoff
   └─> Switch endpoints if needed
   ```

## Fault Tolerance Features

### 1. Connection Recovery
- Automatic reconnection attempts
- Configurable retry limits
- Exponential backoff with jitter
- Connection state preservation

### 2. Endpoint Management
- Multiple endpoints per network
- Priority-based endpoint selection
- Health-based endpoint rotation
- Automatic failover to healthy endpoints

### 3. Error Handling
- Graceful error recovery
- Detailed error logging
- Connection state tracking
- Resource cleanup on failures

## Configuration

### Network Configuration
```typescript
// Example configuration in constants.ts
export const RPC_ENDPOINTS = {
  ASSET_HUB: {
    endpoints: [
      { url: 'wss://primary-endpoint', priority: 1 },
      { url: 'wss://backup-endpoint', priority: 2 }
    ],
    healthCheck: {
      interval: 60000,  // 1 minute
      timeout: 5000     // 5 seconds
    }
  }
};
```

### Connection Parameters
```typescript
export const CONNECTION_CONFIG = {
  MAX_RECONNECT_ATTEMPTS: 5,
  BASE_RECONNECT_DELAY: 1000,   // 1 second
  MAX_RECONNECT_DELAY: 30000,   // 30 seconds
  ATTEMPT_RESET_TIMEOUT: 30000, // 30 seconds
  CONNECTION_TIMEOUT: 15000     // 15 seconds
};
```

## Best Practices

1. **Connection Management**
   - Always use the ConnectionManager singleton
   - Handle connection cleanup properly
   - Monitor connection states

2. **Error Handling**
   - Implement proper error boundaries
   - Log connection issues
   - Handle cleanup on errors

3. **Resource Management**
   - Clean up connections when not needed
   - Monitor resource usage
   - Implement proper timeouts

## Common Scenarios

### 1. Network Interruptions
The system automatically handles:
- Temporary network outages
- Connection timeouts
- Endpoint failures

### 2. System Events
Handles various system events:
- System sleep/wake cycles
- Network connectivity changes
- Application state changes

### 3. Performance Optimization
- Connection pooling
- Resource cleanup
- State management

## Debugging

### Common Issues
1. **Connection Timeouts**
   - Check network connectivity
   - Verify endpoint health
   - Review connection parameters

2. **Reconnection Loops**
   - Check endpoint availability
   - Review reconnection parameters
   - Verify network stability

3. **Resource Leaks**
   - Monitor connection cleanup
   - Check event listener cleanup
   - Verify timeout clearing

### Logging
The system provides detailed logging for:
- Connection attempts
- Health check results
- Error conditions
- State transitions

## Future Improvements

1. **Monitoring**
   - Add detailed metrics collection
   - Implement performance tracking
   - Enhanced error reporting

2. **Optimization**
   - Connection pooling
   - Better resource management
   - Enhanced caching

3. **Features**
   - Additional network support
   - Enhanced type safety
   - Better state management 


**Cursor ID** : WebSocket Connection Error Troubleshooting

## 12/03 : Improvements on Endpoint Switching Behavior

Endpoint switching behavior and health check system:

1. **Endpoint Switching Behavior**
Yes, when a health check fails, the system will switch to a different endpoint. Here's how it works in the current code:

```typescript
// In RpcEndpointManager.ts
public getEndpoint(network: string): string {
    // Get healthy endpoints sorted by priority
    const healthyEndpoints = config.endpoints
        .filter(e => {
            const health = this.endpointHealth.get(e.url);
            return health?.isHealthy;
        })
        .sort((a, b) => a.priority - b.priority);

    if (healthyEndpoints.length > 0) {
        return healthyEndpoints[0].url;  // Returns highest priority healthy endpoint
    }

    // Fallback to highest priority endpoint if all are unhealthy
    const fallbackEndpoint = [...config.endpoints]
        .sort((a, b) => a.priority - b.priority)[0];
```

The switching process works like this:
1. When a health check fails, that endpoint is marked as unhealthy
2. The next time `getEndpoint()` is called (during reconnection), it will:
   - First try to find a healthy endpoint with the highest priority
   - If no healthy endpoints exist, fall back to the highest priority endpoint

2. **Constants**
You're right - if you're running on a cloud server, the previous constants would work fine. Let's revert the constants back:

```typescript:packages/api/services/constants.ts
// Time constants in milliseconds
export const HEALTH_CHECK = {
    INTERVAL: 2 * 60 * 1000,    // Check every 2 minutes if RPC endpoint is healthy
    TIMEOUT: 15000,             // 15 seconds timeout for health checks
    REACTIVATION: 5 * 60 * 1000 // Reactivate after 5 minutes, longer recovery time for stability
} as const;

// Connection management constants
export const CONNECTION_CONFIG = {
    MAX_RECONNECT_ATTEMPTS: 10,    // Increased max attempts
    BASE_RECONNECT_DELAY: 2000,    // 2 seconds base delay
    MAX_RECONNECT_DELAY: 60000,    // Maximum delay of 1 minute
    ATTEMPT_RESET_TIMEOUT: 60000,  // Reset attempts after 1 minute
    CONNECTION_TIMEOUT: 30000      // 30 seconds timeout for initial connections
} as const;
```

1. **Health Check Process**:
   - Every 2 minutes (`HEALTH_CHECK.INTERVAL`), each endpoint is checked
   - Each check has 15 seconds to complete (`HEALTH_CHECK.TIMEOUT`)
   - If a check fails, the endpoint is marked as unhealthy

2. **Reconnection Process**:
   - When a connection fails, `ConnectionManager` will:
     - Try to get a healthy endpoint first
     - If no healthy endpoints, use the highest priority endpoint
     - Use exponential backoff between attempts (starting at 2s, max 60s)
     - Try up to 10 times before engaging circuit breaker

3. **Recovery Process**:
   - Failed endpoints are automatically rechecked after 5 minutes (`HEALTH_CHECK.REACTIVATION`)
   - If the recheck succeeds, the endpoint becomes available again
   - This prevents permanently blacklisting endpoints that might have temporary issues

The system prioritizes:
1. Stable connections (longer health check intervals)
2. Multiple retry attempts (10 instead of 5)
3. Longer timeouts (15s instead of 5s)

