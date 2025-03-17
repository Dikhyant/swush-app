import { AssetHubRouter } from '../AssetHubRouter';
import { TokenGraph } from '../TokenGraph';
import { CacheService } from '../../../cache/CacheService';
import { NETWORKS_SUPPORTED } from '../../../constants';
import { jest, describe, it, beforeEach, expect } from '@jest/globals';

// Mock dependencies
jest.mock('../../../cache/CacheService');
jest.mock('../TokenGraph');

describe('AssetHubRouter', () => {
    let router: AssetHubRouter;
    
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock minimal API
        const mockApi = { apis: { AssetConversionApi: { quote_price_exact_tokens_for_tokens: jest.fn() } } };
        
        // Mock minimal TokenGraph
        const mockTokenGraph = { findAllPaths: jest.fn(), getNode: jest.fn() };
        
        // Mock CacheService
        jest.spyOn(CacheService, 'getInstance').mockReturnValue({
            get: jest.fn()
        } as any);
        
        // Create router instance
        router = new AssetHubRouter(mockApi as any, mockTokenGraph as any);
    });
    
    describe('findBestRoute', () => {
        it('should handle empty cache', async () => {
            jest.spyOn(CacheService.getInstance() as any, 'get').mockReturnValue(new Map());
            const result = await router.findBestRoute('asset1', 'asset2', '100');
            expect(result).toBeNull();
        });
    });
    
    describe('getHydraDxQuote', () => {
        it('should handle missing HydraDX info', async () => {
            jest.spyOn(CacheService.getInstance() as any, 'get').mockReturnValue(new Map());
            const result = await router.getHydraDxQuote('asset1', 'asset2', '100');
            expect(result).toBeNull();
        });
    });
}); 