'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import useAssetAggregator, { determineCurrency } from '@/services/xcm-router/useAssetAggregator';
import { EXCHANGE_CHAINS } from '@paraspell/xcm-router';
import type { TokenInfo } from '@/components/swap/types';

/**
 * XCM-powered token selection hook using ParaSpell SDK
 * 
 * Replaces useSwapTokens with real asset data from ParaSpell
 * Provides network-aware token selection with automatic network selection
 * 
 * @returns Token selection state and helpers for XCM routing
 */
export function useXcmTokens() {
  // Simple React state for selected tokens (URL params removed for now)
  const [inputToken, setInputToken] = useState<TokenInfo | null>(null);
  const [outputToken, setOutputToken] = useState<TokenInfo | null>(null);

  // Initialize asset aggregator with all exchange chains
  const {
    unifiedFromAssets,
    unifiedToAssets,
    getTAssetFromKey,
    getAssetKeyForNetwork,
    getOptimalExchanges,
    currencyFromMap,
    currencyToMap,
  } = useAssetAggregator(undefined, EXCHANGE_CHAINS, undefined);

  // Convert UnifiedAssets to flat TokenInfo list for UI compatibility
  const tokens = useMemo<TokenInfo[]>(() => {
    const allTokens: TokenInfo[] = [];
    
    // Combine from and to assets, removing duplicates
    const allUnifiedAssets = [...unifiedFromAssets];
    unifiedToAssets.forEach(toAsset => {
      if (!allUnifiedAssets.find(a => a.symbol === toAsset.symbol)) {
        allUnifiedAssets.push(toAsset);
      }
    });
    
    allUnifiedAssets.forEach(asset => {
      asset.supportedNetworks.forEach(network => {
        allTokens.push({
          id: network.assetKey,
          name: asset.name,
          symbol: asset.symbol,
          icon: asset.symbol.charAt(0),
          decimals: network.actualAsset.decimals || 10,
          network: network.network,
          assetKey: network.assetKey,
          networkChain: network.network,
        });
      });
    });
    
    return allTokens;
  }, [unifiedFromAssets, unifiedToAssets]);

  // Auto-select default tokens when assets load (if no tokens are selected)
  useEffect(() => {
    if (tokens.length > 0 && !inputToken && !outputToken) {
      // Find DOT as input token (common default)
      const dotToken = tokens.find(t => t.symbol === 'DOT');
      if (dotToken) {
        setInputToken(dotToken);
      }

      // Find USDC as output token (common default)
      const usdcToken = tokens.find(t => t.symbol === 'USDC');
      if (usdcToken) {
        setOutputToken(usdcToken);
      }
    }
  }, [tokens, inputToken, outputToken]);
  
  const handleSetInputToken = useCallback((token: TokenInfo) => {
    setInputToken(token);
  }, []);

  const handleSetOutputToken = useCallback((token: TokenInfo) => {
    setOutputToken(token);
  }, []);

  return {
    inputToken,
    outputToken,
    tokens,
    setInputToken: handleSetInputToken,
    setOutputToken: handleSetOutputToken,
    // Expose additional helpers for routing (Phase 2)
    getOptimalExchanges,
    determineCurrency,
    getTAssetFromKey,
    // For debugging/inspection
    unifiedFromAssets,
    unifiedToAssets,
  };
}
