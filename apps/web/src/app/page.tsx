"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Settings, RotateCcw, ChevronsDown, History, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { Toaster, toast } from 'react-hot-toast'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  WalletSelect
} from '@talismn/connect-components'
import {
  AlephZeroWallet,
  EnkryptWallet,
  FearlessWallet,
  MantaWallet,
  NovaWallet,
  PolkadotjsWallet,
  PolkaGate,
  SubWallet,
  TalismanWallet,
} from '@talismn/connect-wallets'
import { api } from '@/lib/api'
import type { AssetWithId } from '@/lib/api'
import { TokenButton } from '@/components/swap/TokenButton'
import { AssetList } from '@/components/swap/AssetList'
import { WalletMenu } from '@/components/swap/WalletMenu'
import { SwapProgress } from '@/components/swap/SwapProgress'
import { SigningStep, TokenInfo } from '@/components/swap/types'
import { calculateOutputAmount, calculateMinimumReceived, mockBlockchainTransaction } from '@/components/swap/utils'

const WalletButton = ({ 
  isConnected, 
  setIsConnected, 
  setWalletAddress, 
  variant = 'default',
  className = '' 
}: { 
  isConnected: boolean;
  setIsConnected: (value: boolean) => void;
  setWalletAddress: (value: string) => void;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}) => {
  const handleAccountSelected = (account: any) => {
    setIsConnected(true);
    setWalletAddress(account.address);
    toast.success('Wallet connected successfully', {
      icon: '👋',
      style: {
        borderLeft: '4px solid #22c55e',
      },
    });
  };

  return (
    <WalletSelect
      dappName="Swush"
      showAccountsList
      walletList={[
        new TalismanWallet(),
        new NovaWallet(),
        new SubWallet(),
        new MantaWallet(),
        new PolkaGate(),
        new FearlessWallet(),
        new EnkryptWallet(),
        new PolkadotjsWallet(),
        new AlephZeroWallet(),
      ]}
      triggerComponent={
        <Button 
          variant={variant}
          className={className}
        >
          Connect Wallet
        </Button>
      }
      onAccountSelected={handleAccountSelected}
    />
  );
};

