'use client';

import { useAccount, useChainId } from 'wagmi';
import { useBalances } from '@/hooks/useBalances';
import { getNetworkConfig } from '@/lib/contracts';
import { BalanceCardSkeleton } from './Skeleton';

export function BalanceCard() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { ethFormatted, usdcFormatted, isLoading, error } = useBalances();
  
  const networkConfig = getNetworkConfig(chainId);

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
              <p className="text-xs text-gray-400">ETH ({networkConfig.NAME})</p>
              <p className="text-xl font-semibold text-white mono-text">
                {parseFloat(ethFormatted).toFixed(4)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl">{networkConfig.ICON}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-[1px] bg-gradient-to-r from-purple-500/80 via-fuchsia-500/70 to-blue-500/70">
        <div className="glass-panel rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">USDC ({networkConfig.NAME})</p>
              {error ? (
                <p className="text-sm text-amber-400">Unable to load</p>
              ) : (
                <p className="text-xl font-semibold text-white mono-text">{usdcFormatted}</p>
              )}
            </div>
            <div className="text-right">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-blue-400 text-sm font-bold">$</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
