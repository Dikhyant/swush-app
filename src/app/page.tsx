"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Settings, Clock, ArrowRight, ArrowDownToLine, Wallet, Check, Loader2, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"


interface TokenButtonProps {
  token: string;
  icon: React.ReactNode;
  onClick: () => void;
  price?: string; // Add price prop
}
const TokenButton = ({ token, icon, onClick }: TokenButtonProps) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors w-full"
  >
    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
      {icon}
    </div>
    <div className="flex flex-col items-start">
      <span className="font-medium text-white">{token}</span>
    </div>
    <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
  </button>
)

export default function Component() {
  const [inputToken, setInputToken] = useState({ name: 'DOT', icon: '●', price: '$2.00' })
  const [outputToken, setOutputToken] = useState({ name: 'ETH', icon: 'Ξ', price: '$2000' })
  const [inputAmount, setInputAmount] = useState('50')
  const [outputAmount, setOutputAmount] = useState('100')
  const [slippageTolerance, setSlippageTolerance] = useState(0.5)
  const [transactionDeadline, setTransactionDeadline] = useState(20)
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [isSwapping, setIsSwapping] = useState(false)
  const [swapSteps, setSwapSteps] = useState([
    { id: 1, title: 'Approve DOT', status: 'pending' },
    { id: 2, title: 'Swap DOT → USDC', status: 'waiting' },
    { id: 3, title: 'Swap USDC → ETH', status: 'waiting' },
  ])

  const handleInputChange = (value: string) => {
    setInputAmount(value)
    setOutputAmount((parseFloat(value) * 2).toString())
  }

  const handleWalletConnect = () => {
    setIsConnected(!isConnected)
    setWalletAddress(isConnected ? '' : '0x1234...5678')
  }

  const handleSwap = async () => {
    setIsSwapping(true)
    
    // Simulate multi-step swap process
    try {
      // Step 1: Approve
      setSwapSteps(steps => steps.map(step =>
        step.id === 1 ? { ...step, status: 'loading' } : step
      ))
      await new Promise(r => setTimeout(r, 2000))
      setSwapSteps(steps => steps.map(step =>
        step.id === 1 ? { ...step, status: 'completed' } : step
      ))

      // Step 2: First swap
      setSwapSteps(steps => steps.map(step =>
        step.id === 2 ? { ...step, status: 'loading' } : step
      ))
      await new Promise(r => setTimeout(r, 3000))
      setSwapSteps(steps => steps.map(step =>
        step.id === 2 ? { ...step, status: 'completed' } : step
      ))

      // Step 3: Second swap
      setSwapSteps(steps => steps.map(step =>
        step.id === 3 ? { ...step, status: 'loading' } : step
      ))
      await new Promise(r => setTimeout(r, 2500))
      setSwapSteps(steps => steps.map(step =>
        step.id === 3 ? { ...step, status: 'completed' } : step
      ))

    } catch (error) {
      console.error('Swap failed:', error)
    }
  }

  const tokens = [
    { name: 'DOT', icon: '●', price: '$2.00' },
    { name: 'ETH', icon: 'Ξ', price: '$2000' },
    { name: 'BTC', icon: '₿', price: '$30000' },
  ]

  const percentageOptions = [
    { label: '25%', value: 0.25 },
    { label: '50%', value: 0.50 },
    { label: '75%', value: 0.75 },
    { label: 'MAX', value: 1 },
  ]

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-cyan-900 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="fixed top-4 right-4">
        <Button
          onClick={handleWalletConnect}
          variant="outline"
          className="flex items-center gap-2 bg-slate-900/90 border-slate-800/50 hover:bg-slate-800 text-white"
        >
          <Wallet className="w-4 h-4" />
          <span className="hidden sm:inline">
            {isConnected ? walletAddress : 'Connect Wallet'}
          </span>
        </Button>
      </div>

      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-between items-center px-1">
          <h1 className="text-xl font-medium text-white">Swap</h1>
          <div className="flex items-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <button className="p-2 rounded-lg hover:bg-slate-800/50">
                  <Settings className="w-5 h-5 text-slate-400" />
                </button>
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
            <button className="p-2 rounded-lg hover:bg-slate-800/50">
              <Clock className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/90 backdrop-blur-sm border border-slate-800/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-base font-semibold text-white">Pay</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Balance: </span>
                <span className="text-sm font-medium text-white">1,234.56 {inputToken.name}</span>
              </div>
            </div>
            
            <div className="flex gap-2 mb-4">
              {percentageOptions.map(({ label, value }) => (
                <button
                  key={label}
                  onClick={() => handleInputChange((1234.56 * value).toString())}
                  className="px-2 py-1 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <div className="flex-shrink-0">
                    <TokenButton
                      token={inputToken.name}
                      icon={
                        <div className="w-full h-full bg-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">{inputToken.icon}</span>
                        </div>
                      }
                      onClick={() => {}}
                    />
                  </div>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800">
                  <DialogHeader>
                    <DialogTitle className="text-white">Select a token</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-2 py-4">
                    {tokens.map((token) => (
                      <TokenButton
                        key={token.name}
                        token={token.name}
                        icon={<div className={`w-full h-full ${token.name === 'DOT' ? 'bg-pink-500' : token.name === 'ETH' ? 'bg-blue-500' : 'bg-orange-500'} rounded-full flex items-center justify-center`}>
                          <span className="text-white text-xs">{token.icon}</span>
                        </div>}
                        onClick={() => setInputToken(token)}
                      />
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              <div className="flex-1">
                <Input
                  type="number"
                  value={inputAmount}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="border-0 bg-transparent text-2xl text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 text-right"
                  placeholder="0"
                />
                <div className="text-right">
                  <span className="text-sm text-slate-400">$100 </span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-2 py-3 rounded-xl bg-slate-800/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Exchange Rate</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-slate-500 hover:text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-800 border-slate-700">
                      <div className="space-y-2">
                        <p>Current market rate including:</p>
                        <ul className="text-xs space-y-1 text-slate-300">
                          <li>• Network fees</li>
                          <li>• Price impact</li>
                          <li>• DEX fees</li>
                        </ul>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-white">1 {inputToken.name}</span>
                    <span className="text-slate-400 mx-2">=</span>
                    <span className="text-sm font-medium text-white">
                      {(parseFloat(outputToken.price.slice(1)) / parseFloat(inputToken.price.slice(1))).toFixed(4)} {outputToken.name}
                    </span>
                  </div>
                  <button className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors group">
                    <svg 
                      width="14" 
                      height="14" 
                      viewBox="0 0 16 16" 
                      fill="none" 
                      className="text-slate-400 group-hover:text-slate-300"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        d="M7.2 4L4 7.2M4 7.2L7.2 10.4M4 7.2H12" 
                        stroke="currentColor" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                <span className="text-sm text-slate-400">
                  ${outputToken.price.slice(1)}
                </span>
              </div>
            </div>
            
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-slate-400">Price Impact</span>
              <span className="text-green-400">-0.03%</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-slate-400">Minimum Received</span>
              <span className="text-white">
                {(parseFloat(outputAmount) * 0.995).toFixed(4)} {outputToken.name}
              </span>
            </div>
          </div>

          <div className="flex justify-center -my-3 relative z-10">
            <div className="p-2 rounded-lg bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 hover:bg-slate-700/90 transition-colors cursor-pointer">
              <ArrowDownToLine className="w-5 h-5 text-slate-300" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 backdrop-blur-sm border border-slate-800/50">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-slate-400">Receive</span>
              <span className="text-sm font-medium text-white bg-slate-800 px-2 py-1 rounded-full">
                ${(parseFloat(outputAmount) * parseFloat(outputToken.price.slice(1))).toFixed(3)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <div className="flex-shrink-0">
                    <TokenButton
                      token={outputToken.name}
                      icon={
                        <div className="w-full h-full bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">{outputToken.icon}</span>
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
                  <div className="grid gap-2 py-4">
                    {tokens.map((token) => (
                      <TokenButton
                        key={token.name}
                        token={token.name}
                        icon={<div className={`w-full h-full ${token.name === 'DOT' ? 'bg-pink-500' : token.name === 'ETH' ? 'bg-blue-500' : 'bg-orange-500'} rounded-full flex items-center justify-center`}>
                          <span className="text-white text-xs">{token.icon}</span>
                        </div>}
                        price={token.price}
                        onClick={() => setOutputToken(token)}
                      />
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              <div className="flex-1">
                <Input
                  type="number"
                  value={outputAmount}
                  readOnly
                  className="border-0 bg-transparent text-2xl text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 text-right"
                  placeholder="0"
                />
                <div className="text-right">
                  <span className="text-sm text-slate-400">$100</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Dialog open={isSwapping} onOpenChange={setIsSwapping}>
          <DialogTrigger asChild>
            <Button 
              className="w-full h-12 text-lg font-medium bg-rose-500/90 hover:bg-rose-500 text-white rounded-xl"
              onClick={handleSwap}
            >
              Swap
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Confirming Swap</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              {swapSteps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-4">
                  <div className="relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center
                      ${step.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                        step.status === 'loading' ? 'bg-blue-500/20 text-blue-500' :
                        'bg-slate-800 text-slate-400'}`}>
                      {step.status === 'completed' ? (
                        <Check className="w-5 h-5" />
                      ) : step.status === 'loading' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <span className="text-sm">{step.id}</span>
                      )}
                    </div>
                    {index < swapSteps.length - 1 && (
                      <div className={`absolute left-1/2 h-full border-l border-dashed
                        ${step.status === 'completed' ? 'border-green-500/50' : 'border-slate-700'}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{step.title}</p>
                    <p className="text-sm text-slate-400">
                      {step.status === 'completed' ? 'Transaction confirmed' :
                       step.status === 'loading' ? 'Waiting for confirmation...' :
                       'Waiting to start'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter className="mt-6">
              {swapSteps.every(step => step.status === 'completed') ? (
                <Button
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => setIsSwapping(false)}
                >
                  Done
                </Button>
              ) : (
                <Button
                  className="w-full"
                  disabled
                >
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Confirming Transaction
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}