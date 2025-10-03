# Services API Reference

> **Function Reference**: How to use the services folder APIs in your UI

Based on analysis of `AssetFirstSelector.tsx` and the services folder.

---

## 📁 Services Overview

```
src/services/
├── assetRegistry.ts          # Asset definitions & DEX compatibility
├── assetRegistryUtils.ts      # Registry helper functions  
├── useAssetAggregator.ts      # Main aggregation hook
├── useCurrencyOptions.ts      # ParaSpell data fetching
└── feeCalculator.ts          # Fee calculation utilities
```

---

## 🔥 Main Hook: `useAssetAggregator`

**File**: `src/services/useAssetAggregator.ts`

### Import
```typescript
import useAssetAggregator, { determineCurrency } from '@/services/useAssetAggregator';
import { EXCHANGE_CHAINS } from '@paraspell/xcm-router';
```

### Usage
```typescript
const {
  // Asset lists for dropdowns
  unifiedFromAssets,      // Array<UnifiedAsset>
  unifiedToAssets,        // Array<UnifiedAsset>
  
  // Helper functions
  getTAssetFromKey,       // (key: string, direction: 'from'|'to') => TAssetInfo
  getAssetKeyForNetwork,  // (symbol: string, network: string, direction: 'from'|'to') => string
  getOptimalExchanges,    // (fromKey: string, toKey: string, fromChain: string, toChain: string) => TExchangeChain[]
  determineCurrency,      // (asset: TAssetInfo) => TCurrencyInput
  
  // Original maps (if needed)
  currencyFromMap,        // Record<string, TAssetInfo>
  currencyToMap,          // Record<string, TAssetInfo>
} = useAssetAggregator(undefined, [...EXCHANGE_CHAINS], undefined);
```

### Key Functions

#### `getAssetKeyForNetwork(symbol, network, direction)`
**Purpose**: Get asset key for specific asset+network combination
```typescript
// Example from AssetFirstSelector.tsx line 225-231
const fromAssetKey = getAssetKeyForNetwork(selection.fromAsset, selection.fromNetwork, 'from');
const toAssetKey = getAssetKeyForNetwork(selection.toAsset, selection.toNetwork, 'to');

// Returns: "USDC-1984" or null if not found
```

#### `getTAssetFromKey(key, direction)`
**Purpose**: Get TAssetInfo from asset key
```typescript
// Example from AssetFirstSelector.tsx line 50-51
const fromAsset = getTAssetFromKey(fromKey, 'from');
const toAsset = getTAssetFromKey(toKey, 'to');

// Returns: TAssetInfo object or undefined
```

#### `getOptimalExchanges(fromKey, toKey, fromChain, toChain)`
**Purpose**: Get optimal DEX array for route (AUTO DEX SELECTION!)
```typescript
// Example from AssetFirstSelector.tsx line 58-63
const optimalExchanges = getOptimalExchanges(
  fromKey, 
  toKey, 
  selection.fromNetwork!, 
  selection.toNetwork!
);

// Returns: ["HydrationDex", "AcalaDex"] or []
```

#### `determineCurrency(asset)`
**Purpose**: Convert TAssetInfo to TCurrencyInput for RouterBuilder
```typescript
// Example from AssetFirstSelector.tsx line 74-75
.currencyFrom(determineCurrency(fromAsset))
.currencyTo(determineCurrency(toAsset))

// Returns: { id: 1984 } or { symbol: "DOT" } or { location: {...} }
```

### Data Structures

#### `UnifiedAsset` Type
```typescript
type UnifiedAsset = {
  symbol: string;           // "USDC"
  name: string;            // "USD Coin"
  category: string;        // "stablecoin"
  description?: string;    // "USD-backed stablecoin by Circle"
  supportedNetworks: Array<{
    network: string;       // "AssetHubPolkadot"
    assetKey: string;      // "USDC-1984"
    displayName: string;   // "USDC (AssetHub)"
    assetType: string;     // "Asset ID"
    verified: boolean;     // true
    actualAsset: TAssetInfo;
  }>;
  isValid: boolean;        // true
  totalNetworks: number;   // 4
  validNetworks: number;   // 3
};
```

---

## 💰 Fee Calculator Functions

**File**: `src/services/feeCalculator.ts`

### Import
```typescript
import { 
  FeeEstimate, 
  calculateTotalFees, 
  safeStringify, 
  formatFeeSummary, 
  getAdjustedFeeAmount 
} from '@/services/feeCalculator';
```

### Functions

#### `calculateTotalFees(feeResult)`
**Purpose**: Calculate total fees from RouterBuilder result
```typescript
// Example from AssetFirstSelector.tsx line 91
const fees = await RouterBuilder().getXcmFees();
const feeSummary = calculateTotalFees(fees);

// Returns: FeeSummary object with totalFees and breakdown
```

