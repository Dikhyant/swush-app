import { useQueryState, parseAsString, parseAsInteger } from 'nuqs'

/**
 * Centralized query param configuration for the swap page
 * This follows nuqs best practices for organization and type safety
 */
export const swapQueryParams = {
  // Token selection - using symbols for XCM integration
  useFromTokenState: () => useQueryState(
    'from',
    parseAsString.withDefault('DOT').withOptions({ // Default to DOT
      shallow: false, // Trigger server re-render if needed
      history: 'replace' // Don't create history entries for token changes
    })
  ),
  
  useToTokenState: () => useQueryState(
    'to', 
    parseAsString.withDefault('USDC').withOptions({ // Default to USDC
      shallow: false,
      history: 'replace'
    })
  ),

  // Future swap parameters (can be added as needed)
  useAmountState: () => useQueryState(
    'amount',
    parseAsString.withDefault('').withOptions({
      shallow: false,
      history: 'replace'
    })
  ),

  useSlippageState: () => useQueryState(
    'slippage',
    parseAsInteger.withDefault(10).withOptions({
      shallow: false,
      history: 'replace'
    })
  ),

  // Network selection for XCM swaps
  useFromNetworkState: () => useQueryState(
    'fromNetwork',
    parseAsString.withDefault('').withOptions({
      shallow: false,
      history: 'replace'
    })
  ),

  useToNetworkState: () => useQueryState(
    'toNetwork',
    parseAsString.withDefault('').withOptions({
      shallow: false,
      history: 'replace'
    })
  ),
}

// Export individual hooks for convenience
export const useFromTokenState = swapQueryParams.useFromTokenState
export const useToTokenState = swapQueryParams.useToTokenState
export const useAmountState = swapQueryParams.useAmountState
export const useSlippageState = swapQueryParams.useSlippageState
export const useFromNetworkState = swapQueryParams.useFromNetworkState
export const useToNetworkState = swapQueryParams.useToNetworkState 