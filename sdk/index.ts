/**
 * Bridge Swift SDK
 * 
 * A comprehensive SDK for building USDC to USDCx bridges for the Stacks blockchain.
 * Provides a developer-friendly API for bridging operations, fee estimation, and
 * transaction tracking.
 * 
 * @packageDocumentation
 * 
 * @example Basic Usage
 * ```typescript
 * import { BridgeSwiftSDK } from '@bridge-swift/sdk';
 * import { createPublicClient, createWalletClient, http } from 'viem';
 * import { sepolia } from 'viem/chains';
 * 
 * // Initialize SDK
 * const sdk = new BridgeSwiftSDK({ debug: true });
 * 
 * // Create viem clients
 * const publicClient = createPublicClient({ chain: sepolia, transport: http() });
 * const walletClient = createWalletClient({ chain: sepolia, transport: http() });
 * 
 * // Execute bridge
 * const result = await sdk.bridge({
 *   amount: sdk.parseUSDC('100'),
 *   stacksRecipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
 *   account: '0x...',
 *   chainId: 11155111,
 * }, publicClient, walletClient);
 * ```
 */

import type { Address, Hash, PublicClient, WalletClient } from 'viem';
import type { 
  BridgeSDKConfig, 
  BridgeParams, 
  BridgeResult,
  FeeEstimate,
  NetworkConfig,
  StacksNetwork,
  StacksAddressValidation,
  BridgeEvent,
  BridgeEventListener,
} from './types';
import { BridgeError, BridgeErrorCode } from './types';
import { 
  NETWORK_CONFIGS,
  BRIDGE_CONSTANTS, 
  CONTRACT_ABIS,
  getNetworkConfig,
  isXReserveSupported,
  isL2Chain,
  createConfig,
  getSupportedChainIds,
  isChainSupported,
} from './config';
import {
  encodeStacksRecipient,
  detectStacksNetwork,
  isValidStacksAddress,
  validateStacksAddressForNetwork,
  formatUSDC,
  parseUSDC,
  formatUSDCWithSymbol,
  truncateAddress,
  calculateMinAmountOut,
  isValidSlippage,
  bpsToPercent,
  getEtherscanUrl,
  getHiroExplorerUrl,
  validateBridgeAmount,
  isValidEVMAddress,
} from './utils';

// ============================================================================
// Main SDK Class
// ============================================================================

/**
 * Bridge Swift SDK - Main entry point
 * 
 * Provides a unified API for USDC to USDCx bridging operations on the Stacks blockchain.
 * Supports multiple EVM source chains and includes utilities for address validation,
 * fee estimation, and transaction tracking.
 */
export class BridgeSwiftSDK {
  private config: Required<BridgeSDKConfig>;
  private eventListeners: Set<BridgeEventListener> = new Set();

  /**
   * Create a new Bridge Swift SDK instance
   * 
   * @param config - SDK configuration options
   * 
   * @example
   * ```typescript
   * // Basic initialization
   * const sdk = new BridgeSwiftSDK();
   * 
   * // With custom configuration
   * const sdk = new BridgeSwiftSDK({
   *   defaultChainId: 1, // Ethereum mainnet
   *   debug: true,
   *   defaultSlippageBps: 100, // 1% slippage
   * });
   * ```
   */
  constructor(config?: BridgeSDKConfig) {
    this.config = createConfig(config);
    this.log('SDK initialized with config:', this.config);
  }

  // ==========================================================================
  // Bridge Operations
  // ==========================================================================

