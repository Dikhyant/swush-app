import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface SwapFailureOptionsProps {
  inputAmount: string
  inputToken: string
  sourceChain: string
  destinationChain: string
  suggestedSlippage: string
  estimatedOutput: string
  outputToken: string
  refundFee: string
  onRetry: () => void
  onRefund: () => void
}

export const SwapFailureOptions = ({
  inputAmount,
  inputToken,
  sourceChain,
  destinationChain,
  suggestedSlippage,
  estimatedOutput,
  outputToken,
  refundFee,
  onRetry,
  onRefund
}: SwapFailureOptionsProps) => {
  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700 shadow-xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 text-amber-500 mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Swap Failed</h2>
          <p className="text-slate-400 mt-2">
            Your {inputAmount} {inputToken} is safe on {destinationChain}. What would you like to do next?
          </p>
        </div>
        
        <div className="space-y-4">
          <Button 
            onClick={onRetry} 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-xl"
          >
            Retry with Adjusted Parameters
            <span className="block text-xs mt-1 text-blue-300">
              {suggestedSlippage}% slippage, estimated {estimatedOutput} {outputToken} output
            </span>
          </Button>
          
          <Button 
            onClick={onRefund}
            variant="outline" 
            className="w-full border-slate-600 text-white hover:bg-slate-700 py-4 rounded-xl"
          >
            Return {inputToken} to {sourceChain}
            <span className="block text-xs mt-1 text-slate-400">
              Additional network fee: {refundFee}
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
} 