import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { AssetWithId, RouteQuote } from '@/lib/api';
import type { TokenInfo } from '@/components/swap/types';
import { FrontendTransactionService } from '@/services/FrontendTransactionService';
import { toast } from 'react-hot-toast';
import { getPolkadotSignerFromPjs, SignPayload, SignRaw } from 'polkadot-api/pjs-signer';
import { getWalletBySource } from '@talismn/connect-wallets';
import type { Signer } from '@polkadot/api/types';
import { FrontendConnectionManager } from '@/services/FrontendConnectionManager';
import { encodeAddress, decodeAddress } from '@polkadot/util-crypto';
import type { TransactionCallbacks } from '@/services/types';

interface UseAssetConversionSwapProps {
  inputToken: TokenInfo | null;
  outputToken: TokenInfo | null;
  walletAddress: string;
  slippageTolerance: number;
  inputAmount: string;
  outputAmount: string;
  routeState: {
    isLoading: boolean;
    error: string | null;
    data: RouteQuote | null;
  };
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useAssetConversionSwap({
  inputToken,
  outputToken,
  walletAddress,
  slippageTolerance,
  inputAmount,
  outputAmount,
  routeState,
  onSuccess,
  onError
}: UseAssetConversionSwapProps) {
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapHash, setSwapHash] = useState<string | null>(null);
  const [swapStatus, setSwapStatus] = useState<string | null>(null);

  // Get assets with XCM location information
  const getAssetsWithXcmLocations = useCallback(async (): Promise<Map<string, AssetWithId>> => {
    try {
      const assets = await api.assets.getAll();
      // Create a map of id -> asset for quick lookup
      return new Map(
        assets.map(asset => [asset.id, asset])
      );
    } catch (error) {
      console.error('Failed to fetch assets with XCM locations:', error);
      throw new Error('Failed to prepare swap path. Please try again.');
    }
  }, []);

  // Calculate minimum output amount based on slippage tolerance
  const calculateMinimumOutput = useCallback((amount: string, slippagePercent: number, decimals: number): bigint => {
    if (!amount || parseFloat(amount) <= 0) return BigInt(0);
    
    // Convert to a number, apply slippage, then convert back to string
    const amountFloat = parseFloat(amount);
    const slippageFactor = 1 - (slippagePercent / 100);
    const minimumAmount = amountFloat * slippageFactor;
    
    // Convert to bigint with appropriate precision
    // We multiply by 10^decimals to get the planck format
    return BigInt(Math.floor(minimumAmount * 10 ** decimals));
  }, []);

  // Convert decimal amount to planck format
  const toAssetPlanckFormat = useCallback((amount: string, decimals: number): bigint => {
    if (!amount || parseFloat(amount) <= 0) return BigInt(0);
    
    const amountFloat = parseFloat(amount);
    const amountPlanck = amountFloat * 10 ** decimals;
    return BigInt(Math.floor(amountPlanck));
  }, []);

  // Parse XCM location from path entry
  const parseXcmFromPathEntry = useCallback((pathEntry: string): { parents: number; interior: any } | null => {
    // Check if the entry might be a JSON string containing XCM location
    if (typeof pathEntry === 'string' && pathEntry.startsWith('{') && pathEntry.includes('parents') && pathEntry.includes('interior')) {
      try {
        // Parse the JSON string directly
        const xcmLocation = JSON.parse(pathEntry);
        return {
          parents: Number(xcmLocation.parents) || 0,
          interior: xcmLocation.interior || { here: null }
        };
      } catch (error) {
        console.error('Failed to parse XCM location from path:', error);
        return null;
      }
    }
    return null;
  }, []);

