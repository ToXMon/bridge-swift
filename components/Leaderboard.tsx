'use client';

import { truncateAddress } from '@/lib/encoding';
import { useLeaderboard, formatBridgedAmount } from '@/hooks/useLeaderboard';

export function Leaderboard() {
  const { data: leaderboard, isLoading, error } = useLeaderboard();

  return (
    <div className="rounded-3xl p-[1px] bg-gradient-to-r from-cyan-400/60 via-purple-500/60 to-blue-500/60">
      <div className="glass-panel rounded-3xl p-6">
        <div className="flex items-start gap-4">
          <div className="text-3xl">🏆</div>
          <div>
            <h3 className="text-lg font-semibold text-white">Top Bridgers</h3>
            <p className="text-sm text-gray-400">
              {isLoading ? 'Loading real-time data...' : 'Live bridge transactions from testnet/mainnet'}
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-sm w-4">{index + 1}.</span>
                  <div className="h-4 w-32 bg-gray-700 rounded" />
                </div>
                <div className="h-4 w-16 bg-gray-700 rounded" />
              </div>
            ))
          ) : error ? (
            <p className="text-gray-400 text-sm text-center py-4">
              Unable to load leaderboard. Please try again later.
            </p>
          ) : leaderboard && leaderboard.length > 0 ? (
            leaderboard.map((entry, index) => (
              <div key={entry.address} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-sm w-4 ${index < 3 ? 'text-amber-400 font-bold' : 'text-gray-500'}`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                  </span>
                  <span className="text-gray-300 mono-text text-sm">
                    {truncateAddress(entry.address, 6)}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({entry.transactionCount} txs)
                  </span>
                </div>
                <span className="text-amber-300 mono-text text-sm font-medium">
                  {formatBridgedAmount(entry.totalBridged)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">
              No bridge transactions found yet. Be the first to bridge!
            </p>
          )}
        </div>
        {!isLoading && !error && leaderboard && leaderboard.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="text-xs text-gray-500 text-center">
              🔄 Updates every 2 minutes • Data from Ethereum, Base, Arbitrum, Optimism
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
