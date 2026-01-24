'use client';

import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { base, arbitrum, optimism, mainnet, sepolia } from 'viem/chains';
import { NETWORK_CONFIGS } from '@/lib/contracts';

export interface LeaderboardEntry {
  address: string;
  totalBridged: bigint;
  transactionCount: number;
  lastBridgeTimestamp: number;
}

const DEPOSIT_EVENT = parseAbiItem(
  'event DepositToRemote(address indexed sender, uint256 value, uint32 remoteDomain, bytes32 remoteRecipient, address localToken)'
);

// Reliable public RPC endpoints
const RPC_URLS: Record<number, string> = {
  [mainnet.id]: 'https://eth.llamarpc.com',
  [base.id]: 'https://mainnet.base.org',
  [arbitrum.id]: 'https://arb1.arbitrum.io/rpc',
  [optimism.id]: 'https://mainnet.optimism.io',
  [sepolia.id]: 'https://rpc.sepolia.org',
};

// Create clients for each supported chain with reliable RPCs
const clients = {
  [mainnet.id]: createPublicClient({ chain: mainnet, transport: http(RPC_URLS[mainnet.id], { timeout: 15_000 }) }),
  [base.id]: createPublicClient({ chain: base, transport: http(RPC_URLS[base.id], { timeout: 15_000 }) }),
  [arbitrum.id]: createPublicClient({ chain: arbitrum, transport: http(RPC_URLS[arbitrum.id], { timeout: 15_000 }) }),
  [optimism.id]: createPublicClient({ chain: optimism, transport: http(RPC_URLS[optimism.id], { timeout: 15_000 }) }),
  [sepolia.id]: createPublicClient({ chain: sepolia, transport: http(RPC_URLS[sepolia.id], { timeout: 15_000 }) }),
};

async function fetchBridgeEvents(chainId: number, xReserveAddress: `0x${string}`, fromBlock: bigint) {
  const client = clients[chainId as keyof typeof clients];
  if (!client) return [];

  try {
    const logs = await client.getLogs({
      address: xReserveAddress,
      event: DEPOSIT_EVENT,
      fromBlock,
      toBlock: 'latest',
    });

    return logs.map((log) => ({
      sender: log.args.sender as string,
      value: log.args.value as bigint,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      chainId,
    }));
  } catch (error) {
    console.warn(`Failed to fetch events from chain ${chainId}:`, error);
    return [];
  }
}

async function fetchAllBridgeEvents(): Promise<LeaderboardEntry[]> {
  // Calculate block from ~30 days ago (assuming ~12s blocks for Ethereum, faster for L2s)
  const blocksPerDay = {
    [mainnet.id]: 7200n,      // ~12s blocks
    [base.id]: 43200n,        // ~2s blocks
    [arbitrum.id]: 345600n,   // ~0.25s blocks
    [optimism.id]: 43200n,    // ~2s blocks
    [sepolia.id]: 7200n,      // ~12s blocks
  };

  const configs = [
    { chainId: mainnet.id, address: NETWORK_CONFIGS.ethereum.X_RESERVE as `0x${string}`, blocksBack: blocksPerDay[mainnet.id] * 30n },
    { chainId: base.id, address: NETWORK_CONFIGS.base.X_RESERVE as `0x${string}`, blocksBack: blocksPerDay[base.id] * 30n },
    { chainId: arbitrum.id, address: NETWORK_CONFIGS.arbitrum.X_RESERVE as `0x${string}`, blocksBack: blocksPerDay[arbitrum.id] * 30n },
    { chainId: optimism.id, address: NETWORK_CONFIGS.optimism.X_RESERVE as `0x${string}`, blocksBack: blocksPerDay[optimism.id] * 30n },
    { chainId: sepolia.id, address: NETWORK_CONFIGS.sepolia.X_RESERVE as `0x${string}`, blocksBack: blocksPerDay[sepolia.id] * 30n },
  ];

  // Fetch current block numbers and events in parallel
  const results = await Promise.all(
    configs.map(async ({ chainId, address, blocksBack }) => {
      const client = clients[chainId as keyof typeof clients];
      if (!client) return [];
      
      try {
        const currentBlock = await client.getBlockNumber();
        const fromBlock = currentBlock > blocksBack ? currentBlock - blocksBack : 0n;
        return fetchBridgeEvents(chainId, address, fromBlock);
      } catch (error) {
        console.warn(`Failed to get block number for chain ${chainId}:`, error);
        return [];
      }
    })
  );

  // Flatten all events
  const allEvents = results.flat();

  // Aggregate by sender address
  const aggregated = new Map<string, { totalBridged: bigint; transactionCount: number; lastBlock: bigint }>();

  for (const event of allEvents) {
    const existing = aggregated.get(event.sender.toLowerCase());
    if (existing) {
      existing.totalBridged += event.value;
      existing.transactionCount += 1;
      if (event.blockNumber > existing.lastBlock) {
        existing.lastBlock = event.blockNumber;
      }
    } else {
      aggregated.set(event.sender.toLowerCase(), {
        totalBridged: event.value,
        transactionCount: 1,
        lastBlock: event.blockNumber,
      });
    }
  }

  // Convert to array and sort by total bridged
  const leaderboard: LeaderboardEntry[] = Array.from(aggregated.entries())
    .map(([address, data]) => ({
      address,
      totalBridged: data.totalBridged,
      transactionCount: data.transactionCount,
      lastBridgeTimestamp: Number(data.lastBlock), // Using block number as timestamp proxy
    }))
    .sort((a, b) => (b.totalBridged > a.totalBridged ? 1 : -1))
    .slice(0, 10); // Top 10

  return leaderboard;
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchAllBridgeEvents,
    staleTime: 60_000, // 1 minute cache
    refetchInterval: 120_000, // Refresh every 2 minutes
    retry: 2,
  });
}

export function formatBridgedAmount(amount: bigint): string {
  const value = Number(amount) / 1_000_000; // USDC has 6 decimals
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}
