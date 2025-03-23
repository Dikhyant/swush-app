import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { WalletSelect } from '@talismn/connect-components';
import {
  AlephZeroWallet,
  EnkryptWallet,
  FearlessWallet,
  MantaWallet,
  NovaWallet,
  PolkadotjsWallet,
  PolkaGate,
  SubWallet,
  TalismanWallet,
  WalletAccount,
  getWalletBySource,
} from '@talismn/connect-wallets';
import { toast } from 'react-hot-toast';
import { encodeAddress, decodeAddress } from '@polkadot/util-crypto';
import { WalletButtonProps } from './types';
import { PolkadotSigner } from 'polkadot-api';
import { FrontendConnectionManager } from '@/services/FrontendConnectionManager';
import { FrontendTransactionService } from '@/services/FrontendTransactionService';
import { Binary } from 'polkadot-api';

// Network configuration for address formatting
const NETWORK_CONFIG = {
  POLKADOT: {
    name: 'Polkadot',
    prefix: 0, // Polkadot SS58 prefix
    assetHubPrefix: 0 // Asset Hub Polkadot uses the same prefix
  },
  KUSAMA: {
    name: 'Kusama',
    prefix: 2, // Kusama SS58 prefix
    assetHubPrefix: 2 // Asset Hub Kusama uses the same prefix
  }
};

