import type { AssetWithId } from './api';

// Types
interface TokenIdentifierConfig {
  symbol: string;
  isDuplicate: boolean;
  hash?: string;
}

// Helper functions
/**
 * Creates a simple numeric hash from a string
 */
function createNumericHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
  }
  return Math.abs(hash).toString().slice(-4).padStart(4, '0');
}

/**
 * Generates a unique identifier for tokens with the same symbol
 * For unique symbols, returns the symbol itself
 * For duplicate symbols, appends a hash to make it unique
 */
export function generateTokenIdentifier(asset: AssetWithId, allAssets: AssetWithId[]): string {
  if (!asset || !asset.metadata || !asset.metadata.symbol) {
    return '';
  }

  const symbol = asset.metadata.symbol;
  const duplicateSymbolCount = allAssets.filter(a => a && a.metadata && a.metadata.symbol === symbol).length;
  
  const isUniqueSymbol = duplicateSymbolCount === 1;
  
  if (isUniqueSymbol) {
    return symbol;
  } else {
    const assetIdHash = createNumericHash(asset.id);
    return `${symbol}-${assetIdHash}`;
  }
}

/**
 * Creates a mapping of token identifiers to asset IDs
 * Handles cases where multiple tokens have the same symbol
 */
export function createTokenIdentifierMap(assets: AssetWithId[]): Map<string, string> {
  const hasValidAssets = assets && assets.length > 0;
  if (!hasValidAssets) {
    return new Map();
  }

  const symbolOccurrenceCount = new Map<string, number>();
  const identifierMap = new Map<string, string>();
  
  // First pass: count occurrences of each symbol
  assets.forEach(asset => {
    const hasValidMetadata = asset && asset.metadata && asset.metadata.symbol;
    if (hasValidMetadata) {
      const symbol = asset.metadata.symbol;
      symbolOccurrenceCount.set(symbol, (symbolOccurrenceCount.get(symbol) || 0) + 1);
    }
  });
  
  // Second pass: create unique identifiers
  assets.forEach(asset => {
    const hasCompleteData = asset && asset.metadata && asset.metadata.symbol && asset.id;
    if (hasCompleteData) {
      const symbol = asset.metadata.symbol;
      const occurrenceCount = symbolOccurrenceCount.get(symbol) || 0;
      
      const isUniqueSymbol = occurrenceCount === 1;
      let identifier: string;
      
      if (isUniqueSymbol) {
        identifier = symbol;
      } else {
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
  const hasValidAssets = assets && assets.length > 0;
  if (!hasValidAssets) {
    return new Map();
  }

  const identifierToAssetIdMap = createTokenIdentifierMap(assets);
  const assetIdToIdentifierMap = new Map<string, string>();
  
  identifierToAssetIdMap.forEach((assetId, identifier) => {
    assetIdToIdentifierMap.set(assetId, identifier);
  });
  
  return assetIdToIdentifierMap;
}

/**
 * Finds an asset by its identifier (symbol or symbol-hash)
 */
export function findAssetByIdentifier(assets: AssetWithId[], identifier: string): AssetWithId | undefined {
  const hasValidInputs = assets && assets.length > 0 && identifier;
  if (!hasValidInputs) {
    return undefined;
  }

  // First try exact match
  let foundAsset = assets.find(asset => {
    const hasValidMetadata = asset && asset.metadata && asset.metadata.symbol;
    if (!hasValidMetadata) {
      return false;
    }

    const symbol = asset.metadata.symbol;
    const duplicateSymbolCount = assets.filter(a => a && a.metadata && a.metadata.symbol === symbol).length;
    
    const isUniqueSymbol = duplicateSymbolCount === 1;
    
    if (isUniqueSymbol) {
      return symbol === identifier;
    } else {
      const assetIdHash = createNumericHash(asset.id);
      const expectedIdentifier = `${symbol}-${assetIdHash}`;
      return expectedIdentifier === identifier;
    }
  });
  
  // If not found, try symbol match (for backward compatibility)
  const hasFoundExactMatch = foundAsset !== undefined;
  if (!hasFoundExactMatch) {
    foundAsset = assets.find(asset => {
      const hasValidSymbol = asset && asset.metadata && asset.metadata.symbol;
      return hasValidSymbol && asset.metadata.symbol.toUpperCase() === identifier.toUpperCase();
    });
  }
  
  return foundAsset;
}

/**
 * Gets the identifier for a given asset
 */
export function getAssetIdentifier(assets: AssetWithId[], assetId: string): string | undefined {
  const hasValidInputs = assets && assets.length > 0 && assetId;
  if (!hasValidInputs) {
    return undefined;
  }

  const foundAsset = assets.find(a => a && a.id === assetId);
  const hasFoundAsset = foundAsset && foundAsset.metadata && foundAsset.metadata.symbol;
  
  if (!hasFoundAsset) {
    return undefined;
  }
  
  const symbol = foundAsset.metadata.symbol;
  const duplicateSymbolCount = assets.filter(a => a && a.metadata && a.metadata.symbol === symbol).length;
  
  const isUniqueSymbol = duplicateSymbolCount === 1;
  
  if (isUniqueSymbol) {
    return symbol;
  } else {
    const assetIdHash = createNumericHash(foundAsset.id);
    return `${symbol}-${assetIdHash}`;
  }
}
