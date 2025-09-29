# 🚀 XCM Router Implementation Guide

> **Direct Migration Approach**: Complete replacement of SwapContainer with real ParaSpell XCM Router APIs

---

## 📋 Overview

This document outlines the **complete implementation approach** for replacing the current dummy asset and routing logic in SwapContainer with the new XCM Router services. No backward compatibility is needed - we're doing a clean replacement.

### **What We're Replacing**

```
CURRENT (Dummy)                    NEW (XCM Router)
─────────────────────────────────────────────────────────────
useSwapTokens()          →        Direct useAssetAggregator()
├─ DUMMY_ASSETS array           ├─ Real ParaSpell unified assets
├─ 23 hardcoded tokens          ├─ Network-aware asset selection
└─ Basic symbol matching        └─ Asset keys + network chains

useSwapRoute()           →        RouterBuilder integration
├─ Dummy 95% conversion         ├─ Real BestAmountOut quotes
├─ Fake fee calculation         ├─ Multi-currency XCM fees
└─ Hardcoded DEX                └─ Auto DEX selection
```

---

## 🎯 Implementation Strategy

### **Phase 1: Token Management Redesign** (Days 1-2)

#### **1.1 Complete SwapContainer Token Integration**

**Goal**: Replace the entire token management system with XCM-aware assets

**File**: `apps/web/src/components/swap/SwapContainer.tsx`

**Implementation**:

