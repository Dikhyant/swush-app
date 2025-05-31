# Network and RPC Architecture

## Overview
The network module provides a robust and simplified system for managing connections to multiple blockchain networks (Asset Hub, HydraDX) using both Polkadot-JS API and PAPI (Polkadot API). The architecture is designed with simplicity and reliability in mind, focusing on clear separation of concerns and straightforward error handling.

## Architecture Components

### 1. Connection Manager (`ConnectionManager.ts`)
The central orchestrator for all network connections, implementing:
- Singleton pattern for global connection management
- Connection state tracking for multiple networks
- Automatic reconnection with exponential backoff
- Health monitoring and validation
- Graceful error handling and recovery

```typescript
// Usage example
const manager = ConnectionManager.getInstance();
await manager.initialize(); // Sets up connections to all networks
const api = manager.getAssetHubApiWithRetry(10000); // Get Asset Hub API with 10s timeout
```

### 2. Endpoint Provider (`EndpointProvider.ts`)
Simple endpoint management:
- Multiple RPC endpoints per network
- Round-robin endpoint selection
- Session-based endpoint blacklisting
- Automatic failover to healthy endpoints

### 3. Connection Factory (`ConnectionFactory.ts`)
Handles individual connection creation:
- Static factory methods for different API types
- Unified timeout and error handling
- Connection validation
- Clean disconnection logic

### 4. Type System (`types.ts`)
Provides type safety:
- Network type definitions
- Chain descriptor mappings
- Type guards for connection types

## Connection Flow

1. **Initialization**
   ```
   ConnectionManager
   ├─> Get endpoints from EndpointProvider
   ├─> Create connections via ConnectionFactory
   └─> Validate and mark as ready
   ```

2. **Health Monitoring**
   ```
   ConnectionManager (every 60s)
   ├─> Validate each connection
   ├─> Mark unhealthy connections for reconnection
   └─> Track response times and errors
   ```

3. **Error Recovery**
   ```
   Connection Error
   ├─> Mark endpoint as failed
   ├─> Try next available endpoint
   ├─> Exponential backoff (1s, 2s, 4s, 8s, 16s, 30s max)
   └─> Reset after successful connection
   ```

## Fault Tolerance Features

### 1. Connection Recovery
- Automatic reconnection attempts
- Exponential backoff (max 30 seconds)
- Endpoint rotation on failures
- Connection state preservation

### 2. Endpoint Management
- Multiple endpoints per network
- Round-robin selection
- Session-based blacklisting (no permanent blacklisting)
- Clear endpoint status reporting

### 3. Error Handling
- Graceful error recovery
- Detailed error logging
- Connection state tracking
- Proper resource cleanup

## Configuration

### Network Configuration
```typescript
// In EndpointProvider.ts
endpoints = {
  [NETWORKS_SUPPORTED.ASSET_HUB]: [
    'wss://polkadot-asset-hub-rpc.polkadot.io',
    'wss://asset-hub-polkadot.dotters.network',
    'wss://sys.ibp.network/asset-hub-polkadot'
  ],
  [NETWORKS_SUPPORTED.HYDRA_DX]: [
    'wss://rpc.hydradx.cloud',
    'wss://hydradx-rpc.dwellir.com'
  ]
};
```

### Connection Parameters
```typescript
export const CONNECTION_CONFIG = {
  MAX_RECONNECT_ATTEMPTS: 5,
  BASE_RECONNECT_DELAY: 2000,   // 2 seconds
  MAX_RECONNECT_DELAY: 30000,   // 30 seconds
  ATTEMPT_RESET_TIMEOUT: 120000, // 2 minutes
  CONNECTION_TIMEOUT: 30000     // 30 seconds
};
```

## API Usage Patterns

### 1. Immediate Connection
```typescript
const api = manager.getAssetHubApi(); // Returns null if not ready
```

### 2. Connection with Retry
```typescript
const api = await manager.getAssetHubApiWithRetry(10000); // Wait up to 10 seconds
```

### 3. Connection Status Monitoring
```typescript
const status = manager.getConnectionStatus();
// Returns detailed status for each network including endpoint health
```

## Best Practices

1. **Connection Management**
   - Always use the ConnectionManager singleton
   - Use retry methods for critical operations
   - Monitor connection status regularly

2. **Error Handling**
   - Handle null responses from immediate connection methods
   - Use appropriate timeouts for retry methods
   - Check connection status for debugging

3. **Resource Management**
   - ConnectionManager handles all cleanup automatically
   - No manual connection management needed
   - Proper shutdown via disconnect()

## Common Scenarios

### 1. Network Interruptions
The system automatically handles:
- Temporary network outages
- Connection timeouts
- Endpoint failures

### 2. API Usage
- HTTP 503 responses when connections unavailable
- Automatic retry logic in API endpoints
- Clear error messages for debugging

### 3. Performance
- Lightweight health checking
- Efficient connection reuse
- Minimal resource overhead

## Debugging

### Connection Status Endpoint
```bash
curl http://localhost:3001/api/v1/assets/connection-status
```

### Common Issues
1. **Connection Timeouts**
   - Check endpoint availability
   - Review network connectivity
   - Monitor endpoint status

2. **All Endpoints Failed**
   - Check endpoint health
   - Review blacklisted endpoints
   - Verify network configuration

### Logging
The system provides clear logging for:
- Connection attempts and results
- Health check results
- Error conditions with context
- Endpoint status changes

## Architecture Benefits

**Simplified Design:**
- ~70% less code than previous version
- Clear separation of concerns
- No complex event systems
- Predictable error flows

**Better Reliability:**
- Single source of truth for connection state
- Proper connection validation
- Graceful degradation
- Clear error propagation

**Easier Maintenance:**
- Simple, focused components
- Minimal interdependencies
- Clear interfaces
- Comprehensive status reporting

## Migration Notes

**Removed Components:**
- `RpcEndpointManager.ts` (217 lines) → Replaced by `EndpointProvider.ts` (75 lines)
- `RpcConnection.ts` (337 lines) → Replaced by `ConnectionFactory.ts` (90 lines)
- Complex event system → Direct method calls
- Health check WebSockets → Connection validation

**Total Reduction:** ~400 lines of complex code → ~200 lines of simple code

