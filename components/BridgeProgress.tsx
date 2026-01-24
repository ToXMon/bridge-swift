'use client';

import { useEffect, useState } from 'react';
import { getEtherscanUrl, getHiroExplorerUrl, detectStacksNetwork, logStacksTransaction } from '@/lib/transaction-history';

export type BridgeStep = 
  | 'idle'
  | 'connecting'
  | 'approving'
  | 'bridge_initiated'
  | 'bridge_confirmed'
  | 'minting'
  | 'complete'
  | 'error';

interface ProgressStep {
  key: BridgeStep;
  label: string;
  description: string;
}

const STEPS: ProgressStep[] = [
  { key: 'connecting', label: 'Connecting', description: 'Establishing wallet connection' },
  { key: 'approving', label: 'Approving USDC', description: 'Granting bridge permission' },
  { key: 'bridge_initiated', label: 'Bridging', description: 'Locking USDC on Ethereum' },
  { key: 'bridge_confirmed', label: 'Confirming', description: 'Waiting for block confirmation' },
  { key: 'minting', label: 'Minting USDCx', description: 'Issuing USDCx on Stacks' },
  { key: 'complete', label: 'Complete', description: 'USDCx sent to your wallet' },
];

interface BridgeProgressProps {
  currentStep: BridgeStep;
  txHash?: string;
  stacksTxId?: string;
  stacksRecipient?: string;
  chainId?: number;
  eta?: string;
  onComplete?: () => void;
}

export function BridgeProgress({ 
  currentStep, 
  txHash, 
  stacksTxId,
  stacksRecipient,
  chainId = 11155111,
  eta = '~2 minutes', 
  onComplete 
}: BridgeProgressProps) {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  const stacksNetwork = stacksRecipient ? detectStacksNetwork(stacksRecipient) : 'mainnet';

  useEffect(() => {
    setAnimatedProgress(progress);
  }, [progress]);

  useEffect(() => {
    if (currentStep === 'complete' && onComplete) {
      onComplete();
    }
  }, [currentStep, onComplete]);

  useEffect(() => {
    if (stacksTxId && stacksRecipient) {
      logStacksTransaction(stacksTxId, stacksNetwork, 'amount', stacksRecipient);
    }
  }, [stacksTxId, stacksRecipient, stacksNetwork]);

  return (
    <div className="bridge-progress">
      {currentStep !== 'idle' && currentStep !== 'complete' && (
        <div className="eta-banner bg-black/40 border border-white/10 rounded-lg px-4 py-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Estimated completion: <span className="text-white font-medium">{eta}</span>
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {txHash && (
              <a
                href={getEtherscanUrl(txHash, chainId)}
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
            )}
            
            {stacksTxId && (
              <a
                href={getHiroExplorerUrl(stacksTxId, stacksNetwork)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs bg-purple-900/20 hover:bg-purple-900/40 border border-purple-700/50 text-purple-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
                  <circle cx="12" cy="14" r="3"/>
                </svg>
                <span>Hiro ({stacksNetwork})</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>
      )}

      <div className="progress-container mb-4">
        <div className="flex justify-between text-xs text-gray-300 mb-1">
          <span>Progress</span>
          <span>{Math.round(animatedProgress)}%</span>
        </div>
        <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${animatedProgress}%` }}
          />
        </div>
      </div>

      <div className="steps space-y-3">
        {STEPS.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = step.key === currentStep;
          const isPending = index > currentIndex;

          return (
            <div
              key={step.key}
              className={`step flex items-start gap-3 transition-opacity duration-300 ${isCurrent ? 'active' : ''} ${isComplete ? 'complete' : ''} ${isPending ? 'pending' : ''}`}
              style={{ opacity: isCurrent ? 1 : isComplete ? 0.7 : 0.4 }}
            >
              <div className={`step-indicator w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isComplete ? 'bg-green-500' : isCurrent ? 'bg-blue-500 animate-pulse' : 'bg-gray-600'}`}>
                {isComplete ? (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : isCurrent ? (
                  <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <span className="text-xs text-white">{index + 1}</span>
                )}
              </div>

              <div className="step-content flex-1 min-w-0">
                <p className={`text-sm font-medium ${isCurrent ? 'text-blue-400' : isComplete ? 'text-green-400' : 'text-gray-500'}`}>
                  {step.label}
                </p>
                <p className={`text-xs ${isCurrent ? 'text-blue-300' : 'text-gray-400'}`}>
                  {step.description}
                </p>
              </div>

              {isCurrent && (
                <span className="text-xs text-blue-400 animate-pulse">Processing...</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
