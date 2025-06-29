import { toast } from 'react-hot-toast';
import { TransactionStatus, TransactionCallbacks } from '@/services/types';
import { UserService } from '@/services/userService';
import { SwapHistoryService } from '@/services/swapHistoryService';
import { monitorXcmFlow } from '@/services/xcm/xcmMonitor';
import { AssetHubApi } from '../types';

interface MonitoringCallbacksConfig {
  setSwapHash: (hash: string | null) => void;
  setSwapStatus: (status: string | null) => void;
  setIsFinalized: (isFinalized: boolean) => void;
  setIsSwapping: (isSwapping: boolean) => void;
  onSuccess?: () => void;
  onBalanceUpdateNeeded?: (txHash?: string) => void;
}

interface SwapDetails {
  inputAmount: string;
  inputToken: string;
  outputToken: string;
}

export const createTransactionCallbacks = (
  walletAddress: string,
  swapRecord: { id: string },
  config: MonitoringCallbacksConfig,
  isHydraDx: boolean,
  assetHubApi?: AssetHubApi,
  swapDetails?: SwapDetails
): TransactionCallbacks => {
  const {
    setSwapHash,
    setSwapStatus,
    setIsFinalized,
    setIsSwapping,
    onSuccess
 } = config;

  return {
    onStatusChange: async (status: TransactionStatus) => {
      switch (status.type) {
        case 'signed':
          if (status.txHash) {
            setSwapHash(status.txHash);
            setSwapStatus('Processing your swap...');
            
            // Replace preparation toast with processing toast
            toast.dismiss('swap-prepare');
            toast.loading('Processing your swap...', { id: 'swap-status' });
          }
          break;

        case 'broadcasted':
          // Keep same user-friendly message
          setSwapStatus('Processing your swap...');
          toast.loading('Processing your swap...', { id: 'swap-status' });
          break;

        case 'txBestBlocksState':
          // Keep same user-friendly message
          setSwapStatus('Processing your swap...');
          toast.loading('Processing your swap...', { id: 'swap-status' });
          break;

        case 'finalized':
          setIsFinalized(true);

          if (status.success) {
            // Update swap history status
            await SwapHistoryService.updateSwapStatus(swapRecord.id, 'success');

            // Award XP for successful swap
            await UserService.updateUserXP(walletAddress, 10);

            if (!isHydraDx) {
              toast.dismiss('swap-status');
              const successMessage = swapDetails 
                ? `Swap completed! ${swapDetails.inputAmount} ${swapDetails.inputToken} → ${swapDetails.outputToken}`
                : 'Swap completed successfully!';
              
              setSwapStatus('Swap completed!');
              toast.success(successMessage, {
                id: 'swap-success',
                duration: 5000,
                icon: '🎉'
              });
            } else {
              // For HydraDX, aggressively maintain the loading toast
              setSwapStatus('Processing your swap...');
              toast.loading('Processing your swap...', { id: 'swap-status', duration: 60000 }); // Longer duration
            }
          } else {
            await SwapHistoryService.updateSwapStatus(swapRecord.id, 'failed');
          }
          break;
      }
    },
    onSuccess: async () => {
      if (!isHydraDx) {
        setIsSwapping(false);
        if (onSuccess) onSuccess();
      }
      // For HydraDX, do absolutely nothing here to avoid interfering with XCM monitoring
    },
    onError: async (error: Error) => {
      await SwapHistoryService.updateSwapStatus(swapRecord.id, 'failed');
      throw error; // Let the main hook handle the error
    }
  };
};

export const handleXcmMonitoring = async (
  assetHubApi: AssetHubApi,
  walletAddress: string,
  config: MonitoringCallbacksConfig,
  swapDetails?: SwapDetails
) => {
  const {
    setSwapStatus,
    setIsSwapping,
    onSuccess,
    setSwapHash
  } = config;

  try {
    // Keep showing "Processing your swap..." instead of changing to XCM transfer
    setSwapStatus('Processing your swap...');
    // Ensure toast continues showing during XCM monitoring
    toast.loading('Processing your swap...', { id: 'swap-status' });
    
    const xcmSuccess = await monitorXcmFlow(
      assetHubApi,
      walletAddress
    );

    if (!xcmSuccess) {
      throw new Error('XCM transaction monitoring failed or timed out');
    }

    // Only dismiss and show success after XCM flow completes successfully
    toast.dismiss('swap-status');
    const successMessage = swapDetails 
      ? `Swap completed! ${swapDetails.inputAmount} ${swapDetails.inputToken} → ${swapDetails.outputToken}`
      : 'Swap completed successfully!';
    
    setSwapStatus('Swap completed!');
    toast.success(successMessage, {
      id: 'swap-success',
      duration: 5000,
      icon: '🎉'
    });

    setIsSwapping(false);
    if (onSuccess) onSuccess();

  } catch (error) {
    console.error('XCM monitoring error:', error);
    throw new Error(`XCM monitoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}; 