```typescript
"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { SubmitButtonAction, SwapHeader, SwapField, SwapDetails } from '@/components/swap'
import { HeaderActions } from '@/components/swap/ui/SwapHeader'

// XCM Router imports
import useAssetAggregator, { determineCurrency } from '@/services/xcm-router/useAssetAggregator'
import { EXCHANGE_CHAINS } from '@paraspell/xcm-router'
import { calculateTotalFees, formatFeeSummary } from '@/services/xcm-router/feeCalculator'

// Dynamic imports for non-critical components
const SwapConfirmSheet = dynamic(() => import('@/components/swap/ui/SwapConfirmSheet').then(mod => ({ default: mod.SwapConfirmSheet })), {
  ssr: false
})

const SwapHistoryDialog = dynamic(() => import('@/components/swap/ui/SwapHistoryDialog').then(mod => ({ default: mod.SwapHistoryDialog })), {
  ssr: false
})

import { useTokenBalances } from '@/components/swap/hooks/useTokenBalances'
import { useSwapConfirmation } from '@/components/swap/hooks/useSwapConfirmation'
import { useSwapExecution } from '@/components/swap/hooks/useSwapExecution'
import { useSwapHistory } from '@/components/swap/hooks/useSwapHistory'
import { LoadState } from '@/components/swap/ui/LoadState'
import { ArrowSymbolDown } from '@/components/swap'
import { calculateMinimumReceived } from '@/components/swap'
import { SwapCompleteDialog } from './ui/SwapCompleteDialog'

// URL param management
import { useFromTokenState, useToTokenState, useFromNetworkState, useToNetworkState } from '@/components/swap/hooks/utils/queryParams'

// Enhanced token type for XCM
export interface XcmTokenInfo {
  id: string;              // Asset key (e.g., "USDC-1984")
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
  network: string;         // Network name
  assetKey: string;        // ParaSpell asset key
  networkChain: string;    // Chain identifier for RouterBuilder
}

export function SwapContainer() {
  // UI state
  const [inputAmount, setInputAmount] = useState('')
  const [slippageTolerance, setSlippageTolerance] = useState(10)
  const [insufficientBalance, setInsufficientBalance] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [openInputDialog, setOpenInputDialog] = useState(false)
  const [openOutputDialog, setOpenOutputDialog] = useState(false)

  // Wallet state
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')

  // XCM Route state
  const [outputAmount, setOutputAmount] = useState('')
  const [routeDex, setRouteDex] = useState<string>('')
  const [isRouteLoading, setIsRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [estimatedFees, setEstimatedFees] = useState<string>('0')
  const [feeBreakdown, setFeeBreakdown] = useState<any>(undefined)
  const [isProcessing, setIsProcessing] = useState(false)

  // Asset & Network Selection from URL params
  const [fromSymbol, setFromSymbol] = useFromTokenState()
  const [toSymbol, setToSymbol] = useToTokenState()
  const [fromNetwork, setFromNetwork] = useFromNetworkState()
  const [toNetwork, setToNetwork] = useToNetworkState()

  // Initialize XCM Asset Aggregator
  const {
    unifiedFromAssets,
    unifiedToAssets,
    getTAssetFromKey,
    getAssetKeyForNetwork,
    getOptimalExchanges,
  } = useAssetAggregator(undefined, [...EXCHANGE_CHAINS], undefined)

  // Auto-select first verified network when symbol changes
  useEffect(() => {
    if (fromSymbol && !fromNetwork) {
      const asset = unifiedFromAssets.find(a => a.symbol === fromSymbol)
      if (asset && asset.supportedNetworks.length > 0) {
        const verifiedNetwork = asset.supportedNetworks.find(n => n.verified)
        setFromNetwork(verifiedNetwork?.network || asset.supportedNetworks[0].network)
      }
    }
  }, [fromSymbol, fromNetwork, unifiedFromAssets, setFromNetwork])

  useEffect(() => {
    if (toSymbol && !toNetwork) {
      const asset = unifiedToAssets.find(a => a.symbol === toSymbol)
      if (asset && asset.supportedNetworks.length > 0) {
        const verifiedNetwork = asset.supportedNetworks.find(n => n.verified)
        setToNetwork(verifiedNetwork?.network || asset.supportedNetworks[0].network)
      }
    }
  }, [toSymbol, toNetwork, unifiedToAssets, setToNetwork])

  // Convert unified assets to XcmTokenInfo
  const inputToken = useMemo<XcmTokenInfo | null>(() => {
    if (!fromSymbol || !fromNetwork) return null
    
    const assetKey = getAssetKeyForNetwork(fromSymbol, fromNetwork, 'from')
    if (!assetKey) return null
    
    const asset = getTAssetFromKey(assetKey, 'from')
    if (!asset) return null
    
    return {
      id: assetKey,
      name: asset.symbol || fromSymbol,
      symbol: asset.symbol || fromSymbol,
      icon: (asset.symbol || fromSymbol).charAt(0),
      decimals: asset.decimals || 10,
      network: fromNetwork,
      assetKey,
      networkChain: fromNetwork,
    }
  }, [fromSymbol, fromNetwork, getAssetKeyForNetwork, getTAssetFromKey])

  const outputToken = useMemo<XcmTokenInfo | null>(() => {
    if (!toSymbol || !toNetwork) return null
    
    const assetKey = getAssetKeyForNetwork(toSymbol, toNetwork, 'to')
    if (!assetKey) return null
    
    const asset = getTAssetFromKey(assetKey, 'to')
    if (!asset) return null
    
    return {
      id: assetKey,
      name: asset.symbol || toSymbol,
      symbol: asset.symbol || toSymbol,
      icon: (asset.symbol || toSymbol).charAt(0),
      decimals: asset.decimals || 10,
      network: toNetwork,
      assetKey,
      networkChain: toNetwork,
    }
  }, [toSymbol, toNetwork, getAssetKeyForNetwork, getTAssetFromKey])

  // Convert unified assets to token list for UI compatibility
  const tokens = useMemo<XcmTokenInfo[]>(() => {
    const allTokens: XcmTokenInfo[] = []
    
    // Combine from and to assets
    const allUnifiedAssets = [...unifiedFromAssets]
    unifiedToAssets.forEach(toAsset => {
      if (!allUnifiedAssets.find(a => a.symbol === toAsset.symbol)) {
        allUnifiedAssets.push(toAsset)
      }
    })
    
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
        })
      })
    })
    
    return allTokens
  }, [unifiedFromAssets, unifiedToAssets])

  // Token selection handlers
  const setInputToken = useCallback((token: XcmTokenInfo) => {
    setFromSymbol(token.symbol)
    setFromNetwork(token.networkChain)
  }, [setFromSymbol, setFromNetwork])

  const setOutputToken = useCallback((token: XcmTokenInfo) => {
    setToSymbol(token.symbol)
    setToNetwork(token.networkChain)
  }, [setToSymbol, setToNetwork])

  // Rest of existing hooks stay the same...
  const {
    inputBalance,
    outputBalance,
    isBalanceLoading,
    balancesLoaded,
    resetBalances,
    refreshBalances
  } = useTokenBalances({
    isConnected,
    walletAddress,
    inputToken,
    outputToken
  })

  // Handle wallet disconnect
  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setWalletAddress('');
    resetBalances();
  }, [resetBalances]);

  // XCM Route fetching with RouterBuilder
  const fetchXcmRoute = useCallback(async (amount: string) => {
    if (!inputToken || !outputToken || !amount || parseFloat(amount) <= 0) {
      setOutputAmount('');
      setRouteDex('');
      setIsRouteLoading(false);
      setRouteError(null);
      setEstimatedFees('0');
      setFeeBreakdown(undefined);
      return;
    }

    setIsRouteLoading(true);
    setRouteError(null);
    setOutputAmount('');
    setRouteDex('');

    try {
      console.log('🔄 Fetching XCM route:', {
        from: `${inputToken.symbol} (${inputToken.networkChain})`,
        to: `${outputToken.symbol} (${outputToken.networkChain})`,
        amount
      });

      // Get optimal DEX selection
      const optimalExchanges = getOptimalExchanges(
        inputToken.assetKey,
        outputToken.assetKey,
        inputToken.networkChain,
        outputToken.networkChain
      );

      const exchangesToUse = optimalExchanges.length > 0 
        ? optimalExchanges 
        : ["HydrationDex"]; // Fallback

      // Get asset info for RouterBuilder
      const fromAsset = getTAssetFromKey(inputToken.assetKey, 'from');
      const toAsset = getTAssetFromKey(outputToken.assetKey, 'to');

      if (!fromAsset || !toAsset) {
        throw new Error(`Assets not found: ${inputToken.assetKey} or ${outputToken.assetKey}`);
      }

      // Convert to smallest unit for RouterBuilder
      const amountInSmallestUnit = BigInt(
        Math.floor(parseFloat(amount) * Math.pow(10, inputToken.decimals))
      );

      // Import RouterBuilder dynamically to avoid SSR issues
      const { RouterBuilder } = await import('@paraspell/xcm-router');

      // Get best quote
      const quoteResult = await RouterBuilder()
        .from(inputToken.networkChain as any)
        .to(outputToken.networkChain as any)
        .exchange(exchangesToUse as any)
        .currencyFrom(determineCurrency(fromAsset))
        .currencyTo(determineCurrency(toAsset))
        .amount(amountInSmallestUnit)
        .getBestAmountOut();

      // Convert output back to decimal
      const outputDecimal = (Number(quoteResult.amountOut) / Math.pow(10, outputToken.decimals)).toFixed(6);
      setOutputAmount(outputDecimal);
      setRouteDex(Array.isArray(quoteResult.exchange) 
        ? quoteResult.exchange.join(' → ') 
        : quoteResult.exchange
      );

      console.log('✅ Quote received:', {
        outputAmount: outputDecimal,
        exchange: quoteResult.exchange,
      });

      // Get fees if wallet connected
      if (walletAddress) {
        console.log('💰 Fetching XCM fees...');
        
        const feeResult = await RouterBuilder()
          .from(inputToken.networkChain as any)
          .to(outputToken.networkChain as any)
          .exchange(exchangesToUse as any)
          .currencyFrom(determineCurrency(fromAsset))
          .currencyTo(determineCurrency(toAsset))
          .amount(amountInSmallestUnit)
          .senderAddress(walletAddress)
          .recipientAddress(walletAddress)
          .slippagePct((slippageTolerance / 10).toString()) // Convert to decimal
          .getXcmFees();

        const feeSummary = calculateTotalFees(feeResult);
        setFeeBreakdown(feeSummary);
        setEstimatedFees(formatFeeSummary(feeSummary));

        console.log('✅ Fees calculated:', formatFeeSummary(feeSummary));
      }

    } catch (error: any) {
      console.error('❌ XCM route fetch error:', error);
      setRouteError(error.message || 'Failed to fetch route');
      setOutputAmount('');
      setRouteDex('');
    } finally {
      setIsRouteLoading(false);
    }
  }, [
    inputToken,
    outputToken,
    getOptimalExchanges,
    getTAssetFromKey,
    walletAddress,
    slippageTolerance,
  ]);

  // Debounced route fetching
  const debouncedFetchRoute = useMemo(() => {
    const debounce = (func: Function, delay: number) => {
      let timeoutId: NodeJS.Timeout;
      return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
      };
    };
    return debounce(fetchXcmRoute, 800);
  }, [fetchXcmRoute]);

  const resetRoute = useCallback(() => {
    setOutputAmount('');
    setRouteDex('');
    setIsRouteLoading(false);
    setRouteError(null);
    setEstimatedFees('0');
    setFeeBreakdown(undefined);
  }, []);

  // Existing confirmation hooks stay the same
  const {
    showConfirmation,
    simulationResult,
    isConfirmingSwap,
    isSwapComplete,
    isSwappingInProgress,
    setShowConfirmation,
    handleSimulationComplete,
    handleConfirmSwap,
    handleCancelSwap,
    resetConfirmationState
  } = useSwapConfirmation({
    setIsSwapping: setIsProcessing
  });

  // Handle balance updates after swap
  const handleBalanceUpdateNeeded = useCallback((txHash?: string) => {
    refreshBalances(true, txHash);
  }, [refreshBalances]);

  // Swap execution (existing hook can be reused)
  const { handleSwapExecution } = useSwapExecution({
    inputToken,
    outputToken,
    inputAmount,
    insufficientBalance,
    executeAssetConversionSwap: async () => {
      // This will be replaced with XCM swap execution
      console.log('XCM Swap execution - to be implemented');
    },
    setIsSwapping: setIsProcessing,
    setIsConfirmingSwap: resetConfirmationState
  });

  // Reset states when tokens change
  useEffect(() => {
    setInsufficientBalance(false);
    resetRoute();

    // If we have both tokens and an input amount, fetch new route
    if (inputToken && outputToken && inputAmount && parseFloat(inputAmount) > 0) {
      debouncedFetchRoute(inputAmount);
    }
  }, [inputToken?.id, outputToken?.id, inputAmount, debouncedFetchRoute, resetRoute]);

  // Input change handler
  const handleInputChange = useCallback((value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setInputAmount(value);

      if (value && parseFloat(value) > 0) {
        debouncedFetchRoute(value);
      } else {
        resetRoute();
      }

      setInsufficientBalance(value !== '' && parseFloat(value) > parseFloat(inputBalance));
    }
  }, [debouncedFetchRoute, inputBalance, resetRoute]);

  const percentageOptions = useMemo(() => [
    { label: '25%', value: 0.25 },
    { label: '50%', value: 0.50 },
    { label: 'MAX', value: 1 },
  ], []);

  // Swap history hook
  const { swapHistory, isLoadingHistory } = useSwapHistory({
    walletAddress,
    showHistory
  });

  // Handle wallet disconnect with cleanup
  const handleWalletDisconnect = useCallback(() => {
    handleDisconnect();
    resetBalances();
    if (showConfirmation) {
      resetConfirmationState();
    }
    resetRoute();
    setInputAmount('');
  }, [handleDisconnect, showConfirmation, resetConfirmationState, resetBalances, resetRoute]);

  if (!inputToken || !outputToken) {
    return <LoadState />
  }

  return (
    <>
      {/* Main Content */}
      <div className="w-full h-full flex flex-col items-center pt-16 sm:-top-10 sm:justify-center px-4 md:px-4 relative z-10 overflow-y-scroll no-scrollbar">
        <div className="w-full max-w-md space-y-5 md:space-y-4">
          <SwapHeader
            slippageTolerance={slippageTolerance}
            setSlippageTolerance={setSlippageTolerance}
            onHistoryClick={() => setShowHistory(true)}
          />

          <div className="space-y-4">
            <div className="">
              <SwapField
                type="input"
                token={inputToken}
                amount={inputAmount}
                balance={inputBalance}
                onTokenSelect={(token) => setInputToken(token)}
                onAmountChange={handleInputChange}
                openDialog={openInputDialog}
                setOpenDialog={setOpenInputDialog}
                availableTokens={tokens}
                percentageOptions={percentageOptions}
                onPercentageSelect={(value) => handleInputChange((parseFloat(inputBalance) * value).toString())}
                isLoading={isConnected && isBalanceLoading}
                balancesLoaded={balancesLoaded}
                isConnected={isConnected}
              />

              <ArrowSymbolDown />

              <SwapField
                type="output"
                token={outputToken}
                amount={outputAmount}
                balance={outputBalance}
                onTokenSelect={(token) => setOutputToken(token)}
                openDialog={openOutputDialog}
                setOpenDialog={setOpenOutputDialog}
                availableTokens={tokens}
                isLoading={isRouteLoading || (isConnected && isBalanceLoading)}
                balancesLoaded={balancesLoaded}
                isConnected={isConnected}
                isProcessing={isProcessing}
                error={routeError}
              />
            </div>

            <SwapDetails
              minimumReceived={calculateMinimumReceived(outputAmount, slippageTolerance)}
              outputToken={outputToken}
              inputToken={inputToken}
              maxTransactionFee={estimatedFees}
              feeBreakdown={feeBreakdown}
              route={routeDex || ''}
              isLoading={isRouteLoading}
              isProcessing={isProcessing}
            />

            <SubmitButtonAction
              isConnected={isConnected}
              isSwapping={isProcessing}
              setIsConnected={setIsConnected}
              setWalletAddress={setWalletAddress}
              onSwap={() => setShowConfirmation(true)}
              insufficientBalance={insufficientBalance}
              disabled={!inputAmount || inputAmount === '' || parseFloat(inputAmount) <= 0 || insufficientBalance}
            />
          </div>
        </div>
      </div>

      {/* History Dialog */}
      <SwapHistoryDialog
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        swapHistory={swapHistory}
        isLoadingHistory={isLoadingHistory}
      />

      {/* Swap Confirmation Bottom Sheet */}
      <SwapConfirmSheet
        isOpen={showConfirmation}
        onClose={handleCancelSwap}
        onConfirm={handleConfirmSwap}
        inputAmount={inputAmount}
        inputToken={inputToken.symbol}
        outputAmount={outputAmount}
        outputToken={outputToken.symbol}
        slippageTolerance={slippageTolerance}
        simulationResult={simulationResult}
        isConfirming={isConfirmingSwap}
      />

      <SwapCompleteDialog 
        isOpen={isSwappingInProgress || isSwapComplete}
        isSwappingInProgress={isSwappingInProgress}
        isSwapComplete={isSwapComplete}
        inputAmount={inputAmount}
        inputToken={inputToken.symbol}
        outputAmount={outputAmount}
        outputToken={outputToken.name}
        duration={4000}
        onClose={resetConfirmationState}
      />
    </>
  )
} 
```

