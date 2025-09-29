# 🏗️ ParaSpell Migration - Architecture Diagram

---

## 📐 System Architecture Comparison

### **BEFORE: Dummy Data Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                     SwapContainer.tsx                        │
│                    (Main UI Component)                       │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
             │                            │
    ┌────────▼──────────┐        ┌───────▼──────────┐
    │  useSwapTokens()  │        │  useSwapRoute()  │
    │                   │        │                   │
    │  [DUMMY DATA]     │        │  [DUMMY LOGIC]   │
    └────────┬──────────┘        └───────┬──────────┘
             │                            │
             │                            │
    ┌────────▼──────────┐        ┌───────▼──────────┐
    │  DUMMY_ASSETS[]   │        │   Fake Route     │
    │  • 23 hardcoded   │        │   • 95% conv.    │
    │  • No networks    │        │   • Fake fees    │
    │  • Static data    │        │   • No DEX sel.  │
    └───────────────────┘        └──────────────────┘
```

**Problems**:
- ❌ No real asset data
- ❌ No network awareness
- ❌ Fake conversion rates
- ❌ No DEX selection
- ❌ Not production ready

---

### **AFTER: ParaSpell Architecture**

```
┌──────────────────────────────────────────────────────────────────┐
│                      SwapContainer.tsx                           │
│                     (Main UI Component)                          │
└────────────┬─────────────────────────────┬──────────────────────┘
             │                             │
             │                             │
    ┌────────▼──────────┐         ┌───────▼──────────────────┐
    │  useXcmTokens()   │         │    useXcmRoute()         │
    │                   │         │                          │
    │  [PARASPELL]      │         │  [ROUTERBUILDER]         │
    └────────┬──────────┘         └───────┬──────────────────┘
             │                             │
             │                             │
    ┌────────▼───────────────┐    ┌───────▼──────────────────┐
    │  useAssetAggregator()  │    │  RouterBuilder API       │
    │  ┌──────────────────┐  │    │  ┌────────────────────┐  │
    │  │ Asset Registry   │  │    │  │ getBestAmountOut() │  │
    │  │ • USDC-1984      │  │    │  │ getXcmFees()       │  │
    │  │ • DOT-5          │  │    │  │ Auto DEX select    │  │
    │  │ • Network aware  │  │    │  │ Real quotes        │  │
    │  └──────────────────┘  │    │  └────────────────────┘  │
    │  ┌──────────────────┐  │    │                          │
    │  │ useCurrencyOpts  │  │    │  ┌────────────────────┐  │
    │  │ • ParaSpell SDK  │  │    │  │ Fee Calculator     │  │
    │  │ • Live data      │  │    │  │ • Multi-currency   │  │
    │  │ • Validation     │  │    │  │ • Breakdown        │  │
    │  └──────────────────┘  │    │  └────────────────────┘  │
    └────────────────────────┘    └──────────────────────────┘
