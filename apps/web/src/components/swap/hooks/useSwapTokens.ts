import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import type { AssetWithId } from '@/lib/api';
import type { TokenInfo } from '@/components/swap/types';
import { toast } from 'react-hot-toast';
import { useFromTokenState, useToTokenState } from './utils/queryParams';
import { 
  findAssetByIdentifier, 
  getAssetIdentifier, 
  createTokenIdentifierMap,
  createAssetIdToIdentifierMap 
} from '@/lib/tokenUtils';

export function useSwapTokens() {
  const [assets, setAssets] = useState<AssetWithId[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Use centralized query params configuration (now using token identifiers)
  const [fromTokenIdentifier, setFromTokenIdentifier] = useFromTokenState();
  const [toTokenIdentifier, setToTokenIdentifier] = useToTokenState();

  // Fetch assets only once during initialization
  useEffect(() => {
    if (isInitialized) return;
    
    const fetchAssets = async () => {
      try {
        const fetchedAssets = await api.assets.getAll();
        setAssets(fetchedAssets || []);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to fetch assets:', error);
        toast.error('Failed to load assets');
        setIsInitialized(true); // Mark as initialized even on error to prevent infinite retries
      }
    };

    fetchAssets();
  }, [isInitialized]);

  // Set default tokens if none are selected and assets are loaded
  useEffect(() => {
    if (assets.length > 0 && isInitialized && (!fromTokenIdentifier || !toTokenIdentifier)) {
      // Find some default tokens (first two available tokens)
      const availableTokens = assets.filter(asset => asset && asset.metadata && asset.metadata.symbol);
      
      if (availableTokens.length >= 2) {
        if (!fromTokenIdentifier) {
          const defaultFrom = availableTokens[0];
          const fromIdentifier = getAssetIdentifier(assets, defaultFrom.id);
          if (fromIdentifier) {
            setFromTokenIdentifier(fromIdentifier);
          }
        }
        
        if (!toTokenIdentifier) {
          const defaultTo = availableTokens[1];
          const toIdentifier = getAssetIdentifier(assets, defaultTo.id);
          if (toIdentifier) {
            setToTokenIdentifier(toIdentifier);
          }
        }
      }
    }
  }, [assets, isInitialized, fromTokenIdentifier, toTokenIdentifier, setFromTokenIdentifier, setToTokenIdentifier]);

  // Create mappings for efficient lookups
  const tokenIdentifierMap = useMemo(() => 
    createTokenIdentifierMap(assets), [assets]
  );
  
  const assetIdToIdentifierMap = useMemo(() => 
    createAssetIdToIdentifierMap(assets), [assets]
  );

  // Convert token identifiers to token objects
  const inputToken = useMemo(() => {
    if (!assets.length || !fromTokenIdentifier) return null;
    
    try {
      // Find asset by identifier (symbol or symbol-hash)
      const asset = findAssetByIdentifier(assets, fromTokenIdentifier);
      
      if (!asset || !asset.metadata) return null;
      
      return {
        id: asset.id,
        name: asset.metadata.name || '',
        symbol: asset.metadata.symbol || '',
        icon: (asset.metadata.symbol || '').charAt(0) || '?',
        decimals: asset.metadata.decimals || 0
      };
    } catch (error) {
      console.error('Error creating input token:', error);
      return null;
    }
  }, [assets, fromTokenIdentifier]);

  const outputToken = useMemo(() => {
    if (!assets.length || !toTokenIdentifier) return null;
    
    try {
      // Find asset by identifier (symbol or symbol-hash)
      const asset = findAssetByIdentifier(assets, toTokenIdentifier);
      
      if (!asset || !asset.metadata) return null;
      
      return {
        id: asset.id,
        name: asset.metadata.name || '',
        symbol: asset.metadata.symbol || '',
        icon: (asset.metadata.symbol || '').charAt(0) || '?',
        decimals: asset.metadata.decimals || 0
      };
    } catch (error) {
      console.error('Error creating output token:', error);
      return null;
    }
  }, [assets, toTokenIdentifier]);

  // Token selection handlers that update URL with token identifiers
  const setInputToken = (token: TokenInfo) => {
    try {
      const identifier = assetIdToIdentifierMap.get(token.id);
      if (identifier) {
        setFromTokenIdentifier(identifier);
      }
    } catch (error) {
      console.error('Error setting input token:', error);
    }
  };

  const setOutputToken = (token: TokenInfo) => {
    try {
      const identifier = assetIdToIdentifierMap.get(token.id);
      if (identifier) {
        setToTokenIdentifier(identifier);
      }
    } catch (error) {
      console.error('Error setting output token:', error);
    }
  };

  // Convert assets to tokens for selection
  const tokens = useMemo(() => {
    try {
      return assets
        .filter(asset => asset && asset.metadata && asset.metadata.symbol)
        .map(asset => ({
          id: asset.id,
          name: asset.metadata.name || '',
          symbol: asset.metadata.symbol || '',
          icon: (asset.metadata.symbol || '').charAt(0) || '?',
          decimals: asset.metadata.decimals || 0
        }));
    } catch (error) {
      console.error('Error creating tokens array:', error);
      return [];
    }
  }, [assets]);

  return {
    inputToken,
    setInputToken,
    outputToken,
    setOutputToken,
    tokens,
  };
} 