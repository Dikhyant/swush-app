'use client';

import { useState } from 'react';
import { WalletButton, SignMessageButton, SubmitRemarkButton } from '@/components/swap/WalletButton';

export default function SignTestPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Wallet Interaction Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Connect Wallet</h2>
            <p className="text-sm text-gray-500">
              Connect your wallet to test the different functionalities
            </p>
          </div>
          
          <WalletButton
            isConnected={isConnected}
            setIsConnected={setIsConnected}
            setWalletAddress={setWalletAddress}
            className="w-full"
          />
          
          {isConnected && (
            <div className="mt-4">
              <p className="text-sm font-medium">Connected Address:</p>
              <p className="text-xs break-all bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                {walletAddress}
              </p>
              <p className="text-xs mt-2 text-gray-500">
                Network: {localStorage.getItem('walletNetwork') || 'Unknown'}
              </p>
            </div>
          )}
        </div>
        
        {isConnected && (
          <>
            <div className="border rounded-lg p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Sign Message</h2>
                <p className="text-sm text-gray-500">
                  Test the signing functionality with your connected wallet
                </p>
              </div>
              
              <SignMessageButton />
            </div>
            
            <div className="border rounded-lg p-6 shadow-sm md:col-span-2">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Submit Transaction</h2>
                <p className="text-sm text-gray-500">
                  Send a system.remark transaction to the blockchain
                </p>
              </div>
              
              <SubmitRemarkButton />
              
              <div className="mt-4 text-xs text-gray-500">
                <p>This will submit a transaction to the blockchain with a simple message and timestamp.</p>
                <p>You can track the status of the transaction in real-time above.</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 