'use client';

import { useChainId } from 'wagmi';
import { getNetworkName } from '@/lib/contracts';

export function NetworkStatus() {
  const chainId = useChainId();
  const networkName = getNetworkName(chainId);
  
  return (
    <div className="glass-panel rounded-2xl px-4 py-2 text-center text-xs text-gray-200/80">
      <span className="font-semibold">Network Health</span>
      <span className="ml-2">
        {networkName}: <span className="text-emerald-400">Good</span> ●
      </span>
      <span className="ml-2">
        Stacks: <span className="text-emerald-400">Normal</span> ●
      </span>
      <span className="ml-2">
        Bridge Congestion: <span className="text-emerald-400">Low</span>
      </span>
    </div>
  );
}
