'use client';

import { Address } from 'viem';
import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http } from 'viem';
import { mainnet, arbitrum, optimism, base, polygon, avalanche, sepolia } from 'viem/chains';
import { ERC20_ABI, NETWORK_CONFIGS } from '@/lib/contracts';

// Helper function to get all chain configs
function getAllChainConfigs() {
  return [
    NETWORK_CONFIGS.ethereum,
    NETWORK_CONFIGS.arbitrum,
    NETWORK_CONFIGS.optimism,
    NETWORK_CONFIGS.base,
    NETWORK_CONFIGS.polygon,
    NETWORK_CONFIGS.avalanche,
  ];
}

// Public RPC endpoints for each chain (fallback to reliable public RPCs)
const RPC_URLS: Record<number, string> = {
  1: 'https://eth.llamarpc.com',
  42161: 'https://arb1.arbitrum.io/rpc',
  10: 'https://mainnet.optimism.io',
  8453: 'https://mainnet.base.org',
  137: 'https://polygon-rpc.com',
  43114: 'https://api.avax.network/ext/bc/C/rpc',
  11155111: 'https://rpc.sepolia.org',
};

// Helper function to create clients for all chains
function createClientsForChains(chainConfigs: typeof NETWORK_CONFIGS[keyof typeof NETWORK_CONFIGS][]) {
  const clients: Record<number, any> = {};
  
  chainConfigs.forEach(config => {
    let chain;
    switch (config.CHAIN_ID) {
      case 1:
        chain = mainnet;
        break;
      case 42161:
        chain = arbitrum;
        break;
      case 10:
        chain = optimism;
        break;
      case 8453:
        chain = base;
        break;
      case 137:
        chain = polygon;
        break;
      case 43114:
        chain = avalanche;
        break;
      default:
        chain = sepolia;
    }
    
    const rpcUrl = RPC_URLS[config.CHAIN_ID];
    clients[config.CHAIN_ID] = createPublicClient({
      chain,
      transport: http(rpcUrl, { timeout: 10_000 }),
    });
  });
  
  return clients;
}

// Main hook for fetching multi-chain balances
export function useMultiChainBalances(address: Address | undefined) {
  return useQuery({
    queryKey: ['multiChainBalances', address],
    queryFn: async () => {
      if (!address) return new Map();

      const chainConfigs = getAllChainConfigs();
      const clients = createClientsForChains(chainConfigs);

      // Parallel fetch all balances
      const results = await Promise.all(
        chainConfigs.map(async (config) => {
          try {
            const balance = await clients[config.CHAIN_ID].readContract({
              address: config.USDC,
              abi: ERC20_ABI,
              functionName: 'balanceOf',
              args: [address],
            });
            return [config.CHAIN_ID, balance] as [number, bigint];
          } catch (error) {
            console.warn(`Failed to fetch balance for chain ${config.CHAIN_ID}:`, error);
            return [config.CHAIN_ID, 0n] as [number, bigint];
          }
        })
      );

      return new Map(results);
    },
    staleTime: 30_000, // 30 seconds cache
    refetchInterval: 60_000, // Refresh every minute
    enabled: !!address,
  });
}

// Helper function to get formatted balance for a specific chain
export function useFormattedMultiChainBalance(address: Address | undefined, chainId: number) {
  const { data: balances } = useMultiChainBalances(address);
  
  if (!balances) {
    return {
      balance: 0n,
      formatted: '0.00',
    };
  }
  
  const balance = balances.get(chainId) || 0n;
  const formatted = balance ? (Number(balance) / 1_000_000).toFixed(2) : '0.00';
  
  return {
    balance,
    formatted,
  };
}

// Helper function to get total balance across all chains
export function useTotalMultiChainBalance(address: Address | undefined) {
  const { data: balances } = useMultiChainBalances(address);
  
  if (!balances) {
    return {
      totalBalance: 0n,
      totalFormatted: '0.00',
      chainCount: 0,
    };
  }
  
  let totalBalance = 0n;
  let chainCount = 0;
  
  balances.forEach((balance) => {
    if (balance > 0n) {
      totalBalance += balance;
      chainCount++;
    }
  });
  
  const totalFormatted = totalBalance ? (Number(totalBalance) / 1_000_000).toFixed(2) : '0.00';
  
  return {
    totalBalance,
    totalFormatted,
    chainCount,
  };
}