---

### **Phase 2: Enhanced Asset Selection UI** (Day 2)

#### **2.1 Add Network Selection Query Parameters**

**File**: `apps/web/src/components/swap/hooks/utils/queryParams.ts`

**Add network parameter support**:

```typescript
// Add these new exports to existing queryParams.ts

export const useFromNetworkState = () => {
  return useQueryState('fromNetwork', parseAsString.withDefault(''));
};

export const useToNetworkState = () => {
  return useQueryState('toNetwork', parseAsString.withDefault(''));
};
```

#### **2.2 Enhanced SwapField with Network Display**

**File**: `apps/web/src/components/swap/ui/SwapField.tsx`

**Enhancement to show network badges**:

```typescript
// Add network display to token selection button
<Button
  variant="ghost"
  className="w-full h-12 p-2 justify-between"
  onClick={() => setOpenDialog(true)}
>
  <div className="flex items-center space-x-3">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-medium text-sm">
      {token.icon}
    </div>
    <div className="flex flex-col items-start">
      <div className="font-medium text-gray-900 dark:text-white">
        {token.symbol}
      </div>
      {token.network && (
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
          <span>{token.network}</span>
          <div className="w-1 h-1 bg-green-500 rounded-full"></div>
        </div>
      )}
    </div>
  </div>
  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
</Button>
```

