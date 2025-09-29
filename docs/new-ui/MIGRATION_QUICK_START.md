# 🚀 ParaSpell Migration - Quick Start Guide

> **TL;DR**: Replace dummy assets/routes with real ParaSpell SDK in 4 phases over 5-7 days

---

## 📊 What's Being Replaced

```
BEFORE (Dummy)                    AFTER (ParaSpell)
─────────────────────────────────────────────────────────────
useSwapTokens()          →        useXcmTokens()
├─ DUMMY_ASSETS array           ├─ useAssetAggregator() 
├─ 23 hardcoded tokens          ├─ Real ParaSpell assets
└─ No network awareness         └─ Multi-network support

useSwapRoute()           →        useXcmRoute()
├─ Dummy 95% conversion         ├─ RouterBuilder quotes
├─ Fake fee calculation         ├─ Real XCM fees
└─ Hardcoded DEX                └─ Auto DEX selection
```

---

## 🎯 The 4-Phase Strategy

### **Phase 1: Token Migration** (Days 1-2)
**Goal**: Replace dummy assets with real ParaSpell data

**Action Items**:
1. ✅ Create `apps/web/src/components/swap/hooks/useXcmTokens.ts`
2. ✅ Update `TokenInfo` type to include `assetKey` and `networkChain`
3. ✅ Test with real asset data from `useAssetAggregator`
4. ✅ Verify network auto-selection works

**Success Criteria**:
- Token dropdown shows real ParaSpell assets
- Network grouping works (USDC on AssetHub, Hydration, etc.)
- URL params still work for symbols

---

### **Phase 2: Routing Migration** (Days 2-3)
**Goal**: Replace dummy routes with RouterBuilder

**Action Items**:
1. ✅ Create `apps/web/src/components/swap/hooks/useXcmRoute.ts`
2. ✅ Integrate RouterBuilder for quotes
3. ✅ Add automatic DEX selection via `getOptimalExchanges()`
4. ✅ Implement real fee calculation
5. ✅ Add BigInt conversion utilities

**Success Criteria**:
- Output amount comes from real RouterBuilder quote
- DEX auto-selects based on asset compatibility
- Fees show multi-currency breakdown (e.g., "0.001 DOT + 0.0005 USDC")

---

### **Phase 3: Integration** (Days 3-4)
**Goal**: Wire everything together in SwapContainer

**Action Items**:
1. ✅ Replace `useSwapTokens()` with `useXcmTokens()` in SwapContainer
2. ✅ Replace `useSwapRoute()` with `useXcmRoute()` in SwapContainer
3. ✅ Update `SwapDetails` component for multi-currency fees
4. ✅ Test end-to-end swap flow

**Success Criteria**:
- Entire swap flow works with real data
- No console errors
- Loading states look good
- Errors are handled gracefully

---

### **Phase 4: Cleanup** (Days 4-5)
**Goal**: Remove all dummy code and polish

**Action Items**:
1. ✅ Delete `useSwapTokens.ts` and `useSwapRoute.ts`
2. ✅ Remove `DUMMY_ASSETS` constant
3. ✅ Remove `USE_DUMMY_ASSETS` and `USE_DUMMY_ROUTE` flags
4. ✅ Clean up console.logs
5. ✅ Update documentation

**Success Criteria**:
- No dummy code remains
- All imports updated
- Clean git diff

---

## 💻 Code Examples

### **Before (Dummy)**
```typescript
// useSwapTokens.ts
const DUMMY_ASSETS = [
  { id: '0', metadata: { name: 'Polkadot', symbol: 'DOT', ... } },
  { id: '1', metadata: { name: 'Kusama', symbol: 'KSM', ... } },
  // ... 21 more hardcoded assets
];

// useSwapRoute.ts
const route: RouteQuote = {
  expectedOutput: {
    decimal: (Number(currentInputAmount) * 0.95).toString()
  },
  dex: NETWORKS_SUPPORTED.ASSET_HUB
};
```

