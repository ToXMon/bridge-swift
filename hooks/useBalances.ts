'use client';

import { useAccount, useBalance, usePublicClient, useChainId } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http } from 'viem';
import { mainnet, arbitrum, optimism, base, polygon, avalanche, sepolia } from 'viem/chains';
import { ERC20_ABI, getNetworkConfig } from '@/lib/contracts';

// Reliable public RPC endpoints
const RPC_URLS: Record<number, string> = {
  1: 'https://eth.llamarpc.com',
  42161: 'https://arb1.arbitrum.io/rpc',
  10: 'https://mainnet.optimism.io',
  8453: 'https://mainnet.base.org',
  137: 'https://polygon-rpc.com',
  43114: 'https://api.avax.network/ext/bc/C/rpc',
  11155111: 'https://rpc.sepolia.org',
};

const CHAINS: Record<number, any> = {
  1: mainnet,
  42161: arbitrum,
  10: optimism,
  8453: base,
  137: polygon,
  43114: avalanche,
  11155111: sepolia,
};

function createClientForChain(chainId: number) {
  const chain = CHAINS[chainId] || sepolia;
  const rpcUrl = RPC_URLS[chainId];
  return createPublicClient({
    chain,
    transport: http(rpcUrl, { timeout: 10_000 }),
  });
}

export function useBalances() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();

  const { data: ethBalance } = useBalance({ address });

  const { data: usdcBalance, isLoading: usdcLoading, error } = useQuery({
    queryKey: ['usdcBalance', address, chainId],
    queryFn: async () => {
      if (!address) return 0n;
      const config = getNetworkConfig(chainId);
      
      // Try wagmi client first, fall back to dedicated client
      try {
        if (publicClient) {
          return await publicClient.readContract({
            address: config.USDC,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address],
          });
        }
      } catch (err) {
        console.warn('Primary RPC failed, trying fallback:', err);
      }
      
      // Fallback to dedicated client with reliable RPC
      const fallbackClient = createClientForChain(chainId);
      return fallbackClient.readContract({
        address: config.USDC,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      });
    },
    enabled: !!address,
    refetchInterval: 15000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 10000,
  });

  return {
    ethBalance: ethBalance?.value ?? 0n,
    ethFormatted: ethBalance?.formatted ?? '0',
    usdcBalance: usdcBalance ?? 0n,
    usdcFormatted: usdcBalance ? (Number(usdcBalance) / 1_000_000).toFixed(2) : '0.00',
    isLoading: usdcLoading,
    error,
  };
}