#### `formatFeeSummary(feeSummary)`
**Purpose**: Format fees for display
```typescript
// Example from AssetFirstSelector.tsx line 531
<h4>💰 Total Fees: {formatFeeSummary(feeEstimate.fees)}</h4>

// Returns: "0.001000 DOT + 0.000500 USDC"
```

#### `getAdjustedFeeAmount(fee, decimals)`
**Purpose**: Convert raw amount to human-readable
```typescript
// Example from AssetFirstSelector.tsx line 559
<div>Adjusted: {getAdjustedFeeAmount(feeEstimate.fees.breakdown.origin.fee || "0", feeEstimate.fees.breakdown.origin.asset?.decimals || 0)} {feeEstimate.fees.breakdown.origin.currency}</div>

// Returns: "0.001000" (formatted with 6 decimals)
```

#### `safeStringify(obj)`
**Purpose**: Safe JSON serialization for BigInt values
```typescript
// Example from AssetFirstSelector.tsx line 671-672
<strong>Amount Estimate State:</strong> {amountEstimate ? safeStringify(amountEstimate) : 'None'}

// Returns: JSON string with BigInt converted to string
```

### Types

#### `FeeEstimate` Type
```typescript
type FeeEstimate = {
  fees: FeeSummary | null;
  isLoading: boolean;
  error?: string;
};
```

#### `FeeSummary` Type
```typescript
type FeeSummary = {
  totalFees: {
    [currency: string]: {
      rawAmount: string;      // "1000000000000"
      adjustedAmount: string; // "0.001000"
      decimals: number;       // 12
      currency: string;       // "DOT"
    };
  };
  breakdown: {
    origin: TRouterXcmFeeResult['origin'];
    destination: TRouterXcmFeeResult['destination'];
    hops: TRouterXcmFeeResult['hops'];
  };
};
```

---

## 🏪 Asset Registry Utils

**File**: `src/services/assetRegistryUtils.ts`

### Import
```typescript
import { 
  getCompatibleDEXs, 
  getOptimalDEXArray,
  getAssetRegistryByKey,
  getKeysForSymbol 
} from '@/services/assetRegistryUtils';
```

### Functions

#### `getCompatibleDEXs(fromChain, toChain)`
**Purpose**: Get compatible DEXs for chain pair
```typescript
const dexs = getCompatibleDEXs("AssetHubPolkadot", "Hydration");
// Returns: ["HydrationDex", "AssetHubPolkadotDex"]
```

#### `getOptimalDEXArray(fromKey, toKey, fromChain, toChain)`
**Purpose**: Get optimal DEX array with preferences
```typescript
const optimalDEXs = getOptimalDEXArray("USDC-1984", "DOT-5", "AssetHubPolkadot", "Hydration");
// Returns: ["HydrationDex", "AssetHubPolkadotDex"] (prioritized by asset preferences)
```

#### `getAssetRegistryByKey(key)`
**Purpose**: Get registry entry by asset key
```typescript
const registry = getAssetRegistryByKey("USDC-1984");
// Returns: AssetRegistryEntry or null
```

#### `getKeysForSymbol(symbol)`
**Purpose**: Get all keys for a symbol
```typescript
const keys = getKeysForSymbol("USDC");
// Returns: ["USDC-1984", "USDC-22", "USDC-14", "USDC-5"]
```

---

## 📊 Asset Registry Data

**File**: `src/services/assetRegistry.ts`

### Import
```typescript
import { ASSET_REGISTRY, DEX_CHAIN_COMPATIBILITY } from '@/services/assetRegistry';
```

### Constants

#### `ASSET_REGISTRY`
**Purpose**: Asset definitions with network instances
```typescript
// Structure:
{
  "USDC": {
    symbol: "USDC",
    name: "USD Coin",
    category: "stablecoin",
    networkInstances: {
      "USDC-1984": {
        network: "AssetHub",
        assetType: "Asset ID",
        displayName: "USDC (AssetHub)",
        verified: true
      }
    }
  }
}
```

#### `DEX_CHAIN_COMPATIBILITY`
**Purpose**: DEX compatibility matrix
```typescript
// Structure:
{
  "HydrationDex": ["AssetHubPolkadot", "Hydration", "Moonbeam", "Acala", "BifrostPolkadot"],
  "AssetHubPolkadotDex": ["AssetHubPolkadot", "Hydration"],
  "AcalaDex": ["Acala", "Hydration"]
}
```

---

## 🔄 Complete Integration Flow

Based on `AssetFirstSelector.tsx` implementation:

### 1. Initialize Hook
```typescript
const {
  unifiedFromAssets,
  unifiedToAssets,
  getTAssetFromKey,
  getAssetKeyForNetwork,
  getOptimalExchanges,
} = useAssetAggregator(undefined, [...EXCHANGE_CHAINS], undefined);
```

### 2. Get Asset Keys
```typescript
const fromAssetKey = getAssetKeyForNetwork(fromAsset, fromNetwork, 'from');
const toAssetKey = getAssetKeyForNetwork(toAsset, toNetwork, 'to');
```

