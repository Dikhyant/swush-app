#!/usr/bin/env tsx

import { ConnectionManager } from '../services/network/ConnectionManager';

async function integrationTest() {
  const timestamp = new Date().toISOString().substring(11, 19);
  console.log(`🧪 [${timestamp}] INTEGRATION TEST: Starting real network connection tests\n`);
  
  try {
    console.log('1️⃣ Testing Real Connection Manager...');
    const connectionManager = ConnectionManager.getInstance();
    
    console.log('🔧 Initializing with real HydraDX endpoints...');
    
    // Test initialization with timeout
    const initPromise = connectionManager.initialize();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Initialization timeout')), 30000)
    );
    
    try {
      await Promise.race([initPromise, timeoutPromise]);
      console.log('✅ Connection Manager initialized successfully');
    } catch (error) {
      console.log('⚠️  Initialization took longer than expected or failed:', error instanceof Error ? error.message : error);
    }
    
    // Test connection status
    console.log('\n2️⃣ Testing Connection Status...');
    const status = connectionManager.getConnectionStatus();
    
    for (const [network, networkStatus] of Object.entries(status)) {
      console.log(`\n🌐 Network: ${network}`);
      console.log(`   Status: ${networkStatus.isReady ? '✅ Ready' : '❌ Not Ready'}`);
      console.log(`   Healthy: ${networkStatus.isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
      console.log(`   Current Endpoint: ${networkStatus.endpointStatus?.currentEndpoint || 'None'}`);
      console.log(`   Consecutive Failures: ${networkStatus.consecutiveFailures || 0}`);
      console.log(`   Connecting: ${networkStatus.endpointStatus?.isConnecting ? 'Yes' : 'No'}`);
      
      if (networkStatus.lastError) {
        console.log(`   Last Error: ${networkStatus.lastError.substring(0, 100)}...`);
      }
    }
    
    // Test API access with retry
    console.log('\n3️⃣ Testing API Access...');
    
    try {
      const hydradxApi = await connectionManager.getHydradxApiWithRetry();
      if (hydradxApi) {
        console.log('✅ HydraDX API connection successful');
        
        // Test a simple query
        console.log(`✅ HydraDX API object available`);
      } else {
        console.log('❌ HydraDX API connection failed');
      }
    } catch (error) {
      console.log('❌ HydraDX API test failed:', error instanceof Error ? error.message : error);
    }
    
    try {
      const assetHubApi = await connectionManager.getAssetHubApiWithRetry();
      if (assetHubApi) {
        console.log('✅ Asset Hub API connection successful');
        
        console.log(`✅ Asset Hub API object available`);
      } else {
        console.log('❌ Asset Hub API connection failed');
      }
    } catch (error) {
      console.log('❌ Asset Hub API test failed:', error instanceof Error ? error.message : error);
    }
    
    // Test endpoint provider status
    console.log('\n4️⃣ Testing Endpoint Provider...');
    const endpointProvider = (connectionManager as any).endpointProvider;
    if (endpointProvider) {
      const hydradxStatus = endpointProvider.getEndpointStatus('hydra_dx');
      console.log(`\n🌊 HydraDX Endpoints:`);
      console.log(`   Total: ${hydradxStatus.total}`);
      console.log(`   Available: ${hydradxStatus.available}`);
      console.log(`   Blacklisted: ${hydradxStatus.blacklisted.length}`);
      
      if (hydradxStatus.blacklisted.length > 0) {
        console.log(`   Blacklisted: ${hydradxStatus.blacklisted.join(', ')}`);
      }
    }
    
    console.log('\n🎉 Integration test completed!');
    
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await connectionManager.disconnect();
    console.log('✅ Disconnected successfully');
    
  } catch (error) {
    console.error('\n❌ Integration test failed:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    process.exit(1);
  }
}

integrationTest().catch(console.error); 