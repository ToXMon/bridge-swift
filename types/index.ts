import type { Address, Hash } from 'viem';

export type BridgeStatus = 'idle' | 'approving' | 'bridging' | 'success' | 'error';

export interface BridgeParams {
  amount: bigint;
  stacksRecipient: string;
  account: Address;
}

export interface BridgeResult {
  approvalHash?: Hash;
  bridgeHash: Hash;
}

export interface LeaderboardEntry {
  address: string;
  amount: number;
  rank?: number;
}

export interface BalanceData {
  ethBalance: bigint;
  ethFormatted: string;
  usdcBalance: bigint;
  usdcFormatted: string;
  isLoading: boolean;
}
