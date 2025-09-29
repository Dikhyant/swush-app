import type { TExchangeChain } from "@paraspell/xcm-router";
import type { AssetRegistryEntry } from "./assetRegistry";
import { ASSET_REGISTRY, DEX_CHAIN_COMPATIBILITY } from "./assetRegistry";

// Helper function to get registry entry for a key from useCurrencyOptions
export const getAssetRegistryByKey = (key: string, assetRegistry: Record<string, AssetRegistryEntry>): AssetRegistryEntry | null => {
  for (const asset of Object.values(assetRegistry)) {
    if (key in asset.networkInstances) {
      return asset;
    }
  }
  return null;
};

// Helper to get all keys for a symbol
export const getKeysForSymbol = (symbol: string, assetRegistry: Record<string, AssetRegistryEntry>): string[] => {
  const asset = assetRegistry[symbol];
  return asset ? Object.keys(asset.networkInstances) : [];
};

// Helper to find canonical asset for better UI display
export const findCanonicalAsset = (key: string, assetRegistry: Record<string, AssetRegistryEntry>): AssetRegistryEntry | null => {
  return getAssetRegistryByKey(key, assetRegistry);
};

// Helper function to get compatible DEXs for a chain pair
export const getCompatibleDEXs = (fromChain: string, toChain: string): TExchangeChain[] => {
  const compatibleDEXs: TExchangeChain[] = [];
  
  Object.entries(DEX_CHAIN_COMPATIBILITY).forEach(([dex, supportedChains]) => {
    if (supportedChains.includes(fromChain) && supportedChains.includes(toChain)) {
      compatibleDEXs.push(dex as TExchangeChain);
    }
  });
  
  return compatibleDEXs;
};

// Helper function to get optimal DEX array for asset pair
export const getOptimalDEXArray = (
  fromAssetKey: string, 
  toAssetKey: string, 
  fromChain: string, 
  toChain: string,
): TExchangeChain[] => {
  const compatibleDEXs = getCompatibleDEXs(fromChain, toChain);
  
  // Get asset registry entries for preference
  const fromRegistry = getAssetRegistryByKey(fromAssetKey, ASSET_REGISTRY);
  const toRegistry = getAssetRegistryByKey(toAssetKey, ASSET_REGISTRY);
  
  // If assets have preferred exchanges, prioritize them
  const preferredExchanges = new Set<TExchangeChain>();
  if (fromRegistry?.dexConfig?.preferredExchange) {
    preferredExchanges.add(fromRegistry.dexConfig.preferredExchange);
  }
  if (toRegistry?.dexConfig?.preferredExchange) {
    preferredExchanges.add(toRegistry.dexConfig.preferredExchange);
  }
  
  // Sort: preferred exchanges first, then all compatible DEXs
  const preferredDEXs = compatibleDEXs.filter(dex => preferredExchanges.has(dex));
  const fallbackDEXs = compatibleDEXs.filter(dex => !preferredExchanges.has(dex));
  
  return [...preferredDEXs, ...fallbackDEXs];
};
