import type { Address, Hash, PublicClient, WalletClient } from 'viem';
import { BRIDGE_CONFIG, ERC20_ABI, X_RESERVE_ABI, getNetworkConfig } from './contracts';
import { encodeStacksRecipient } from './encoding';
import { getOptimizedFeeData } from './fees';

const MAX_APPROVAL = 1_000_000_000n; // $1000 max per transaction (6 decimals)

export interface BridgeParams {
  amount: bigint;
  stacksRecipient: string;
  account: Address;
  chainId: number;
  minAmountOut?: bigint;
}

export interface BridgeResult {
  approvalHash?: Hash;
  bridgeHash: Hash;
  stacksTxId?: string;
  network?: 'mainnet' | 'testnet';
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
  publicClient: PublicClient,
  chainId: number
): Promise<Hash> {
  const config = getNetworkConfig(chainId);

  // Apply max approval cap
  const approvalAmount = amount > MAX_APPROVAL ? MAX_APPROVAL : amount;

  // Reset existing approval if needed (security best practice)
  const currentAllowance = await getAllowance(account, publicClient, chainId);
  if (currentAllowance > 0n) {
    // Get optimized EIP-1559 fee data for faster confirmation
    const resetFeeData = await getOptimizedFeeData(publicClient, chainId);
    
    const resetHash = await walletClient.writeContract({
      address: config.USDC,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [config.X_RESERVE, 0n],
      account,
      chain: walletClient.chain,
      gas: 150_000n, // Slightly higher for two-step
      maxFeePerGas: resetFeeData.maxFeePerGas,
      maxPriorityFeePerGas: resetFeeData.maxPriorityFeePerGas,
    });
    await publicClient.waitForTransactionReceipt({ hash: resetHash });
  }

  // Estimate gas for approval
  let approvalGas: bigint;
  try {
    const estimate = await publicClient.estimateContractGas({
      address: config.USDC,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [config.X_RESERVE, approvalAmount],
      account,
    });
    approvalGas = estimate * 120n / 100n; // 20% buffer
  } catch (error) {
    console.warn('Gas estimation failed for approval, using fallback:', error);
    approvalGas = 150_000n; // Fallback for approval
  }

  // Get optimized EIP-1559 fee data for faster confirmation
  const feeData = await getOptimizedFeeData(publicClient, chainId);

  return walletClient.writeContract({
    address: config.USDC,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [config.X_RESERVE, approvalAmount],
    account,
    chain: walletClient.chain,
    gas: approvalGas,
    maxFeePerGas: feeData.maxFeePerGas,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
  });
}

export async function estimateBridgeGas(
  publicClient: PublicClient,
  params: BridgeParams
): Promise<bigint> {
  const config = getNetworkConfig(params.chainId);
  const remoteRecipient = encodeStacksRecipient(params.stacksRecipient);

  try {
    const estimate = await publicClient.estimateContractGas({
      address: config.X_RESERVE,
      abi: X_RESERVE_ABI,
      functionName: 'depositToRemote',
      args: [
        params.amount,
        config.STACKS_DOMAIN,
        remoteRecipient,
        config.USDC,
        BRIDGE_CONFIG.BRIDGE_FEE_USDC,
        BRIDGE_CONFIG.HOOK_DATA,
      ],
      account: params.account,
    });

    // Add 20% buffer for safety
    return estimate * 120n / 100n;
  } catch (error) {
    console.warn('Gas estimation failed, using fallback:', error);
    // Fallback to conservative estimate
    return 500_000n;
  }
}

export async function executeBridge(
  params: BridgeParams,
  walletClient: WalletClient,
  publicClient: PublicClient
): Promise<Hash> {
  const { amount, stacksRecipient, account, chainId } = params;
  const config = getNetworkConfig(chainId);
  const remoteRecipient = encodeStacksRecipient(stacksRecipient);

  // Estimate gas for bridge transaction
  const estimatedGas = await estimateBridgeGas(publicClient, params);

  // Get optimized EIP-1559 fee data for faster confirmation
  const feeData = await getOptimizedFeeData(publicClient, chainId);

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
    gas: estimatedGas,
    maxFeePerGas: feeData.maxFeePerGas,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
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
    approvalHash = await approveUSDC(amount, account, walletClient, publicClient, chainId);
    await publicClient.waitForTransactionReceipt({ hash: approvalHash });
  }

  const bridgeHash = await executeBridge(params, walletClient, publicClient);

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