```

**Benefits**:
- ✅ Real ParaSpell data
- ✅ Multi-network support
- ✅ Accurate quotes
- ✅ Auto DEX selection
- ✅ Production ready

---

## 🔄 Data Flow Diagram

### **Token Selection Flow**

```
┌─────────────┐
│    User     │
│  selects    │
│    USDC     │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│      useXcmTokens()                  │
│                                      │
│  1. Get symbol: "USDC"               │
│  2. Query useAssetAggregator()       │
│     ↓                                │
│  3. Returns unifiedFromAssets:       │
│     {                                │
│       symbol: "USDC",                │
│       supportedNetworks: [           │
│         { network: "AssetHub",       │
│           assetKey: "USDC-1984" },   │
│         { network: "Hydration",      │
│           assetKey: "USDC-22" },     │
│         { network: "Bifrost",        │
│           assetKey: "USDC-5" }       │
│       ]                              │
│     }                                │
│     ↓                                │
│  4. Auto-select first verified net   │
│  5. Return XcmTokenInfo:             │
│     {                                │
│       symbol: "USDC",                │
│       assetKey: "USDC-1984",         │
│       networkChain: "AssetHub",      │
│       decimals: 6                    │
│     }                                │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│      SwapContainer                   │
│      Updates inputToken state        │
└──────────────────────────────────────┘
```

---

### **Route Calculation Flow**

```
┌─────────────┐
│    User     │
│   enters    │
│  amount: 100│
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│      useXcmRoute()                                       │
│                                                          │
│  1. Debounce input (800ms)                               │
│     ↓                                                    │
│  2. Convert to smallest unit:                            │
│     100 USDC × 10^6 = BigInt(100000000)                  │
│     ↓                                                    │
│  3. Get optimal DEX:                                     │
│     getOptimalExchanges(                                 │
│       "USDC-1984",           // fromKey                  │
│       "DOT-5",               // toKey                    │
│       "AssetHub",            // fromChain                │
│       "Hydration"            // toChain                  │
│     )                                                    │
│     → Returns: ["HydrationDex", "AssetHubDex"]           │
│     ↓                                                    │
│  4. Get asset info:                                      │
│     fromAsset = getTAssetFromKey("USDC-1984", 'from')    │
│     toAsset = getTAssetFromKey("DOT-5", 'to')            │
│     ↓                                                    │
│  5. Build RouterBuilder query:                           │
│     await RouterBuilder()                                │
│       .from("AssetHubPolkadot")                          │
│       .to("Hydration")                                   │
│       .exchange(["HydrationDex", "AssetHubDex"])         │
│       .currencyFrom({ id: 1984 })                        │
│       .currencyTo({ id: 5 })                             │
│       .amount(BigInt(100000000))                         │
│       .getBestAmountOut()                                │
│     ↓                                                    │
│  6. Receive quote:                                       │
│     {                                                    │
│       amountOut: BigInt(9850000000),  // 98.5 DOT       │
│       exchange: ["HydrationDex"]                         │
│     }                                                    │
│     ↓                                                    │
│  7. Convert back to decimal:                             │
│     BigInt(9850000000) ÷ 10^10 = "98.5"                  │
│     ↓                                                    │
│  8. If wallet connected, get fees:                       │
│     await RouterBuilder()                                │
│       /* same params */                                  │
│       .senderAddress(walletAddress)                      │
│       .recipientAddress(walletAddress)                   │
│       .slippagePct("1")                                  │
│       .getXcmFees()                                      │
│     ↓                                                    │
│  9. Calculate fee summary:                               │
│     {                                                    │
│       totalFees: {                                       │
│         'DOT': { adjustedAmount: '0.001', ... },         │
│         'USDC': { adjustedAmount: '0.0005', ... }        │
│       }                                                  │
│     }                                                    │
│     ↓                                                    │
│ 10. Return to UI:                                        │
│     outputAmount: "98.5"                                 │
│     routeDex: "HydrationDex"                             │
│     estimatedFees: "0.001 DOT + 0.0005 USDC"             │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│      SwapContainer                   │
│      Displays quote to user          │
└──────────────────────────────────────┘
```

---

## 🗂️ File Structure Comparison

### **BEFORE: Dummy Implementation**

```
apps/web/src/components/swap/
├── SwapContainer.tsx
├── hooks/
│   ├── useSwapTokens.ts          ❌ DUMMY ASSETS
│   │   └── DUMMY_ASSETS = [...]
│   │
│   ├── useSwapRoute.ts           ❌ FAKE ROUTING
│   │   └── expectedOutput = input * 0.95
│   │
│   ├── useTokenBalances.ts       ✅ (Keep)
│   ├── useSwapConfirmation.ts    ✅ (Keep)
│   └── useSwapExecution.ts       ✅ (Keep)
│
└── types.ts
    └── TokenInfo {               ❌ No network info
          id, name, symbol,
          icon, decimals
        }
