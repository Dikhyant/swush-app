import { useState } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, CircleDashed, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface SwapPreviewProps {
  inputAmount: string
  inputToken: string
  outputAmount: string
  outputToken: string
  sourceChain: string
  destinationChain: string
  priceImpact: string
  slippageTolerance: string
  networkFee: string
  simulationSuccess: boolean
  simulationWarning?: string
  onStartSwap: () => void
  onAdjustParams?: () => void
}

export const SwapPreview = ({
  inputAmount,
  inputToken,
  outputAmount,
  outputToken,
  sourceChain,
  destinationChain,
  priceImpact,
  slippageTolerance,
  networkFee,
  simulationSuccess,
  simulationWarning,
  onStartSwap,
  onAdjustParams
}: SwapPreviewProps) => {
  return (
    <div className="max-w-2xl mx-auto bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-slate-700/50">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Cross-Chain Swap Preview</h1>
          <p className="text-slate-400">
            You are about to swap assets in an isolated pool, which may have higher risks like slippage or low liquidity.
          </p>
        </div>

        <div className="bg-slate-700/30 rounded-xl p-5 border border-slate-600/50">
          <div className="flex justify-between items-center mb-4">
            <div className="space-y-1">
              <p className="text-sm text-slate-400">You will send</p>
              <p className="text-2xl font-semibold text-white">{inputAmount} {inputToken}</p>
              <p className="text-sm text-slate-400">from {sourceChain}</p>
            </div>
            <ArrowRight className="text-slate-500" />
            <div className="space-y-1 text-right">
              <p className="text-sm text-slate-400">You will receive</p>
              <p className="text-2xl font-semibold text-white">{outputAmount} {outputToken}</p>
              <p className="text-sm text-slate-400">on {destinationChain}</p>
            </div>
          </div>

          <div className="space-y-2 mt-6">
            <div className="flex justify-between text-sm">
              <span className="flex items-center text-slate-400">
                Price Impact
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3.5 h-3.5 ml-1 text-slate-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-60 text-xs">The difference between the market price and estimated price due to trade size.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </span>
              <span className={`${
                parseFloat(priceImpact) > 5 ? 'text-red-400' : 
                parseFloat(priceImpact) > 3 ? 'text-amber-400' : 'text-white'
              }`}>{priceImpact}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center text-slate-400">
                Slippage Tolerance
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3.5 h-3.5 ml-1 text-slate-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-60 text-xs">Your transaction will revert if the price changes unfavorably by more than this percentage.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </span>
              <span className="text-white">{slippageTolerance}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Network Fee</span>
              <span className="text-white">{networkFee}</span>
            </div>
          </div>
        </div>

        {simulationSuccess ? (
          <div className="bg-blue-900/20 rounded-xl p-5 border border-blue-700/30 flex gap-4">
            <div className="shrink-0">
              <CircleDashed className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-blue-300 font-medium mb-1">Preview Summary</h3>
              <p className="text-blue-200 text-sm">
                Simulation successful. Your swap should complete with the expected output, and assets will be transferred to {destinationChain}.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-900/20 rounded-xl p-5 border border-amber-700/30 flex gap-4">
            <div className="shrink-0">
              <AlertCircle className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-amber-300 font-medium mb-1">Simulation Warning</h3>
              <p className="text-amber-200 text-sm">
                {simulationWarning || 'The simulation indicates this swap may fail. Consider adjusting parameters or proceeding with caution.'}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <h3 className="text-lg font-medium text-white">2-Step Process</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-slate-600/50 flex items-center justify-center text-white font-medium">1</div>
                <div>
                  <h4 className="font-medium text-white">Send to {destinationChain}</h4>
                  <p className="text-sm text-slate-400 mt-1">
                    Transfer your {inputToken} from {sourceChain} to {destinationChain}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-slate-600/50 flex items-center justify-center text-white font-medium">2</div>
                <div>
                  <h4 className="font-medium text-white">Execute Swap</h4>
                  <p className="text-sm text-slate-400 mt-1">
                    Swap your {inputToken} for {outputToken} on {destinationChain}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {!simulationSuccess && onAdjustParams && (
            <Button
              onClick={onAdjustParams}
              variant="outline"
              className="w-full border-amber-600/50 bg-amber-900/20 text-amber-200 hover:bg-amber-900/30 hover:text-amber-100 py-5 px-8 rounded-xl"
            >
              Adjust Swap Parameters
            </Button>
          )}

          <Button
            onClick={onStartSwap}
            className={`w-full ${
              simulationSuccess 
                ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/25' 
                : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'
            } text-white font-medium py-6 px-8 rounded-xl shadow-lg transition-all duration-200`}
          >
            {simulationSuccess ? 'Start Swap Process' : 'Proceed Anyway'}
          </Button>
        </div>
      </div>
    </div>
  )
} 