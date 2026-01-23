'use client';

import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient, useChainId } from 'wagmi';
import { bridgeUSDCToStacks, parseUSDC, type BridgeResult } from '@/lib/bridge';

export type BridgeStatus = 'idle' | 'approving' | 'bridging' | 'success' | 'error';

export function useBridge() {
  const [status, setStatus] = useState<BridgeStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BridgeResult | null>(null);

  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

  const executeBridge = useCallback(
    async (amount: string, stacksRecipient: string) => {
      if (!address || !walletClient || !publicClient) {
        setError('Please connect your wallet');
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

        const bridgeResult = await bridgeUSDCToStacks(
          { amount: amountBigInt, stacksRecipient, account: address, chainId },
          publicClient,
          walletClient
        );

        setStatus('bridging');
        await publicClient.waitForTransactionReceipt({ hash: bridgeResult.bridgeHash });

        setResult(bridgeResult);
        setStatus('success');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Bridge failed';
        setError(message.includes('User rejected') ? 'Transaction cancelled' : message);
        setStatus('error');
      }
    },
    [address, publicClient, walletClient, chainId]
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setResult(null);
  }, []);

  return { status, error, result, executeBridge, reset };
}