```

---

### **AFTER: ParaSpell Implementation**

```
apps/web/
├── src/
│   ├── components/swap/
│   │   ├── SwapContainer.tsx            ✏️ Updated hooks
│   │   ├── hooks/
│   │   │   ├── useXcmTokens.ts         ✨ NEW - ParaSpell tokens
│   │   │   ├── useXcmRoute.ts          ✨ NEW - RouterBuilder
│   │   │   ├── useTokenBalances.ts     ✅ (No change)
│   │   │   ├── useSwapConfirmation.ts  ✅ (No change)
│   │   │   └── useSwapExecution.ts     ✅ (No change)
│   │   │
│   │   └── types.ts                    ✏️ Extended TokenInfo
│   │       └── TokenInfo {
│   │             id, name, symbol,
│   │             icon, decimals,
│   │             network,              ✨ NEW
│   │             assetKey?,            ✨ NEW
│   │             networkChain?         ✨ NEW
│   │           }
│   │
│   └── services/xcm-router/           ✅ Already exists
│       ├── useAssetAggregator.ts      🔥 Powers useXcmTokens
│       ├── assetRegistry.ts           🔥 Asset definitions
│       ├── assetRegistryUtils.ts      🔥 DEX compatibility
│       ├── useCurrencyOptions.ts      🔥 ParaSpell data
│       ├── feeCalculator.ts           🔥 Fee calculation
│       └── docs/
│           └── SERVICES_API_REFERENCE.md
│
├── PARASPELL_MIGRATION_PLAN.md        📄 Detailed plan
├── MIGRATION_QUICK_START.md           📄 Quick guide
└── ARCHITECTURE_DIAGRAM.md            📄 This file
```

---

## 🔌 Integration Points

### **Hook Dependencies**

```
┌─────────────────────────────────────────────────────────────┐
│                     useXcmTokens                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Depends on:                                                │
│  ├─ useAssetAggregator()        (from services/)            │
│  │  ├─ useCurrencyOptions()     (ParaSpell SDK)             │
│  │  ├─ ASSET_REGISTRY           (Curated assets)            │
│  │  └─ assetRegistryUtils       (DEX compatibility)         │
│  │                                                           │
│  ├─ useFromTokenState()         (URL params)                │
│  └─ useToTokenState()           (URL params)                │
│                                                             │
│  Returns:                                                   │
│  ├─ inputToken: XcmTokenInfo                                │
│  ├─ outputToken: XcmTokenInfo                               │
│  ├─ tokens: XcmTokenInfo[]                                  │
│  ├─ setInputToken()                                         │
│  ├─ setOutputToken()                                        │
│  ├─ getOptimalExchanges()       (Helper for routing)        │
│  ├─ determineCurrency()         (Helper for routing)        │
│  └─ getTAssetFromKey()          (Helper for routing)        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     useXcmRoute                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Depends on:                                                │
│  ├─ RouterBuilder               (from @paraspell/xcm-router)│
│  ├─ calculateTotalFees()        (from services/)            │
│  ├─ formatFeeSummary()          (from services/)            │
│  ├─ getOptimalExchanges()       (from useXcmTokens)         │
│  ├─ determineCurrency()         (from useXcmTokens)         │
│  └─ getTAssetFromKey()          (from useXcmTokens)         │
│                                                             │
│  Receives:                                                  │
│  ├─ inputToken: XcmTokenInfo                                │
│  ├─ outputToken: XcmTokenInfo                               │
│  ├─ walletAddress?: string                                  │
│  └─ slippageTolerance?: number                              │
│                                                             │
│  Returns:                                                   │
│  ├─ outputAmount: string                                    │
│  ├─ routeDex: string                                        │
│  ├─ routeState: { isLoading, error, data }                  │
│  ├─ estimatedFees: string                                   │
│  ├─ feeBreakdown: FeeSummary                                │
│  ├─ debouncedFetchRoute()                                   │
│  ├─ isProcessing: boolean                                   │
│  └─ resetRoute()                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔀 Type System Flow

### **Token Types Hierarchy**

