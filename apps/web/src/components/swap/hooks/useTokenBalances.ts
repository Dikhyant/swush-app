import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { TokenInfo } from '@/components/swap/types';
import { BALANCE_REFRESH_TIMEOUT } from '@/lib/const';

interface UseTokenBalancesProps {
  isConnected: boolean;
  walletAddress: string;
  inputToken: TokenInfo | null;
  outputToken: TokenInfo | null;
}

// Default polling configuration
const BALANCE_POLLING = {
  INITIAL_INTERVAL: 1000, // 1 second
  MAX_INTERVAL: 5000,     // 5 seconds
  RETRIES: 5,             // Number of polling attempts
  POST_SWAP_TIMEOUT: 5000 // Wait 5 seconds after swap before checking
};

export function useTokenBalances({
  isConnected,
  walletAddress,
  inputToken,
  outputToken
}: UseTokenBalancesProps) {
  const [inputBalance, setInputBalance] = useState('0');
  const [outputBalance, setOutputBalance] = useState('0');
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [lastSwapTimestamp, setLastSwapTimestamp] = useState<number | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [savedBalances, setSavedBalances] = useState<Record<string, string>>({});

  // Function to fetch balances normally
  const fetchBalances = useCallback(async () => {
    if (!isConnected || !walletAddress) {
      setInputBalance('0');
      setOutputBalance('0');
      return;
    }

    const tokens = [inputToken, outputToken].filter(Boolean) as TokenInfo[];
    if (tokens.length === 0) return;

    setIsBalanceLoading(true);
    try {
      // Prepare batch request for all tokens
      const requests = tokens.map(token => ({
        address: walletAddress,
        assetId: token.id
      }));

      // Fetch balances in batch
      const response = await api.balances.batch({ requests });

      // Process results and update states
      response.forEach(result => {
        if (result.status === 'success' && result.data) {
          const { address, assetId } = result.request;
          const balanceKey = `${address}-${assetId}`;
          const balance = result.data.balance.toString();
          
          // Update saved balances
          setSavedBalances(prev => ({
            ...prev,
            [balanceKey]: balance
          }));
          
          // Update the appropriate token balance
          if (inputToken && assetId === inputToken.id) {
            setInputBalance(balance);
          }
          if (outputToken && assetId === outputToken.id) {
            setOutputBalance(balance);
          }
        }
      });
    } catch (error) {
      console.error('Failed to fetch token balances:', error);
    } finally {
      setIsBalanceLoading(false);
    }
  }, [isConnected, walletAddress, inputToken, outputToken]);

  // Enhanced balance refresh function with polling for post-swap updates
  const refreshBalances = useCallback(async (afterSwap = false, txHash?: string) => {
    if (afterSwap) {
      console.log(`Post-swap balance refresh requested${txHash ? ` for tx: ${txHash}` : ''}`);
      setLastSwapTimestamp(Date.now());
      setPollCount(0);
      
      // Wait a bit before starting to poll to allow the blockchain to update
      await new Promise(resolve => setTimeout(resolve, BALANCE_POLLING.POST_SWAP_TIMEOUT));
    }
    
    // Save the previous balance values for comparison
    const prevInputBalance = inputToken ? savedBalances[`${walletAddress}-${inputToken.id}`] : '0';
    const prevOutputBalance = outputToken ? savedBalances[`${walletAddress}-${outputToken.id}`] : '0';
    
    // Fetch the balances
    await fetchBalances();
    
    // If this is a post-swap refresh, check if balances changed
    if (afterSwap) {
      // Get updated balances after fetch
      const newInputBalance = inputToken ? savedBalances[`${walletAddress}-${inputToken.id}`] : '0';
      const newOutputBalance = outputToken ? savedBalances[`${walletAddress}-${outputToken.id}`] : '0';
      
      const inputChanged = newInputBalance !== prevInputBalance;
      const outputChanged = newOutputBalance !== prevOutputBalance;
      
      if (inputChanged || outputChanged) {
        console.log('Balance changed detected, stopping polling', {
          inputBalanceChanged: inputChanged,
          outputBalanceChanged: outputChanged
        });
        // Balance changed, stop polling
        setPollCount(BALANCE_POLLING.RETRIES + 1);
      } else if (pollCount < BALANCE_POLLING.RETRIES) {
        // Continue polling with backoff
        const nextPollDelay = Math.min(
          BALANCE_POLLING.INITIAL_INTERVAL * (1 + pollCount),
          BALANCE_POLLING.MAX_INTERVAL
        );
        
        console.log(`Scheduling next balance poll in ${nextPollDelay}ms (attempt ${pollCount + 1}/${BALANCE_POLLING.RETRIES})`);
        
        setPollCount(pollCount + 1);
        
        // Schedule next poll with increasing delay
        setTimeout(() => refreshBalances(true, txHash), nextPollDelay);
      } else {
        console.log('Max polling attempts reached, giving up');
      }
    }
  }, [fetchBalances, inputToken, outputToken, pollCount, savedBalances, walletAddress]);

  // Reset the balance states
  const resetBalances = useCallback((afterSwap = false, txHash?: string) => {
    if (afterSwap) {
      console.log('Triggering post-swap balance refresh');
      refreshBalances(true, txHash);
    } else {
      setInputBalance('0');
      setOutputBalance('0');
      refreshBalances();
    }
  }, [refreshBalances]);

  // Effect to fetch balances when wallet or tokens change
  useEffect(() => {
    fetchBalances();
    
    // Set up regular refresh interval if connected
    if (isConnected) {
      const intervalId = setInterval(fetchBalances, BALANCE_REFRESH_TIMEOUT);
      return () => clearInterval(intervalId);
    }
  }, [isConnected, walletAddress, inputToken, outputToken, fetchBalances]);

  return {
    inputBalance,
    outputBalance,
    isBalanceLoading,
    resetBalances,
    refreshBalances
  };
} 