/**
 * Bridge Swift SDK Tests - Main SDK
 * 
 * Tests for the main BridgeSwiftSDK class and its methods.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { BridgeSwiftSDK, createBridgeSDK, BridgeError } from '../index';

// Test addresses
const MAINNET_ADDRESS = 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7';
const TESTNET_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const EVM_ADDRESS = '0x1234567890123456789012345678901234567890' as const;

describe('BridgeSwiftSDK', () => {
  let sdk: BridgeSwiftSDK;

  beforeEach(() => {
    sdk = new BridgeSwiftSDK();
  });

  // ============================================================================
  // Initialization
  // ============================================================================

  describe('initialization', () => {
    it('should create SDK instance with default config', () => {
      const sdk = new BridgeSwiftSDK();
      expect(sdk).toBeDefined();
      expect(sdk.getConfig().debug).toBe(false);
    });

    it('should create SDK instance with custom config', () => {
      const sdk = new BridgeSwiftSDK({ debug: true, defaultSlippageBps: 100 });
      expect(sdk.getConfig().debug).toBe(true);
      expect(sdk.getConfig().defaultSlippageBps).toBe(100);
    });

    it('should merge custom config with defaults', () => {
      const sdk = new BridgeSwiftSDK({ debug: true });
      const config = sdk.getConfig();
      expect(config.debug).toBe(true);
      expect(config.defaultChainId).toBe(11155111); // Default
      expect(config.maxAttestationRetries).toBe(10); // Default
    });
  });

  // ============================================================================
  // Factory Function
  // ============================================================================

  describe('createBridgeSDK factory', () => {
    it('should create SDK instance', () => {
      const sdk = createBridgeSDK();
      expect(sdk).toBeInstanceOf(BridgeSwiftSDK);
    });

    it('should pass config to SDK', () => {
      const sdk = createBridgeSDK({ debug: true });
      expect(sdk.getConfig().debug).toBe(true);
    });
  });

  // ============================================================================
  // Utility Methods
  // ============================================================================

  describe('USDC utilities', () => {
    it('should parse USDC amounts', () => {
      expect(sdk.parseUSDC('1')).toBe(1_000_000n);
      expect(sdk.parseUSDC('10.50')).toBe(10_500_000n);
    });

    it('should format USDC amounts', () => {
      expect(sdk.formatUSDC(1_000_000n)).toBe('1.00');
      expect(sdk.formatUSDC(10_500_000n)).toBe('10.50');
    });

    it('should format USDC with symbol', () => {
      expect(sdk.formatUSDCWithSymbol(1_000_000n)).toBe('$1.00');
    });
  });

  describe('address utilities', () => {
    it('should truncate addresses', () => {
      expect(sdk.truncateAddress(EVM_ADDRESS, 4)).toBe('0x1234...7890');
    });

    it('should detect Stacks network', () => {
      expect(sdk.detectStacksNetwork(MAINNET_ADDRESS)).toBe('mainnet');
      expect(sdk.detectStacksNetwork(TESTNET_ADDRESS)).toBe('testnet');
    });

    it('should encode Stacks recipient', () => {
      const encoded = sdk.encodeStacksRecipient(TESTNET_ADDRESS);
      expect(encoded).toMatch(/^0x[a-f0-9]{64}$/);
    });
  });

  describe('slippage utilities', () => {
    it('should calculate min amount out', () => {
      const result = sdk.calculateMinAmountOut(1_000_000n, 50);
      expect(result).toBe(995_000n);
    });

    it('should validate slippage', () => {
      expect(sdk.isValidSlippage(50)).toBe(true);
      expect(sdk.isValidSlippage(5)).toBe(false);
    });

    it('should convert bps to percent', () => {
      expect(sdk.bpsToPercent(50)).toBe('0.5%');
    });
  });

  describe('explorer URL utilities', () => {
    it('should generate Etherscan URLs', () => {
      const url = sdk.getEtherscanUrl('0x123', 1);
      expect(url).toBe('https://etherscan.io/tx/0x123');
    });

    it('should generate Hiro Explorer URLs', () => {
      const url = sdk.getHiroExplorerUrl('0x123', 'mainnet');
      expect(url).toBe('https://explorer.hiro.so/txid/0x123');
    });
  });

  // ============================================================================
  // Network Configuration
  // ============================================================================

  describe('network configuration', () => {
    it('should get network config by chain ID', () => {
      const config = sdk.getNetworkConfig(1);
      expect(config.NAME).toBe('Ethereum');
    });

    it('should get all supported chain IDs', () => {
      const chainIds = sdk.getSupportedChainIds();
      expect(chainIds).toContain(1);
      expect(chainIds).toContain(11155111);
    });

    it('should check chain support', () => {
      expect(sdk.isChainSupported(1)).toBe(true);
      expect(sdk.isChainSupported(999)).toBe(false);
    });

    it('should check xReserve support', () => {
      expect(sdk.isXReserveSupported(1)).toBe(true);
      expect(sdk.isXReserveSupported(8453)).toBe(false);
    });

    it('should get bridge constants', () => {
      const constants = sdk.getBridgeConstants();
      expect(constants.MIN_AMOUNT).toBe(10_000_000n);
      expect(constants.BRIDGE_FEE_USDC).toBe(4_800_000n);
    });
  });

  // ============================================================================
  // Address Validation
  // ============================================================================

  describe('validateStacksAddress', () => {
    it('should validate mainnet addresses', () => {
      const result = sdk.validateStacksAddress(MAINNET_ADDRESS);
      expect(result.valid).toBe(true);
      expect(result.detectedNetwork).toBe('mainnet');
    });

    it('should validate testnet addresses', () => {
      const result = sdk.validateStacksAddress(TESTNET_ADDRESS);
      expect(result.valid).toBe(true);
      expect(result.detectedNetwork).toBe('testnet');
    });

    it('should validate against specific network', () => {
      const result = sdk.validateStacksAddress(TESTNET_ADDRESS, 'mainnet');
      expect(result.valid).toBe(false);
    });

    it('should reject invalid addresses', () => {
      const result = sdk.validateStacksAddress('INVALID');
      expect(result.valid).toBe(false);
    });
  });

  // ============================================================================
  // Event System
  // ============================================================================

  describe('event system', () => {
    it('should subscribe to events', () => {
      const events: unknown[] = [];
      const unsubscribe = sdk.on((event) => events.push(event));
      
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should unsubscribe from events', () => {
      const events: unknown[] = [];
      const unsubscribe = sdk.on((event) => events.push(event));
      unsubscribe();
      
      // Events should not be received after unsubscribe
      expect(events).toHaveLength(0);
    });
  });

  // ============================================================================
  // Confirmation Time
  // ============================================================================

  describe('getEstimatedConfirmationTime', () => {
    it('should return faster time for L2 chains', () => {
      expect(sdk.getEstimatedConfirmationTime(8453)).toBe(3); // Base
      expect(sdk.getEstimatedConfirmationTime(42161)).toBe(3); // Arbitrum
    });

    it('should return standard time for L1 chains', () => {
      expect(sdk.getEstimatedConfirmationTime(1)).toBe(15); // Ethereum
    });
  });
});

// ============================================================================
// BridgeError Tests
// ============================================================================

describe('BridgeError', () => {
  it('should create error with code and message', () => {
    const error = new BridgeError('INVALID_AMOUNT' as const, 'Invalid amount');
    expect(error.code).toBe('INVALID_AMOUNT');
    expect(error.message).toBe('Invalid amount');
    expect(error.name).toBe('BridgeError');
  });

  it('should include optional details', () => {
    const error = new BridgeError('INVALID_AMOUNT' as const, 'Invalid amount', { min: 10 });
    expect(error.details).toEqual({ min: 10 });
  });

  it('should be instanceof Error', () => {
    const error = new BridgeError('INVALID_AMOUNT' as const, 'Invalid amount');
    expect(error).toBeInstanceOf(Error);
  });
});