### 3. Get Optimal Exchanges
```typescript
const optimalExchanges = getOptimalExchanges(
  fromAssetKey, 
  toAssetKey, 
  fromNetwork, 
  toNetwork
);
```

### 4. Get Asset Info
```typescript
const fromAssetInfo = getTAssetFromKey(fromAssetKey, 'from');
const toAssetInfo = getTAssetFromKey(toAssetKey, 'to');
```

### 5. Execute RouterBuilder
```typescript
// Get quote
const result = await RouterBuilder()
  .from(fromNetwork as any)
  .to(toNetwork as any)
  .exchange(optimalExchanges as any)
  .currencyFrom(determineCurrency(fromAssetInfo))
  .currencyTo(determineCurrency(toAssetInfo))
  .amount(BigInt(amount))
  .getBestAmountOut();

// Get fees
const fees = await RouterBuilder()
  .from(fromNetwork as any)
  .to(toNetwork as any)
  .exchange(optimalExchanges as any)
  .currencyFrom(determineCurrency(fromAssetInfo))
  .currencyTo(determineCurrency(toAssetInfo))
  .amount(BigInt(amount))
  .senderAddress(senderAddress)
  .recipientAddress(recipientAddress)
  .slippagePct("1")
  .getXcmFees();

const feeSummary = calculateTotalFees(fees);
```

### 6. Display Results
```typescript
// Quote
console.log('Amount Out:', result.amountOut.toString());
console.log('Best Exchange:', result.exchange);

// Fees
console.log('Total Fees:', formatFeeSummary(feeSummary));
```

---

## 🎯 Key Integration Points

### Asset Selection UI
```typescript
// Populate dropdowns
{unifiedFromAssets.map(asset => (
  <option key={asset.symbol} value={asset.symbol}>
    {asset.name} ({asset.symbol}) - {asset.validNetworks}/{asset.totalNetworks} networks
  </option>
))}

// Get networks for selected asset
const availableNetworks = unifiedFromAssets
  .find(a => a.symbol === selectedAsset)
  ?.supportedNetworks || [];
```

### Network Selection UI
```typescript
// Populate network dropdown
{availableNetworks.map(network => (
  <option key={network.network} value={network.network}>
    {network.network} {network.verified && '✓'}
  </option>
))}
```

### Auto-calculation Trigger
```typescript
// Trigger when both assets selected (from AssetFirstSelector.tsx line 234-249)
useEffect(() => {
  if (fromAssetKey && toAssetKey && amount) {
    Promise.all([
      getBestAmountOut(fromAssetKey, toAssetKey, amount),
      getRouterFees(fromAssetKey, toAssetKey, amount)
    ]);
  }
}, [fromAssetKey, toAssetKey, amount, fromNetwork, toNetwork]);
```

---

## ⚠️ Important Notes

### Amount Format
- Always use **smallest unit** (string): `"1000000000000"`
- Never use decimals: `1.5` ❌

### Error Handling
```typescript
// Always check for null/undefined
if (!fromAsset || !toAsset) {
  throw new Error("Assets not found in currency maps");
}

// Handle RouterBuilder errors
try {
  const result = await RouterBuilder().getBestAmountOut();
} catch (error) {
  console.error('RouterBuilder error:', error);
}
```

### Exchange Fallback
```typescript
// Use optimal exchanges or fallback (from AssetFirstSelector.tsx line 66-68)
const exchangesToUse = optimalExchanges.length > 0 
  ? optimalExchanges 
  : ["HydrationDex"];
```

---

## 📋 Quick Reference

| Function | Purpose | Returns |
|----------|---------|---------|
| `useAssetAggregator()` | Main hook | `{ unifiedFromAssets, unifiedToAssets, ... }` |
| `getAssetKeyForNetwork()` | Get asset key | `string \| null` |
| `getTAssetFromKey()` | Get asset info | `TAssetInfo \| undefined` |
| `getOptimalExchanges()` | Auto DEX selection | `TExchangeChain[]` |
| `determineCurrency()` | Convert for RouterBuilder | `TCurrencyInput` |
| `calculateTotalFees()` | Calculate fees | `FeeSummary` |
| `formatFeeSummary()` | Format for display | `string` |
| `getAdjustedFeeAmount()` | Convert raw amount | `string` |

---

## 🚀 That's It!

Your UI team can now:
1. ✅ Use `useAssetAggregator()` hook
2. ✅ Display `unifiedFromAssets` / `unifiedToAssets`
3. ✅ Get asset keys with `getAssetKeyForNetwork()`
4. ✅ Auto-select DEX with `getOptimalExchanges()`
5. ✅ Calculate fees with `calculateTotalFees()`
6. ✅ Execute swaps with `RouterBuilder()`

**All functions are ready to use - just import and call!** 🎯
