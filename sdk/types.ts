/**
 * Bridge Swift SDK Types
 * 
 * Core type definitions for the Bridge Swift SDK.
 * These types provide a consistent interface for building USDC to USDCx bridge applications.
 */

import type { Address, Hash, PublicClient, WalletClient } from 'viem';

// ============================================================================
// Core Configuration Types
// ============================================================================

/**
 * Supported EVM networks for bridging
 */
export type SupportedNetwork = 
  | 'ethereum'
  | 'arbitrum'
  | 'optimism'
  | 'base'
  | 'polygon'
  | 'avalanche'
  | 'sepolia';

/**
 * Stacks network type
 */
export type StacksNetwork = 'mainnet' | 'testnet';

/**
 * SDK configuration options
 */
export interface BridgeSDKConfig {
  /** Default EVM chain ID to use for bridging */
  defaultChainId?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom RPC endpoints per chain */
  rpcUrls?: Partial<Record<SupportedNetwork, string>>;
  /** Maximum number of retry attempts for attestation fetching */
  maxAttestationRetries?: number;
  /** Custom slippage tolerance in basis points (1 bps = 0.01%) */
  defaultSlippageBps?: number;
}

// ============================================================================
// Network Configuration Types
// ============================================================================

/**
 * Network-specific contract configuration
 */
export interface NetworkConfig {
  /** USDC token contract address */
  USDC: Address;
  /** xReserve contract address for Stacks bridging */
  X_RESERVE: Address;
  /** Chain ID */
  CHAIN_ID: number;
  /** Stacks domain identifier for CCTP */
  STACKS_DOMAIN: number;
  /** USDCx contract address on Stacks */
  STACKS_USDCX: string;
  /** Target Stacks network */
  STACKS_NETWORK: StacksNetwork;
  /** Human-readable network name */
  NAME: string;
  /** Network icon emoji */
  ICON: string;
}

// ============================================================================
// Bridge Operation Types
// ============================================================================

/**
 * Parameters for initiating a bridge transaction
 */
export interface BridgeParams {
  /** Amount to bridge in USDC (6 decimal precision) */
  amount: bigint;
  /** Recipient Stacks address */
  stacksRecipient: string;
  /** Sender EVM address */
  account: Address;
  /** Source chain ID */
  chainId: number;
  /** Minimum amount to receive after slippage */
  minAmountOut?: bigint;
}

/**
 * Result of a successful bridge transaction
 */
export interface BridgeResult {
  /** USDC approval transaction hash (if approval was needed) */
  approvalHash?: Hash;
  /** Bridge deposit transaction hash */
  bridgeHash: Hash;
  /** Stacks transaction ID (populated after attestation) */
  stacksTxId?: string;
  /** Target Stacks network */
  network?: StacksNetwork;
}

/**
 * Comprehensive bridge transaction status
 */
export interface BridgeStatus {
  /** Current status phase */
  phase: BridgePhase;
  /** Whether the operation is complete */
  isComplete: boolean;
  /** Error message if failed */
  error?: string;
  /** Bridge result data */
  result?: BridgeResult;
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number;
}

/**
 * Bridge transaction phases
 */
export type BridgePhase = 
  | 'idle'
  | 'checking_allowance'
  | 'approving'
  | 'approval_pending'
  | 'bridging'
  | 'bridge_pending'
  | 'awaiting_attestation'
  | 'minting'
  | 'complete'
  | 'error';

// ============================================================================
// Address Validation Types
// ============================================================================

/**
 * Stacks address validation result
 */
export interface StacksAddressValidation {
  /** Whether the address is valid */
  valid: boolean;
  /** Validation failure reason */
  reason?: string;
  /** Detected Stacks network from address prefix */
  detectedNetwork?: StacksNetwork;
}

// ============================================================================
// Fee Estimation Types
// ============================================================================

/**
 * EIP-1559 fee data
 */