  /**
   * Execute a complete bridge operation (approval + bridge)
   * 
   * @param params - Bridge parameters
   * @param publicClient - Viem public client for read operations
   * @param walletClient - Viem wallet client for write operations
   * @returns Bridge result with transaction hashes
   * 
   * @example
   * ```typescript
   * const result = await sdk.bridge({
   *   amount: sdk.parseUSDC('100'),
   *   stacksRecipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
   *   account: '0x1234...',
   *   chainId: 11155111,
   * }, publicClient, walletClient);
   * 
   * console.log('Bridge hash:', result.bridgeHash);
   * ```
   */
  async bridge(
    params: BridgeParams,
    publicClient: PublicClient,
    walletClient: WalletClient
  ): Promise<BridgeResult> {
    this.log('Starting bridge operation:', params);

    // Validate parameters
    this.validateBridgeParams(params);

    const { amount, stacksRecipient, account, chainId } = params;
    const networkConfig = getNetworkConfig(chainId);

    // Check and handle allowance
    const allowance = await this.getAllowance(account, publicClient, chainId);
    let approvalHash: Hash | undefined;

    if (allowance < amount) {
      this.emitEvent({ type: 'approval_started', timestamp: Date.now() });
      approvalHash = await this.approveUSDC(amount, account, walletClient, publicClient, chainId);
      this.emitEvent({ type: 'approval_submitted', timestamp: Date.now(), txHash: approvalHash });
      
      await publicClient.waitForTransactionReceipt({ hash: approvalHash });
      this.emitEvent({ type: 'approval_confirmed', timestamp: Date.now(), txHash: approvalHash });
    }

    // Execute bridge
    this.emitEvent({ type: 'bridge_started', timestamp: Date.now() });
    const bridgeHash = await this.executeBridgeTransaction(params, walletClient, publicClient);
    this.emitEvent({ type: 'bridge_submitted', timestamp: Date.now(), txHash: bridgeHash });

    const detectedNetwork = detectStacksNetwork(stacksRecipient);

    return {
      approvalHash,
      bridgeHash,
      network: detectedNetwork || networkConfig.STACKS_NETWORK,
    };
  }

  /**
   * Approve USDC spending for bridge contract
   * 
   * @param amount - Amount to approve
   * @param account - Account address
   * @param walletClient - Wallet client
   * @param publicClient - Public client
   * @param chainId - Chain ID
   * @returns Approval transaction hash
   */
  async approveUSDC(
    amount: bigint,
    account: Address,
    walletClient: WalletClient,
    publicClient: PublicClient,
    chainId: number
  ): Promise<Hash> {
    const config = getNetworkConfig(chainId);
    
    // Apply max approval cap
    const approvalAmount = amount > BRIDGE_CONSTANTS.MAX_APPROVAL 
      ? BRIDGE_CONSTANTS.MAX_APPROVAL 
      : amount;

    // Reset existing approval if needed
    const currentAllowance = await this.getAllowance(account, publicClient, chainId);
    if (currentAllowance > 0n) {
      const feeData = await this.getOptimizedFeeData(publicClient, chainId);
      const resetHash = await walletClient.writeContract({
        address: config.USDC,
        abi: CONTRACT_ABIS.ERC20,
        functionName: 'approve',
        args: [config.X_RESERVE, 0n],
        account,
        chain: walletClient.chain,
        gas: 150_000n,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      });
      await publicClient.waitForTransactionReceipt({ hash: resetHash });
    }

    // Estimate gas
    let approvalGas: bigint;
    try {
      const estimate = await publicClient.estimateContractGas({
        address: config.USDC,
        abi: CONTRACT_ABIS.ERC20,
        functionName: 'approve',
        args: [config.X_RESERVE, approvalAmount],
        account,
      });
      approvalGas = estimate * 120n / 100n; // 20% buffer
    } catch {
      approvalGas = 150_000n; // Fallback
    }

    const feeData = await this.getOptimizedFeeData(publicClient, chainId);

    return walletClient.writeContract({
      address: config.USDC,
      abi: CONTRACT_ABIS.ERC20,
      functionName: 'approve',
      args: [config.X_RESERVE, approvalAmount],
      account,
      chain: walletClient.chain,
      gas: approvalGas,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    });
  }

  /**
   * Execute the bridge transaction (deposit to remote)
   */
  private async executeBridgeTransaction(
    params: BridgeParams,
    walletClient: WalletClient,
    publicClient: PublicClient
  ): Promise<Hash> {
    const { amount, stacksRecipient, account, chainId } = params;
    const config = getNetworkConfig(chainId);
    const remoteRecipient = encodeStacksRecipient(stacksRecipient);

    const estimatedGas = await this.estimateBridgeGas(publicClient, params);
    const feeData = await this.getOptimizedFeeData(publicClient, chainId);

    return walletClient.writeContract({
      address: config.X_RESERVE,
      abi: CONTRACT_ABIS.X_RESERVE,
      functionName: 'depositToRemote',
      args: [
        amount,
        config.STACKS_DOMAIN,
        remoteRecipient,
        config.USDC,
        BRIDGE_CONSTANTS.BRIDGE_FEE_USDC,
        BRIDGE_CONSTANTS.HOOK_DATA,
      ],
      account,
      chain: walletClient.chain,
      gas: estimatedGas,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    });
  }

