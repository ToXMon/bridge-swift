'use client';

import { useEffect } from 'react';
import { getTransactionHistory } from '@/lib/transaction-history';
import { 
  isTransactionStuck, 
  fetchAttestationWithRetry,
  calculateBackoffDelay,
  getAttestationStatus 
} from '@/lib/attestation-tracking';

/**
 * Background service that monitors bridge transactions and automatically
 * retries fetching attestations for stuck transactions.
 * 
 * This component should be mounted once at the app level.
 * 
 * Usage:
 *   <AttestationMonitor enabled={true} />
 */
export function AttestationMonitor({ enabled = true }: { enabled?: boolean }) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    
    console.log('[Attestation Monitor] Started');
    
    /**
     * Check all transactions and retry stuck ones
     */
    const checkAndRetryStuckTransactions = async () => {
      try {
        const transactions = getTransactionHistory();
        const now = Date.now();
        
        // Filter for potentially stuck transactions
        const recentTxs = transactions.filter(tx => {
          const age = now - tx.timestamp;
          // Only check transactions less than 24 hours old
          return age < 24 * 60 * 60 * 1000;
        });
        
        for (const tx of recentTxs) {
          // Check if stuck
          if (!isTransactionStuck(tx.evmTxHash, tx.timestamp)) {
            continue;
          }
          
          const status = getAttestationStatus(tx.evmTxHash);
          
          // Check if we should retry based on backoff
          if (status?.lastAttempt) {
            const timeSinceAttempt = now - status.lastAttempt;
            const requiredDelay = calculateBackoffDelay(status.attempts);
            
            if (timeSinceAttempt < requiredDelay) {
              continue; // Too soon to retry
            }
          }
          
          // Need message hash to fetch attestation
          // In a real implementation, you would:
          // 1. Extract message hash from transaction receipt
          // 2. Store it when transaction is created
          // 3. Use it here to fetch attestation
          
          if (tx.messageHash) {
            console.log('[Attestation Monitor] Retrying stuck transaction:', tx.evmTxHash);
            
            try {
              await fetchAttestationWithRetry(
                tx.evmTxHash,
                tx.messageHash,
                tx.network
              );
            } catch (error) {
              console.error('[Attestation Monitor] Retry failed:', error);
            }
          } else {
            console.log('[Attestation Monitor] Transaction stuck but no message hash:', tx.evmTxHash);
            console.log('[Attestation Monitor] Use scripts/fetch-attestation.js to manually retrieve attestation');
          }
        }
      } catch (error) {
        console.error('[Attestation Monitor] Check failed:', error);
      }
    };
    
    // Initial check
    checkAndRetryStuckTransactions();
    
    // Check every 5 minutes
    const interval = setInterval(checkAndRetryStuckTransactions, 5 * 60 * 1000);
    
    return () => {
      console.log('[Attestation Monitor] Stopped');
      clearInterval(interval);
    };
  }, [enabled]);
  
  // This component doesn't render anything
  return null;
}

/**
 * Display component showing attestation retry status
 * Can be added to transaction history or status panel
 */
export function AttestationRetryStatus({ txHash }: { txHash: string }) {
  const status = getAttestationStatus(txHash);
  
  if (!status || status.status === 'complete') {
    return null;
  }
  
  if (status.status === 'fetching') {
    return (
      <div className="text-sm text-blue-600 dark:text-blue-400">
        ⏳ Fetching attestation (attempt {status.attempts}/10)...
      </div>
    );
  }
  
  if (status.status === 'failed') {
    return (
      <div className="text-sm text-red-600 dark:text-red-400">
        ❌ Attestation fetch failed: {status.error}
      </div>
    );
  }
  
  if (status.attempts > 0) {
    return (
      <div className="text-sm text-yellow-600 dark:text-yellow-400">
        ⏳ Waiting for attestation ({status.attempts} attempts)
      </div>
    );
  }
  
  return null;
}
