'use client';

/**
 * Attestation tracking and retry logic for Circle CCTP bridge transactions
 * 
 * This module provides utilities to track attestation status and automatically
 * retry fetching attestations for stuck transactions.
 */

export interface AttestationStatus {
  txHash: string;
  messageHash?: string;
  attestation?: string;
  status: 'pending' | 'fetching' | 'complete' | 'failed';
  lastAttempt?: number;
  attempts: number;
  error?: string;
}

const ATTESTATION_STORAGE_KEY = 'bridge_swift_attestations';
const STUCK_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
const MAX_RETRY_ATTEMPTS = 10;

// Circle Iris API endpoints
const IRIS_API = {
  mainnet: 'https://iris-api.circle.com',
  testnet: 'https://iris-api-sandbox.circle.com',
} as const;

/**
 * Save attestation status to localStorage
 */
export function saveAttestationStatus(status: AttestationStatus): void {
  if (typeof window === 'undefined') return;
  
  try {
    const allStatuses = getAttestationStatuses();
    const index = allStatuses.findIndex(s => s.txHash === status.txHash);
    
    if (index >= 0) {
      allStatuses[index] = status;
    } else {
      allStatuses.push(status);
    }
    
    // Keep only last 100 attestation statuses
    const trimmed = allStatuses.slice(0, 100);
    localStorage.setItem(ATTESTATION_STORAGE_KEY, JSON.stringify(trimmed));
    
    console.log('[Attestation Status Saved]', status);
  } catch (error) {
    console.error('[Attestation Status Save Error]', error);
  }
}

/**
 * Get all attestation statuses from localStorage
 */