#### **2.3 Enhanced AssetList with Network Grouping**

**File**: `apps/web/src/components/swap/ui/AssetList.tsx`

**Update to use UnifiedAssets**:

```typescript
// Enhanced AssetList to show network-grouped assets
import { UnifiedAsset } from '@/services/xcm-router/useAssetAggregator'

export interface EnhancedAssetListProps {
  unifiedAssets: UnifiedAsset[];
  onSelect: (token: XcmTokenInfo) => void;
  currentToken?: XcmTokenInfo | null;
  onClose: () => void;
}

export function EnhancedAssetList({ 
  unifiedAssets, 
  onSelect, 
  currentToken, 
  onClose 
}: EnhancedAssetListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set());

  const filteredAssets = useMemo(() => {
    return unifiedAssets.filter(asset =>
      asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
      // Prioritize assets with more verified networks
      if (a.validNetworks !== b.validNetworks) {
        return b.validNetworks - a.validNetworks;
      }
      return a.symbol.localeCompare(b.symbol);
    });
  }, [unifiedAssets, searchTerm]);

  const toggleAssetExpansion = (symbol: string) => {
    const newExpanded = new Set(expandedAssets);
    if (newExpanded.has(symbol)) {
      newExpanded.delete(symbol);
    } else {
      newExpanded.add(symbol);
    }
    setExpandedAssets(newExpanded);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Select Asset & Network</DialogTitle>
        </DialogHeader>
        
        {/* Search */}
        <div className="space-y-4">
          <Input
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          
          <div className="space-y-2 overflow-y-auto max-h-[500px]">
            {filteredAssets.map((asset) => (
              <div key={asset.symbol} className="space-y-1">
                {/* Asset Header */}
                <Button
                  variant="ghost"
                  className="w-full justify-between p-3 h-auto"
                  onClick={() => toggleAssetExpansion(asset.symbol)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
                      {asset.symbol.charAt(0)}
                    </div>
                    <div className="flex flex-col items-start">
                      <div className="font-medium">{asset.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {asset.symbol} • {asset.validNetworks}/{asset.totalNetworks} networks
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={asset.isValid ? "default" : "secondary"}>
                      {asset.category}
                    </Badge>
                    <ChevronRightIcon 
                      className={`w-4 h-4 transition-transform ${
                        expandedAssets.has(asset.symbol) ? 'rotate-90' : ''
                      }`} 
                    />
                  </div>
                </Button>
                
                {/* Network Options */}
                {expandedAssets.has(asset.symbol) && (
                  <div className="pl-6 space-y-1">
                    {asset.supportedNetworks.map((network) => {
                      const isSelected = 
                        currentToken?.symbol === asset.symbol && 
                        currentToken?.network === network.network;
                      
                      return (
                        <Button
                          key={network.assetKey}
                          variant={isSelected ? "default" : "ghost"}
                          className="w-full justify-start text-sm py-2 h-auto"
                          onClick={() => {
                            onSelect({
                              id: network.assetKey,
                              name: asset.name,
                              symbol: asset.symbol,
                              icon: asset.symbol.charAt(0),
                              decimals: network.actualAsset.decimals || 10,
                              network: network.network,
                              assetKey: network.assetKey,
                              networkChain: network.network,
                            });
                            onClose();
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-2">
                              <span>{network.displayName}</span>
                              {network.verified && (
                                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {network.assetType}
                            </Badge>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### **Phase 3: Enhanced Types & Interfaces** (Day 3)

#### **3.1 Update Core Types**

**File**: `apps/web/src/components/swap/types.ts`

**Replace existing TokenInfo with XCM-aware version**:

```typescript
// Replace the existing TokenInfo interface
export interface TokenInfo {
  id: string;              // Asset key (e.g., "USDC-1984")
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
  network: string;         // Network name (required for XCM)
  assetKey?: string;       // ParaSpell asset key
  networkChain?: string;   // Chain identifier for RouterBuilder
}

