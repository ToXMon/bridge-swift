'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useBridge } from '@/hooks/useBridge';
import { useBalances } from '@/hooks/useBalances';
import { isValidStacksAddress } from '@/lib/encoding';
import { StatusPanel } from './StatusPanel';

export function BridgeForm() {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const { isConnected } = useAccount();
  const { usdcFormatted, usdcBalance } = useBalances();
  const { status, error, result, executeBridge, reset } = useBridge();

  const isValidAmount = parseFloat(amount) >= 10;
  const isValidRecipient = isValidStacksAddress(recipient);
  const canSubmit = isConnected && isValidAmount && isValidRecipient && status === 'idle';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await executeBridge(amount, recipient);
  };

  const handleMax = () => {
    const maxAmount = Number(usdcBalance) / 1_000_000;
    setAmount(maxAmount.toString());
  };

  if (status !== 'idle' && status !== 'error') {
    return <StatusPanel status={status} result={result} onReset={reset} amount={amount} />;
  }

  return (
    <div className="rounded-3xl p-[1px] bg-gradient-to-b from-cyan-400/80 via-purple-500/70 to-fuchsia-500/80">
      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-6">Bridge USDC to Stacks</h2>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-300">Amount (USDC)</label>
              <button
                type="button"
                onClick={handleMax}
                className="text-xs text-sky-300 hover:text-sky-200"
              >
                Max: {usdcFormatted}
              </button>
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount (min 10 USDC)"
              min="10"
              step="0.01"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400/70"
            />
            {amount && !isValidAmount && (
              <p className="text-red-400 text-xs mt-1">Minimum amount is 10 USDC (required by Circle xReserve)</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Stacks Recipient Address</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="ST... or SP..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 sm:px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400/70 mono-text text-xs sm:text-sm"
            />
            {recipient && !isValidRecipient && (
              <p className="text-red-400 text-xs mt-1">Invalid Stacks address</p>
            )}
          </div>

          <div className="bg-black/40 rounded-xl p-4 text-sm border border-white/5">
            <div className="flex justify-between text-gray-300">
              <span>Bridge Fee</span>
              <span>~$4.80 USDC</span>
            </div>
            <div className="flex justify-between text-gray-300 mt-1">
              <span>Estimated Time</span>
              <span>~15 minutes</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 hover:from-cyan-300 hover:via-blue-400 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-cyan-500/20"
          >
            {!isConnected ? 'Connect Wallet' : 'Bridge to Stacks'}
          </button>
        </div>
      </form>
    </div>
  );
}
