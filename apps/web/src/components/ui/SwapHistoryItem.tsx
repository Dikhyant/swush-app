import { formatDistanceToNow } from 'date-fns';
import type { SwapHistory } from '@/services/swapHistoryService';

interface SwapHistoryItemProps {
  swap: SwapHistory;
}

export function SwapHistoryItem({ swap }: SwapHistoryItemProps) {
  return (
    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/70 transition-colors">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <span className="text-slate-200">{swap.from_asset}</span>
            <span className="text-slate-400">→</span>
            <span className="text-slate-200">{swap.to_asset}</span>
          </div>
          <span className={`px-2 py-1 text-xs rounded-full capitalize ${
            swap.status === 'success' 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {swap.status}
          </span>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">Amount: {swap.amount}</span>
          <span className="text-slate-500">
            {formatDistanceToNow(new Date(swap.timestamp), { addSuffix: true })}
          </span>
        </div>
        
        {(swap.chain_from || swap.chain_to) && (
          <div className="text-xs text-slate-500">
            {swap.chain_from && <span>From: {swap.chain_from}</span>}
            {swap.chain_from && swap.chain_to && <span> → </span>}
            {swap.chain_to && <span>To: {swap.chain_to}</span>}
          </div>
        )}
      </div>
    </div>
  );
}