  // ==========================================================================
  // Balance & Allowance Methods
  // ==========================================================================

  /**
   * Get USDC balance for an address
   * 
   * @param address - Wallet address
   * @param publicClient - Public client
   * @param chainId - Chain ID
   * @returns USDC balance in smallest units
   */
  async getUSDCBalance(
    address: Address,
    publicClient: PublicClient,
    chainId: number
  ): Promise<bigint> {
    const config = getNetworkConfig(chainId);
    return publicClient.readContract({
      address: config.USDC,
      abi: CONTRACT_ABIS.ERC20,
      functionName: 'balanceOf',
      args: [address],
    });
  }

  /**
   * Get current USDC allowance for xReserve contract
   * 
   * @param owner - Token owner address
   * @param publicClient - Public client
   * @param chainId - Chain ID
   * @returns Current allowance
   */
  async getAllowance(
    owner: Address,
    publicClient: PublicClient,
    chainId: number
  ): Promise<bigint> {
    const config = getNetworkConfig(chainId);
    return publicClient.readContract({
      address: config.USDC,
      abi: CONTRACT_ABIS.ERC20,
      functionName: 'allowance',
      args: [owner, config.X_RESERVE],
    });
  }

  // ==========================================================================
  // Fee Estimation Methods
  // ==========================================================================

  /**
   * Estimate complete bridge fees including gas and protocol fees
   * 
   * @param params - Bridge parameters
   * @param publicClient - Public client
   * @returns Comprehensive fee estimate
   * 
   * @example
   * ```typescript
   * const fees = await sdk.estimateFees({
   *   amount: sdk.parseUSDC('100'),
   *   stacksRecipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
   *   account: '0x...',
   *   chainId: 11155111,
   * }, publicClient);
   * 
   * console.log('Estimated gas:', fees.estimatedGas);
   * console.log('Bridge fee:', sdk.formatUSDC(fees.bridgeFeeUsdc));
   * ```
   */
  async estimateFees(
    params: BridgeParams,
    publicClient: PublicClient
  ): Promise<FeeEstimate> {
    const estimatedGas = await this.estimateBridgeGas(publicClient, params);
    const feeData = await this.getOptimizedFeeData(publicClient, params.chainId);
    
    const estimatedCostWei = estimatedGas * feeData.maxFeePerGas;
    const estimatedConfirmationTime = this.getEstimatedConfirmationTime(params.chainId);

    return {
      estimatedGas,
      feeData,
      estimatedCostWei,
      bridgeFeeUsdc: BRIDGE_CONSTANTS.BRIDGE_FEE_USDC,
      estimatedConfirmationTime,
    };
  }

  /**
   * Estimate gas for bridge transaction
   */
  async estimateBridgeGas(
    publicClient: PublicClient,
    params: BridgeParams
  ): Promise<bigint> {
    const config = getNetworkConfig(params.chainId);
    const remoteRecipient = encodeStacksRecipient(params.stacksRecipient);

    try {
      const estimate = await publicClient.estimateContractGas({
        address: config.X_RESERVE,
        abi: CONTRACT_ABIS.X_RESERVE,
        functionName: 'depositToRemote',
        args: [
          params.amount,
          config.STACKS_DOMAIN,
          remoteRecipient,
          config.USDC,
          BRIDGE_CONSTANTS.BRIDGE_FEE_USDC,
          BRIDGE_CONSTANTS.HOOK_DATA,
        ],
        account: params.account,
      });

      return estimate * 120n / 100n; // 20% buffer
    } catch {
      return 500_000n; // Fallback
    }
  }