```
┌────────────────────────────────────────────────────────────┐
│               ParaSpell SDK Types                          │
│                                                            │
│  TAssetInfo {                                              │
│    symbol?: string                                         │
│    decimals?: number                                       │
│    assetId?: string | number                               │
│    location?: any                                          │
│  }                                                         │
│                                                            │
│  TCurrencyInput = { id } | { symbol } | { location }       │
│                                                            │
│  TExchangeChain = "HydrationDex" | "AssetHubDex" | ...     │
└────────────────────┬───────────────────────────────────────┘
                     │
                     │ Used by
                     ▼
┌────────────────────────────────────────────────────────────┐
│               Asset Registry Types                         │
│                                                            │
│  AssetRegistryEntry {                                      │
│    symbol: string                                          │
│    name: string                                            │
│    category: "stablecoin" | "native" | ...                 │
│    networkInstances: Record<string, {                      │
│      network: string                                       │
│      assetType: "Native" | "Asset ID" | ...                │
│      displayName: string                                   │
│      verified: boolean                                     │
│    }>                                                      │
│  }                                                         │
│                                                            │
│  UnifiedAsset {                                            │
│    symbol, name, category                                  │
│    supportedNetworks: Array<{                              │
│      network, assetKey, displayName,                       │
│      assetType, verified,                                  │
│      actualAsset: TAssetInfo                               │
│    }>                                                      │
│  }                                                         │
└────────────────────┬───────────────────────────────────────┘
                     │
                     │ Converted to
                     ▼
┌────────────────────────────────────────────────────────────┐
│               UI Component Types                           │
│                                                            │
│  TokenInfo {              // Base type (existing)          │
│    id: string                                              │
│    name: string                                            │
│    symbol: string                                          │
│    icon: string                                            │
│    decimals: number                                        │
│    network?: string                                        │
│  }                                                         │
│                                                            │
│  XcmTokenInfo extends TokenInfo {  // Enhanced            │
│    assetKey: string        // e.g., "USDC-1984"            │
│    networkChain: string    // e.g., "AssetHubPolkadot"     │
│  }                                                         │
└────────────────────────────────────────────────────────────┘
```

---

## 🎨 UI Component Flow

### **Asset Selection Dialog**

```
┌─────────────────────────────────────────────────────────┐
│              SwapField Component                        │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Token Button                                    │   │
│  │  ┌────────┐  USDC                                │   │
│  │  │   U    │  USD Coin                            │   │
│  │  └────────┘  AssetHub                  ▼         │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  On Click ↓                                             │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Asset List Dialog                               │   │
│  │                                                  │   │
│  │  🔍 Search: ____________                         │   │
│  │                                                  │   │
│  │  ┌─────────────────────────────────────────┐    │   │
│  │  │ 💵 USDC - USD Coin          [Expand ▼]  │    │   │
│  │  └─────────────────────────────────────────┘    │   │
│  │     ↓ Expanded                                   │   │
│  │  ┌─────────────────────────────────────────┐    │   │
│  │  │   └─ AssetHub        (USDC-1984)    ✓  │    │   │
│  │  │   └─ Hydration       (USDC-22)      ✓  │    │   │
│  │  │   └─ Bifrost         (USDC-5)       ✓  │    │   │
│  │  └─────────────────────────────────────────┘    │   │
│  │                                                  │   │
│  │  ┌─────────────────────────────────────────┐    │   │
│  │  │ 🔵 DOT - Polkadot           [Expand ▼]  │    │   │
│  │  └─────────────────────────────────────────┘    │   │
│  │                                                  │   │
│  │  ┌─────────────────────────────────────────┐    │   │
│  │  │ 💰 USDT - Tether USD        [Expand ▼]  │    │   │
│  │  └─────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

Data Flow:
1. tokens = useXcmTokens().tokens  (XcmTokenInfo[])
2. AssetList groups by symbol
3. Shows networks as sub-items
4. User selects network variant
5. onTokenSelect(XcmTokenInfo) → Updates state
6. URL updates: ?from=USDC&fromNetwork=AssetHub
```

---

## 🔄 State Management Flow

### **Complete User Journey**

