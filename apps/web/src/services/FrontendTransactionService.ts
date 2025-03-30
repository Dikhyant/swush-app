import { PolkadotSigner } from 'polkadot-api';
import { TransactionStatus, TransactionCallbacks, TxOptions } from './types';
import { TransactionErrorService, EnhancedError } from './TransactionErrorService';

// Use PolkadotSigner type directly instead of our custom interface
type Signer = PolkadotSigner;

export class FrontendTransactionService {

    static async estimateFees(
        transaction: any,
        address: string,
        options?: TxOptions
    ): Promise<bigint> {
        try {
            return await transaction.getEstimatedFees(address, options);
        } catch (error) {
            // Avoid excessive logging
            const enhancedError = TransactionErrorService.handleTransactionError(error);
            throw enhancedError;
        }
    }

    static async signAndSubmit(
        transaction: any,
        signer: Signer,
        options?: TxOptions
    ): Promise<string> {
        try {
            return await transaction.sign(signer, options);
        } catch (error) {
            // Avoid excessive logging
            const enhancedError = TransactionErrorService.handleTransactionError(error);
            throw enhancedError;
        }
    }

    static async signSubmitAndWatch(
        transaction: any,
        signer: Signer,
        callbacks?: TransactionCallbacks,
        options?: TxOptions
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const subscription = transaction.signSubmitAndWatch(signer, options).subscribe({
                    next: (event: any) => {
                        const baseStatus: TransactionStatus = {
                            type: event.type,
                            txHash: event.txHash,
                        };

                        switch (event.type) {
                            case 'signed':
                            case 'broadcasted':
                                callbacks?.onStatusChange?.({
                                    ...baseStatus,
                                    success: true,
                                });
                                break;

                            case 'txBestBlocksState':
                                if (event.found) {
                                    const status: TransactionStatus = {
                                        ...baseStatus,
                                        blockNumber: event.block.number,
                                        blockHash: event.block.hash,
                                        success: event.ok,
                                    };

                                    if (!event.ok && event.dispatchError) {
                                        status.error = TransactionErrorService.parseDispatchError(event.dispatchError).message;
                                    }

                                    callbacks?.onStatusChange?.(status);
                                }
                                break;

                            case 'finalized':
                                const finalStatus: TransactionStatus = {
                                    ...baseStatus,
                                    blockNumber: event.block?.number,
                                    blockHash: event.block?.hash,
                                    success: event.ok,
                                    events: event.events
                                };

                                if (!event.ok && event.dispatchError) {
                                    const errorInfo = TransactionErrorService.parseDispatchError(event.dispatchError);
                                    finalStatus.error = errorInfo.message;
                                    const error = TransactionErrorService.createErrorFromDispatchInfo(errorInfo);
                                    callbacks?.onError?.(error);
                                    reject(error);
                                } else {
                                    callbacks?.onSuccess?.(finalStatus);
                                    resolve();
                                }

                                callbacks?.onStatusChange?.(finalStatus);
                                break;

                            default:
                                callbacks?.onStatusChange?.({
                                    ...baseStatus,
                                    success: undefined,
                                });
                        }
                    },
                    error: (error: Error) => {
                        const enhancedError = TransactionErrorService.handleTransactionError(error);
                        callbacks?.onError?.(enhancedError);
                        reject(enhancedError);
                    },
                    complete: () => {
                        console.log('Transaction subscription completed');
                    }
                });

                return subscription;
            } catch (error) {
                const enhancedError = TransactionErrorService.handleTransactionError(error);
                callbacks?.onError?.(enhancedError);
                reject(enhancedError);
            }
        });
    }
}