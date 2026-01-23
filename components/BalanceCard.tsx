'use client';

import { useAccount } from 'wagmi';
import { useBalances } from '@/hooks/useBalances';
import { BalanceCardSkeleton } from './Skeleton';

export function BalanceCard() {
  const { isConnected } = useAccount();
  const { ethFormatted, usdcFormatted, isLoading } = useBalances();

  if (!isConnected) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-gray-800">
        <p className="text-gray-400 text-center text-sm">Connect wallet to view balances</p>
      </div>
    );
  }

  if (isLoading) {
    return <BalanceCardSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="rounded-2xl p-[1px] bg-gradient-to-r from-cyan-400/80 via-blue-500/70 to-purple-500/80">
        <div className="glass-panel rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">ETH</p>
              <p className="text-xl font-semibold text-white mono-text">
                {parseFloat(ethFormatted).toFixed(4)}
              </p>
            </div>
            <div className="text-right">
              <div className="h-8 w-16 rounded-md bg-gradient-to-r from-emerald-400/40 to-emerald-400/10" />
              <p className="text-xs text-emerald-400 mt-1">+2.1%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-[1px] bg-gradient-to-r from-purple-500/80 via-fuchsia-500/70 to-blue-500/70">
        <div className="glass-panel rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">USDC</p>
              <p className="text-xl font-semibold text-white mono-text">{usdcFormatted}</p>
            </div>
            <div className="text-right">
              <div className="h-8 w-16 rounded-md bg-gradient-to-r from-rose-500/40 to-rose-500/10" />
              <p className="text-xs text-rose-400 mt-1">-0.5%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
