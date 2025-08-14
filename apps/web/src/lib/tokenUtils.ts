import type { AssetWithId } from './api';

/**
 * Creates a simple numeric hash from a string
 */
function createNumericHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString().slice(-4).padStart(4, '0');
}

/**
 * Generates a unique identifier for tokens with the same symbol
 * For unique symbols, returns the symbol itself
 * For duplicate symbols, appends a hash to make it unique
 */
export function generateTokenIdentifier(asset: AssetWithId): string {
  return asset.metadata.symbol;
}

/**
 * Creates a mapping of token identifiers to asset IDs
 * Handles cases where multiple tokens have the same symbol
 */
export function createTokenIdentifierMap(assets: AssetWithId[]): Map<string, string> {
  if (!assets || assets.length === 0) {
    return new Map();
  }

  const symbolCount = new Map<string, number>();
  const identifierMap = new Map<string, string>();
  
  // First pass: count occurrences of each symbol
  assets.forEach(asset => {
    if (asset && asset.metadata && asset.metadata.symbol) {
      const symbol = asset.metadata.symbol;
      symbolCount.set(symbol, (symbolCount.get(symbol) || 0) + 1);
    }
  });
  
  // Second pass: create unique identifiers
  assets.forEach(asset => {
    if (asset && asset.metadata && asset.metadata.symbol && asset.id) {
      const symbol = asset.metadata.symbol;
      const count = symbolCount.get(symbol) || 0;
      
      let identifier: string;
      if (count === 1) {
        // Unique symbol, use as is
        identifier = symbol;
      } else {
        // Duplicate symbol, create unique identifier
        // Use a combination of symbol and numeric hash of asset ID
        const assetIdHash = createNumericHash(asset.id);
        identifier = `${symbol}-${assetIdHash}`;
      }
      
      identifierMap.set(identifier, asset.id);
    }
  });
  
  return identifierMap;
}

/**
 * Creates a reverse mapping from asset ID to token identifier
 */
export function createAssetIdToIdentifierMap(assets: AssetWithId[]): Map<string, string> {
  if (!assets || assets.length === 0) {
    return new Map();
  }

  const identifierMap = createTokenIdentifierMap(assets);
  const reverseMap = new Map<string, string>();
  
  identifierMap.forEach((assetId, identifier) => {
    reverseMap.set(assetId, identifier);
  });
  
  return reverseMap;
}

/**
 * Finds an asset by its identifier (symbol or symbol-hash)
 */
export function findAssetByIdentifier(assets: AssetWithId[], identifier: string): AssetWithId | undefined {
  if (!assets || assets.length === 0 || !identifier) {
    return undefined;
  }

  // First try exact match
  let asset = assets.find(asset => {
    if (!asset || !asset.metadata || !asset.metadata.symbol) {
      return false;
    }

    const symbol = asset.metadata.symbol;
    const count = assets.filter(a => a.metadata.symbol === symbol).length;
    
    if (count === 1) {
      return symbol === identifier;
    } else {
      const assetIdHash = createNumericHash(asset.id);
      return `${symbol}-${assetIdHash}` === identifier;
    }
  });
  
  // If not found, try symbol match (for backward compatibility)
  if (!asset) {
    asset = assets.find(asset => 
      asset && asset.metadata && asset.metadata.symbol &&
      asset.metadata.symbol.toUpperCase() === identifier.toUpperCase()
    );
  }
  
  return asset;
}

/**
 * Gets the identifier for a given asset
 */
export function getAssetIdentifier(assets: AssetWithId[], assetId: string): string | undefined {
  if (!assets || assets.length === 0 || !assetId) {
    return undefined;
  }

  const asset = assets.find(a => a && a.id === assetId);
  if (!asset || !asset.metadata || !asset.metadata.symbol) {
    return undefined;
  }
  
  const symbol = asset.metadata.symbol;
  const count = assets.filter(a => a.metadata.symbol === symbol).length;
  
  if (count === 1) {
    return symbol;
  } else {
    const assetIdHash = createNumericHash(asset.id);
    return `${symbol}-${assetIdHash}`;
  }
}