### **After (ParaSpell)**
```typescript
// useXcmTokens.ts
const {
  unifiedFromAssets,    // Real assets from ParaSpell
  unifiedToAssets,
  getTAssetFromKey,
  getOptimalExchanges,
} = useAssetAggregator(undefined, [...EXCHANGE_CHAINS], undefined);

// useXcmRoute.ts
const quoteResult = await RouterBuilder()
  .from(inputToken.networkChain)
  .to(outputToken.networkChain)
  .exchange(optimalExchanges)  // Auto-selected DEX
  .currencyFrom(determineCurrency(fromAsset))
  .currencyTo(determineCurrency(toAsset))
  .amount(amountInSmallestUnit)
  .getBestAmountOut();  // Real quote!
```

---

## 🔑 Key Technical Points

### **1. Asset Keys**
```typescript
// Old: Just symbol
token.id = "0"
token.symbol = "USDC"

// New: Network-aware key
token.assetKey = "USDC-1984"        // AssetHub
token.assetKey = "USDC-22"          // Hydration
token.networkChain = "AssetHubPolkadot"
```

### **2. Decimal Conversion**
```typescript
// User inputs: "1.5 USDC"
// Must convert to smallest unit for RouterBuilder

function toSmallestUnit(amount: string, decimals: number): bigint {
  return BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals)));
}
// "1.5" with 6 decimals → BigInt(1500000)

// RouterBuilder returns: BigInt(1425000)
// Must convert back to decimal

function toDecimalUnit(amount: bigint, decimals: number): string {
  return (Number(amount) / Math.pow(10, decimals)).toString();
}
// BigInt(1425000) with 6 decimals → "1.425"
```

### **3. Multi-Currency Fees**
```typescript
// Old: Single fee string
estimatedFees = "0.001"

// New: Multi-currency object
feeBreakdown = {
  totalFees: {
    'DOT': { adjustedAmount: '0.001000', currency: 'DOT' },
    'USDC': { adjustedAmount: '0.000500', currency: 'USDC' }
  },
  breakdown: { origin, destination, hops }
}

// Display: "0.001000 DOT + 0.000500 USDC"
```

---

## ⚠️ Common Pitfalls & Solutions

### **Issue 1: BigInt Serialization**
```typescript
// ❌ WRONG - JSON.stringify fails on BigInt
console.log(JSON.stringify(quoteResult));  // Error!

// ✅ CORRECT - Use safeStringify
import { safeStringify } from '@/services/xcm-router/feeCalculator';
console.log(safeStringify(quoteResult));
```

### **Issue 2: Stale API Responses**
```typescript
// ❌ WRONG - Race condition
const fetchRoute = async (amount) => {
  const result = await RouterBuilder().getBestAmountOut();
  setOutputAmount(result.amountOut);  // Might be stale!
};

// ✅ CORRECT - Track latest input
const latestInputRef = useRef('');
const fetchRoute = async (amount) => {
  latestInputRef.current = amount;
  const result = await RouterBuilder().getBestAmountOut();
  
  if (latestInputRef.current === amount) {  // Check still relevant
    setOutputAmount(result.amountOut);
  }
};
```

### **Issue 3: Missing Asset Keys**
```typescript
// ❌ WRONG - Assume asset exists
const asset = getTAssetFromKey(assetKey, 'from');
const currency = determineCurrency(asset);  // asset might be undefined!

// ✅ CORRECT - Validate first
const asset = getTAssetFromKey(assetKey, 'from');
if (!asset) {
  throw new Error(`Asset not found: ${assetKey}`);
}
const currency = determineCurrency(asset);
```

---

## 🧪 Testing Checklist

### **Unit Tests**
- [ ] `useXcmTokens` returns correct token list
- [ ] Network auto-selection chooses verified network
- [ ] `toSmallestUnit` / `toDecimalUnit` conversions accurate
- [ ] Fee calculation handles multiple currencies

### **Integration Tests**
- [ ] Token selection updates URL params
- [ ] Route fetching debounces properly
- [ ] Stale responses are ignored
- [ ] Error states display correctly

