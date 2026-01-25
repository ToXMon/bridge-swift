/**
 * Bridge Swift SDK Utilities
 * 
 * Core utility functions for address validation, encoding, and formatting.
 */

import { createAddress } from '@stacks/transactions';
import { hex } from '@scure/base';
import type { StacksNetwork, StacksAddressValidation } from './types';
import { BRIDGE_CONSTANTS } from './config';

// ============================================================================
// Stacks Address Constants
// ============================================================================

/** Valid Stacks mainnet address prefixes */
const MAINNET_VALID_PREFIXES = ['SP', 'SM'];

/** Valid Stacks testnet address prefixes */
const TESTNET_VALID_PREFIXES = ['ST', 'SN'];

/** All valid Stacks address prefixes */
const ALL_VALID_PREFIXES = [...MAINNET_VALID_PREFIXES, ...TESTNET_VALID_PREFIXES];

// ============================================================================
// Stacks Address Encoding
// ============================================================================

/**
 * Encode a Stacks address to bytes32 format for CCTP bridging
 * 
 * @param stacksAddress - The Stacks address to encode
 * @returns The bytes32 encoded recipient address
 * @throws Error if the address is invalid
 * 
 * @example
 * ```typescript
 * const encoded = encodeStacksRecipient('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
 * // Returns: '0x00000000000000000000001axxxxxxxxxxxxxxxxxxxxxxxx'
 * ```
 */
export function encodeStacksRecipient(stacksAddress: string): `0x${string}` {
  const address = createAddress(stacksAddress);
  const encoded = new Uint8Array(32);
  encoded[11] = address.version;
  const hash160Bytes = hex.decode(address.hash160);
  encoded.set(hash160Bytes, 12);
  return `0x${hex.encode(encoded)}` as `0x${string}`;
}

// ============================================================================
// Stacks Address Validation
// ============================================================================

/**
 * Detect the Stacks network from an address prefix
 * 
 * @param address - The Stacks address to analyze
 * @returns The detected network or null if invalid
 * 
 * @example
 * ```typescript
 * detectStacksNetwork('SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7'); // 'mainnet'
 * detectStacksNetwork('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'); // 'testnet'
 * detectStacksNetwork('invalid'); // null
 * ```
 */
export function detectStacksNetwork(address: string): StacksNetwork | null {
  if (!address || typeof address !== 'string') {
    return null;
  }
  
  if (address.startsWith('SP') || address.startsWith('SM')) {
    return 'mainnet';
  } else if (address.startsWith('ST') || address.startsWith('SN')) {
    return 'testnet';
  }
  
  return null;
}

/**
 * Validate a Stacks address format
 * 
 * @param address - The address to validate
 * @param network - Optional network to validate against
 * @returns True if the address is valid
 * 
 * @example
 * ```typescript
 * isValidStacksAddress('SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7'); // true
 * isValidStacksAddress('SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7', 'mainnet'); // true
 * isValidStacksAddress('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'mainnet'); // false (testnet address)
 * ```
 */
