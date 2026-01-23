'use client';

import { truncateAddress } from '@/lib/encoding';

const MOCK_LEADERBOARD = [
  { address: 'ST1PQHQKVORJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', amount: 15000 },
  { address: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG', amount: 8500 },
  { address: 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC', amount: 5200 },
  { address: 'ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND', amount: 3100 },
  { address: 'ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB', amount: 1800 },
];

export function Leaderboard() {
  return (
    <div className="rounded-3xl p-[1px] bg-gradient-to-r from-cyan-400/60 via-purple-500/60 to-blue-500/60">
      <div className="glass-panel rounded-3xl p-6">
        <div className="flex items-start gap-4">
          <div className="text-3xl">🏆</div>
          <div>
            <h3 className="text-lg font-semibold text-white">Top Bridgers</h3>
            <p className="text-sm text-gray-400">Bridge USDC to climb the leaderboard!</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {MOCK_LEADERBOARD.map((entry, index) => (
            <div key={entry.address} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-sm w-4">{index + 1}.</span>
                <span className="text-gray-300 mono-text text-sm">
                  {truncateAddress(entry.address, 6)}
                </span>
              </div>
              <span className="text-amber-300 mono-text text-sm">
                ${entry.amount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