export default function SwapPage() {
  const [inputToken, setInputToken] = useState<TokenInfo>({ name: 'DOT', icon: '●', price: '$2.00' })
  const [outputToken, setOutputToken] = useState<TokenInfo>({ name: 'ETH', icon: 'Ξ', price: '$2000' })
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
  const [isLoadingAssets, setIsLoadingAssets] = useState(true)
  const [openInputDialog, setOpenInputDialog] = useState(false);
  const [openOutputDialog, setOpenOutputDialog] = useState(false);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const assets = await api.assets.getAll();
        setAssets(assets);
      } catch (error) {
        console.error('Failed to fetch assets:', error);
        toast.error('Failed to load assets');
      } finally {
        setIsLoadingAssets(false);
      }
    };

    fetchAssets();
  }, []);

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

  const tokens = assets.map(asset => ({
    name: asset.metadata.symbol,
    icon: asset.metadata.symbol.charAt(0),
    price: `$${parseFloat(asset.metadata.deposit.toString()).toFixed(2)}`
  }));

  const percentageOptions = [
    { label: '25%', value: 0.25 },
    { label: '50%', value: 0.50 },
    { label: '75%', value: 0.75 },
    { label: 'MAX', value: 1 },
  ]

  const renderActionButton = () => {
    if (!isConnected) {
      return (
        <WalletButton
          isConnected={isConnected}
          setIsConnected={setIsConnected}
          setWalletAddress={setWalletAddress}
              className="w-full h-14 text-lg font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
        />
      );
    }

    return (
      <Button 
        className="w-full h-14 text-lg font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-rose-500/25"
        onClick={handleSwap}
        disabled={!inputAmount || parseFloat(inputAmount) <= 0 || insufficientBalance}
      >
        {insufficientBalance ? 'Insufficient Balance' : isSwapping ? 'Swapping...' : 'Swap'}
      </Button>
    );
  };

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

  return (
    <>
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

      <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-cyan-900 to-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-between items-center px-1">
            <h1 className="text-2xl font-bold text-white"></h1>
            <div className="flex gap-2 items-center">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800/50">
                    <Settings className="w-5 h-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800">
                  <DialogHeader>
                    <DialogTitle className="text-white">Settings</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <label className="text-sm text-slate-400">Slippage Tolerance (%)</label>
                      <Input
                        type="number"
                        value={slippageTolerance}
                        onChange={(e) => setSlippageTolerance(parseFloat(e.target.value))}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm text-slate-400">Transaction Deadline (minutes)</label>
                      <Input
                        type="number"
                        value={transactionDeadline}
                        onChange={(e) => setTransactionDeadline(parseInt(e.target.value))}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800/50">
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <motion.div 
              className="p-6 rounded-2xl bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-slate-300">Pay</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">Balance: </span>
                  <span className="text-sm font-medium text-slate-300">{balance} {inputToken.name}</span>
                </div>
              </div>
              
              <div className="flex gap-2 mb-4">
                {percentageOptions.map(({ label, value }) => (
                  <Button
                    key={label}
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange((balance * value).toString())}
                    className="text-xs font-medium bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white transition-all duration-200"
                  >
                    {label}
                  </Button>
                ))}
              </div>
              
              <div className="flex items-center gap-4">
                <Dialog open={openInputDialog} onOpenChange={setOpenInputDialog}>
                  <DialogTrigger asChild>
                    <div className="flex-shrink-0">
                      <TokenButton
                        token={inputToken.name}
                        icon={
                          <div className="w-full h-full bg-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-lg font-bold">{inputToken.icon}</span>
                          </div>
                        }
                        price={inputToken.price}
                        onClick={() => {}}
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-800">
                    <DialogHeader>
                      <DialogTitle className="text-white">Select a token</DialogTitle>
                    </DialogHeader>
                    <AssetList 
                      assets={tokens} 
                      onSelect={setInputToken}
                      currentAsset={inputToken}
                      onClose={() => setOpenInputDialog(false)}
                    />
                  </DialogContent>
                </Dialog>
                <div className="flex-1">
                  <Input
                    type="number"
                    value={inputAmount}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="border-0 bg-transparent text-2xl text-white focus-visible:ring-0 focus-visible:ring-offset-0 text-right appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    placeholder="0"
                  />
                </div>
              </div>
            </motion.div>

            <div className="flex justify-center -my-3 relative z-10">
              <motion.div 
                className="p-2 rounded-lg bg-slate-700/90 backdrop-blur-sm border border-slate-600/50 shadow-lg hover:bg-slate-600/90 transition-all duration-200 cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.01 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronsDown className="w-6 h-6 text-slate-300" />
              </motion.div>
            </div>

            <motion.div 
              className="p-6 rounded-2xl bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-slate-300">Receive</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">Balance: </span>
                  <span className="text-sm font-medium text-slate-300">5,678.90 {outputToken.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Dialog open={openOutputDialog} onOpenChange={setOpenOutputDialog}>
                  <DialogTrigger asChild>
                    <div className="flex-shrink-0">
                      <TokenButton
                        token={outputToken.name}
                        icon={
                          <div className="w-full h-full bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-lg font-bold">{outputToken.icon}</span>
                          </div>
                        }
                        price={outputToken.price}
                        onClick={() => {}}
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-800">
                    <DialogHeader>
                      <DialogTitle className="text-white">Select a token</DialogTitle>
                    </DialogHeader>
                    <AssetList 
                      assets={tokens} 
                      onSelect={setOutputToken}
                      currentAsset={outputToken}
                      onClose={() => setOpenOutputDialog(false)}
                    />
                  </DialogContent>
                </Dialog>
                <div className="flex-1">
                  <Input
                    type="number"
                    value={outputAmount}
                    readOnly
                    className="border-0 bg-transparent text-2xl text-white focus-visible:ring-0 focus-visible:ring-offset-0 text-right appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    placeholder="0"
                  />
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div 
            className="p-4 rounded-xl bg-slate-800/20 backdrop-blur-sm border border-slate-700/20 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="space-y-2">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Minimum Received</span>
                  <span className="text-slate-300">
                    {calculateMinimumReceived(outputAmount)} {outputToken.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Max Transaction Fee</span>
                  <span className="text-slate-300">0.004005</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Route</span>
                  <span className="text-slate-300">Moonbeam</span>
                </div>
              </div>

              <Collapsible>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-center gap-2 pt-2 text-sm text-slate-400 hover:text-slate-300 transition-colors">
                    <span>Show more details</span>
                    <Search className="w-4 h-4" />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-3 pt-3 border-t border-slate-700/50">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Routing Path</span>
                      </div>
                      <div className="">
                        <p className="text-xs text-slate-300 font-medium leading-relaxed">
                          {`${inputToken.name} → USDC → ${outputToken.name}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            {renderActionButton()}
          </motion.div>
        </div>
      </div>

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

      {showSwapProgress && (
        <SwapProgress
          steps={swapSteps}
          onClose={() => setShowSwapProgress(false)}
          onSignStep={handleSignStep}
          inputAmount={inputAmount}
          inputToken={inputToken.name}
          outputAmount={outputAmount}
          outputToken={outputToken.name}
          isSwapping={isSwapping}
          setIsSwapping={setIsSwapping}
        />
      )}
    </>
  );
}