### **E2E Tests**
- [ ] Select USDC on AssetHub → DOT on Hydration
- [ ] Enter amount → See real quote
- [ ] Execute swap → See real fees
- [ ] Handle network failures gracefully

---

## 📦 Files to Create

```bash
apps/web/src/components/swap/hooks/
├── useXcmTokens.ts          # NEW - ParaSpell token management
└── useXcmRoute.ts           # NEW - RouterBuilder integration

apps/web/
├── PARASPELL_MIGRATION_PLAN.md     # Detailed plan (already created)
└── MIGRATION_QUICK_START.md        # This file
```

---

## 📦 Files to Modify

```bash
apps/web/src/components/swap/
├── SwapContainer.tsx        # Replace hooks
├── types.ts                 # Add assetKey/networkChain to TokenInfo
└── ui/
    └── SwapDetails.tsx      # Update fee display
```

---

## 📦 Files to Delete (Phase 4)

```bash
apps/web/src/components/swap/hooks/
├── useSwapTokens.ts         # DELETE - replaced by useXcmTokens
└── useSwapRoute.ts          # DELETE - replaced by useXcmRoute
```

---

## 🎯 First Steps (Do This Now!)

1. **Read the full plan**: Open `PARASPELL_MIGRATION_PLAN.md`

2. **Create Phase 1 branch**:
   ```bash
   git checkout -b feat/paraspell-token-migration
   ```

3. **Create `useXcmTokens.ts`**:
   - Copy implementation from migration plan
   - Test in isolation first

4. **Test with console logs**:
   ```typescript
   const { tokens, inputToken, outputToken } = useXcmTokens();
   console.log('Available tokens:', tokens.length);
   console.log('Input token:', inputToken);
   ```

5. **Verify asset data loads**:
   - Should see real ParaSpell assets
   - Check network grouping works
   - Verify decimals are correct

6. **Once tokens work, move to Phase 2!**

---

## 🆘 Need Help?

### **Asset Registry Issues**
- Check `apps/web/src/services/xcm-router/assetRegistry.ts`
- Ensure asset keys match ParaSpell format
- Verify network names are correct (e.g., "AssetHubPolkadot" not "AssetHub")

### **RouterBuilder Errors**
- Check ParaSpell SDK documentation
- Verify currency format (id vs symbol vs location)
- Check network compatibility with DEX

### **Type Errors**
- Ensure `TokenInfo` has all required fields
- Use `XcmTokenInfo` type in new hooks
- Check `TAssetInfo` from ParaSpell SDK

---

## 🎉 Success Indicators

You'll know the migration is complete when:

✅ **No dummy data** in codebase  
✅ **Real quotes** from RouterBuilder  
✅ **Accurate fees** with multi-currency support  
✅ **Network selection** works smoothly  
✅ **All tests pass**  
✅ **No console errors**  
✅ **Production-ready** swap flow  

---

## 📊 Progress Tracker

Track your progress here:

```
Phase 1: Token Migration
[ ] Create useXcmTokens.ts
[ ] Update TokenInfo type
[ ] Test token selection
[ ] Verify network grouping
[ ] Test URL params
✅ Phase 1 Complete!

Phase 2: Routing Migration
[ ] Create useXcmRoute.ts
[ ] Integrate RouterBuilder
[ ] Test quote fetching
[ ] Implement fee calculation
[ ] Handle errors
✅ Phase 2 Complete!

Phase 3: Integration
[ ] Update SwapContainer
[ ] Test end-to-end flow
[ ] Update fee UI
[ ] Polish loading states
✅ Phase 3 Complete!

Phase 4: Cleanup
[ ] Delete old hooks
[ ] Remove dummy constants
[ ] Update documentation
[ ] Final QA
✅ Phase 4 Complete!

🎉 MIGRATION COMPLETE!
```

---

**Ready to start? Begin with Phase 1 in `PARASPELL_MIGRATION_PLAN.md`!** 🚀
