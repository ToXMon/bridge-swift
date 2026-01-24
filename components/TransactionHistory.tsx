'use client';

import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { getTransactionHistory, getEtherscanUrl, getHiroExplorerUrl, type BridgeTransaction } from '@/lib/transaction-history';

export function TransactionHistory() {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<BridgeTransaction[]>([]);

  useEffect(() => {
    if (address) {
      const history = getTransactionHistory(address);
      setTransactions(history);
    }
  }, [address]);

  if (!address || transactions.length === 0) {
    return null;
  }

  return (
    <div className="glass-panel rounded-2xl p-6 mt-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        Recent Transactions
      </h3>

      <div className="space-y-3">
        {transactions.slice(0, 5).map((tx) => (
          <div key={tx.id} className="bg-black/40 rounded-xl p-4 border border-white/10">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-white font-medium">{tx.amount} USDC</p>
                <p className="text-xs text-gray-400 mono-text truncate max-w-[200px]">
                  {tx.recipient}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                tx.status === 'completed' 
                  ? 'bg-green-900/30 text-green-400' 
                  : tx.status === 'pending'
                  ? 'bg-yellow-900/30 text-yellow-400'
                  : 'bg-red-900/30 text-red-400'
              }`}>
                {tx.status}
              </span>
            </div>

            <div className="flex gap-2 mt-3">
              <a
                href={getEtherscanUrl(tx.evmTxHash, tx.chainId)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs bg-blue-900/20 hover:bg-blue-900/40 border border-blue-700/50 text-blue-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 293.775 293.667" fill="currentColor">
                  <path d="M146.887 0C65.764 0 0 65.764 0 146.887s65.764 146.887 146.887 146.887 146.887-65.764 146.887-146.887S228.01 0 146.887 0zm0 270.667c-68.267 0-123.78-55.513-123.78-123.78S78.62 23.107 146.887 23.107s123.78 55.513 123.78 123.78-55.513 123.78-123.78 123.78z"/>
                </svg>
                <span>Etherscan</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              {tx.stacksTxId && (
                <a
                  href={getHiroExplorerUrl(tx.stacksTxId, tx.network)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs bg-purple-900/20 hover:bg-purple-900/40 border border-purple-700/50 text-purple-300 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
                    <circle cx="12" cy="14" r="3"/>
                  </svg>
                  <span>Hiro ({tx.network})</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-2">
              {new Date(tx.timestamp).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
