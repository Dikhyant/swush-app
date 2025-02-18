"use client"

import React, { useState, useEffect } from 'react'
import { History } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Toaster, toast } from 'react-hot-toast'
import { api } from '@/lib/api'
import type { AssetWithId } from '@/lib/api'
import {
  ArrowSymbolDown,
  WalletMenu,
  SwapProgress,
  SwapHeader,
  SwapField,
  SwapDetails,
  SwapAction,
  WalletButton,
  SigningStep,
  calculateOutputAmount,
  calculateMinimumReceived,
  mockBlockchainTransaction
} from '@/components/swap'
import type { TokenInfo } from '@/components/swap/types'

export default function SwapPage() {
  // State management
  const [inputToken, setInputToken] = useState<TokenInfo | null>(null)
  const [outputToken, setOutputToken] = useState<TokenInfo | null>(null)
  const [inputAmount, setInputAmount] = useState('50')
  const [outputAmount, setOutputAmount] = useState('0')
  const [slippageTolerance, setSlippageTolerance] = useState(0.5)
  const [transactionDeadline, setTransactionDeadline] = useState(20)
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [isSwapping, setIsSwapping] = useState(false)
  const [swapSteps, setSwapSteps] = useState<SigningStep[]>([
    { 
      id: 1, 
      title: 'Approve DOT',
      description: 'Allow the smart contract to spend your DOT',
      status: 'pending',
      needsSignature: true
    },
    { 
      id: 2, 
      title: 'Swap DOT → USDC',
      description: 'Swap DOT to USDC via Moonbeam DEX',
      status: 'waiting',
      needsSignature: true
    },
    { 
      id: 3, 
      title: 'Swap USDC → ETH',
      description: 'Swap USDC to ETH via Bridge',
      status: 'waiting',
      needsSignature: true
    },
  ])
  const [showHistory, setShowHistory] = useState(false)
  const [balance] = useState(1234.56)
  const [insufficientBalance, setInsufficientBalance] = useState(false)
  const [showSwapProgress, setShowSwapProgress] = useState(false)
  const [assets, setAssets] = useState<AssetWithId[]>([])
  const [openInputDialog, setOpenInputDialog] = useState(false)
  const [openOutputDialog, setOpenOutputDialog] = useState(false)

  // Effects
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const fetchedAssets = await api.assets.getAll();
        setAssets(fetchedAssets);
        
        // Set default tokens if not already set
        if (!inputToken) {
          const defaultInput = fetchedAssets.find(asset => 
            asset.metadata.symbol.toUpperCase() === 'DOT'
          );
          if (defaultInput) {
            setInputToken({
              name: defaultInput.metadata.name,
              symbol: defaultInput.metadata.symbol,
              icon: defaultInput.metadata.symbol.charAt(0),
            });
          } else {
            // If DOT not found, set the first asset as default
            const firstAsset = fetchedAssets[0];
            if (firstAsset) {
              setInputToken({
                name: firstAsset.metadata.name,
                symbol: firstAsset.metadata.symbol,
                icon: firstAsset.metadata.symbol.charAt(0),
              });
            }
          }
        }
        
        if (!outputToken) {
          const defaultOutput = fetchedAssets.find(asset => 
            asset.metadata.symbol.toUpperCase() === 'ETH'
          );
          if (defaultOutput) {
            setOutputToken({
              name: defaultOutput.metadata.name,
              symbol: defaultOutput.metadata.symbol,
              icon: defaultOutput.metadata.symbol.charAt(0),
            });
          } else {
            // If ETH not found, set the second asset as default
            const secondAsset = fetchedAssets[1];
            if (secondAsset) {
              setOutputToken({
                name: secondAsset.metadata.name,
                symbol: secondAsset.metadata.symbol,
                icon: secondAsset.metadata.symbol.charAt(0),
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch assets:', error);
        toast.error('Failed to load assets');
      }
    };

    fetchAssets();
  }, []);

  // Event handlers
  const handleInputChange = (value: string) => {
    setInputAmount(value)
    setOutputAmount(calculateOutputAmount(value))
    setInsufficientBalance(parseFloat(value) > balance)
  }

  const handleSwap = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first', { icon: '🔒' })
      return
    }
    
    setShowSwapProgress(true)
    setIsSwapping(true)
  }

  const handleSignStep = async (stepId: number) => {
    try {
      setSwapSteps(steps => steps.map(step => ({
        ...step,
        status: step.id === stepId ? 'loading' : step.status
      })))

      await new Promise(r => setTimeout(r, 2000))
      const success = await mockBlockchainTransaction()
      
      if (!success) {
        setSwapSteps(steps => steps.map(step => ({
          ...step,
          status: step.id === stepId ? 'failed' : step.status
        })))
        throw new Error(`Step ${stepId} failed`)
      }

      setSwapSteps(steps => steps.map(step => ({
        ...step,
        status: 
          step.id === stepId ? 'completed' :
          step.id === stepId + 1 ? 'pending' :
          step.status
      })))

    } catch (error) {
      console.error('Step failed:', error)
      toast.error(`Failed to complete step ${stepId}`, { icon: '❌' })
    }
  }

  const handleDisconnect = () => {
    setIsConnected(false);
    setWalletAddress('');
    toast.success('Wallet disconnected', {
      icon: '👋',
      style: {
        borderLeft: '4px solid #64748b',
      },
    });
  };

  const tokens = assets.map(asset => ({
    name: asset.metadata.name,
    symbol: asset.metadata.symbol,
    icon: asset.metadata.symbol.charAt(0),
  }));

  const percentageOptions = [
    { label: '25%', value: 0.25 },
    { label: '50%', value: 0.50 },
    { label: '75%', value: 0.75 },
    { label: 'MAX', value: 1 },
  ]

  if (!inputToken || !outputToken) {
    return (
      <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-cyan-900 to-slate-900 flex flex-col items-center justify-center">
        <div className="animate-pulse text-white">Loading assets...</div>
      </div>
    );
  }

  return (
    <>
      {/* Header Actions */}
      <div className="fixed top-4 right-4 hidden sm:flex items-center gap-4 z-50">
        <Button
          onClick={() => setShowHistory(true)}
          variant="outline"
          size="icon"
          className="bg-slate-800/90 border-slate-700/50 hover:bg-slate-700 text-slate-300 transition-all duration-200"
        >
          <History className="w-4 h-4" />
        </Button>
        {!isConnected ? (
          <WalletButton
            isConnected={isConnected}
            setIsConnected={setIsConnected}
            setWalletAddress={setWalletAddress}
            variant="outline"
            className="flex items-center gap-2 bg-slate-800/90 border-slate-700/50 hover:bg-slate-700 text-slate-300 transition-all duration-200"
          />
        ) : (
          <WalletMenu
            address={walletAddress}
            onDisconnect={handleDisconnect}
            className="bg-slate-800/90 border-slate-700/50 hover:bg-slate-700 text-slate-300 transition-all duration-200"
          />
        )}
      </div>

      {/* Main Content */}
      <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-cyan-900 to-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <SwapHeader
            slippageTolerance={slippageTolerance}
            setSlippageTolerance={setSlippageTolerance}
            transactionDeadline={transactionDeadline}
            setTransactionDeadline={setTransactionDeadline}
          />

          <div className="space-y-6">
            <SwapField
              type="input"
              token={inputToken}
              amount={inputAmount}
              balance={balance.toString()}
              onTokenSelect={(token: TokenInfo) => setInputToken(token)}
              onAmountChange={handleInputChange}
              openDialog={openInputDialog}
              setOpenDialog={setOpenInputDialog}
              availableTokens={tokens}
              percentageOptions={percentageOptions}
              onPercentageSelect={(value) => handleInputChange((balance * value).toString())}
            />

            <ArrowSymbolDown />

            <SwapField
              type="output"
              token={outputToken}
              amount={outputAmount}
              balance="5,678.90"
              onTokenSelect={(token: TokenInfo) => setOutputToken(token)}
              openDialog={openOutputDialog}
              setOpenDialog={setOpenOutputDialog}
              availableTokens={tokens}
            />
          </div>

          <SwapDetails
            minimumReceived={calculateMinimumReceived(outputAmount)}
            outputToken={outputToken}
            inputToken={inputToken}
            maxTransactionFee="0.004005"
            route="Moonbeam"
          />

          <SwapAction
            isConnected={isConnected}
            setIsConnected={setIsConnected}
            setWalletAddress={setWalletAddress}
            onSwap={handleSwap}
            isSwapping={isSwapping}
            insufficientBalance={insufficientBalance}
            disabled={!inputAmount || parseFloat(inputAmount) <= 0 || insufficientBalance}
          />
        </div>
      </div>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="bg-slate-900 border-slate-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">Swap History</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4 max-h-96 overflow-y-auto">
            <p className="text-slate-400">No swap history yet.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Toast Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: "!bg-slate-900 !border !border-slate-800 !text-white",
          style: {
            background: 'rgb(15 23 42 / 0.9)',
            border: '1px solid rgb(51 65 85 / 0.5)',
            backdropFilter: 'blur(8px)',
          },
        }}
      />

      {/* Swap Progress Modal */}
      {showSwapProgress && (
        <SwapProgress
          steps={swapSteps}
          onClose={() => setShowSwapProgress(false)}
          onSignStep={handleSignStep}
          inputAmount={inputAmount}
          inputToken={inputToken.symbol}
          outputAmount={outputAmount}
          outputToken={outputToken.symbol}
          isSwapping={isSwapping}
          setIsSwapping={setIsSwapping}
        />
      )}
    </>
  );
}