  // Execute the swap
  const executeSwap = useCallback(async () => {
    if (!inputToken || !outputToken || !walletAddress || !inputAmount || parseFloat(inputAmount) <= 0) {
      toast.error('Invalid swap parameters');
      return;
    }

    try {
      setIsSwapping(true);
      setSwapStatus('Preparing swap...');
      
      // Get wallet source from localStorage
      const walletSource = localStorage.getItem('walletSource');
      if (!walletSource) {
        throw new Error('Wallet not connected');
      }
      
      // Get wallet and prepare signer
      const wallet = getWalletBySource(walletSource);
      if (!wallet) {
        throw new Error('Wallet not found');
      }
      
      // Enable wallet if not already enabled
      if (!wallet.extension) {
        await wallet.enable('Swush');
      }
      
      // Get signer
      const signer = wallet.signer as Signer;
      const signPayload = signer.signPayload as SignPayload;
      const signRaw = signer.signRaw as SignRaw;
      const polkadotSigner = getPolkadotSignerFromPjs(walletAddress, signPayload, signRaw);
      
      if (!polkadotSigner) {
        throw new Error('Signer not available');
      }
      
      // Get connection
      const connectionManager = FrontendConnectionManager.getInstance();
      const networkId = localStorage.getItem('activeConnection') || 'asset_hub';
      const connection = await connectionManager.getConnection(networkId);
      
      if (!connection || !connection.api) {
        throw new Error('RPC connection is not active. Please reconnect your wallet.');
      }
      
      const polkadotApi = connection.api;
      
      // Fetch assets with XCM locations
      setSwapStatus('Fetching asset information...');
      const assetsMap = await getAssetsWithXcmLocations();
      
      // Prepare swap parameters
      const inputAsset = assetsMap.get(inputToken.id);
      if (!inputAsset) {
        throw new Error('Failed to find input asset information');
      }
      
      const inputAmountPlanck = toAssetPlanckFormat(inputAmount, inputAsset.metadata.decimals);
      
      // For output asset and path, we have two approaches:
      // 1. Use the route from routeState if available (potentially multi-hop)
      // 2. Fallback to direct swap if routeState is not available
      
      let path: { parents: number; interior: any }[] = [];
      let outputAsset;
      
      if (routeState.data && routeState.data.path.length > 0) {
        // Using the route from routeState (which contains the path)
        setSwapStatus('Preparing optimal swap path...');
        console.log('Using path from route:', routeState.data.path);
        
        // Process each entry in the path
        for (const pathEntry of routeState.data.path) {
          // Try to parse as XCM location JSON string first
          const xcmFromJson = parseXcmFromPathEntry(pathEntry);
          
          if (xcmFromJson) {
            // It's a JSON string with XCM location
            path.push(xcmFromJson);
          } else {
            // It's an asset ID, look it up in the assets map
            const asset = assetsMap.get(pathEntry);
            if (!asset || !asset.rawXcmLocation) {
              throw new Error(`Missing XCM location for asset in path: ${pathEntry}`);
            }
            
            // Format the XCM location
            path.push({
              parents: Number(asset.rawXcmLocation.parents) || 0,
              interior: asset.rawXcmLocation.interior || { here: null }
            });
          }
        }
        
        // Get the output asset info for minimum amount calculation
        const lastPathEntry = routeState.data.path[routeState.data.path.length - 1];
        const xcmFromLastEntry = parseXcmFromPathEntry(lastPathEntry);
        
        if (xcmFromLastEntry) {
          // The last entry is an XCM location, try to find a matching asset
          const matchingAsset = Array.from(assetsMap.values()).find(asset => 
            asset.rawXcmLocation && 
            asset.rawXcmLocation.parents === xcmFromLastEntry.parents &&
            JSON.stringify(asset.rawXcmLocation.interior) === JSON.stringify(xcmFromLastEntry.interior)
          );
          
          if (matchingAsset) {
            outputAsset = matchingAsset;
          } else {
            // Fallback to output token
            console.warn('Could not find matching asset for last XCM location in path');
            outputAsset = assetsMap.get(outputToken.id);
          }
        } else {
          // Regular asset ID
          outputAsset = assetsMap.get(lastPathEntry);
        }
      } else {
        // Fallback to direct path if no route data available
        setSwapStatus('Preparing direct swap path...');
        outputAsset = assetsMap.get(outputToken.id);
        
        if (!inputAsset.rawXcmLocation || !outputAsset?.rawXcmLocation) {
          throw new Error('Missing XCM location information for assets');
        }
        
        path = [
          {
            parents: Number(inputAsset.rawXcmLocation.parents) || 0,
            interior: inputAsset.rawXcmLocation.interior || { here: null }
          },
          {
            parents: Number(outputAsset.rawXcmLocation.parents) || 0,
            interior: outputAsset.rawXcmLocation.interior || { here: null }
          }
        ];
      }
      
      // If we still don't have an output asset, use the output token
      if (!outputAsset) {
        console.warn('Could not determine output asset from path, using output token');
        outputAsset = assetsMap.get(outputToken.id);
        if (!outputAsset) {
          throw new Error('Failed to find output asset information');
        }
      }
      
      // Calculate minimum output amount with slippage
      const minOutputAmountPlanck = calculateMinimumOutput(
        outputAmount,
        slippageTolerance,
        outputAsset.metadata.decimals
      );
      
      setSwapStatus('Creating transaction...');
      console.log('Swap path:', path);
      
      // Build the swap transaction with properly formatted parameters
      const transaction = await polkadotApi.tx.AssetConversion.swap_exact_tokens_for_tokens({
        amount_in: inputAmountPlanck,
        amount_out_min: minOutputAmountPlanck,
        path: path,
        keep_alive: true,
        send_to: walletAddress
      });
      
      setSwapStatus('Signing transaction...');
      
      // Define transaction callbacks
      const callbacks: TransactionCallbacks = {
        onStatusChange: (status) => {
          console.log('Swap transaction status:', status);
          
          switch (status.type) {
            case 'signed':
              if (status.txHash) {
                setSwapHash(status.txHash);
                setSwapStatus(`Transaction signed! Hash: ${status.txHash}`);
                toast.loading('Transaction signed, waiting for broadcast...', { id: 'swap-status' });
              }
              break;
              
            case 'broadcasted':
              setSwapStatus('Transaction broadcasted! Waiting for confirmation...');
              toast.loading('Transaction broadcasted, waiting for confirmation...', { id: 'swap-status' });
              break;
              
            case 'txBestBlocksState':
              if (status.blockNumber) {
                setSwapStatus(`Transaction included in block ${status.blockNumber}`);
                toast.loading(`Transaction included in block ${status.blockNumber}, waiting for finalization...`, { id: 'swap-status' });
                
                if (!status.success) {
                  toast.error('Transaction failed in block', { id: 'swap-status' });
                  setSwapStatus(`Transaction failed: ${status.error || 'Unknown error'}`);
                }
              }
              break;
              
            case 'finalized':
              if (status.success) {
                const blockNum = status.blockNumber ? ` in block ${status.blockNumber}` : '';
                setSwapStatus(`Swap complete${blockNum}!`);
                toast.success('Swap completed successfully! 🎉', { 
                  id: 'swap-status',
                  duration: 5000,
                  icon: '✅'
                });
              }
              break;
          }
        },
        onSuccess: () => {
          console.log('Swap transaction successful');
          setIsSwapping(false);
          if (onSuccess) onSuccess();
        },
        onError: (error) => {
          console.error('Swap transaction error:', error);
          setSwapStatus(`Failed: ${error.message}`);
          toast.error(`Swap failed: ${error.message}`, { id: 'swap-status' });
          setIsSwapping(false);
          if (onError) onError(error);
        }
      };
      
      // Execute the transaction
      await FrontendTransactionService.signSubmitAndWatch(
        transaction,
        polkadotSigner,
        callbacks
      );
      
    } catch (error) {
      console.error('Error executing swap:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSwapStatus(`Failed: ${errorMessage}`);
      toast.error(`Error executing swap: ${errorMessage}`, { id: 'swap-status' });
      setIsSwapping(false);
      if (onError) onError(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [
    inputToken, outputToken, walletAddress, inputAmount, outputAmount,
    slippageTolerance, routeState, getAssetsWithXcmLocations, 
    calculateMinimumOutput, toAssetPlanckFormat, parseXcmFromPathEntry,
    onSuccess, onError
  ]);

  return {
    isSwapping,
    swapHash,
    swapStatus,
    executeSwap
  };
} 