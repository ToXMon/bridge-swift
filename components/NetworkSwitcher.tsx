'use client';

import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { mainnet, sepolia, arbitrum, optimism, base, polygon, avalanche } from 'wagmi/chains';
import { getNetworkConfig, isMainnet as checkIsMainnet } from '@/lib/contracts';

const MAINNET_CHAINS = [
  { chain: mainnet, name: 'Ethereum', icon: '⟠', color: 'from-blue-500 to-purple-500' },
  { chain: arbitrum, name: 'Arbitrum', icon: '🔵', color: 'from-blue-400 to-blue-600' },
  { chain: optimism, name: 'Optimism', icon: '🔴', color: 'from-red-400 to-red-600' },
  { chain: base, name: 'Base', icon: '🔷', color: 'from-blue-500 to-indigo-600' },
  { chain: polygon, name: 'Polygon', icon: '🟣', color: 'from-purple-500 to-purple-700' },
  { chain: avalanche, name: 'Avalanche', icon: '🔺', color: 'from-red-500 to-pink-600' },
];

export function NetworkSwitcher() {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  const isTestnet = chainId === sepolia.id;
  const isSupported = checkIsMainnet(chainId) || isTestnet;
  const currentNetwork = isSupported ? getNetworkConfig(chainId).NAME : 'Unsupported';

  if (!isConnected) {
    return null;
  }

  return (
    <div className="glass-panel rounded-xl px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Select Source Chain</h3>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${isSupported ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className="text-xs text-gray-300">{currentNetwork}</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <p className="text-xs text-gray-400 mb-2 font-medium">Mainnet (Real USDC)</p>
          <div className="grid grid-cols-3 gap-2">
            {MAINNET_CHAINS.map(({ chain, name, icon }) => {
              const isActive = chainId === chain.id;
              return (
                <button
                  key={chain.id}
                  onClick={() => switchChain({ chainId: chain.id })}
                  disabled={isActive}
                  className={`px-3 py-2.5 rounded-lg font-medium text-xs transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/30'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-base">{icon}</span>
                    <span className="text-[10px] leading-tight">{name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-2 font-medium">Testnet (Test USDC)</p>
          <button
            onClick={() => switchChain({ chainId: sepolia.id })}
            disabled={isTestnet}
            className={`w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
              isTestnet
                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/30'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>🧪</span>
              <span>Sepolia Testnet</span>
            </div>
          </button>
        </div>
      </div>

      {!isSupported && (
        <div className="mt-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-xs text-amber-300">
            ⚠️ Please switch to a supported network
          </p>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-white/5">
        <p className="text-[10px] text-gray-500 text-center">
          Bridge USDC from any chain to Stacks via Circle CCTP
        </p>
      </div>
    </div>
  );
}
