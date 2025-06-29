Chat name : Setup dev staging environment for testing

## 🚀 **Concise Reconnection Solution**

### **What I Added:**

#### **1. Automatic Reconnection:**
- **Health Monitoring**: Checks connection every 30 seconds
- **Auto-Retry**: Up to 5 reconnection attempts  
- **Exponential Backoff**: 2s → 4s → 8s → 16s → 32s delays
- **Silent Recovery**: Reconnects without user intervention

#### **2. Smart Connection Handling:**
- **Endpoint Fallback**: Tries both Asset Hub (3421) and Hydration (3422) ports
- **Faster Timeouts**: 3-second timeout per endpoint (faster failure detection)
- **Graceful Degradation**: Continues if at least one endpoint works

#### **3. Better UX:**
- **Status Updates**: "Reconnecting Chopsticks..." during attempts
- **No Spam**: Maintains single toast ID for clean notifications
- **Transparent**: Console logs for debugging but silent for users

### **How It Works:**

```
App Starts → Verify Chopsticks → Start Health Monitor (30s interval)
    ↓                                       ↓
Connected ←------- Connection Lost ← Health Check Fails
    ↓                    ↓
Continues Working    Auto-Reconnect (with exponential backoff)
```

### **Demo Benefits:**
✅ **Hands-off**: Reconnects automatically when RPC endpoints fail  
✅ **Resilient**: Handles the `wss://rpc.hydradx.cloud` disconnections  
✅ **User-friendly**: Transparent reconnection without interrupting demo  
✅ **Reliable**: Falls back between endpoints, retries with smart delays  
✅ **Clean**: Single status indicator, no notification spam  

Now when `wss://rpc.hydradx.cloud` disconnects (like in your logs), chopsticks will automatically reconnect using the fallback endpoints from your `hydration.yml` config! Perfect for smooth demo experience! 🎉