# XCM Swap Flow

This directory contains components for handling cross-chain swaps via XCM. The flow is designed to provide a user-friendly experience for complex cross-chain operations, with clear guidance at each step and smart handling of failures.

## Components

### `SwapPreview`

Displays a preview of the swap with:
- Asset details (input/output amounts and tokens)
- Chain information (source/destination)
- Economic parameters (price impact, slippage, fees)
- Simulation results and warnings
- Options to proceed or adjust parameters

```tsx
<SwapPreview
  inputAmount="10"
  inputToken="DOT"
  outputAmount="100"
  outputToken="USDT"
  sourceChain="Asset Hub"
  destinationChain="Hydradx"
  priceImpact="1.2"
  slippageTolerance="1.5"
  networkFee="~0.01 DOT"
  simulationSuccess={true}
  onStartSwap={() => {}}
  onAdjustParams={() => {}}
/>
```

### `SwapProgress`

Shows the step-by-step progress of a swap with:
- Visual indicators for each step's status
- Transaction signing requests
- Real-time updates on transaction progress

```tsx
<SwapProgress
  steps={[
    {
      id: 1,
      title: "Transfer assets to Hydradx",
      description: "Sign to transfer DOT from Asset Hub to Hydradx",
      status: "pending",
      needsSignature: true,
    },
    // additional steps...
  ]}
  onSignStep={(stepId) => {}}
  onClose={() => {}}
  isSwapping={true}
  setIsSwapping={() => {}}
  inputAmount="10"
  inputToken="DOT"
  outputAmount="100"
  outputToken="USDT"
/>
```

### `SwapFailureOptions`

Displayed when a swap fails, offering options to:
- Retry with adjusted parameters
- Refund assets to the source chain

```tsx
<SwapFailureOptions
  inputAmount="10"
  inputToken="DOT"
  sourceChain="Asset Hub"
  destinationChain="Hydradx"
  suggestedSlippage="3.0"
  estimatedOutput="95"
  outputToken="USDT"
  refundFee="~0.01 DOT"
  onRetry={() => {}}
  onRefund={() => {}}
/>
```

## Flow Overview

1. **Preview Phase**
   - User views swap details with simulation results
   - System shows warnings if simulation detects issues
   - User can proceed or adjust parameters

2. **Execution Phase**
   - Step 1: Transfer assets from source chain to destination chain
   - Step 2: Execute the swap on the destination chain
   - Step 3: Process swap and get confirmation

3. **Outcome Handling**
   - Success: User gets confirmation, assets are received
   - Failure: User is presented with retry or refund options

4. **Retry/Refund Options**
   - Retry: Adjust parameters and try again on destination chain
   - Refund: Transfer assets back to source chain

## Implementation Details

The implementation uses a state machine pattern to track the swap progress, with states including:
- `idle` - Initial state
- `previewing` - Showing the swap preview
- `swapping` - Executing the swap process
- `failed` - Swap has failed, showing recovery options
- `succeeded` - Swap completed successfully
- `refunding` - Processing a refund to the source chain

## Demo Page

For a demonstration of the complete flow, see the following page:
- `/xcm-swap-demo` - Shows the full user journey with success and failure scenarios 