import { toast } from 'react-hot-toast';
import { sr25519CreateDerive } from "@polkadot-labs/hdkd";
import { entropyToMiniSecret, mnemonicToEntropy } from "@polkadot-labs/hdkd-helpers";
import { getPolkadotSigner } from "polkadot-api/signer";

class ChopsticksService {
  private static instance: ChopsticksService;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  private healthCheckInterval: NodeJS.Timeout | null = null;

  // Alice account from test-wallet-setup.md
  private readonly ALICE_ACCOUNT = {
    address: '15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5',
    mnemonic: 'bottom drive obey lake curtain smoke basket hold race lonely fit walk',
    derivationPath: '//Alice',
    name: 'Alice (Test)',
    source: 'chopsticks'
  };

  static getInstance(): ChopsticksService {
    if (!ChopsticksService.instance) {
      ChopsticksService.instance = new ChopsticksService();
    }
    return ChopsticksService.instance;
  }

  /**
   * Initialize chopsticks connection - just checks health since Docker manages the process
   */
  async initializeChopsticks(): Promise<boolean> {
    if (process.env.NEXT_PUBLIC_USE_CHOPSTICKS !== 'true') {
      return false;
    }

    this.connectionStatus = 'connecting';
    toast.loading('Checking demo environment...', { id: 'chopsticks-status' });

    try {
      const isHealthy = await this.checkHealth();
      
      if (isHealthy) {
        this.connectionStatus = 'connected';
        this.startHealthMonitoring();
        
        toast.success('Demo environment ready!', { 
          id: 'chopsticks-status',
          icon: '✅',
          style: {
            borderLeft: '4px solid #22c55e',
          },
        });
        
        return true;
      } else {
        // If not healthy, try to restart via Docker
        return await this.restartChopsticks();
      }
    } catch (error) {
      this.connectionStatus = 'error';
      console.error('Chopsticks initialization failed:', error);
      
      toast.error('Demo environment unavailable. Try refreshing the page.', { 
        id: 'chopsticks-status',
        icon: '🔴',
        style: {
          borderLeft: '4px solid #ef4444',
        },
      });
      return false;
    }
  }

  /**
   * Check if chopsticks endpoints are healthy
   */
  private async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch('/api/chopsticks/health');
      const data = await response.json();
      return data.status === 'healthy';
    } catch (error) {
      console.log('Health check failed:', error);
      return false;
    }
  }

  /**
   * Restart chopsticks via Docker Compose
   */
  private async restartChopsticks(): Promise<boolean> {
    this.connectionStatus = 'connecting';
    toast.loading('Starting demo environment...', { id: 'chopsticks-status' });

    try {
      const response = await fetch('/api/chopsticks/restart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        // Wait a moment for chopsticks to start
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Verify it's healthy
        const isHealthy = await this.checkHealth();
        
        if (isHealthy) {
          this.connectionStatus = 'connected';
          this.startHealthMonitoring();
          
          toast.success('Demo environment started!', { 
            id: 'chopsticks-status',
            icon: '🆕',
            style: {
              borderLeft: '4px solid #4caf50',
            },
          });
          
          return true;
        }
      }
      
      throw new Error(result.message || 'Restart failed');
    } catch (error) {
      this.connectionStatus = 'error';
      console.error('Chopsticks restart failed:', error);
      
      toast.error('Failed to start demo environment. Server may be restarting...', { 
        id: 'chopsticks-status',
        icon: '🔴',
        style: {
          borderLeft: '4px solid #ef4444',
        },
      });
      return false;
    }
  }

  /**
   * Monitor health periodically
   */
  private startHealthMonitoring() {
    // Clear existing interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Check health every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      if (this.connectionStatus === 'connected') {
        const isHealthy = await this.checkHealth();
        if (!isHealthy) {
          console.log('Chopsticks health check failed, marking as disconnected');
          this.connectionStatus = 'error';
        }
      }
    }, 30000);
  }

  /**
   * Legacy method - kept for backward compatibility
   */
  async startChopsticks(): Promise<boolean> {
    return await this.initializeChopsticks();
  }

  getAliceAccount() {
    return this.ALICE_ACCOUNT;
  }

  // Create a real PAPI signer from Alice's seed phrase
  createAliceSigner() {
    try {
      // Convert mnemonic to entropy and create derive function
      const entropy = mnemonicToEntropy(this.ALICE_ACCOUNT.mnemonic);
      const miniSecret = entropyToMiniSecret(entropy);
      const derive = sr25519CreateDerive(miniSecret);
      
      // Derive Alice's keypair
      const aliceKeyPair = derive(this.ALICE_ACCOUNT.derivationPath);
      
      // Create PAPI signer
      const aliceSigner = getPolkadotSigner(
        aliceKeyPair.publicKey,
        "Sr25519",
        aliceKeyPair.sign,
      );
      
      return aliceSigner;
    } catch (error) {
      console.error('Failed to create Alice signer:', error);
      throw new Error('Failed to create chopsticks signer');
    }
  }

  isChopsticksMode(): boolean {
    return process.env.NEXT_PUBLIC_USE_CHOPSTICKS === 'true';
  }

  getConnectionStatus() {
    return this.connectionStatus;
  }

  isChopsticksRunning(): boolean {
    return this.connectionStatus === 'connected';
  }

  // Cleanup on service destruction
  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

export default ChopsticksService; 