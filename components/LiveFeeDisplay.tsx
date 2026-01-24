'use client';

import { useMemo } from 'react';
import { useChainId } from 'wagmi';
import { getNetworkConfig } from '@/lib/contracts';

interface FeeBreakdown {
  networkFee: bigint;
  bridgeFee: bigint;
  totalFee: bigint;
  estimatedTime: string;
}

export function useBridgeFee(amount: bigint, chainId?: number): FeeBreakdown {
  const currentChainId = useChainId();
  const activeChainId = chainId || currentChainId;

  return useMemo(() => {
    if (!amount || amount === 0n) {
      return { networkFee: 0n, bridgeFee: 0n, totalFee: 0n, estimatedTime: '~2 minutes' };
    }

    // Network fee (gas * gasPrice)
    const estimatedGas = 350_000n; // Optimized estimate
    const gasPrice = getGasPrice(activeChainId);
    const networkFee = estimatedGas * gasPrice;

    // Bridge fee (0.1% for xReserve)
    const bridgeFee = amount * 1n / 1000n;

    return {
      networkFee,
      bridgeFee,
      totalFee: networkFee + bridgeFee,
      estimatedTime: getEstimatedTime(activeChainId),
    };
  }, [amount, activeChainId]);
}

function getGasPrice(chainId: number): bigint {
  const gasPrices: Record<number, bigint> = {
    1: 20_000_000_000n,      // Ethereum: 20 gwei
    42161: 100_000_000n,     // Arbitrum: 0.1 gwei
    10: 1_000_000_000n,      // Optimism: 1 gwei
    8453: 1_000_000_000n,    // Base: 1 gwei
    137: 30_000_000_000n,    // Polygon: 30 gwei
    43114: 25_000_000_000n,  // Avalanche: 25 gwei
    11155111: 10_000_000_000n, // Sepolia: 10 gwei
  };
  return gasPrices[chainId] || 20_000_000_000n;
}

function getEstimatedTime(chainId: number): string {
  const chainEstimates: Record<number, string> = {
    8453: '~2 minutes',    // Base
    42161: '~3 minutes',   // Arbitrum
    10: '~3 minutes',      // Optimism
    1: '~15 minutes',      // Ethereum
    137: '~5 minutes',     // Polygon
    43114: '~5 minutes',   // Avalanche
    11155111: '~2 minutes', // Sepolia testnet
  };
  return chainEstimates[chainId] || '~5 minutes';
}

function formatUSD(amount: bigint): string {
  const decimalAmount = Number(amount) / 1_000_000; // USDC has 6 decimals
  return decimalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface LiveFeeDisplayProps {
  amount: bigint;
  chainId?: number;
}

export function LiveFeeDisplay({ amount, chainId }: LiveFeeDisplayProps) {
  const { networkFee, bridgeFee, totalFee, estimatedTime } = useBridgeFee(amount, chainId);
  const amountAfterFees = amount > totalFee ? amount - totalFee : 0n;

  if (!amount || amount === 0n) {
    return null;
  }

  return (
    <div className="live-fee-display bg-black/40 rounded-xl p-4 space-y-2 border border-white/5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-300">Network fee</span>
        <span className="font-mono text-white">${formatUSD(networkFee)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-300">Bridge fee (0.1%)</span>
        <span className="font-mono text-white">${formatUSD(bridgeFee)}</span>
      </div>
      <div className="border-t border-white/10 pt-2 flex justify-between text-sm font-medium">
        <span className="text-gray-200">Total fees</span>
        <span className="font-mono text-white">${formatUSD(totalFee)}</span>
      </div>
      <div className="border-t border-white/10 pt-2 mt-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-300">Estimated arrival</span>
          <span className="text-sky-400 font-medium">{estimatedTime}</span>
        </div>
      </div>
      <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3 mt-2">
        <div className="flex justify-between text-sm font-medium">
          <span className="text-green-300">You'll receive</span>
          <span className="font-mono text-green-300">${formatUSD(amountAfterFees)} USDCx</span>
        </div>
      </div>
    </div>
  );
}