```
1️⃣  USER SELECTS "USDC on AssetHub"
    ↓
    SwapContainer.setInputToken({ 
      symbol: "USDC", 
      assetKey: "USDC-1984",
      networkChain: "AssetHubPolkadot" 
    })
    ↓
    URL updates: ?from=USDC&fromNetwork=AssetHub
    ↓
    useTokenBalances fetches balance

2️⃣  USER SELECTS "DOT on Hydration"
    ↓
    SwapContainer.setOutputToken({ 
      symbol: "DOT", 
      assetKey: "DOT-5",
      networkChain: "Hydration" 
    })
    ↓
    URL updates: ?from=USDC&fromNetwork=AssetHub&to=DOT&toNetwork=Hydration
    ↓
    useTokenBalances fetches balance

3️⃣  USER ENTERS AMOUNT: "100"
    ↓
    SwapContainer.handleInputChange("100")
    ↓
    debouncedFetchRoute("100") triggered
    ↓
    [800ms delay]
    ↓
    useXcmRoute.fetchRoute("100")
    ↓
    RouterBuilder API call
    ↓
    Quote returned: 98.5 DOT
    ↓
    SwapContainer state updated:
    - outputAmount: "98.5"
    - routeDex: "HydrationDex"
    - estimatedFees: "0.001 DOT + 0.0005 USDC"
    ↓
    UI updates with quote

4️⃣  USER CLICKS "SWAP"
    ↓
    SwapContainer.setShowConfirmation(true)
    ↓
    SwapConfirmSheet opens
    ↓
    USER CONFIRMS
    ↓
    useSwapExecution.handleSwapExecution()
    ↓
    Transaction submitted
    ↓
    Balance refresh triggered
    ↓
    Swap complete! 🎉
```

---

## 📊 Performance Considerations

### **Optimization Points**

```
┌─────────────────────────────────────────────────────────┐
│  Asset Loading (Initial)                                │
├─────────────────────────────────────────────────────────┤
│  useAssetAggregator()                                   │
│  ├─ useCurrencyOptions()      ~500ms (cached)           │
│  ├─ ASSET_REGISTRY            instant (static)          │
│  └─ Merge + validate          ~50ms                     │
│                                                         │
│  Total: ~550ms ✅                                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Route Fetching (Per Input Change)                      │
├─────────────────────────────────────────────────────────┤
│  useXcmRoute.debouncedFetchRoute()                      │
│  ├─ Debounce wait             800ms                     │
│  ├─ RouterBuilder quote       500-1500ms (network)      │
│  ├─ Fee calculation           300-800ms (if connected)  │
│  └─ State updates             ~10ms                     │
│                                                         │
│  Total: ~1600-3100ms ⚠️ (network dependent)              │
│                                                         │
│  Optimizations:                                         │
│  ✅ Debouncing prevents excessive calls                 │
│  ✅ Stale response cancellation                         │
│  ✅ Loading states shown immediately                    │
│  ✅ Skeleton loaders for better UX                      │
│  🔮 Future: Cache recent quotes                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Token Selection (User Interaction)                     │
├─────────────────────────────────────────────────────────┤
│  SwapField → AssetList → Token selection                │
│  ├─ Filter assets             ~5ms                      │
│  ├─ Render list               ~20ms                     │
│  ├─ User click                instant                   │
│  ├─ State update              ~5ms                      │
│  └─ URL param update          ~10ms                     │
│                                                         │
│  Total: ~40ms ✅ Instant feel                            │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Architectural Decisions

### **1. Why Separate Hooks?**

```
Decision: Create NEW hooks instead of modifying existing ones

Pros:
✅ Clean separation of concerns
✅ Easy rollback if needed
✅ Can test in parallel
✅ Clear git history

Cons:
❌ Temporary code duplication
❌ Need to delete old files later

Verdict: WORTH IT for safety and clarity
```

### **2. Why Extend TokenInfo?**

```
Decision: Create XcmTokenInfo that extends TokenInfo

Pros:
✅ Backward compatible with UI components
✅ Gradual migration possible
✅ Type-safe additions

Cons:
❌ Slight type complexity

Verdict: BEST APPROACH for backward compatibility
```

### **3. Why Auto-select Networks?**

```
Decision: Auto-select first verified network when symbol chosen

Pros:
✅ Better UX - less clicks
✅ Intelligent defaults
✅ Can still manually change

Cons:
❌ Might not always pick user's desired network

Verdict: GOOD UX with manual override option
```

---

## 🎉 Summary

This architecture provides:

✅ **Clean Migration Path** - New hooks alongside old ones  
✅ **Type Safety** - Strong TypeScript throughout  
✅ **Performance** - Debouncing, caching, stale response handling  
✅ **User Experience** - Network awareness, auto-selection, real data  
✅ **Maintainability** - Clear separation of concerns  
✅ **Production Ready** - Real ParaSpell SDK integration  

**Next Steps**: Follow the implementation in `PARASPELL_MIGRATION_PLAN.md`! 🚀
