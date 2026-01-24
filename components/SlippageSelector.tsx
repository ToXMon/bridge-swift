'use client';

import { formatUSDC } from '@/lib/bridge';

interface SlippageSelectorProps {
  slippage: number;
  setSlippage: (value: number) => void;
  amount: bigint;
  calculateMinAmountOut: (amount: bigint) => bigint;
  disabled?: boolean;
}

export function SlippageSelector({ 
  slippage, 
  setSlippage, 
  amount,
  calculateMinAmountOut,
  disabled = false 
}: SlippageSelectorProps) {
  const minAmountOut = calculateMinAmountOut(amount);

  return (
    <div className="slippage-selector space-y-2">
      <label className="block text-sm text-gray-300">Slippage Protection</label>
      <div className="flex gap-2 flex-wrap">
        {[0.1, 0.5, 1.0].map((pct) => {
          const bps = pct * 100;
          const isActive = slippage === bps;
          
          return (
            <button
              key={pct}
              type="button"
              onClick={() => setSlippage(bps)}
              disabled={disabled}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-black/40 text-gray-300 border border-white/10 hover:bg-blue-600/20 hover:border-blue-400/30'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {pct}%
            </button>
          );
        })}
        <input
          type="number"
          value={slippage / 100}
          onChange={(e) => {
            const value = Number(e.target.value) * 100;
            if (value >= 10 && value <= 100) {
              setSlippage(value);
            }
          }}
          step="0.1"
          min="0.1"
          max="1.0"
          disabled={disabled}
          className="w-20 px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/70 disabled:opacity-50"
          placeholder="Custom"
        />
      </div>
      {amount > 0n && (
        <p className="text-xs text-gray-400">
          You'll receive at least <span className="text-green-400 font-mono">{formatUSDC(minAmountOut)} USDCx</span>
        </p>
      )}
    </div>
  );
}