// New component for submitting a system.remark transaction
export const SubmitRemarkButton = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [estimatedFee, setEstimatedFee] = useState<string | null>(null);

  const submitRemark = async () => {
    try {
      setIsSubmitting(true);
      setTxStatus('Preparing...');
      
      // Get the wallet source and address from localStorage
      const walletSource = localStorage.getItem('walletSource');
      const walletAddress = localStorage.getItem('assetHubAddress') || localStorage.getItem('walletAddress');
      const walletNetwork = localStorage.getItem('walletNetwork') || 'Polkadot';
      const activeConnection = localStorage.getItem('activeConnection');
      
      if (!walletSource || !walletAddress) {
        throw new Error('Wallet not connected');
      }
      
      // Get the wallet by source
      const wallet = getWalletBySource(walletSource);
      
      if (!wallet) {
        throw new Error('Wallet not found');
      }
      
      // Enable the wallet if not already enabled
      if (!wallet.extension) {
        await wallet.enable('Swush');
      }
      
      // Get the signer from the wallet
      const signer = wallet.signer as PolkadotSigner;

      if (!signer) {
        throw new Error('Signer not available');
      }

      // Create a remark with current timestamp
      const remarkText = `Hello from Swush! Timestamp: ${Date.now()}`;
      
      // Use the stored active connection if available, otherwise map from network name
      const networkId = 'asset_hub';
      
      setTxStatus('Preparing transaction...');
      
      // Get the connection
      const connectionManager = FrontendConnectionManager.getInstance();
      const connection = await connectionManager.getConnection(networkId);
      
      // Validate connection is active
      if (!connection || !connection.api) {
        throw new Error('RPC connection is not active. Please reconnect your wallet.');
      }

      const api = connection.api;
      
      // Directly use the API to create a transaction
      console.log('Creating system.remark transaction...');
      const binaryRemark = Binary.fromText(remarkText);
      
      // Create transaction using the typed API
      const transaction = await api.tx.System.remark({ remark: binaryRemark });
      console.log('Transaction created successfully');
      
      // // Set transaction options as per Papi docs
      // const txOptions = {
      //   at: 'finalized', // target finalized block
      //   mortality: { mortal: true, period: 64 },
      //   tip: BigInt(0)
      // };
      
      // Use signSubmitAndWatch instead of signAndSubmit
      const subscription = transaction.signSubmitAndWatch(signer).subscribe({
        next: (event) => {
          console.log('Transaction event:', event);
          
          switch (event.type) {
            case 'signed':
              setTxHash(event.txHash);
              setTxStatus(`Transaction signed! Hash: ${event.txHash}`);
              break;
              
            case 'broadcasted':
              setTxStatus(`Transaction broadcasted! Waiting for confirmation...`);
              break;
              
            case 'txBestBlocksState':
              if (event.found) {
                if (event.ok) {
                  setTxStatus(`Transaction included in block ${event.block.number}`);
                } else {
                  const error = event.dispatchError;
                  setTxStatus(`Transaction failed: ${JSON.stringify(error)}`);
                  toast.error('Transaction failed in block');
                }
              }
              break;
          }
        },
        error: (error) => {
          console.error('Transaction error:', error);
          if (error.message?.includes('1010')) {
            setTxStatus('Transaction failed: Invalid transaction');
            toast.error('Invalid transaction');
          } else {
            setTxStatus(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            toast.error(`Transaction error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          setIsSubmitting(false);
        },
        complete: () => {
          console.log('Transaction finalized');
          toast.success('Transaction completed successfully!');
          setIsSubmitting(false);
        }
      });
      
      // Store subscription for cleanup
      return () => subscription.unsubscribe();
      
    } catch (error) {
      console.error('Error submitting transaction:', error);
      setTxStatus(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error(`Error submitting transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={submitRemark}
        variant="outline"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Remark'}
      </Button>
{/*       
      {estimatedFee && (
        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900 rounded text-xs">
          <p className="font-semibold">Estimated Fee:</p>
          <p>{estimatedFee}</p>
        </div>
      )} */}
      
      {txStatus && (
        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
          <p className="font-semibold">Status:</p>
          <p>{txStatus}</p>
        </div>
      )}
      
      {txHash && (
        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-hidden">
          <p className="font-semibold">Transaction Hash:</p>
          <p className="break-all">{txHash}</p>
        </div>
      )}
    </div>
  );
};

// New component for signing messages
export const SignMessageButton = () => {
  const [isSigning, setIsSigning] = useState(false);
  const [signedMessage, setSignedMessage] = useState<string | null>(null);

  // Sign a message using the connected wallet
  const signMessage = async () => {
    try {
      setIsSigning(true);
      
      // Get the wallet source and address from localStorage
      const walletSource = localStorage.getItem('walletSource');
      const walletAddress = localStorage.getItem('walletAddress');
      
      if (!walletSource || !walletAddress) {
        throw new Error('Wallet not connected');
      }
      
      // Get the wallet by source
      const wallet = getWalletBySource(walletSource);
      
      if (!wallet) {
        throw new Error('Wallet not found');
      }
      
      // Enable the wallet if not already enabled
      if (!wallet.extension) {
        await wallet.enable('Swush');
      }
      
      // Get the signer from the wallet
      const signer = wallet.signer as PolkadotSigner;
      
      if (!signer) {
        throw new Error('Signer not available');
      }
      
      // The message to sign
      const message = 'Hello from Swush!';
      
      // Sign the message using the appropriate method
      // The stringToHex utility function converts the message to hex format if needed
      const stringToHex = (str: string): string => {
        return Array.from(str)
          .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
          .join('');
      };
      
      // Convert message to hex format (0x prefix will be added if needed by the API)
      const messageHex = `0x${stringToHex(message)}`;

      // Use the signer directly to sign the payload
      const signature = await signer.signBytes(new TextEncoder().encode(message));
      
      console.log('Message signed successfully:', signature);
      // The signature could be in various formats depending on the implementation
      // We'll use the most common format or extract from the response object
      const signatureValue = typeof signature === 'string' 
        ? signature 
        : (signature as any).signature || JSON.stringify(signature);
      
      setSignedMessage(signatureValue);
      toast.success('Message signed successfully!');
      
    } catch (error) {
      console.error('Error signing message:', error);
      toast.error(`Error signing message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={signMessage}
        variant="outline"
        disabled={isSigning}
      >
        {isSigning ? 'Signing...' : 'Sign Message'}
      </Button>
      
      {signedMessage && (
        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-hidden">
          <p className="font-semibold">Signature:</p>
          <p className="break-all">{signedMessage}</p>
        </div>
      )}
    </div>
  );
};

export const WalletButton = ({ 
  isConnected, 
  setIsConnected, 
  setWalletAddress, 
  variant = 'default',
  className = '' 
}: WalletButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Determine network based on address and source
  const determineNetwork = (address: string, source: string) => {
    try {

      // If the address starts with a '1', it's likely Polkadot
      if (address.startsWith('1')) {
        return NETWORK_CONFIG.POLKADOT;
      }
      
      // If the source contains 'kusama' or the address format matches Kusama
      if (source.toLowerCase().includes('kusama') || address.startsWith('C') || address.startsWith('D') || address.startsWith('F') || address.startsWith('G')) {
        return NETWORK_CONFIG.KUSAMA;
      }
      
      // Default to Polkadot
      return NETWORK_CONFIG.POLKADOT;
    } catch (error) {
      console.error('Error determining network:', error);
      return NETWORK_CONFIG.POLKADOT; // Default to Polkadot on error
    }
  };

  // Format address for Asset Hub based on network
  const formatAddressForAssetHub = (address: string, network: typeof NETWORK_CONFIG.POLKADOT | typeof NETWORK_CONFIG.KUSAMA) => {
    try {
      // Decode the address to get the public key
      const publicKey = decodeAddress(address);
      
      // Encode with the Asset Hub prefix for the specific network
      return encodeAddress(publicKey, network.assetHubPrefix);
    } catch (error) {
      console.error('Error formatting address for Asset Hub:', error);
      return address; // Return original address on error
    }
  };

  // Initialize the RPC connection
  const initializeRpcConnection = async (networkName: string) => {
    try {
      setIsInitializing(true);
      toast.loading('Initializing network connection...', { id: 'connection-toast' });
      
      // Map the network name to the connection id expected by the service
      const networkMapping: Record<string, string> = {
        'Polkadot': 'asset_hub',
        'Kusama': 'asset_hub_kusama'
      };
      
      const networkId = networkMapping[networkName] || 'asset_hub';
      
      // Get the connection manager instance
      const connectionManager = FrontendConnectionManager.getInstance();
      
      // Initialize connection
      const connection = await connectionManager.getConnection(networkId);
      
      console.log(`RPC connection initialized for ${networkName} (${networkId})`);
      toast.success('Network connection established', { id: 'connection-toast' });
      
      // Store the connection info in localStorage for reuse
      localStorage.setItem('activeConnection', networkId);
      
      return connection;
    } catch (error) {
      console.error('Error initializing RPC connection:', error);
      toast.error(`Failed to connect to network: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'connection-toast' });
      throw error;
    } finally {
      setIsInitializing(false);
    }
  };

  const handleAccountSelected = async (account: WalletAccount) => {
    console.log('Selected account:', account);
    
    if (!account || !account.address) {
      console.error('Invalid account selected');
      return;
    }

    // Determine the network based on the address and source
    const network = determineNetwork(account.address, account.source);
    
    // Format the address for Asset Hub
    const assetHubAddress = formatAddressForAssetHub(account.address, network);
    
    console.log(`Network detected: ${network.name}`);
    console.log(`Original address: ${account.address}`);
    console.log(`Asset Hub address: ${assetHubAddress}`);

    // Store wallet information in localStorage
    localStorage.setItem('walletName', account.name || 'Unknown');
    localStorage.setItem('walletAddress', account.address);
    localStorage.setItem('walletSource', account.source);
    localStorage.setItem('walletNetwork', network.name);
    localStorage.setItem('assetHubAddress', assetHubAddress);

    try {
      // Initialize RPC connection after wallet is connected
      await initializeRpcConnection(network.name);
      
      // Update state
      setIsConnected(true);
      setWalletAddress(assetHubAddress); // Use the Asset Hub formatted address
      setIsOpen(false);
      
      //add success toast
      toast.success('Wallet connected successfully!', {
        icon: '✅',
        style: {
          borderLeft: '4px solid #4caf50',
        },
      });
    } catch (error) {
      console.error('Error during wallet connection:', error);
      toast.error(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDisconnect = async () => {
    try {
      // Disconnect RPC connection when wallet is disconnected
      const connectionManager = FrontendConnectionManager.getInstance();
      const networkName = localStorage.getItem('walletNetwork') || 'Polkadot';
      const networkMapping: Record<string, string> = {
        'Polkadot': 'asset_hub',
        'Kusama': 'asset_hub_kusama'
      };
      const networkId = networkMapping[networkName] || 'asset_hub';
      
      await connectionManager.disconnect(networkId);
      
      // Clear local storage
      localStorage.removeItem('walletName');
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('walletSource');
      localStorage.removeItem('walletNetwork');
      localStorage.removeItem('assetHubAddress');
      
      setIsConnected(false);
      setWalletAddress('');
      
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error(`Disconnect error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <>
      {isConnected ? (
        <Button 
          onClick={handleDisconnect}
          variant={variant}
          className={className}
          disabled={isInitializing}
        >
          Disconnect
        </Button>
      ) : (
        <Button 
          onClick={() => setIsOpen(true)}
          variant={variant}
          className={className}
          disabled={isInitializing}
        >
          {isInitializing ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      )}

      <WalletSelect
        dappName="Swush"
        open={isOpen}
        onWalletConnectOpen={() => setIsOpen(true)}
        onWalletConnectClose={() => setIsOpen(false)}
        onAccountSelected={handleAccountSelected}
        showAccountsList={true}
        walletList={[
          new TalismanWallet(),
          new NovaWallet(),
          new SubWallet(),
          new MantaWallet(),
          new PolkaGate(),
          new FearlessWallet(),
          new EnkryptWallet(),
          new PolkadotjsWallet(),
          new AlephZeroWallet(),
        ]}
      />
    </>
  );
}; 