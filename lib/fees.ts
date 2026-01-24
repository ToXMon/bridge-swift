import type { PublicClient } from 'viem';

export interface FeeData {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

/**
 * Get optimized EIP-1559 fee data for faster transaction confirmation.
 * 
 * For L2 chains (Base, Arbitrum, Optimism, Sepolia):
 * - Adds 50% priority fee tip for sub-3s confirmations
 * - Uses 10% max fee multiplier for cost efficiency
 * 
 * For L1 chains:
 * - Uses 20% priority fee multiplier for standard confirmation
 * - Uses 15% max fee multiplier for reliability
 * 
 * @param publicClient - Viem public client for fee estimation
 * @param chainId - Chain ID to determine fee optimization strategy
 * @returns Optimized fee data with maxFeePerGas and maxPriorityFeePerGas
 */
export async function getOptimizedFeeData(
  publicClient: PublicClient,
  chainId: number
): Promise<FeeData> {
  try {
    const feeData = await publicClient.estimateFeesPerGas();

    // Handle chains that don't support EIP-1559 (fallback to legacy gas pricing)
    if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
      const gasPrice = await publicClient.getGasPrice();
      return {
        maxFeePerGas: gasPrice,
        maxPriorityFeePerGas: gasPrice,
      };
    }

    // Priority fee: 50% tip for faster inclusion on L2s, 20% for L1s
    const priorityFeeMultiplier = isL2Chain(chainId) ? 150n : 120n;
    // Max fee: 10% for L2s (more efficient), 15% for L1s (more conservative)
    const maxFeeMultiplier = isL2Chain(chainId) ? 110n : 115n;

    const maxPriorityFeePerGas = (feeData.maxPriorityFeePerGas * priorityFeeMultiplier) / 100n;
    const maxFeePerGas = (feeData.maxFeePerGas * maxFeeMultiplier) / 100n;

    // Ensure maxFeePerGas is at least baseFee + maxPriorityFeePerGas
    const baseFee = feeData.maxFeePerGas - feeData.maxPriorityFeePerGas;
    const adjustedMaxFee = baseFee + maxPriorityFeePerGas > maxFeePerGas 
      ? baseFee + maxPriorityFeePerGas 
      : maxFeePerGas;

    return {
      maxFeePerGas: adjustedMaxFee,
      maxPriorityFeePerGas,
    };
  } catch (error) {
    console.warn('Fee estimation failed, using fallback:', error);
    
    // Fallback to legacy gas pricing with 20% buffer
    try {
      const gasPrice = await publicClient.getGasPrice();
      const bufferedGasPrice = (gasPrice * 120n) / 100n;
      return {
        maxFeePerGas: bufferedGasPrice,
        maxPriorityFeePerGas: bufferedGasPrice,
      };
    } catch (fallbackError) {
      console.error('Gas price fallback failed:', fallbackError);
      // Last resort - use conservative estimates
      return {
        maxFeePerGas: 20_000_000_000n, // 20 gwei
        maxPriorityFeePerGas: 2_000_000_000n, // 2 gwei
      };
    }
  }
}

/**
 * Check if a chain is an L2 that benefits from higher priority fees.
 * 
 * L2 chains identified:
 * - Base (8453)
 * - Arbitrum (42161) 
 * - Optimism (10)
 * - Sepolia testnet (11155111) - included for testing
 * 
 * @param chainId - Chain ID to check
 * @returns True if chain is L2, false otherwise
 */
export function isL2Chain(chainId: number): boolean {
  const l2Chains = [8453, 42161, 10, 11155111]; // Base, Arbitrum, Optimism, Sepolia
  return l2Chains.includes(chainId);
}

/**
 * Get fee optimization strategy description for UI display.
 * 
 * @param chainId - Chain ID to get strategy for
 * @returns Human-readable description of fee optimization strategy
 */
export function getFeeStrategyDescription(chainId: number): string {
  if (isL2Chain(chainId)) {
    return 'Optimized for sub-3s confirmation with 50% priority fee tip';
  }
  return 'Optimized for reliable confirmation with 20% priority fee';
}

/**
 * Estimate transaction confirmation time based on fee strategy.
 * 
 * @param chainId - Chain ID to estimate time for
 * @returns Estimated confirmation time in seconds
 */
export function getEstimatedConfirmationTime(chainId: number): number {
  if (isL2Chain(chainId)) {
    return 3; // Sub-3 seconds for L2s with priority fee
  }
  return 15; // ~15 seconds for L1 with standard fee
}