// Enhanced version with required XCM fields
export interface XcmTokenInfo extends TokenInfo {
  assetKey: string;        // Required: ParaSpell asset key
  networkChain: string;    // Required: Chain identifier
}

// Update SwapFieldProps to support unified assets
export interface SwapFieldProps {
  type: 'input' | 'output';
  token: TokenInfo;
  amount: string;
  balance: string;
  onTokenSelect: (token: TokenInfo) => void;
  onAmountChange?: (value: string) => void;
  openDialog: boolean;
  setOpenDialog: (value: boolean) => void;
  availableTokens: TokenInfo[];
  unifiedAssets?: UnifiedAsset[];  // NEW: For enhanced selection
  percentageOptions?: Array<{ label: string; value: number }>;
  onPercentageSelect?: (value: number) => void;
  isLoading?: boolean;
  balancesLoaded?: boolean;
  isConnected?: boolean;
  isProcessing?: boolean;
  error?: string | null;
}

// Enhanced route state for XCM
export interface XcmRouteState {
  isLoading: boolean;
  error: string | null;
  data: {
    amountOut: string;
    exchange: string | string[];
    path: string[];
  } | null;
  optimalExchanges: string[];
  feeEstimate: {
    fees: any;
    isLoading: boolean;
    error?: string;
  } | null;
}
```

#### **3.2 Enhanced Hook Interfaces**

**File**: `apps/web/src/components/swap/hooks/types.ts` (new file)

```typescript
// Centralized types for XCM hooks
import type { TAssetInfo } from '@paraspell/sdk';
import type { UnifiedAsset } from '@/services/xcm-router/useAssetAggregator';
import type { FeeSummary } from '@/services/xcm-router/feeCalculator';