export interface FeeData {
  /** Maximum fee per gas unit */
  maxFeePerGas: bigint;
  /** Maximum priority fee per gas unit */
  maxPriorityFeePerGas: bigint;
}

/**
 * Comprehensive fee estimate
 */
export interface FeeEstimate {
  /** Estimated gas units required */
  estimatedGas: bigint;
  /** EIP-1559 fee data */
  feeData: FeeData;
  /** Estimated total cost in wei */
  estimatedCostWei: bigint;
  /** Bridge fee in USDC (6 decimals) */
  bridgeFeeUsdc: bigint;
  /** Estimated confirmation time in seconds */
  estimatedConfirmationTime: number;
}

// ============================================================================
// Transaction History Types
// ============================================================================

/**
 * Stored bridge transaction record
 */
export interface BridgeTransaction {
  /** Unique transaction identifier */
  id: string;
  /** EVM transaction hash */
  evmTxHash: string;
  /** Stacks transaction ID */
  stacksTxId?: string;
  /** Bridge amount in USDC string format */
  amount: string;
  /** Recipient Stacks address */
  recipient: string;
  /** Target Stacks network */
  network: StacksNetwork;
  /** Transaction timestamp */
  timestamp: number;
  /** Transaction status */
  status: 'pending' | 'completed' | 'failed';
  /** Source chain ID */
  chainId: number;
  /** Circle CCTP message hash */
  messageHash?: string;
  /** Attestation signature */
  attestation?: string;
  /** Number of attestation fetch attempts */
  attestationAttempts?: number;
}

// ============================================================================
// Attestation Types
// ============================================================================

/**
 * Attestation status for Circle CCTP
 */
export interface AttestationStatus {
  /** EVM transaction hash */
  txHash: string;
  /** CCTP message hash */
  messageHash?: string;
  /** Attestation signature */
  attestation?: string;
  /** Current status */
  status: 'pending' | 'fetching' | 'complete' | 'failed';
  /** Timestamp of last attempt */
  lastAttempt?: number;
  /** Number of fetch attempts */
  attempts: number;
  /** Error message if failed */
  error?: string;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * SDK event types for tracking bridge progress
 */
export type BridgeEventType = 
  | 'approval_started'
  | 'approval_submitted'
  | 'approval_confirmed'
  | 'bridge_started'
  | 'bridge_submitted'
  | 'bridge_confirmed'
  | 'attestation_received'
  | 'mint_complete'
  | 'error';

/**
 * Bridge event data
 */
export interface BridgeEvent {
  /** Event type */
  type: BridgeEventType;
  /** Event timestamp */
  timestamp: number;
  /** Transaction hash (if applicable) */
  txHash?: Hash;
  /** Additional event data */
  data?: Record<string, unknown>;
}

/**
 * Event listener callback
 */
export type BridgeEventListener = (event: BridgeEvent) => void;

// ============================================================================
// SDK Client Types
// ============================================================================

/**
 * Client dependencies for SDK operations
 */
export interface SDKClients {
  /** Viem public client for read operations */
  publicClient: PublicClient;
  /** Viem wallet client for write operations */
  walletClient: WalletClient;
}

/**
 * SDK error codes
 */
export enum BridgeErrorCode {
  INVALID_CONFIG = 'INVALID_CONFIG',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INSUFFICIENT_ALLOWANCE = 'INSUFFICIENT_ALLOWANCE',
  NETWORK_MISMATCH = 'NETWORK_MISMATCH',
  UNSUPPORTED_NETWORK = 'UNSUPPORTED_NETWORK',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  ATTESTATION_FAILED = 'ATTESTATION_FAILED',
  USER_REJECTED = 'USER_REJECTED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * SDK error class with typed error codes
 */
export class BridgeError extends Error {
  public readonly code: BridgeErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: BridgeErrorCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'BridgeError';
    this.code = code;
    this.details = details;
  }
}
