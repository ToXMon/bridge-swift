'use client';

import { useAccount, useBalance, usePublicClient, useChainId } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { ERC20_ABI, getNetworkConfig } from '@/lib/contracts';

export function useBalances() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();

  const { data: ethBalance } = useBalance({ address });

  const { data: usdcBalance, isLoading: usdcLoading } = useQuery({
    queryKey: ['usdcBalance', address, chainId],
    queryFn: async () => {
      if (!address || !publicClient) return 0n;
      const config = getNetworkConfig(chainId);
      return publicClient.readContract({
        address: config.USDC,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      });
    },
    enabled: !!address && !!publicClient,
    refetchInterval: 10000,
  });

  return {
    ethBalance: ethBalance?.value ?? 0n,
    ethFormatted: ethBalance?.formatted ?? '0',
    usdcBalance: usdcBalance ?? 0n,
    usdcFormatted: usdcBalance ? (Number(usdcBalance) / 1_000_000).toFixed(2) : '0.00',
    isLoading: usdcLoading,
  };
}