export function getAttestationStatuses(): AttestationStatus[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(ATTESTATION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Get attestation status for a specific transaction
 */
export function getAttestationStatus(txHash: string): AttestationStatus | null {
  const statuses = getAttestationStatuses();
  return statuses.find(s => s.txHash === txHash) || null;
}

/**
 * Check if a transaction is stuck (no attestation after threshold time)
 */
export function isTransactionStuck(txHash: string, txTimestamp: number): boolean {
  const now = Date.now();
  const age = now - txTimestamp;
  
  // Not stuck if less than threshold
  if (age < STUCK_THRESHOLD_MS) return false;
  
  // Check if we already have attestation
  const status = getAttestationStatus(txHash);
  if (status?.status === 'complete' && status.attestation) return false;
  
  return true;
}

/**
 * Fetch attestation from Circle's Iris API with retry logic
 * 
 * NOTE: This function makes direct API calls to Circle's Iris API.
 * When called from a browser, this will fail due to CORS restrictions.
 * 
 * For production use, move this to:
 * 1. Backend API route (e.g., /api/attestations/[messageHash])
 * 2. Serverless function (Vercel, AWS Lambda, etc.)
 * 3. Server-side monitoring service
 * 
 * Example backend API route:
 * ```typescript
 * // app/api/attestations/[messageHash]/route.ts
 * export async function GET(
 *   request: Request,
 *   { params }: { params: { messageHash: string } }
 * ) {
 *   const { messageHash } = params;
 *   const network = new URL(request.url).searchParams.get('network') || 'mainnet';
 *   const result = await fetchAttestation(messageHash, network);
 *   return Response.json(result);
 * }
 * ```
 */
export async function fetchAttestation(
  messageHash: string,
  network: 'mainnet' | 'testnet'
): Promise<{ status: string; attestation?: string }> {
  const apiUrl = IRIS_API[network];
  const endpoint = `${apiUrl}/attestations/${messageHash}`;
  
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[Attestation Fetch Error]', error);
    throw error;
  }
}

/**
 * Attempt to fetch attestation with retry logic
 */
export async function fetchAttestationWithRetry(
  txHash: string,
  messageHash: string,
  network: 'mainnet' | 'testnet',
  maxAttempts: number = MAX_RETRY_ATTEMPTS
): Promise<AttestationStatus> {
  const existingStatus = getAttestationStatus(txHash) || {
    txHash,
    messageHash,
    status: 'pending' as const,
    attempts: 0,
  };
  
  // Don't retry if already complete or max attempts reached
  if (existingStatus.status === 'complete') {
    return existingStatus;
  }
  
  if (existingStatus.attempts >= maxAttempts) {
    const failedStatus: AttestationStatus = {
      ...existingStatus,
      status: 'failed',
      error: 'Max retry attempts exceeded',
    };
    saveAttestationStatus(failedStatus);
    return failedStatus;
  }
  
  try {
    const updatedStatus: AttestationStatus = {
      ...existingStatus,
      status: 'fetching',
      lastAttempt: Date.now(),
      attempts: existingStatus.attempts + 1,
    };
    saveAttestationStatus(updatedStatus);
    
    const result = await fetchAttestation(messageHash, network);
    
    if (result.status === 'complete' && result.attestation) {
      const completeStatus: AttestationStatus = {
        ...updatedStatus,
        status: 'complete',
        attestation: result.attestation,
      };
      saveAttestationStatus(completeStatus);
      return completeStatus;
    }
    
    // Still pending
    const pendingStatus: AttestationStatus = {
      ...updatedStatus,
      status: 'pending',
    };
    saveAttestationStatus(pendingStatus);
    return pendingStatus;
    
  } catch (error) {
    const errorStatus: AttestationStatus = {
      ...existingStatus,
      status: 'pending', // Keep as pending to retry later
      lastAttempt: Date.now(),
      attempts: existingStatus.attempts + 1,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    saveAttestationStatus(errorStatus);
    return errorStatus;
  }
}

/**
 * Calculate delay for exponential backoff
 */
export function calculateBackoffDelay(attempt: number): number {
  const baseDelay = 2000; // 2 seconds
  const maxDelay = 60000; // 60 seconds
  const delay = baseDelay * Math.pow(2, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * Get list of transactions that need attestation retry
 */
export function getStuckTransactions(): Array<{
  txHash: string;
  timestamp: number;
  network: 'mainnet' | 'testnet';
}> {
  const statuses = getAttestationStatuses();
  const now = Date.now();
  
  return statuses
    .filter(status => {
      // Only include pending/fetching statuses
      if (status.status === 'complete' || status.status === 'failed') return false;
      
      // Check if enough time has passed since last attempt
      if (status.lastAttempt) {
        const timeSinceAttempt = now - status.lastAttempt;
        const requiredDelay = calculateBackoffDelay(status.attempts);
        if (timeSinceAttempt < requiredDelay) return false;
      }
      
      // Don't retry if max attempts reached
      if (status.attempts >= MAX_RETRY_ATTEMPTS) return false;
      
      return true;
    })
    .map(status => ({
      txHash: status.txHash,
      timestamp: status.lastAttempt || now,
      network: 'mainnet' as const, // Default to mainnet, should be stored in status
    }));
}

/**
 * Hook to monitor and retry attestations for stuck transactions
 * This can be used in a component that runs in the background
 */
export function useAttestationMonitoring(enabled: boolean = true) {
  if (typeof window === 'undefined' || !enabled) return;
  
  // Check for stuck transactions every minute
  const interval = setInterval(() => {
    const stuckTxs = getStuckTransactions();
    
    if (stuckTxs.length > 0) {
      console.log('[Attestation Monitor] Found stuck transactions:', stuckTxs.length);
      
      // Note: This would need the message hash to work properly
      // In a real implementation, you'd need to extract the message hash
      // from the transaction receipt or store it when the transaction is created
    }
  }, 60000); // Check every minute
  
  return () => clearInterval(interval);
}

/**
 * Utility to check attestation status for display in UI
 */
export function getAttestationDisplayStatus(txHash: string): {
  status: string;
  message: string;
  canRetry: boolean;
} {
  const attestation = getAttestationStatus(txHash);
  
  if (!attestation) {
    return {
      status: 'unknown',
      message: 'Attestation status unknown',
      canRetry: false,
    };
  }
  
  switch (attestation.status) {
    case 'complete':
      return {
        status: 'success',
        message: 'Attestation received',
        canRetry: false,
      };
    case 'fetching':
      return {
        status: 'loading',
        message: `Fetching attestation (attempt ${attestation.attempts})...`,
        canRetry: false,
      };
    case 'failed':
      return {
        status: 'error',
        message: attestation.error || 'Failed to fetch attestation',
        canRetry: true,
      };
    default:
      return {
        status: 'pending',
        message: attestation.error 
          ? `Pending (${attestation.attempts} attempts, last error: ${attestation.error})`
          : `Pending (${attestation.attempts} attempts)`,
        canRetry: attestation.attempts < MAX_RETRY_ATTEMPTS,
      };
  }
}