export function isValidStacksAddress(
  address: string,
  network?: StacksNetwork
): boolean {
  try {
    if (!address || typeof address !== 'string') {
      return false;
    }

    // Check prefix matches expected network
    if (network) {
      const validPrefixes = network === 'mainnet' 
        ? MAINNET_VALID_PREFIXES 
        : TESTNET_VALID_PREFIXES;
      
      const hasValidPrefix = validPrefixes.some(prefix => address.startsWith(prefix));
      if (!hasValidPrefix) {
        return false;
      }
    } else {
      // Accept any valid Stacks prefix
      const hasValidPrefix = ALL_VALID_PREFIXES.some(prefix => address.startsWith(prefix));
      if (!hasValidPrefix) {
        return false;
      }
    }

    // Validate address length (40-42 characters including prefix)
    if (address.length < 40 || address.length > 42) {
      return false;
    }

    // Check for valid c32 characters (Crockford base32)
    // Valid: 0-9, A-Z (excluding I, L, O, U)
    // Second char can be P, M (mainnet) or T, N (testnet)
    if (!/^S[PMTN][0123456789ABCDEFGHJKMNPQRSTVWXYZ]+$/.test(address)) {
      return false;
    }

    // Use Stacks library validation as final check
    createAddress(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a Stacks address for a specific network with detailed feedback
 * 
 * @param address - The address to validate
 * @param currentNetwork - The network to validate against
 * @returns Validation result with details
 * 
 * @example
 * ```typescript
 * const result = validateStacksAddressForNetwork('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'mainnet');
 * // { valid: false, reason: 'This is a testnet address...', detectedNetwork: 'testnet' }
 * ```
 */
export function validateStacksAddressForNetwork(
  address: string,
  currentNetwork: StacksNetwork
): StacksAddressValidation {
  if (!address || typeof address !== 'string') {
    return { valid: false, reason: 'Invalid Stacks address format' };
  }

  // Detect network from address prefix
  const detectedNetwork = detectStacksNetwork(address) || undefined;

  // Check if prefix matches current network
  if (currentNetwork === 'mainnet') {
    if (address.startsWith('ST') || address.startsWith('SN')) {
      return { 
        valid: false, 
        reason: 'This is a testnet address (starts with ST/SN). Switch to testnet or use a mainnet address (SP/SM).',
        detectedNetwork: 'testnet'
      };
    }
    if (!isValidStacksAddress(address, 'mainnet')) {
      return { 
        valid: false, 
        reason: 'Invalid mainnet Stacks address format. Must start with SP or SM.',
        detectedNetwork
      };
    }
  } else { // testnet
    if (address.startsWith('SP') || address.startsWith('SM')) {
      return { 
        valid: false, 
        reason: 'This is a mainnet address (starts with SP/SM). Switch to mainnet or use a testnet address (ST/SN).',
        detectedNetwork: 'mainnet'
      };
    }
    if (!isValidStacksAddress(address, 'testnet')) {
      return { 
        valid: false, 
        reason: 'Invalid testnet Stacks address format. Must start with ST or SN.',
        detectedNetwork
      };
    }
  }

  return { valid: true, detectedNetwork };
}

// ============================================================================
// USDC Formatting Utilities
// ============================================================================

/**
 * Format a USDC amount from smallest units to human-readable string
 * 
 * @param amount - Amount in smallest USDC units (6 decimals)
 * @param decimals - Number of decimal places to show (default: 2)
 * @returns Formatted string
 * 
 * @example
 * ```typescript
 * formatUSDC(1000000n); // '1.00'
 * formatUSDC(10500000n, 2); // '10.50'
 * formatUSDC(123456789n, 6); // '123.456789'
 * ```
 */
export function formatUSDC(amount: bigint, decimals: number = 2): string {
  const divisor = 10 ** BRIDGE_CONSTANTS.USDC_DECIMALS;
  const value = Number(amount) / divisor;
  return value.toFixed(decimals);
}

/**
 * Parse a human-readable USDC amount to smallest units
 * 
 * @param amount - Amount string in human-readable format
 * @returns Amount in smallest USDC units
 * 
 * @example
 * ```typescript
 * parseUSDC('1'); // 1000000n
 * parseUSDC('10.50'); // 10500000n
 * parseUSDC('0.000001'); // 1n
 * ```
 */
export function parseUSDC(amount: string): bigint {
  const parsed = parseFloat(amount);
  if (isNaN(parsed) || parsed < 0) return 0n;
  return BigInt(Math.floor(parsed * 10 ** BRIDGE_CONSTANTS.USDC_DECIMALS));
}

/**
 * Format a USDC amount with currency symbol
 * 
 * @param amount - Amount in smallest USDC units
 * @param decimals - Number of decimal places to show
 * @returns Formatted string with $ symbol
 * 
 * @example
 * ```typescript
 * formatUSDCWithSymbol(10500000n); // '$10.50'
 * ```
 */
export function formatUSDCWithSymbol(amount: bigint, decimals: number = 2): string {
  return `$${formatUSDC(amount, decimals)}`;
}

// ============================================================================
// Address Display Utilities
// ============================================================================

/**
 * Truncate an address for display
 * 
 * @param address - Full address string
 * @param chars - Number of characters to show at start and end
 * @returns Truncated address
 * 
 * @example
 * ```typescript
 * truncateAddress('0x1234567890abcdef1234567890abcdef12345678'); // '0x1234...5678'
 * truncateAddress('SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7', 6); // 'SP2J6Z...V9EJ7'
 * ```
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 3) return address;
  
  // Handle EVM addresses (0x prefix)
  if (address.startsWith('0x')) {
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
  }
  
  // Handle Stacks addresses (S prefix + network indicator)
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// ============================================================================
// Slippage Calculation Utilities
// ============================================================================

/**
 * Calculate minimum amount out with slippage protection
 * 
 * @param amount - Input amount in USDC units
 * @param slippageBps - Slippage tolerance in basis points (1 bps = 0.01%)
 * @returns Minimum amount out after slippage
 * 
 * @example
 * ```typescript
 * calculateMinAmountOut(1000000n, 50); // 995000n (0.5% slippage)
 * ```
 */
export function calculateMinAmountOut(amount: bigint, slippageBps: number): bigint {
  if (!amount || amount === 0n) return 0n;
  const multiplier = BigInt(10000 - slippageBps);
  return (amount * multiplier) / 10000n;
}

/**
 * Validate slippage value is within acceptable bounds
 * 
 * @param slippageBps - Slippage in basis points
 * @returns True if slippage is valid
 */
export function isValidSlippage(slippageBps: number): boolean {
  return slippageBps >= BRIDGE_CONSTANTS.MIN_SLIPPAGE_BPS && 
         slippageBps <= BRIDGE_CONSTANTS.MAX_SLIPPAGE_BPS;
}

/**
 * Convert basis points to percentage string
 * 
 * @param bps - Basis points
 * @returns Percentage string
 * 
 * @example
 * ```typescript
 * bpsToPercent(50); // '0.5%'
 * bpsToPercent(100); // '1%'
 * ```
 */
export function bpsToPercent(bps: number): string {
  return `${(bps / 100).toFixed(1)}%`;
}

// ============================================================================
// Transaction Explorer URLs
// ============================================================================

/**
 * Get block explorer URL for an EVM transaction
 * 
 * @param txHash - Transaction hash
 * @param chainId - Chain ID
 * @returns Block explorer URL
 */
export function getEtherscanUrl(txHash: string, chainId: number): string {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io',
    11155111: 'https://sepolia.etherscan.io',
    8453: 'https://basescan.org',
    42161: 'https://arbiscan.io',
    10: 'https://optimistic.etherscan.io',
    137: 'https://polygonscan.com',
    43114: 'https://snowtrace.io',
  };
  
  const baseUrl = explorers[chainId] || 'https://etherscan.io';
  return `${baseUrl}/tx/${txHash}`;
}

/**
 * Get Hiro Explorer URL for a Stacks transaction
 * 
 * @param txId - Stacks transaction ID
 * @param network - Stacks network
 * @returns Hiro Explorer URL
 */
export function getHiroExplorerUrl(txId: string, network: StacksNetwork): string {
  return network === 'mainnet'
    ? `https://explorer.hiro.so/txid/${txId}`
    : `https://explorer.hiro.so/txid/${txId}?chain=testnet`;
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate a bridge amount meets minimum requirements
 * 
 * @param amount - Amount in USDC units
 * @returns Validation result
 */
export function validateBridgeAmount(amount: bigint): { valid: boolean; reason?: string } {
  if (amount <= 0n) {
    return { valid: false, reason: 'Amount must be greater than 0' };
  }
  
  if (amount < BRIDGE_CONSTANTS.MIN_AMOUNT) {
    const minAmountDisplay = formatUSDC(BRIDGE_CONSTANTS.MIN_AMOUNT);
    return { 
      valid: false, 
      reason: `Minimum bridge amount is ${minAmountDisplay} USDC` 
    };
  }
  
  return { valid: true };
}

/**
 * Validate EVM address format
 * 
 * @param address - Address to validate
 * @returns True if valid EVM address
 */
export function isValidEVMAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