export interface XcmTokenHookReturn {
  inputToken: XcmTokenInfo | null;
  outputToken: XcmTokenInfo | null;
  tokens: XcmTokenInfo[];
  setInputToken: (token: XcmTokenInfo) => void;
  setOutputToken: (token: XcmTokenInfo) => void;
  unifiedFromAssets: UnifiedAsset[];
  unifiedToAssets: UnifiedAsset[];
  getOptimalExchanges: (fromKey: string, toKey: string, fromChain: string, toChain: string) => string[];
  determineCurrency: (asset: TAssetInfo) => any;
  getTAssetFromKey: (key: string, direction: 'from' | 'to') => TAssetInfo | undefined;
}

export interface XcmRouteHookProps {
  inputToken: XcmTokenInfo | null;
  outputToken: XcmTokenInfo | null;
  walletAddress?: string;
  slippageTolerance?: number;
  getOptimalExchanges: (fromKey: string, toKey: string, fromChain: string, toChain: string) => string[];
  determineCurrency: (asset: TAssetInfo) => any;
  getTAssetFromKey: (key: string, direction: 'from' | 'to') => TAssetInfo | undefined;
}

export interface XcmRouteHookReturn {
  outputAmount: string;
  routeDex: string;
  routeState: XcmRouteState;
  estimatedFees: string;
  feeBreakdown: FeeSummary | undefined;
  debouncedFetchRoute: (amount: string) => void;
  isProcessing: boolean;
  resetRoute: () => void;
}
```

---

### **Phase 4: Cleanup & File Removal** (Day 4)

#### **4.1 Files to Delete**

```bash
# Remove old dummy-based hooks
apps/web/src/components/swap/hooks/useSwapTokens.ts
apps/web/src/components/swap/hooks/useSwapRoute.ts

