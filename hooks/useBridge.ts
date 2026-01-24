'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAccount, usePublicClient, useWalletClient, useChainId } from 'wagmi';
import { bridgeUSDCToStacks, parseUSDC, type BridgeResult } from '@/lib/bridge';
import { saveTransaction, detectStacksNetwork, type BridgeTransaction } from '@/lib/transaction-history';
import { isXReserveSupported, getNetworkName } from '@/lib/contracts';
import type { Address } from 'viem';

export type BridgeStatus = 'idle' | 'approving' | 'bridging' | 'success' | 'error';

const SLIPPAGE_BPS = 50; // 0.5% slippage protection
const SLIPPAGE_MIN_BPS = 10; // 0.1% minimum slippage
const SLIPPAGE_MAX_BPS = 100; // 1% maximum slippage

export interface BridgeParams {
  amount: bigint;
  stacksRecipient: string;
  account: Address;
  chainId: number;
  minAmountOut?: bigint;
}

function calculateMinAmountOut(amount: bigint, slippageBps: number = SLIPPAGE_BPS): bigint {
  if (!amount || amount === 0n) return 0n;
  // Formula: amount * (10000 - slippageBps) / 10000
  const multiplier = BigInt(10000 - slippageBps);
  const divisor = BigInt(10000);
  return (amount * multiplier) / divisor;
}

export function useBridge() {
  const [status, setStatus] = useState<BridgeStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BridgeResult | null>(null);
  const [slippage, setSlippage] = useState<number>(SLIPPAGE_BPS);

  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

  const validateSlippage = useCallback((value: number): boolean => {
    return value >= SLIPPAGE_MIN_BPS && value <= SLIPPAGE_MAX_BPS;
  }, []);

  const setCustomSlippage = useCallback((value: number) => {
    if (validateSlippage(value)) {
      setSlippage(value);
    } else {
      throw new Error(`Slippage must be between ${SLIPPAGE_MIN_BPS/100}% and ${SLIPPAGE_MAX_BPS/100}%`);
    }
  }, [validateSlippage]);

  const executeBridge = useCallback(
    async (amount: string, stacksRecipient: string) => {
      if (!address || !walletClient || !publicClient) {
        setError('Please connect your wallet');
        setStatus('error');
        return;
      }

      // Validate that the source chain supports xReserve for Stacks bridging
      if (!isXReserveSupported(chainId)) {
        const networkName = getNetworkName(chainId);
        setError(`${networkName} is not supported for Stacks bridging. Circle xReserve only supports Ethereum mainnet. Please switch to Ethereum or bridge your USDC to Ethereum first.`);
        setStatus('error');
        return;
      }

      const amountBigInt = parseUSDC(amount);
      if (amountBigInt === 0n) {
        setError('Please enter a valid amount');
        setStatus('error');
        return;
      }

      try {
        setError(null);
        setStatus('approving');

        const minAmountOut = calculateMinAmountOut(amountBigInt, slippage);

        const bridgeResult = await bridgeUSDCToStacks(
          { amount: amountBigInt, stacksRecipient, account: address, chainId, minAmountOut },
          publicClient,
          walletClient
        );

        setStatus('bridging');
        await publicClient.waitForTransactionReceipt({ hash: bridgeResult.bridgeHash });

        const network = detectStacksNetwork(stacksRecipient);
        const updatedResult = {
          ...bridgeResult,
          network,
        };
        
        setResult(updatedResult);
        setStatus('success');

        const transaction: BridgeTransaction = {
          id: bridgeResult.bridgeHash,
          evmTxHash: bridgeResult.bridgeHash,
          stacksTxId: undefined,
          amount,
          recipient: stacksRecipient,
          network,
          timestamp: Date.now(),
          status: 'completed',
          chainId,
        };

        saveTransaction(transaction);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Bridge failed';
        setError(message.includes('User rejected') ? 'Transaction cancelled' : message);
        setStatus('error');
      }
    },
    [address, publicClient, walletClient, chainId, slippage]
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setResult(null);
  }, []);

  return { 
    status, 
    error, 
    result, 
    executeBridge, 
    reset,
    slippage,
    setSlippage: setCustomSlippage,
    validateSlippage,
    calculateMinAmountOut: (amount: bigint) => calculateMinAmountOut(amount, slippage),
  };
}

export { calculateMinAmountOut };
