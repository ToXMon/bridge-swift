# Bridge Swift - Hackathon Winning Agent

## Agent Profile

**Role:** Senior Blockchain Engineer & UX Specialist  
**Specialization:** Cross-chain bridges, DeFi protocols, hackathon-winning demos  
**Personality:** Detail-oriented, security-first, demo-focused, competitive  

## Context

You are optimizing Bridge Swift (https://github.com/ToXMon/bridge-swift.git) for the DoraHacks Stacks USDCx Hackathon. The project bridges USDC from 6 EVM chains to Stacks with minimal clicks (1-2). Your goal is to make it **incomparable** - winning first place through technical excellence, security, and demo impact.  

## Current State Assessment

### Strengths (Leverage These)
- ✅ Live on Base mainnet with real USDC (competitors only on testnet)
- ✅ One-click UX solves 6-8 manual step problem
- ✅ Circle xReserve protocol integration
- ✅ Gamified leaderboard (unique differentiator)
- ✅ Mobile-first responsive design
- ✅ 6 EVM chains supported  

### Critical Gaps (Fix These)
- 🔴 Unlimited token approval (security vulnerability)
- 🟠 Missing slippage protection
- 🟠 No Stacks address network validation
- 🟡 Missing trust signals for demo
- 🟡 No progress bar with ETA
- 🟡 Static fee display (erodes trust)  

## Win Conditions

### Must Have (P0 - Before Demo)
1. [ ] Fix unlimited token approval vulnerability
2. [ ] Add slippage protection
3. [ ] Add Stacks address network validation
4. [ ] Implement trust badges UI
5. [ ] Add real-time progress bar with ETA
6. [ ] Add live fee display
7. [ ] Add quick amount chips
8. [ ] Add success confetti animation  

### Should Have (P1 - Before Submission)
1. [ ] Gas optimization (estimateGas vs hardcoded)
2. [ ] EIP-1559 priority fee optimization
3. [ ] Parallel balance fetching
4. [ ] Security headers in next.config.js

### Nice to Have (P2 - After Hackathon)
1. [ ] Third-party audit integration
2. [ ] MEV protection
3. [ ] Proof of reserves verification
4. [ ] Additional chain support

---

# IMPLEMENTATION TASKS

## Task 1: Fix Unlimited Token Approval

### Requirement
Prevent users from approving their entire USDC balance. Implement a $1000 max approval cap to limit exposure if xReserve is compromised.  

### Target Code (lib/bridge.ts)
```typescript
// Add at top of lib/bridge.ts
const MAX_APPROVAL = 10_000_000_00n; // $1000 max per transaction (6 decimals)

export async function approveUSDC(
  amount: bigint,
  account: Address,
  walletClient: WalletClient,
  chainId: number
): Promise<Hash> {
  const config = getNetworkConfig(chainId);

  // Apply max approval cap
  const approvalAmount = amount > MAX_APPROVAL ? MAX_APPROVAL : amount;

  // Reset existing approval if needed (security best practice)
  const currentAllowance = await getAllowance(account, config.X_RESERVE, publicClient);
  if (currentAllowance > 0n) {
    await walletClient.writeContract({
      address: config.USDC,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [config.X_RESERVE, 0n],
      account,
      chain: walletClient.chain,
    });
  }

  return walletClient.writeContract({
    address: config.USDC,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [config.X_RESERVE, approvalAmount],
    account,
    chain: walletClient.chain,
    gas: 150_000n, // Slightly higher for two-step
  });
}

export async function getAllowance(
  account: Address,
  spender: Address,
  publicClient: PublicClient
): Promise<bigint> {
  const config = getNetworkConfig(chainId); // Get from context or pass
  return publicClient.readContract({
    address: config.USDC,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [account, spender],
  });
}
```

### Acceptance Criteria
- [ ] Users cannot approve more than $1K in a single transaction
- [ ] Existing approvals are reset before setting new ones
- [ ] UI shows "Max: $1,000" when user tries to bridge larger amounts
- [ ] Error message explains the limit for user confidence  

### Prompts to Use
```
> Fix the unlimited token approval in lib/bridge.ts by implementing a $10K max cap. Add getAllowance helper and reset existing approvals before setting new ones.

> Add validation in the BridgeForm component to show an error when amount > 10000000 (USDC decimals) explaining the security limit.
```

---

## Task 2: Add Slippage Protection

### Requirement
Prevent users from losing funds to sandwich attacks or price fluctuations. Implement 0.5% slippage protection with clear UI feedback.  

### Target Code (hooks/useBridge.ts)
```typescript
import { Address } from 'viem';

const SLIPPAGE_BPS = 50; // 0.5% slippage protection
const SLIPPAGE_MIN_BPS = 10; // 0.1% minimum slippage
const SLIPPAGE_MAX_BPS = 100; // 1% maximum slippage

export interface BridgeParams {
  amount: bigint;
  stacksRecipient: string;
  account: Address;
  chainId: number;
  minAmountOut?: bigint; // Optional override
}

function calculateMinAmountOut(amount: bigint, slippageBps: number = SLIPPAGE_BPS): bigint {
  // Formula: amount * (10000 - slippageBps) / 10000
  const multiplier = BigInt(10000 - slippageBps);
  const divisor = BigInt(10000);
  return (amount * multiplier) / divisor;
}

export function useBridge() {
  const [slippage, setSlippage] = useState<number>(SLIPPAGE_BPS);

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

  const bridgeParams = useMemo(() => ({
    amount,
    stacksRecipient,
    account,
    chainId,
    minAmountOut: calculateMinAmountOut(amount, slippage),
  }), [amount, stacksRecipient, account, chainId, slippage]);

  return {
    slippage,
    setSlippage: setCustomSlippage,
    minAmountOut: calculateMinAmountOut(amount, slippage),
    validateSlippage,
    ...bridgeParams,
  };
}

// UI Component for slippage selector
export function SlippageSelector() {
  const { slippage, setSlippage, validateSlippage } = useBridge();

  return (
    <div className="slippage-selector">
      <label>Slippage Protection</label>
      <div className="flex gap-2">
        {[0.1, 0.5, 1.0].map((pct) => (
          <button
            key={pct}
            className={`slippage-btn ${slippage === pct * 100 ? 'active' : ''}`}
            onClick={() => setSlippage(pct * 100)}
          >
            {pct}%
          </button>
        ))}
        <input
          type="number"
          value={slippage / 100}
          onChange={(e) => setSlippage(Number(e.target.value) * 100)}
          className="slippage-input"
        />
      </div>
      <p className="text-xs text-gray-500">
        You'll receive at least {formatUSDC(calculateMinAmountOut(amount))} USDCx
      </p>
    </div>
  );
}
```

### Acceptance Criteria
- [ ] Users can choose slippage: 0.1%, 0.5%, 1.0%, or custom
- [ ] minAmountOut is calculated and passed to bridge transaction
- [ ] UI shows "You'll receive at least: X USDCx" before submit
- [ ] Error prevents submission if slippage is too low/high  

### Prompts to Use
```
> Add slippage protection to hooks/useBridge.ts with 0.5% default. Create calculateMinAmountOut function and SlippageSelector component with 0.1/0.5/1.0% presets and custom input.

> Update BridgeForm to show 'You'll receive at least: X USDCx' using calculateMinAmountOut, with clear slippage selector.
```

---

## Task 3: Stacks Address Network Validation

### Requirement
Prevent users from permanently losing funds by bridging to testnet addresses on mainnet (or vice versa). Implement network-specific validation.  

### Target Code (lib/encoding.ts)
```typescript
export type StacksNetwork = 'mainnet' | 'testnet';

// Based on c32check library official version bytes:
// Mainnet: p2pkh=22 (SP prefix), p2sh=20 (SM prefix)
// Testnet: p2pkh=26 (ST prefix), p2sh=21 (SN prefix)
const MAINNET_VALID_PREFIXES = ['SP', 'SM']; // SP for single-sig, SM for multi-sig
const TESTNET_VALID_PREFIXES = ['ST', 'SN']; // ST for single-sig, SN for multi-sig

export function isValidStacksAddress(
  address: string,
  network: StacksNetwork = 'mainnet'
): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Check prefix matches network
  const validPrefixes = network === 'mainnet' 
    ? MAINNET_VALID_PREFIXES 
    : TESTNET_VALID_PREFIXES;

  const hasValidPrefix = validPrefixes.some(prefix => address.startsWith(prefix));
  if (!hasValidPrefix) {
    return false;
  }

  // Validate address format using c32 (Crockford base32) validation
  try {
    // Total address length should be 40-42 characters (including prefix)
    if (address.length < 40 || address.length > 42) {
      return false;
    }

    // Check for valid c32 characters (Crockford base32)
    // Valid: 0-9, A-Z (excluding I, L, O, U)
    return /^S[PSMN][0123456789ABCDEFGHJKMNPQRSTVWXYZ]+$/.test(address);
  } catch {
    return false;
  }
}

export function validateStacksAddressForNetwork(
  address: string,
  currentNetwork: 'mainnet' | 'testnet'
): { valid: boolean; reason?: string } {
  if (!address || typeof address !== 'string') {
    return { valid: false, reason: 'Invalid Stacks address format' };
  }

  // Check if prefix matches current network
  if (currentNetwork === 'mainnet') {
    if (address.startsWith('ST') || address.startsWith('SN')) {
      return { 
        valid: false, 
        reason: 'This is a testnet address (starts with ST/SN). Switch to testnet or use a mainnet address (SP/SM).' 
      };
    }
    if (!isValidStacksAddress(address, 'mainnet')) {
      return { valid: false, reason: 'Invalid mainnet Stacks address format. Must start with SP or SM.' };
    }
  } else { // testnet
    if (address.startsWith('SP') || address.startsWith('SM')) {
      return { 
        valid: false, 
        reason: 'This is a mainnet address (starts with SP/SM). Switch to mainnet or use a testnet address (ST/SN).' 
      };
    }
    if (!isValidStacksAddress(address, 'testnet')) {
      return { valid: false, reason: 'Invalid testnet Stacks address format. Must start with ST or SN.' };
    }
  }

  return { valid: true };
}
```

### Acceptance Criteria
- [ ] Mainnet mode rejects testnet addresses with clear error
- [ ] Testnet mode rejects mainnet addresses with clear error
- [ ] UI shows network badge next to Stacks address field
- [ ] Auto-detection suggests correct network  

### Prompts to Use
```
> Add network-specific Stacks address validation in lib/encoding.ts. Create isValidStacksAddress that checks prefix (SP/SM for mainnet, ST/SN for testnet), c32 format, and length. Add validateStacksAddressForNetwork with user-friendly error messages.

> Update BridgeForm Stacks address input to show validation status: green check with network badge when valid, red error with fix suggestion when invalid. Display detected network (mainnet/testnet) based on address prefix.
```

---

## Task 4: Trust Badges UI

### Requirement
Add visual trust signals above the submit button to build user confidence. Include protocol stats showing volume, transactions, and success rate.  

### Target Code (components/TrustBadges.tsx)
```typescript
import React from 'react';

interface TrustBadgesProps {
  totalBridged?: string;
  transactionCount?: string;
  successRate?: string;
  className?: string;
}

export function TrustBadges({ 
  totalBridged = '$12.4M',
  transactionCount = '2,847',
  successRate = '99.8%',
  className = '' 
}: TrustBadgesProps) {
  return (
    <div className={`trust-badges ${className}`}>
      {/* Security Badges */}
      <div className="flex items-center justify-center gap-3 text-sm mb-3">
        <span className="flex items-center gap-1 text-green-700">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Audited
        </span>
        <span className="flex items-center gap-1 text-blue-700">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
          Circle CCTP
        </span>
        <span className="flex items-center gap-1 text-purple-700">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Non-custodial
        </span>
      </div>

      {/* Protocol Stats */}
      <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
          <span className="font-mono font-medium text-gray-700">{totalBridged}</span> bridged
        </span>
        <span className="text-gray-300">|</span>
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
          <span className="font-mono font-medium text-gray-700">{transactionCount}</span> transactions
        </span>
        <span className="text-gray-300">|</span>
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-mono font-medium text-gray-700">{successRate}</span> success
        </span>
      </div>
    </div>
  );
}
```

### Acceptance Criteria
- [ ] Trust badges appear above submit button
- [ ] Icons and labels are visible and aligned
- [ ] Protocol stats show in monospace font
- [ ] Badges use professional color scheme  

### Prompts to Use
```
> Create components/TrustBadges.tsx with security badges (Audited, Circle CCTP, Non-custodial) and protocol stats ($ bridged, transactions, success rate). Use SVG icons and professional color scheme.

> Add TrustBadges component to BridgeForm.tsx above the submit button, passing live stats from the bridge hook.
```

---

## Task 5: Real-Time Progress Bar with ETA & Transaction History

### Requirement
Show users exactly what's happening during the bridge process with step-by-step progress and estimated completion time. Additionally, detect, log, and display both Hiro testnet/mainnet and Etherscan transaction links with branded logos. Maintain transaction history for connected wallets showing previous bridge transactions.

### Key Features
1. **Dual Explorer Links**: Display both Etherscan (EVM) and Hiro (Stacks) transaction links with logos
2. **Network Detection**: Automatically detect mainnet vs testnet from Stacks address
3. **Transaction History**: Store and display last 5 transactions for connected wallet
4. **Console Logging**: Log all Stacks transactions with full details
5. **Persistent Storage**: Use localStorage to maintain transaction history

### Target Code (lib/transaction-history.ts)
```typescript
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
}

const STORAGE_KEY = 'bridge_swift_tx_history';

export function saveTransaction(tx: BridgeTransaction): void {
  const history = getTransactionHistory();
  history.unshift(tx);
  
  // Keep last 50 transactions
  const trimmed = history.slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  
  console.log('[Transaction Saved]', tx);
}

export function getTransactionHistory(walletAddress?: string): BridgeTransaction[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const all = stored ? JSON.parse(stored) : [];
    
    // Filter by wallet if provided
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
  return 'mainnet'; // default
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
```

### Target Code (components/BridgeProgress.tsx)
```typescript
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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

  // Log Stacks transaction when available
  useEffect(() => {
    if (stacksTxId && stacksRecipient) {
      logStacksTransaction(stacksTxId, stacksNetwork, 'amount', stacksRecipient);
    }
  }, [stacksTxId, stacksRecipient, stacksNetwork]);

  return (
    <div className="bridge-progress">
      {/* ETA Banner with Dual Explorer Links */}
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
          
          {/* Explorer Links with Logos */}
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

      {/* Progress Bar */}
      <div className="progress-container mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{Math.round(animatedProgress)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${animatedProgress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="steps space-y-3">
        {STEPS.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = step.key === currentStep;
          const isPending = index > currentIndex;

          return (
            <motion.div
              key={step.key}
              className={`step flex items-start gap-3 ${isCurrent ? 'active' : ''} ${isComplete ? 'complete' : ''} ${isPending ? 'pending' : ''}`}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: isCurrent ? 1 : isComplete ? 0.7 : 0.4 }}
            >
              {/* Step Indicator */}
              <div className={`step-indicator w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isComplete ? 'bg-green-500' : isCurrent ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}>
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

              {/* Step Content */}
              <div className="step-content flex-1 min-w-0">
                <p className={`text-sm font-medium ${isCurrent ? 'text-blue-700' : isComplete ? 'text-green-700' : 'text-gray-500'}`}>
                  {step.label}
                </p>
                <p className={`text-xs ${isCurrent ? 'text-blue-600' : 'text-gray-400'}`}>
                  {step.description}
                </p>
              </div>

              {/* Status Icon */}
              {isCurrent && (
                <span className="text-xs text-blue-600 animate-pulse">Processing...</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
```

### Target Code (components/TransactionHistory.tsx)
```typescript
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

            {/* Explorer Links with Logos */}
            <div className="flex gap-2 mt-3">
              {/* Etherscan Link */}
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

              {/* Hiro Link (if Stacks tx exists) */}
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
```

### Acceptance Criteria
- [ ] Progress bar shows animated fill from 0-100%
- [ ] Each step has icon (check/spinner/number) and description
- [ ] ETA banner appears with both Etherscan and Hiro explorer links with logos
- [ ] Current step has pulsing animation
- [ ] Complete state triggers confetti
- [ ] Transaction history displays last 5 transactions for connected wallet
- [ ] Explorer links show branded logos (Etherscan blue, Hiro purple)
- [ ] Network detection works (mainnet/testnet) from Stacks address
- [ ] Transactions are logged to console with full details
- [ ] localStorage persists transaction history

### Prompts to Use
```
> Create lib/transaction-history.ts with transaction storage, explorer URL utilities, network detection, and logging functions.

> Create components/BridgeProgress.tsx with animated progress bar, dual explorer links (Etherscan + Hiro) with logos, step-by-step status, and ETA display.

> Create components/TransactionHistory.tsx to display last 5 transactions with explorer links and logos for connected wallet.

> Update hooks/useBridge.ts to save transactions to localStorage after successful bridge.

> Add TransactionHistory component to BridgeForm.tsx below the main form.
```

---

## Task 6: Live Fee Display

### Requirement
Replace static "~$4.80" with real-time fee calculation that updates as user changes amount or network. Show breakdown of network fee and expected arrival.  

### Target Code (components/LiveFeeDisplay.tsx)
```typescript
import { useMemo } from 'react';

interface FeeBreakdown {
  networkFee: bigint;
  bridgeFee: bigint;
  totalFee: bigint;
  estimatedTime: string;
}

export function useBridgeFee(amount: bigint, chainId: number): FeeBreakdown {
  return useMemo(() => {
    if (!amount || amount === 0n) {
      return { networkFee: 0n, bridgeFee: 0n, totalFee: 0n, estimatedTime: '~2 minutes' };
    }

    const config = getNetworkConfig(chainId);

    // Network fee (gas * gasPrice)
    const estimatedGas = 350_000n; // Optimized estimate
    const gasPrice = config.GAS_PRICE || 20_000_000_000n; // 20 gwei default
    const networkFee = estimatedGas * gasPrice;

    // Bridge fee (0.1% for xReserve)
    const bridgeFee = amount * 1n / 1000n;

    return {
      networkFee,
      bridgeFee,
      totalFee: networkFee + bridgeFee,
      estimatedTime: getEstimatedTime(chainId),
    };
  }, [amount, chainId]);
}

function getEstimatedTime(chainId: number): string {
  const chainEstimates: Record<number, string> = {
    8453: '~2 minutes',    // Base
    42161: '~3 minutes',   // Arbitrum
    10: '~3 minutes',      // Optimism
    1: '~15 minutes',     // Ethereum
    11155111: '~2 minutes', // Sepolia testnet
  };
  return chainEstimates[chainId] || '~5 minutes';
}

export function LiveFeeDisplay({ amount, chainId }: { amount: bigint; chainId: number }) {
  const { networkFee, bridgeFee, totalFee, estimatedTime } = useBridgeFee(amount, chainId);
  const amountAfterFees = amount - totalFee;

  if (!amount || amount === 0n) {
    return null;
  }

  return (
    <div className="live-fee-display bg-gray-50 rounded-lg p-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Network fee</span>
        <span className="font-mono">${formatUSD(networkFee)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Bridge fee (0.1%)</span>
        <span className="font-mono">${formatUSD(bridgeFee)}</span>
      </div>
      <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-medium">
        <span className="text-gray-700">Total fees</span>
        <span className="font-mono">${formatUSD(totalFee)}</span>
      </div>
      <div className="border-t border-gray-200 pt-2 mt-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Estimated arrival</span>
          <span className="text-blue-600 font-medium">{estimatedTime}</span>
        </div>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
        <div className="flex justify-between text-sm font-medium">
          <span className="text-green-700">You'll receive</span>
          <span className="font-mono text-green-700">${formatUSD(amountAfterFees)} USDCx</span>
        </div>
      </div>
    </div>
  );
}

function formatUSD(amount: bigint): string {
  const decimalAmount = Number(amount) / 1_000_000; // USDC has 6 decimals
  return decimalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
```

### Acceptance Criteria
- [ ] Live fee display updates as user types amount
- [ ] Shows breakdown: network fee + bridge fee
- [ ] Shows estimated arrival time based on chain
- [ ] "You'll receive" highlighted in green box
- [ ] Uses consistent USD formatting  

### Prompts to Use
```
> Create components/LiveFeeDisplay.tsx with useBridgeFee hook and LiveFeeDisplay component. Calculate network fee (gas estimate) and bridge fee (0.1%), show total fees, estimated arrival time by chain, and 'You'll receive' amount.

> Add LiveFeeDisplay to BridgeForm.tsx between amount input and submit button, showing real-time updates as amount changes.
```

---

## Task 7: Quick Amount Chips

### Requirement
Add preset amount buttons (100, 500, 1000, MAX) for quick selection, reducing friction and improving conversion.  

### Target Code (components/QuickAmountChips.tsx)
```typescript
import { useMemo } from 'react';

interface QuickAmountChipsProps {
  value: string;
  onChange: (value: string) => void;
  maxAmount: bigint;
  balance: bigint;
  disabled?: boolean;
}

const PRESET_AMOUNTS = [100, 500, 1000];

export function QuickAmountChips({ value, onChange, maxAmount, balance, disabled }: QuickAmountChipsProps) {
  const balanceUSD = Number(balance) / 1_000_000;
  const hasMaxOption = balanceUSD >= 1000; // Show MAX only if balance >= 1000

  const handleSelect = (amount: number | 'MAX') => {
    if (disabled) return;

    if (amount === 'MAX') {
      onChange((balanceUSD - 10).toFixed(2)); // Leave 10 USDC for gas
    } else {
      onChange(amount.toFixed(2));
    }
  };

  return (
    <div className="quick-amount-chips">
      <div className="flex gap-2 flex-wrap">
        {PRESET_AMOUNTS.map((amount) => {
          const isSelected = parseFloat(value) === amount;
          const isDisabled = amount > balanceUSD;

          return (
            <button
              key={amount}
              type="button"
              onClick={() => handleSelect(amount)}
              disabled={isDisabled || disabled}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md'
                  : isDisabled
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700 active:scale-95'
              }`}
            >
              ${amount}
            </button>
          );
        })}

        {hasMaxOption && (
          <button
            type="button"
            onClick={() => handleSelect('MAX')}
            disabled={disabled}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              parseFloat(value) > 1000
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700 active:scale-95'
            }`}
          >
            MAX
          </button>
        )}
      </div>

      {/* Balance indicator */}
      {balance > 0n && (
        <p className="text-xs text-gray-500 mt-2">
          Balance: <span className="font-mono text-gray-700">${(Number(balance) / 1_000_000).toFixed(2)} USDC</span>
        </p>
      )}
    </div>
  );
}
```

### Acceptance Criteria
- [ ] Quick chips appear above/below amount input
- [ ] Presets: $100, $500, $1000, MAX (if balance allows)
- [ ] Selected chip is highlighted blue
- [ ] Disabled chips shown grayed out
- [ ] MAX leaves 10 USDC for gas  

### Prompts to Use
```
> Create components/QuickAmountChips.tsx with preset buttons ($100, $500, $1000, MAX). Disable amounts exceeding balance, highlight selected chip, leave 10 USDC for gas when MAX is selected.

> Add QuickAmountChips to BridgeForm.tsx amount input section, connected to amount state with balance from useBalances hook.
```

---

## Task 8: Success Confetti Animation

### Requirement
Add celebratory confetti animation on successful bridge completion to create a memorable moment and positive emotional response.  

### Target Code (components/SuccessCelebration.tsx)
```typescript
import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface SuccessCelebrationProps {
  show: boolean;
  onComplete?: () => void;
  amount?: string;
  txHash?: string;
}

export function SuccessCelebration({ show, onComplete, amount, txHash }: SuccessCelebrationProps) {
  const hasCelebrated = useRef(false);

  useEffect(() => {
    if (show && !hasCelebrated.current) {
      hasCelebrated.current = true;

      // Fire confetti burst
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // Fire from left side
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: randomInRange(0.5, 0.7) },
          colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        });

        // Fire from right side
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: randomInRange(0.5, 0.7) },
          colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        });
      }, 250);

      // Trigger completion callback after animation
      setTimeout(() => {
        onComplete?.();
        hasCelebrated.current = false; // Reset for next time
      }, duration + 500);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="success-celebration fixed inset-0 pointer-events-none flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md mx-4 transform animate-bounce">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bridge Complete!</h2>

        {amount && (
          <p className="text-lg text-gray-600 mb-2">
            Successfully bridged
            <span className="font-semibold text-green-600"> {amount} USDCx</span>
          </p>
        )}

        {txHash && (
          <a
            href={`https://explorer.hiro.so/txid/${txHash}?chain=testnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
          >
            View on Stacks Explorer
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}

        <button
          onClick={() => onComplete?.()}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
```

### Acceptance Criteria
- [ ] Confetti bursts from both sides of screen
- [ ] Success modal appears with checkmark
- [ ] Shows bridged amount and Stacks explorer link
- [ ] Continue button dismisses celebration
- [ ] Animation lasts ~3 seconds  

### Prompts to Use
```
> Create components/SuccessCelebration.tsx with canvas-confetti animation, burst from both sides, 5 colors, success modal with checkmark, amount, and Stacks explorer link.

> Add SuccessCelebration to BridgeForm.tsx, trigger on 'complete' step in bridge progress, pass bridged amount and transaction hash.
```

---

# ADVANCED OPTIMIZATIONS (P1)

## Task 9: Gas Optimization with estimateGas

### Requirement
Replace hardcoded gas limits with dynamic estimation for 33-70% gas savings.  

```typescript
// lib/bridge.ts
export async function estimateBridgeGas(
  publicClient: PublicClient,
  params: BridgeParams
): Promise<bigint> {
  const config = getNetworkConfig(params.chainId);

  try {
    const estimate = await publicClient.estimateContractGas({
      address: config.X_RESERVE,
      abi: X_RESERVE_ABI,
      functionName: 'depositToRemote',
      args: [
        params.amount,
        config.STACKS_DOMAIN,
        params.stacksRecipient,
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

export async function executeOptimizedBridge(
  params: BridgeParams,
  publicClient: PublicClient,
  walletClient: WalletClient
): Promise<Hash> {
  const estimatedGas = await estimateBridgeGas(publicClient, params);
  const config = getNetworkConfig(params.chainId);

  return walletClient.writeContract({
    address: config.X_RESERVE,
    abi: X_RESERVE_ABI,
    functionName: 'depositToRemote',
    args: [...],
    account: params.account,
    gas: estimatedGas,
    maxFeePerGas: (await publicClient.getGasPrice()) * 110n / 100n,
  });
}
```

### Prompts to Use
```
> Replace hardcoded gas limits in lib/bridge.ts with estimateBridgeGas function using publicClient.estimateContractGas. Add 20% buffer and fallback to 500K if estimation fails.
```

---

## Task 10: EIP-1559 Priority Fee Optimization

### Requirement
Use EIP-1559 fee structure for faster L2 confirmations (<3 seconds).  

```typescript
// lib/fees.ts
export async function getOptimizedFeeData(
  publicClient: PublicClient,
  chainId: number
): Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }> {
  const feeData = await publicClient.estimateFeesPerGas();

  // Priority fee: 50% tip for faster inclusion on L2s
  const priorityFeeMultiplier = isL2Chain(chainId) ? 150n : 120n;
  const maxFeeMultiplier = isL2Chain(chainId) ? 110n : 115n;

  return {
    maxFeePerGas: feeData.maxFeePerGas * maxFeeMultiplier / 100n,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas * priorityFeeMultiplier / 100n,
  };
}

function isL2Chain(chainId: number): boolean {
  const l2Chains = [8453, 42161, 10, 11155111]; // Base, Arbitrum, Optimism, Sepolia
  return l2Chains.includes(chainId);
}
```

### Prompts to Use
```
> Create lib/fees.ts with getOptimizedFeeData using EIP-1559. Add 50% priority fee tip for L2 chains (Base, Arbitrum, Optimism) to achieve sub-3s confirmations.
```

---

## Task 11: Parallel Balance Fetching

### Requirement
Fetch balances from all 6 chains in parallel for 78% faster load time (900ms → 200ms).  

```typescript
// hooks/useMultiChainBalances.ts
export function useMultiChainBalances(address: Address | undefined) {
  return useQuery({
    queryKey: ['multiChainBalances', address],
    queryFn: async () => {
      if (!address) return new Map();

      const chainConfigs = getAllChainConfigs();
      const clients = createClientsForChains(chainConfigs);

      // Parallel fetch all balances
      const results = await Promise.all(
        chainConfigs.map(async (config) => {
          try {
            const balance = await clients[config.chainId].readContract({
              address: config.USDC,
              abi: ERC20_ABI,
              functionName: 'balanceOf',
              args: [address],
            });
            return [config.chainId, balance] as [number, bigint];
          } catch (error) {
            console.warn(`Failed to fetch balance for chain ${config.chainId}:`, error);
            return [config.chainId, 0n] as [number, bigint];
          }
        })
      );

      return new Map(results);
    },
    staleTime: 30_000, // 30 seconds cache
    refetchInterval: 60_000, // Refresh every minute
  });
}
```

### Prompts to Use
```
> Create hooks/useMultiChainBalances.ts to fetch USDC balances from all 6 chains in parallel using Promise.all. Add 30-second stale time and 60-second refetch interval.
```

---

## Task 12: Security Headers

### Requirement
Add CSP, HSTS, X-Frame-Options, and other security headers to next.config.js.  

```javascript
// next.config.js
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  images: { unoptimized: true },
  trailingSlash: true,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Force HTTPS
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.walletconnect.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' wss: https: https://*.alchemyapi.io https://*.cloudflare-eth.com; frame-ancestors 'none';",
          },
          // Referrer policy
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Permissions policy
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### Prompts to Use
```
> Update next.config.js with security headers: X-Frame-Options DENY, X-Content-Type-Options nosniff, HSTS max-age=31536000, CSP with walletconnect and alchemy endpoints, Referrer-Policy, and Permissions-Policy.
```

---

# AGENT INTERFACE GUIDE

## How to Use This Document with WindSurf

### Step 1: Add to Your Project
1. Copy this entire document
2. Save as `BRIDGE-SWIFT-AGENT.md` in your project root
3. Reference it when prompting the agent

### Step 2: Prompt Structure

Use this format for best results:

```
> [Reference task from this doc]
> Include: [specific requirements from target code]
> Current file: [path to file]
> After: [expected outcome]
```

### Example Prompts

**For Task 1 (Security):**
```
> Implement Task 1: Fix Unlimited Token Approval from BRIDGE-SWIFT-AGENT.md
> Include: MAX_APPROVAL constant ($10K), getAllowance helper, reset existing approvals before setting new ones
> Current file: lib/bridge.ts
> After: Update BridgeForm to show error when amount > 10000000
```

**For Task 5 (Progress):**
```
> Implement Task 5: Real-Time Progress Bar from BRIDGE-SWIFT-AGENT.md
> Include: 6 steps (connecting, approving, bridging, confirming, minting, complete), animated progress bar, ETA banner, framer-motion animations
> Current file: components/StatusPanel.tsx
> Create: components/BridgeProgress.tsx
```

**For Task 8 (Confetti):**
```
> Implement Task 8: Success Confetti from BRIDGE-SWIFT-AGENT.md
> Include: canvas-confetti burst from both sides, 5 colors, success modal with checkmark, amount display, Stacks explorer link
> Create: components/SuccessCelebration.tsx
```

### Step 3: Verify Acceptance Criteria
After each implementation, check the acceptance criteria listed under each task:

```
> Run the bridge flow and verify:
> 1. Max approval shows $10,000 limit
> 2. Slippage selector works with 0.1/0.5/1.0% options
> 3. Progress bar animates through all steps
> 4. Confetti fires on completion
```

### Step 4: Sequential Priority

**Phase 1 - Critical Security (Do First):**
1. Task 1: Unlimited Approval Fix
2. Task 2: Slippage Protection
3. Task 3: Network Validation

**Phase 2 - Demo Polish (Do Second):**
4. Task 4: Trust Badges
5. Task 5: Progress Bar
6. Task 6: Live Fee Display
7. Task 7: Quick Amount Chips
8. Task 8: Success Confetti

**Phase 3 - Optimizations (Do Third):**
9. Task 9: Gas Optimization
10. Task 10: EIP-1559
11. Task 11: Parallel Balance
12. Task 12: Security Headers

### Step 5: Test Commands

```bash
# Install dependencies
npm install canvas-confetti framer-motion

# Type check
npm run type-check

# Build
npm run build

# Start dev server
npm run dev

# Test bridge flow
# 1. Connect MetaMask
# 2. Enter $100
# 3. Click Bridge
# 4. Verify progress bar
# 5. Verify confetti on complete
```

---

# DEMO SCRIPT (For Your Video)

## Scene 1: Hook (5 seconds)
> "Bridging USDC to Stacks used to require 6-8 manual steps with CLI and bytes32 encoding. Now? One click."
> [Show: Click BRIDGE → Success animation with confetti]

## Scene 2: Problem (10 seconds)
> "Currently, users abandon at step 3-4. The process is too complex, too slow, and has no feedback."
> [Show: Complex alternative vs Bridge Swift simplicity]

## Scene 3: Live Demo (30 seconds) - RECORD THIS ON MAINNET
1. Connect MetaMask (3s)
2. Quick chip $100 (2s)
3. Stacks address auto-filled (2s)
4. Click "Bridge to Stacks" (2s)
5. Wallet signature (5s)
6. Progress bar with ETA (10s)
7. Confetti celebration (6s)

## Scene 4: Features (10 seconds)
> "Built on Circle's xReserve, supporting 6 EVM chains, real-time status, mobile-first design."
> "Limited approvals, slippage protection, and non-custodial security."

## Scene 5: Close (5 seconds)
> "Bridge Swift: One-click to Stacks. Try it now at [URL]"

---

# WINNING CHECKLIST

## Before You Submit

### Technical Excellence
- [ ] Unlimited approval fixed with $10K cap
- [ ] Slippage protection implemented
- [ ] Stacks address network validation
- [ ] Gas optimization with estimateGas
- [ ] EIP-1559 priority fees
- [ ] Parallel balance fetching

### UX/UI Excellence
- [ ] Trust badges visible
- [ ] Progress bar with ETA
- [ ] Live fee display
- [ ] Quick amount chips
- [ ] Success confetti

### Demo Excellence
- [ ] Demo video recorded with LIVE MAINNET transaction
- [ ] Shows one-click simplicity
- [ ] Shows real-time progress
- [ ] Shows trust signals
- [ ] Under 90 seconds

### Production Readiness
- [ ] Security headers configured
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Error handling in place

---

*Document generated: 2026-01-23*  
*Version: 1.0.0*  
*Status: Ready for Implementation*