  /**
   * Get optimized EIP-1559 fee data
   */
  private async getOptimizedFeeData(
    publicClient: PublicClient,
    chainId: number
  ): Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }> {
    try {
      const feeData = await publicClient.estimateFeesPerGas();

      if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
        const gasPrice = await publicClient.getGasPrice();
        return { maxFeePerGas: gasPrice, maxPriorityFeePerGas: gasPrice };
      }

      const priorityFeeMultiplier = isL2Chain(chainId) ? 150n : 120n;
      const maxFeeMultiplier = isL2Chain(chainId) ? 110n : 115n;

      const maxPriorityFeePerGas = (feeData.maxPriorityFeePerGas * priorityFeeMultiplier) / 100n;
      const maxFeePerGas = (feeData.maxFeePerGas * maxFeeMultiplier) / 100n;

      const baseFee = feeData.maxFeePerGas - feeData.maxPriorityFeePerGas;
      const adjustedMaxFee = baseFee + maxPriorityFeePerGas > maxFeePerGas 
        ? baseFee + maxPriorityFeePerGas 
        : maxFeePerGas;

      return { maxFeePerGas: adjustedMaxFee, maxPriorityFeePerGas };
    } catch {
      try {
        const gasPrice = await publicClient.getGasPrice();
        const bufferedGasPrice = (gasPrice * 120n) / 100n;
        return { maxFeePerGas: bufferedGasPrice, maxPriorityFeePerGas: bufferedGasPrice };
      } catch {
        return {
          maxFeePerGas: 20_000_000_000n,
          maxPriorityFeePerGas: 2_000_000_000n,
        };
      }
    }
  }

  /**
   * Get estimated confirmation time for a chain
   */
  getEstimatedConfirmationTime(chainId: number): number {
    return isL2Chain(chainId) ? 3 : 15;
  }

  // ==========================================================================
  // Validation Methods
  // ==========================================================================

  /**
   * Validate bridge parameters
   * 
   * @throws BridgeError if validation fails
   */
  private validateBridgeParams(params: BridgeParams): void {
    // Validate amount
    const amountValidation = validateBridgeAmount(params.amount);
    if (!amountValidation.valid) {
      throw new BridgeError(
        BridgeErrorCode.INVALID_AMOUNT,
        amountValidation.reason || 'Invalid amount'
      );
    }

    // Validate Stacks address
    if (!isValidStacksAddress(params.stacksRecipient)) {
      throw new BridgeError(
        BridgeErrorCode.INVALID_ADDRESS,
        'Invalid Stacks recipient address'
      );
    }

    // Validate EVM address
    if (!isValidEVMAddress(params.account)) {
      throw new BridgeError(
        BridgeErrorCode.INVALID_ADDRESS,
        'Invalid EVM account address'
      );
    }

    // Validate chain support
    if (!isXReserveSupported(params.chainId)) {
      const config = getNetworkConfig(params.chainId);
      throw new BridgeError(
        BridgeErrorCode.UNSUPPORTED_NETWORK,
        `${config.NAME} does not support direct bridging to Stacks. Use Ethereum mainnet or Sepolia.`
      );
    }

    // Validate network match
    const detectedNetwork = detectStacksNetwork(params.stacksRecipient);
    const expectedNetwork = getNetworkConfig(params.chainId).STACKS_NETWORK;
    if (detectedNetwork && detectedNetwork !== expectedNetwork) {
      throw new BridgeError(
        BridgeErrorCode.NETWORK_MISMATCH,
        `Stacks address is for ${detectedNetwork} but source chain targets ${expectedNetwork}`
      );
    }
  }

  /**
   * Validate a Stacks address
   * 
   * @param address - Stacks address to validate
   * @param network - Optional network to validate against
   * @returns Validation result
   */
  validateStacksAddress(address: string, network?: StacksNetwork): StacksAddressValidation {
    if (network) {
      return validateStacksAddressForNetwork(address, network);
    }
    return {
      valid: isValidStacksAddress(address),
      detectedNetwork: detectStacksNetwork(address) || undefined,
    };
  }

  // ==========================================================================
  // Event System
  // ==========================================================================

  /**
   * Subscribe to bridge events
   * 
   * @param listener - Event listener callback
   * @returns Unsubscribe function
   * 
   * @example
   * ```typescript
   * const unsubscribe = sdk.on((event) => {
   *   console.log('Bridge event:', event.type);
   *   if (event.txHash) console.log('Tx hash:', event.txHash);
   * });
   * 
   * // Later: unsubscribe();
   * ```
   */
  on(listener: BridgeEventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  /**
   * Emit an event to all listeners
   */
  private emitEvent(event: BridgeEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        this.log('Event listener error:', error);
      }
    });
  }

  // ==========================================================================
  // Utility Methods (Static-like Exports)
  // ==========================================================================

  /** Parse USDC string to bigint */
  parseUSDC = parseUSDC;

  /** Format USDC bigint to string */
  formatUSDC = formatUSDC;

  /** Format USDC with $ symbol */
  formatUSDCWithSymbol = formatUSDCWithSymbol;

  /** Truncate address for display */
  truncateAddress = truncateAddress;

  /** Calculate minimum amount out with slippage */
  calculateMinAmountOut = calculateMinAmountOut;

  /** Validate slippage value */
  isValidSlippage = isValidSlippage;

  /** Convert basis points to percentage */
  bpsToPercent = bpsToPercent;

  /** Get EVM explorer URL */
  getEtherscanUrl = getEtherscanUrl;

  /** Get Stacks explorer URL */
  getHiroExplorerUrl = getHiroExplorerUrl;

  /** Detect Stacks network from address */
  detectStacksNetwork = detectStacksNetwork;

  /** Encode Stacks address for CCTP */
  encodeStacksRecipient = encodeStacksRecipient;

  // ==========================================================================
  // Configuration Getters
  // ==========================================================================

  /**
   * Get network configuration by chain ID
   */
  getNetworkConfig(chainId: number): NetworkConfig {
    return getNetworkConfig(chainId);
  }

  /**
   * Get all supported chain IDs
   */
  getSupportedChainIds(): number[] {
    return getSupportedChainIds();
  }

  /**
   * Check if a chain is supported for bridging
   */
  isChainSupported(chainId: number): boolean {
    return isChainSupported(chainId);
  }

  /**
   * Check if a chain supports direct bridging to Stacks
   */
  isXReserveSupported(chainId: number): boolean {
    return isXReserveSupported(chainId);
  }

  /**
   * Get bridge constants
   */
  getBridgeConstants() {
    return { ...BRIDGE_CONSTANTS };
  }

  /**
   * Get current SDK configuration
   */
  getConfig(): Readonly<Required<BridgeSDKConfig>> {
    return { ...this.config };
  }

  // ==========================================================================
  // Internal Methods
  // ==========================================================================

  /**
   * Log debug messages if debug mode is enabled
   */
  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[BridgeSwiftSDK]', ...args);
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new Bridge Swift SDK instance
 * 
 * @param config - Optional SDK configuration
 * @returns SDK instance
 * 
 * @example
 * ```typescript
 * import { createBridgeSDK } from '@bridge-swift/sdk';
 * 
 * const sdk = createBridgeSDK({ debug: true });
 * ```
 */
