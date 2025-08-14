# Token URL System

## Overview

The application now uses token symbols in URLs instead of asset IDs, making URLs more user-friendly and readable. For tokens with duplicate symbols (like different USDC types), unique identifiers are generated.

## URL Format

### Before (using asset IDs)
```
https://localhost:3000/?from=22222052&to=12345678
```

### After (using token symbols)
```
https://localhost:3000/?from=DOT&to=USDC
```

For tokens with duplicate symbols:
```
https://localhost:3000/?from=USDC-0002&to=USDC-0003
```

## How It Works

### 1. Token Identifier Generation

- **Unique symbols**: Use the symbol directly (e.g., `DOT`, `USDT`)
- **Duplicate symbols**: Append asset ID suffix (e.g., `USDC-0002`, `USDC-0003`)

### 2. Internal Mapping

The system maintains two mappings:
- `tokenIdentifierMap`: Maps token identifiers to asset IDs
- `assetIdToIdentifierMap`: Maps asset IDs to token identifiers

### 3. URL Parameter Handling

- URLs use token identifiers (symbols)
- Internal operations use asset IDs
- Automatic conversion between the two formats

## Key Functions

### `createTokenIdentifierMap(assets)`
Creates a mapping from token identifiers to asset IDs, handling duplicate symbols.

### `findAssetByIdentifier(assets, identifier)`
Finds an asset by its identifier (symbol or symbol-hash).

### `getAssetIdentifier(assets, assetId)`
Gets the identifier for a given asset ID.

## Backward Compatibility

The system maintains backward compatibility by:
- Supporting both symbol and asset ID lookups
- Case-insensitive symbol matching
- Graceful fallback to symbol matching if identifier lookup fails

## Example Usage

```typescript
// URL shows: https://localhost:3000/?from=DOT&to=USDC-0002
// Internal mapping: DOT -> asset_id_1, USDC-0002 -> asset_id_2

// When user selects a token
setInputToken(token); // token.id = "asset_id_1"
// URL updates to: ?from=DOT

// When URL changes
// fromTokenIdentifier = "DOT"
// findAssetByIdentifier() returns asset with id "asset_id_1"
```

## Benefits

1. **User-friendly URLs**: Easy to read and understand
2. **Shareable links**: Users can easily share specific token pairs
3. **SEO friendly**: URLs contain meaningful token names
4. **Backward compatible**: Old URLs still work
5. **Handles duplicates**: Unique identifiers for tokens with same symbol