# Remove any dummy constants if they exist elsewhere
```

#### **4.2 Update Import Statements**

**Files to update**:

1. **`apps/web/src/components/swap/index.ts`** - Update exports
2. **Any test files** - Update imports
3. **Component files** that might import the old hooks

#### **4.3 Remove Dummy Constants**

Search and remove:
- `DUMMY_ASSETS` array
- `USE_DUMMY_ASSETS` flag
- `USE_DUMMY_ROUTE` flag
- Any hardcoded asset arrays

---

## 🔧 Implementation Benefits

### **1. Real Asset Data**
- ✅ **100+ real assets** from ParaSpell SDK
- ✅ **Network-aware selection** with verified chains
- ✅ **Automatic asset discovery** as ParaSpell adds new assets

### **2. Accurate Routing**
- ✅ **Real quotes** from multiple DEXs
- ✅ **Optimal DEX selection** based on liquidity
- ✅ **Cross-chain routing** with proper fee calculation

### **3. Enhanced UX**
- ✅ **Network grouping** in asset selection
- ✅ **Multi-currency fees** with breakdown
- ✅ **Real-time quotes** with proper loading states
- ✅ **Shareable URLs** with full swap context

### **4. Type Safety**
- ✅ **Full TypeScript support** throughout
- ✅ **ParaSpell SDK types** integration
- ✅ **Compile-time validation** of asset keys and networks

---

## ⚠️ Implementation Considerations

### **1. Performance Optimization**

**Router queries can be slow (1-3 seconds)**:
```typescript
// Use aggressive debouncing
const debouncedFetchRoute = useMemo(() => 
  debounce(fetchXcmRoute, 800), [fetchXcmRoute]
);

