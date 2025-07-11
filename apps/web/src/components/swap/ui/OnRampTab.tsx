import { useState, useEffect } from 'react'
import { SwapField } from '@/components/swap'

interface OnRampTabProps {
  tokens: any[]
  isConnected: boolean
}

export function OnRampTab({ tokens, isConnected }: OnRampTabProps) {
  const [inputAmount, setInputAmount] = useState('')
  const [selectedToken, setSelectedToken] = useState(tokens[0] || null)

  // Update selected token when tokens are loaded
  useEffect(() => {
    if (!selectedToken && tokens.length > 0) {
      setSelectedToken(tokens[0])
    }
  }, [tokens, selectedToken])

  // Dummy USDC token for output
  const usdcToken = { symbol: 'USDC', name: 'USD Coin' }

  // Don't render until we have tokens loaded
  if (!selectedToken && tokens.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-24 w-full bg-forest-800/50 rounded-lg animate-pulse" />
        <div className="h-16 w-full bg-forest-800/50 rounded-lg animate-pulse" />
        <div className="h-24 w-full bg-forest-800/50 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Input Token Selection */}
      <div className="space-y-4">
        {selectedToken && (
          <SwapField
            type="input"
            token={selectedToken}
            amount={inputAmount}
            balance="0"
            onTokenSelect={setSelectedToken}
            onAmountChange={setInputAmount}
            openDialog={false}
            setOpenDialog={() => {}}
            availableTokens={tokens}
            isLoading={false}
            balancesLoaded={true}
            isConnected={isConnected}
          />
        )}

        {/* Conversion Arrow */}
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
              <path d="M12 5v14m7-7l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* USDC Output (Auto-calculated) */}
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                $
              </div>
              <div>
                <div className="font-medium">USDC</div>
                <div className="text-sm text-muted-foreground">USD Coin</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">
                {inputAmount ? (parseFloat(inputAmount) * 1.2).toFixed(2) : '0.00'}
              </div>
              <div className="text-sm text-muted-foreground">≈ ${inputAmount ? (parseFloat(inputAmount) * 1.2).toFixed(2) : '0.00'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hyperliquid Info */}
      <div className="rounded-lg border border-border bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
            HL
          </div>
          <div>
            <div className="font-medium">Hyperliquid</div>
            <div className="text-sm text-muted-foreground">Perps Trading</div>
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Auto-deposit to:</span>
            <span>Hyperliquid Mainnet</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Available for:</span>
            <span>Perps Trading</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Processing time:</span>
            <span>~30 seconds</span>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <h4 className="font-medium mb-3">What happens next:</h4>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
            <span>Convert {selectedToken?.symbol || 'TOKEN'} to USDC</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
            <span>Auto-deposit to your HL account</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
            <span>Ready for perps trading</span>
          </div>
        </div>
      </div>
    </div>
  )
} 