import { Suspense } from 'react'
import { SwapContainer } from '@/components/swap/SwapContainer'
import { LoadState } from '@/components/swap/ui/LoadState'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function SwapPage() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen relative">
        {/* Simplified Swush-inspired background with better contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-forest-900 via-forest-900 to-slate-900">
        </div>

        <Suspense fallback={<LoadState />}>
          <SwapContainer />
        </Suspense>
      </div>
    </ErrorBoundary>
  )
}