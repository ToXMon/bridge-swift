import type { Address, Hash, PublicClient, WalletClient } from 'viem';
import { BRIDGE_CONFIG, ERC20_ABI, X_RESERVE_ABI, getNetworkConfig } from './contracts';
import { encodeStacksRecipient } from './encoding';

export interface BridgeParams {
  amount: bigint;
  stacksRecipient: string;
  account: Address;
  chainId: number;
}

export interface BridgeResult {
  approvalHash?: Hash;
  bridgeHash: Hash;
}

export async function getUSDCBalance(
  address: Address,
  publicClient: PublicClient,
  chainId: number
): Promise<bigint> {
  const config = getNetworkConfig(chainId);
  return publicClient.readContract({
    address: config.USDC,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
  });
}

export async function getAllowance(
  owner: Address,
  publicClient: PublicClient,
  chainId: number
): Promise<bigint> {
  const config = getNetworkConfig(chainId);
  return publicClient.readContract({
    address: config.USDC,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [owner, config.X_RESERVE],
  });
}

export async function approveUSDC(
  amount: bigint,
  account: Address,
  walletClient: WalletClient,
  chainId: number
): Promise<Hash> {
  const config = getNetworkConfig(chainId);
  return walletClient.writeContract({
    address: config.USDC,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [config.X_RESERVE, amount],
    account,
    chain: walletClient.chain,
    gas: 100_000n,
  });
}

export async function executeBridge(
  params: BridgeParams,
  walletClient: WalletClient
): Promise<Hash> {
  const { amount, stacksRecipient, account, chainId } = params;
  const config = getNetworkConfig(chainId);
  const remoteRecipient = encodeStacksRecipient(stacksRecipient);

  return walletClient.writeContract({
    address: config.X_RESERVE,
    abi: X_RESERVE_ABI,
    functionName: 'depositToRemote',
    args: [
      amount,
      config.STACKS_DOMAIN,
      remoteRecipient,
      config.USDC,
      BRIDGE_CONFIG.BRIDGE_FEE_USDC,
      BRIDGE_CONFIG.HOOK_DATA,
    ],
    account,
    chain: walletClient.chain,
    gas: 500_000n,
  });
}

export async function bridgeUSDCToStacks(
  params: BridgeParams,
  publicClient: PublicClient,
  walletClient: WalletClient
): Promise<BridgeResult> {
  const { amount, account, chainId } = params;

  const allowance = await getAllowance(account, publicClient, chainId);
  let approvalHash: Hash | undefined;

  if (allowance < amount) {
    approvalHash = await approveUSDC(amount, account, walletClient, chainId);
    await publicClient.waitForTransactionReceipt({ hash: approvalHash });
  }

  const bridgeHash = await executeBridge(params, walletClient);

  return { approvalHash, bridgeHash };
}

export function formatUSDC(amount: bigint): string {
  return (Number(amount) / 1_000_000).toFixed(2);
}

export function parseUSDC(amount: string): bigint {
  const parsed = parseFloat(amount);
  if (isNaN(parsed) || parsed < 0) return 0n;
  return BigInt(Math.floor(parsed * 1_000_000));
}