// Show skeleton loaders during fetching
{isRouteLoading && <RouteSkeleton />}

// Cache results where possible
const routeCache = useMemo(() => new Map(), []);
```

### **2. Error Handling**

**Network failures are common**:
```typescript
try {
  const result = await RouterBuilder().getBestAmountOut();
} catch (error) {
  // Graceful fallback
  setRouteError('Unable to fetch route. Please try again.');
  // Could implement retry logic
}
```

### **3. BigInt Handling**

**RouterBuilder uses BigInt for precision**:
```typescript
// Always convert user input to BigInt
const amountInSmallestUnit = BigInt(
  Math.floor(parseFloat(amount) * Math.pow(10, decimals))
);

// Always convert RouterBuilder output back to string
const outputDecimal = (Number(result.amountOut) / Math.pow(10, decimals)).toFixed(6);

// Use safeStringify for logging
console.log('Route result:', safeStringify(result));
```

---

## 📋 Implementation Checklist

### **Phase 1: Token Management** ✅
- [ ] Replace useSwapTokens with direct useAssetAggregator integration
- [ ] Add network parameter support to URL
- [ ] Implement auto-network selection logic
- [ ] Update TokenInfo types for XCM compatibility
- [ ] Test token selection with real ParaSpell data

### **Phase 2: Asset Selection UI** ✅
- [ ] Enhance SwapField with network display
- [ ] Create network-grouped AssetList component
- [ ] Add search functionality for assets
- [ ] Implement network verification indicators
- [ ] Test UI with multiple networks per asset

### **Phase 3: Route Integration** ✅
- [ ] Implement RouterBuilder integration for quotes
- [ ] Add automatic DEX selection logic
- [ ] Implement multi-currency fee calculation
- [ ] Add proper error handling and loading states
- [ ] Test cross-chain routes (AssetHub ↔ Hydration)

### **Phase 4: Cleanup** ✅
- [ ] Delete old hook files (useSwapTokens, useSwapRoute)
- [ ] Remove all dummy constants and flags
- [ ] Update all import statements
- [ ] Clean up console logs and debug code
- [ ] Update documentation

### **Testing & QA** ✅
- [ ] Test asset selection across different networks
- [ ] Test route calculation with various asset pairs
- [ ] Test fee calculation and display
- [ ] Test error scenarios (network failures, invalid routes)
- [ ] Performance testing (debouncing, loading states)
- [ ] End-to-end swap flow testing

---

## 🚀 Success Metrics

### **Functional Requirements**
- ✅ Real asset data from ParaSpell SDK (no dummy data)
- ✅ Network-aware asset selection with verification
- ✅ Accurate cross-chain routing with optimal DEX selection
- ✅ Multi-currency fee calculation and display
- ✅ Shareable URLs with full swap context

### **Performance Requirements**
- ⏱️ Asset loading < 1 second
- ⏱️ Route calculation < 3 seconds (95th percentile)
- 🔄 Debounced input to prevent excessive API calls
- 📱 Responsive UI with proper loading states

### **User Experience**
- 🎨 Clean network-grouped asset selection
- ⚠️ Clear error messaging for failed routes
- 🔗 Shareable swap URLs with asset + network context
- 📊 Detailed fee breakdown with multi-currency support

---

## 📚 Resources & References

- **ParaSpell SDK Documentation**: https://paraspell.github.io/docs/
- **XCM Router Package**: https://github.com/paraspell/xcm-tools/tree/main/packages/xcm-router
- **Services API Reference**: `apps/web/src/services/xcm-router/docs/SERVICES_API_REFERENCE.md`
- **Asset Registry**: `apps/web/src/services/xcm-router/assetRegistry.ts`
- **Fee Calculator**: `apps/web/src/services/xcm-router/feeCalculator.ts`

---

**This implementation approach provides a complete, production-ready XCM Router integration that replaces all dummy logic with real ParaSpell functionality while maintaining a clean, type-safe, and user-friendly interface.** 🎯
