'use client';

import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useBridge } from '@/hooks/useBridge';
import { useBalances } from '@/hooks/useBalances';
import { isXReserveSupported, getNetworkName, getNetworkConfig } from '@/lib/contracts';
import { validateStacksAddressForNetwork, detectStacksNetwork } from '@/lib/encoding';
import { parseUSDC } from '@/lib/bridge';
import { StatusPanel } from './StatusPanel';
import { SlippageSelector } from './SlippageSelector';
import { TrustBadges } from './TrustBadges';
import { TransactionHistory } from './TransactionHistory';
import { LiveFeeDisplay } from './LiveFeeDisplay';

export function BridgeForm() {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const { isConnected } = useAccount();
  const chainId = useChainId();
  
  // Determine the current Stacks network based on the EVM chain
  const currentNetwork = getNetworkConfig(chainId).STACKS_NETWORK;
  
  const { usdcFormatted, usdcBalance } = useBalances();
  
  // Check if current chain supports xReserve for Stacks bridging
  const isChainSupported = isXReserveSupported(chainId);
  const currentChainName = getNetworkName(chainId);
  const { status, error, result, executeBridge, reset, slippage, setSlippage, calculateMinAmountOut } = useBridge();

  const MAX_BRIDGE_AMOUNT = 1000;
  const parsedAmount = parseFloat(amount);
  const isValidAmount = parsedAmount >= 10 && parsedAmount <= MAX_BRIDGE_AMOUNT;
  
  // Network-specific validation
  const addressValidation = recipient ? validateStacksAddressForNetwork(recipient, currentNetwork) : { valid: false };
  const detectedNetwork = recipient ? detectStacksNetwork(recipient) : null;
  const isValidRecipient = addressValidation.valid;
  
  const canSubmit = isConnected && isChainSupported && isValidAmount && isValidRecipient && status === 'idle';

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
    return <StatusPanel status={status} result={result} onReset={reset} amount={amount} network={detectedNetwork || currentNetwork} />;
  }

  return (
    <>
      <div className="rounded-3xl p-[1px] bg-gradient-to-b from-cyan-400/80 via-purple-500/70 to-fuchsia-500/80">
        <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-6">Bridge USDC to Stacks</h2>

        {!isChainSupported && isConnected && (
          <div className="mb-4 p-4 bg-amber-900/30 border border-amber-600/50 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-amber-300 font-semibold text-sm">Unsupported Network: {currentChainName}</p>
                <p className="text-amber-200/80 text-xs mt-1">
                  Circle xReserve for Stacks bridging is only available on <strong>Ethereum mainnet</strong>. 
                  Please switch your wallet to Ethereum, or first bridge your USDC from {currentChainName} to Ethereum.
                </p>
                <a 
                  href="https://superbridge.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 mt-2"
                >
                  Bridge {currentChainName} → Ethereum via Superbridge ↗
                </a>
              </div>
            </div>
          </div>
        )}

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
            {amount && parsedAmount < 10 && (
              <p className="text-red-400 text-xs mt-1">Minimum amount is 10 USDC (required by Circle xReserve)</p>
            )}
            {amount && parsedAmount > MAX_BRIDGE_AMOUNT && (
              <p className="text-red-400 text-xs mt-1">Maximum amount is ${MAX_BRIDGE_AMOUNT} USDC per transaction (security limit to protect your funds)</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-gray-300">Stacks Recipient Address</label>
              {detectedNetwork && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  detectedNetwork === 'mainnet' 
                    ? 'bg-green-900/30 text-green-400 border border-green-700/50' 
                    : 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/50'
                }`}>
                  {detectedNetwork === 'mainnet' ? '🟢 Mainnet' : '🟡 Testnet'}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="SP... (mainnet) or ST... (testnet)"
                className={`w-full bg-black/40 border rounded-xl px-3 sm:px-4 py-3 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 mono-text text-xs sm:text-sm ${
                  recipient && isValidRecipient
                    ? 'border-green-500/50 focus:ring-green-400/70'
                    : recipient && !isValidRecipient
                    ? 'border-red-500/50 focus:ring-red-400/70'
                    : 'border-white/10 focus:ring-sky-400/70'
                }`}
              />
              {recipient && isValidRecipient && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            {recipient && !isValidRecipient && addressValidation.reason && (
              <div className="mt-2 p-2 bg-red-900/20 border border-red-800/50 rounded-lg">
                <p className="text-red-400 text-xs">{addressValidation.reason}</p>
              </div>
            )}
            {recipient && isValidRecipient && detectedNetwork && (
              <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Valid {detectedNetwork} address
              </p>
            )}
          </div>

          <SlippageSelector
            slippage={slippage}
            setSlippage={setSlippage}
            amount={parseUSDC(amount)}
            calculateMinAmountOut={calculateMinAmountOut}
            disabled={status !== 'idle'}
          />

          <LiveFeeDisplay amount={parseUSDC(amount)} />

          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <TrustBadges network={currentNetwork} className="mb-4" />

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 hover:from-cyan-300 hover:via-blue-400 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-cyan-500/20"
          >
            {!isConnected ? 'Connect Wallet' : !isChainSupported ? `Switch to Ethereum` : 'Bridge to Stacks'}
          </button>
        </div>
        </form>
      </div>
      
      <TransactionHistory />
    </>
  );
}
