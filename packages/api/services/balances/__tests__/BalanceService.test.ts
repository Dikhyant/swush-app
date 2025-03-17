import { BalanceService } from '../BalanceService';
import { ConnectionManager } from '../../network/ConnectionManager';
import { AssetType } from '../../assets/types';
import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import * as utils from '../../assets/utils';

jest.mock('../../network/ConnectionManager');
jest.mock('../../assets/utils');

describe('BalanceService', () => {
    let service: BalanceService;
    let mockApi: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockApi = {
            query: {
                System: {
                    Account: {
                        getValue: jest.fn()
                    }
                },
                Assets: {
                    Account: {
                        getValue: jest.fn()
                    }
                },
                ForeignAssets: {
                    Account: {
                        getValue: jest.fn()
                    }
                }
            }
        };

        // Basic mock setup
        jest.spyOn(ConnectionManager, 'getInstance').mockReturnValue({
            isInitialized: jest.fn().mockReturnValue(true),
            initialize: jest.fn(),
            getAssetHubApi: jest.fn().mockReturnValue(mockApi)
        } as any);

        jest.spyOn(utils, 'fetchCachedAssets').mockReturnValue({
            asset: {},
            metadata: { decimals: 18 },
            assetType: AssetType.Native
        } as any);

        jest.spyOn(utils, 'formatAmount').mockReturnValue({
            decimal: '100.0',
            raw: '100'
        });

        service = BalanceService.getInstance();
    });

    describe('getBalance', () => {
        const validRequest = {
            address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
            assetId: '1'
        };

        it('should fetch native asset balance', async () => {
            mockApi.query.Assets.Account.getValue.mockResolvedValue({
                balance: BigInt(1000),
                status: { Liquid: null },
                reason: { Sufficient: null }
            });

            const result = await service.getBalance(validRequest);
            expect(result).toBeTruthy();
            expect(result.status).toBe('Liquid');
        });


        it('should handle asset not found', async () => {
            jest.spyOn(utils, 'fetchCachedAssets').mockReturnValue(null);

            await expect(service.getBalance(validRequest))
                .rejects
                .toThrow('Asset not found');
        });
    });
}); 