export function createBridgeSDK(config?: BridgeSDKConfig): BridgeSwiftSDK {
  return new BridgeSwiftSDK(config);
}

// ============================================================================
// Re-exports
// ============================================================================

// Types
export type {
  BridgeSDKConfig,
  BridgeParams,
  BridgeResult,
  FeeEstimate,
  NetworkConfig,
  StacksNetwork,
  StacksAddressValidation,
  BridgeEvent,
  BridgeEventListener,
  BridgeErrorCode,
  BridgeTransaction,
  AttestationStatus,
  BridgePhase,
  BridgeStatus,
  BridgeEventType,
  SupportedNetwork,
  FeeData,
  SDKClients,
} from './types';

// Error class
export { BridgeError } from './types';

// Configuration
export { 
  NETWORK_CONFIGS,
  BRIDGE_CONSTANTS, 
  CONTRACT_ABIS,
  getNetworkConfig,
  getNetworkConfigByName,
  isXReserveSupported,
  isL2Chain,
  getSupportedChainIds,
  isChainSupported,
  getXReserveSupportedChains,
  DEFAULT_CONFIG,
  createConfig,
} from './config';

// Utilities
export {
  encodeStacksRecipient,
  detectStacksNetwork,
  isValidStacksAddress,
  validateStacksAddressForNetwork,
  formatUSDC,
  parseUSDC,
  formatUSDCWithSymbol,
  truncateAddress,
  calculateMinAmountOut,
  isValidSlippage,
  bpsToPercent,
  getEtherscanUrl,
  getHiroExplorerUrl,
  validateBridgeAmount,
  isValidEVMAddress,
} from './utils';
