'use client';

import React from 'react';
import { useAccount } from 'wagmi';
import { useMultiChainBalances, useTotalMultiChainBalance, useFormattedMultiChainBalance } from '@/hooks/useMultiChainBalances';
import { getNetworkName } from '@/lib/contracts';

export function MultiChainBalanceDisplay() {
  const { address } = useAccount();
  const { data: balances, isLoading } = useMultiChainBalances(address);
  const { totalFormatted, chainCount } = useTotalMultiChainBalance(address);

  if (!address) {
    return (
      <div className="text-center text-gray-400 py-8">
        Connect wallet to see multi-chain balances
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center text-gray-400 py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        Fetching balances from 6 chains...
      </div>
    );
  }

  const chainIds = [1, 42161, 10, 8453, 137, 43114]; // Ethereum, Arbitrum, Optimism, Base, Polygon, Avalanche

  return (
    <div className="bg-black/40 rounded-2xl p-6 border border-white/10">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
        Multi-Chain USDC Balances
      </h3>

      {/* Total Balance Summary */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-4 mb-6 border border-blue-700/30">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-400">Total USDC Across Chains</p>
            <p className="text-2xl font-bold text-white">${totalFormatted}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Chains with Balance</p>
            <p className="text-xl font-semibold text-blue-400">{chainCount}/6</p>
          </div>
        </div>
      </div>

      {/* Individual Chain Balances */}
      <div className="space-y-3">
        {chainIds.map((chainId) => {
          const { formatted } = useFormattedMultiChainBalance(address, chainId);
          const balance = balances?.get(chainId) || 0n;
          const hasBalance = balance > 0n;

          return (
            <div
              key={chainId}
              className={`flex justify-between items-center p-3 rounded-lg border transition-all ${
                hasBalance
                  ? 'bg-green-900/10 border-green-700/30 text-green-400'
                  : 'bg-black/40 border-white/10 text-gray-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  hasBalance ? 'bg-green-400' : 'bg-gray-600'
                }`}></div>
                <span className="font-medium">{getNetworkName(chainId)}</span>
              </div>
              <div className="text-right">
                <p className="font-mono font-semibold">${formatted}</p>
                <p className="text-xs opacity-75">
                  {hasBalance ? 'Available' : 'No balance'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance Indicator */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Parallel fetching enabled
          </span>
          <span>30s cache • 60s refresh</span>
        </div>
      </div>
    </div>
  );
}
