'use client';

import { useState } from 'react';
import type { BridgeResult } from '@/lib/bridge';
import type { BridgeStatus } from '@/hooks/useBridge';
import { ShareButton } from './ShareButton';
import { SuccessCelebration } from './SuccessCelebration';

interface StatusPanelProps {
  amount?: string;
  status: BridgeStatus;
  result: BridgeResult | null;
  onReset: () => void;
  network?: 'mainnet' | 'testnet';
}

const statusConfig = {
  idle: { text: 'Ready', color: 'text-gray-400' },
  approving: { text: 'Approving USDC...', color: 'text-yellow-400' },
  bridging: { text: 'Bridging to Stacks...', color: 'text-blue-400' },
  success: { text: 'Bridge Complete!', color: 'text-green-400' },
  error: { text: 'Bridge Failed', color: 'text-red-400' },
};

export function StatusPanel({ status, result, onReset, amount, network = 'mainnet' }: StatusPanelProps) {
  const config = statusConfig[status];
  const [showCelebration, setShowCelebration] = useState(false);

  return (
    <>
      <SuccessCelebration
        show={status === 'success' && !showCelebration}
        amount={amount}
        txHash={result?.stacksTxId}
        network={network}
        onComplete={() => setShowCelebration(true)}
      />
      
      <div className="bg-card rounded-xl p-6 border border-gray-800">
        <div className="text-center">
          {status === 'approving' || status === 'bridging' ? (
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          ) : status === 'success' ? (
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">✓</span>
            </div>
          ) : null}

          <h3 className={`text-xl font-semibold ${config.color} mb-2`}>{config.text}</h3>

          {status === 'approving' && (
            <p className="text-gray-400 text-sm">Please confirm the approval in your wallet</p>
          )}

          {status === 'bridging' && (
            <p className="text-gray-400 text-sm">Please confirm the bridge transaction</p>
          )}

          {status === 'success' && result && (
            <div className="mt-4 space-y-4">
              <p className="text-gray-400 text-sm">
                Your USDCx will arrive on Stacks in ~15 minutes
              </p>
              
              {result.bridgeHash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${result.bridgeHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-indigo-400 hover:text-indigo-300 text-sm underline"
                >
                  View on Etherscan →
                </a>
              )}

              <div className="flex flex-col gap-3 pt-2">
                <ShareButton amount={amount} txHash={result.bridgeHash} />
                <button
                  onClick={onReset}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Bridge Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
