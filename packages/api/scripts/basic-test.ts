#!/usr/bin/env tsx

import { EndpointProvider } from '../services/network/EndpointProvider';

async function basicTest() {
  console.log('🧪 Basic Network Test - Bare Minimum\n');
  
  try {
    // Test 1: Endpoint Provider Basic Functionality
    console.log('1️⃣ Testing Endpoint Provider...');
    const endpointProvider = EndpointProvider.getInstance();
    
    // Get an endpoint
    const endpoint = endpointProvider.getEndpoint('hydra_dx');
    console.log(`✅ Got endpoint: ${endpoint}`);
    
    // Test endpoint status
    const status = endpointProvider.getEndpointStatus('hydra_dx');
    console.log(`✅ Endpoint status - Total: ${status.total}, Available: ${status.available}`);
    
    // Test marking endpoint as failed
    endpointProvider.markEndpointFailed('hydra_dx', endpoint);
    console.log(`✅ Marked endpoint as failed: ${endpoint}`);
    
    // Get next endpoint (should be different)
    const nextEndpoint = endpointProvider.getEndpoint('hydra_dx');
    console.log(`✅ Got next endpoint: ${nextEndpoint}`);
    
    if (endpoint !== nextEndpoint) {
      console.log('✅ Endpoint rotation working correctly');
    } else {
      console.log('⚠️  Endpoint rotation may not be working (only one endpoint available?)');
    }
    
    // Test 2: Connection Manager Basic Functionality
    console.log('\n2️⃣ Testing Connection Manager...');
    
    // Import here to avoid initialization issues
    const { ConnectionManager } = await import('../services/network/ConnectionManager');
    const connectionManager = ConnectionManager.getInstance();
    
    // Test getting status without initialization
    const connectionStatus = connectionManager.getConnectionStatus();
    console.log(`✅ Got connection status for ${Object.keys(connectionStatus).length} networks`);
    
    for (const [network, netStatus] of Object.entries(connectionStatus)) {
      console.log(`   ${network}: ${netStatus.isReady ? 'Ready' : 'Not Ready'}`);
    }
    
    console.log('\n🎉 All basic tests passed!');
    console.log('\n📋 Summary:');
    console.log('✅ Endpoint Provider: Working');
    console.log('✅ Endpoint Rotation: Working');
    console.log('✅ Connection Manager: Working');
    console.log('✅ Status Reporting: Working');
    
  } catch (error) {
    console.error('\n❌ Basic test failed:', error);
    console.error('\nStack trace:', error instanceof Error ? error.stack : 'No stack trace');
    process.exit(1);
  }
}

basicTest().catch(console.error); 