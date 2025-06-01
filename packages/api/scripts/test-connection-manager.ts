#!/usr/bin/env tsx

import { ConnectionManager } from '../services/network/ConnectionManager';

async function testConnectionManager() {
  console.log('🧪 Testing Connection Manager...\n');
  
  try {
    // Get connection manager instance
    const connectionManager = ConnectionManager.getInstance();
    
    // Test initialization
    console.log('🔧 Initializing Connection Manager...');
    await connectionManager.initialize();
    console.log('✅ Connection Manager initialized successfully\n');
    
    // Test connection status
    console.log('📊 Connection Status:');
    const status = connectionManager.getConnectionStatus();
    
    for (const [network, networkStatus] of Object.entries(status)) {
      console.log(`\n🌐 Network: ${network}`);
      console.log(`   Status: ${networkStatus.isReady ? '✅ Ready' : '❌ Not Ready'}`);
      console.log(`   Current Endpoint: ${networkStatus.currentEndpoint || 'None'}`);
      console.log(`   Consecutive Failures: ${networkStatus.consecutiveFailures}`);
      console.log(`   Last Error: ${networkStatus.lastError || 'None'}`);
      console.log(`   Last Success: ${networkStatus.endpointStatus?.lastSuccessfulConnection || 'Never'}`);
    }
    
    // Test endpoint provider status
    console.log('\n🔌 Endpoint Provider Status:');
    const endpointProvider = (connectionManager as any).endpointProvider;
    if (endpointProvider) {
      const hydradxStatus = endpointProvider.getEndpointStatus('hydra_dx');
      console.log(`\n🌊 HydraDX Endpoints:`);
      console.log(`   Total: ${hydradxStatus.total}`);
      console.log(`   Available: ${hydradxStatus.available}`);
      console.log(`   Blacklisted: ${hydradxStatus.blacklisted.length}`);
      
      if (hydradxStatus.blacklisted.length > 0) {
        console.log(`   Blacklisted endpoints: ${hydradxStatus.blacklisted.join(', ')}`);
      }
      
      console.log('\n📈 Endpoint Details:');
      for (const [endpoint, details] of Object.entries(hydradxStatus.endpointDetails)) {
        const endpointDetails = details as { failureCount: number; lastUsed: string; isBlacklisted: boolean };
        console.log(`   ${endpoint}:`);
        console.log(`     Failure Count: ${endpointDetails.failureCount}`);
        console.log(`     Last Used: ${endpointDetails.lastUsed}`);
        console.log(`     Blacklisted: ${endpointDetails.isBlacklisted ? '❌' : '✅'}`);
      }
    }
    
    // Test disconnection
    console.log('\n🔌 Testing disconnection...');
    await connectionManager.disconnect();
    console.log('✅ Connection Manager disconnected successfully');
    
    console.log('\n🎉 All Connection Manager tests passed!');
    
  } catch (error) {
    console.error('\n❌ Connection Manager test failed:', error);
    process.exit(1);
  }
}

testConnectionManager().catch(console.error); 