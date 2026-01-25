export interface BridgeTransaction {
  id: string;
  evmTxHash: string;
  stacksTxId?: string;
  amount: string;
  recipient: string;
  network: 'mainnet' | 'testnet';
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  chainId: number;
  messageHash?: string; // Circle CCTP message hash for attestation tracking
  attestation?: string; // Attestation signature from Circle
  attestationAttempts?: number; // Number of attestation fetch attempts
}

const STORAGE_KEY = 'bridge_swift_tx_history';

export function saveTransaction(tx: BridgeTransaction): void {
  const history = getTransactionHistory();
  history.unshift(tx);
  
  const trimmed = history.slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  
  console.log('[Transaction Saved]', tx);
}

export function getTransactionHistory(walletAddress?: string): BridgeTransaction[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const all = stored ? JSON.parse(stored) : [];
    
    if (walletAddress) {
      return all.filter((tx: BridgeTransaction) => 
        tx.recipient.toLowerCase().includes(walletAddress.toLowerCase())
      );
    }
    
    return all;
  } catch {
    return [];
  }
}

export function getEtherscanUrl(txHash: string, chainId: number): string {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io',
    11155111: 'https://sepolia.etherscan.io',
    8453: 'https://basescan.org',
    42161: 'https://arbiscan.io',
    10: 'https://optimistic.etherscan.io',
  };
  
  const baseUrl = explorers[chainId] || 'https://etherscan.io';
  return `${baseUrl}/tx/${txHash}`;
}

export function getHiroExplorerUrl(txId: string, network: 'mainnet' | 'testnet'): string {
  return network === 'mainnet'
    ? `https://explorer.hiro.so/txid/${txId}`
    : `https://explorer.hiro.so/txid/${txId}?chain=testnet`;
}

export function detectStacksNetwork(address: string): 'mainnet' | 'testnet' {
  if (address.startsWith('SP') || address.startsWith('SM')) {
    return 'mainnet';
  }
  if (address.startsWith('ST') || address.startsWith('SN')) {
    return 'testnet';
  }
  return 'mainnet';
}

export function logStacksTransaction(
  txId: string, 
  network: 'mainnet' | 'testnet', 
  amount: string,
  recipient: string
): string {
  const explorerUrl = getHiroExplorerUrl(txId, network);
  
  console.log('[Stacks Transaction]', {
    txId,
    network,
    amount,
    recipient,
    explorerUrl,
    timestamp: new Date().toISOString()
  });
  
  return explorerUrl;
}
