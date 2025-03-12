## RPC Connection Flow

I'll walk you through the entire connection process, using the HydraDX network as an example from your RPC_ENDPOINTS configuration:

1. **Initial Connection Attempt**
```typescript
// From RPC_ENDPOINTS configuration
[NETWORKS_SUPPORTED.HYDRA_DX]: {
  endpoints: [
    { url: 'wss://rpc.hydradx.cloud', priority: 1, isActive: true },        // Primary
    { url: 'wss://hydradx-rpc.dwellir.com', priority: 2, isActive: true },  // Secondary
    { url: 'wss://hydration.dotters.network', priority: 3, isActive: true }, // Tertiary
  ]
}
```

Here's the process:

1. **Initial Connection**:
   - System starts by trying the highest priority endpoint (`wss://rpc.hydradx.cloud`)
   - Connection attempt has 30 seconds to complete (`CONNECTION_CONFIG.CONNECTION_TIMEOUT`)

2. **If Connection Fails**:
   ```typescript
   // The system will:
   - Mark current endpoint as unhealthy
   - Try next highest priority healthy endpoint
   - Start with BASE_RECONNECT_DELAY (2 seconds)
   - Can try up to MAX_RECONNECT_ATTEMPTS (10 times)
   ```

3. **Endpoint Switching Process**:
   If `rpc.hydradx.cloud` fails:
   - First try: Wait 2s, try `hydradx-rpc.dwellir.com`
   - If that fails: Wait 4s, try `hydration.dotters.network`
   - If all fail: Go back to highest priority, with exponential backoff
   
   ```typescript
   // Backoff timing example:
   Attempt 1: 2 seconds  (BASE_RECONNECT_DELAY)
   Attempt 2: 4 seconds
   Attempt 3: 8 seconds
   Attempt 4: 16 seconds
   Attempt 5: 32 seconds
   Attempt 6-10: 60 seconds (MAX_RECONNECT_DELAY)
   ```

4. **Health Check Process**:
   ```typescript
   // Every 2 minutes (HEALTH_CHECK.INTERVAL):
   - Check each endpoint's health
   - Each check has 15s timeout (HEALTH_CHECK.TIMEOUT)
   - If endpoint fails health check:
     - Mark as unhealthy
     - Will be rechecked after 5 minutes (HEALTH_CHECK.REACTIVATION)
   ```

5. **Recovery Process**:
   - After 5 minutes, unhealthy endpoints get another chance
   - If health check passes:
     - Endpoint marked as healthy
     - Available for selection again based on priority

Here's a real-world example scenario:

```typescript
// Example Scenario:
1. Initial connection to rpc.hydradx.cloud succeeds
2. After some time, connection drops

// First Recovery Attempt:
- System waits 2s (BASE_RECONNECT_DELAY)
- Tries hydradx-rpc.dwellir.com
- If succeeds: Continues with this endpoint
- If fails: Moves to next endpoint

// If All Endpoints Fail:
- System uses exponential backoff
- Continues trying endpoints in priority order
- Maximum 10 attempts before circuit breaker
```

The key points about the reconnection process:

1. **Automatic Failover**:
   - Yes, it automatically switches to different endpoints
   - Follows priority order (1 → 2 → 3)
   - Returns to higher priority endpoints when they recover

2. **Smart Retry Logic**:
   - Uses exponential backoff (2s → 4s → 8s → ... → 60s)
   - Maximum 10 retry attempts
   - Resets attempt counter after 1 minute of stability

3. **Health Monitoring**:
   - Continuous health checks every 2 minutes
   - Failed endpoints can recover after 5 minutes
   - Maintains list of healthy endpoints for quick switching


More implementation details at : [README.md](../../packages/api/services/network/README.md)
