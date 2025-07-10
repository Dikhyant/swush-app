import { useState } from 'react'
import { SwapField } from '@/components/swap'
import { ArrowSymbolDown } from '@/components/swap'

interface CrossChainTabProps {
  tokens: any[]
  isConnected: boolean
}

export function CrossChainTab({ tokens, isConnected }: CrossChainTabProps) {
  const [sourceChain, setSourceChain] = useState('Polkadot')
  const [destChain, setDestChain] = useState('Arbitrum')
  const [inputAmount, setInputAmount] = useState('')
  const [outputAmount, setOutputAmount] = useState('')

  // Dummy token for demonstration
  const dotToken = tokens.find(t => t.symbol === 'DOT') || { 
    id: 'dot', 
    symbol: 'DOT', 
    name: 'Polkadot', 
    icon: '/tokens/dot.svg', 
    decimals: 10 
  }
  const ethToken = { 
    id: 'eth', 
    symbol: 'ETH', 
    name: 'Ethereum', 
    icon: '/tokens/eth.svg', 
    decimals: 18 
  }

  const chainOptions = [
    { label: 'Polkadot', value: 'Polkadot' },
    { label: 'Asset Hub', value: 'AssetHub' },
  ]

  const destChainOptions = [
    { label: 'Arbitrum', value: 'Arbitrum' },
    { label: 'Base', value: 'Base' },
    { label: 'Ethereum', value: 'Ethereum' },
  ]

  return (
    <div className="space-y-6">
      {/* Chain Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">From Chain</label>
          <select 
            value={sourceChain}
            onChange={(e) => setSourceChain(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {chainOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">To Chain</label>
          <select 
            value={destChain}
            onChange={(e) => setDestChain(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {destChainOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Token Fields */}
      <div className="space-y-4">
        <SwapField
          type="input"
          token={dotToken}
          amount={inputAmount}
          balance="0"
          onTokenSelect={() => {}}
          onAmountChange={setInputAmount}
          openDialog={false}
          setOpenDialog={() => {}}
          availableTokens={[dotToken]}
          isLoading={false}
          balancesLoaded={true}
          isConnected={isConnected}
        />

        <ArrowSymbolDown />

        <SwapField
          type="output"
          token={ethToken}
          amount={outputAmount}
          balance="0"
          onTokenSelect={() => {}}
          openDialog={false}
          setOpenDialog={() => {}}
          availableTokens={[ethToken]}
          isLoading={false}
          balancesLoaded={true}
          isConnected={isConnected}
        />
      </div>

      {/* Bridge Info */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bridge Provider:</span>
            <span>Chainflip</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estimated Time:</span>
            <span>~2-5 minutes</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bridge Fee:</span>
            <span>~0.1%</span>
          </div>
        </div>
      </div>
    </div>
  )
} 