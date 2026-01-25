/**
 * Bridge Swift SDK Tests - Utilities
 * 
 * Tests for SDK utility functions including address validation, encoding, and formatting.
 */

import { describe, it, expect } from '@jest/globals';
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
} from '../utils';

// Test addresses
const MAINNET_ADDRESS = 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7';
const TESTNET_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const MAINNET_MULTISIG = 'SM1Y6EXF21RZ9739DFTEQKB1H044BMM0XVCM4A4NY';
const TESTNET_MULTISIG = 'SN1Y6EXF21RZ9739DFTEQKB1H044BMM0XVCM4A4NY';
const EVM_ADDRESS = '0x1234567890123456789012345678901234567890';

describe('SDK Utilities', () => {
  // ============================================================================
  // Stacks Address Detection
  // ============================================================================
  
  describe('detectStacksNetwork', () => {
    it('should detect mainnet addresses (SP prefix)', () => {
      expect(detectStacksNetwork(MAINNET_ADDRESS)).toBe('mainnet');
    });

    it('should detect mainnet multisig addresses (SM prefix)', () => {
      expect(detectStacksNetwork(MAINNET_MULTISIG)).toBe('mainnet');
    });

    it('should detect testnet addresses (ST prefix)', () => {
      expect(detectStacksNetwork(TESTNET_ADDRESS)).toBe('testnet');
    });

    it('should detect testnet multisig addresses (SN prefix)', () => {
      expect(detectStacksNetwork(TESTNET_MULTISIG)).toBe('testnet');
    });

    it('should return null for invalid addresses', () => {
      expect(detectStacksNetwork('INVALID')).toBe(null);
      expect(detectStacksNetwork('0x1234')).toBe(null);
      expect(detectStacksNetwork('')).toBe(null);
    });

    it('should handle null/undefined gracefully', () => {
      expect(detectStacksNetwork(null as unknown as string)).toBe(null);
      expect(detectStacksNetwork(undefined as unknown as string)).toBe(null);
    });
  });

  // ============================================================================
  // Stacks Address Validation
  // ============================================================================

  describe('isValidStacksAddress', () => {
    it('should validate mainnet addresses without network parameter', () => {
      expect(isValidStacksAddress(MAINNET_ADDRESS)).toBe(true);
    });

    it('should validate testnet addresses without network parameter', () => {
      expect(isValidStacksAddress(TESTNET_ADDRESS)).toBe(true);
    });

    it('should validate mainnet addresses with mainnet parameter', () => {
      expect(isValidStacksAddress(MAINNET_ADDRESS, 'mainnet')).toBe(true);
    });

    it('should reject testnet addresses when mainnet is specified', () => {
      expect(isValidStacksAddress(TESTNET_ADDRESS, 'mainnet')).toBe(false);
    });

    it('should validate testnet addresses with testnet parameter', () => {
      expect(isValidStacksAddress(TESTNET_ADDRESS, 'testnet')).toBe(true);
    });

    it('should reject mainnet addresses when testnet is specified', () => {
      expect(isValidStacksAddress(MAINNET_ADDRESS, 'testnet')).toBe(false);
    });

    it('should reject addresses that are too short', () => {
      expect(isValidStacksAddress('SP123')).toBe(false);
    });

    it('should reject addresses that are too long', () => {
      expect(isValidStacksAddress('SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7TOOLONG123456')).toBe(false);
    });

    it('should reject addresses with invalid c32 characters', () => {
      expect(isValidStacksAddress('SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJI')).toBe(false); // I
      expect(isValidStacksAddress('SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJL')).toBe(false); // L
      expect(isValidStacksAddress('SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJO')).toBe(false); // O
      expect(isValidStacksAddress('SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJU')).toBe(false); // U
    });

    it('should reject addresses with invalid prefixes', () => {
      expect(isValidStacksAddress('SX2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7')).toBe(false);
      expect(isValidStacksAddress('AB2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7')).toBe(false);
    });
  });

  describe('validateStacksAddressForNetwork', () => {
    describe('mainnet validation', () => {
      it('should accept valid mainnet addresses', () => {
        const result = validateStacksAddressForNetwork(MAINNET_ADDRESS, 'mainnet');
        expect(result.valid).toBe(true);
        expect(result.detectedNetwork).toBe('mainnet');
      });

      it('should reject testnet addresses with clear error message', () => {
        const result = validateStacksAddressForNetwork(TESTNET_ADDRESS, 'mainnet');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('testnet address');
        expect(result.detectedNetwork).toBe('testnet');
      });
    });

    describe('testnet validation', () => {
      it('should accept valid testnet addresses', () => {
        const result = validateStacksAddressForNetwork(TESTNET_ADDRESS, 'testnet');
        expect(result.valid).toBe(true);
        expect(result.detectedNetwork).toBe('testnet');
      });

      it('should reject mainnet addresses with clear error message', () => {
        const result = validateStacksAddressForNetwork(MAINNET_ADDRESS, 'testnet');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('mainnet address');
        expect(result.detectedNetwork).toBe('mainnet');
      });
    });

    it('should handle empty input', () => {
      const result = validateStacksAddressForNetwork('', 'mainnet');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid Stacks address format');
    });
  });

  // ============================================================================
  // Stacks Address Encoding
  // ============================================================================

  describe('encodeStacksRecipient', () => {
    it('should encode a valid testnet address', () => {
      const encoded = encodeStacksRecipient(TESTNET_ADDRESS);
      expect(encoded).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it('should encode a valid mainnet address', () => {
      const encoded = encodeStacksRecipient(MAINNET_ADDRESS);
      expect(encoded).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it('should produce different encodings for different addresses', () => {
      const encoded1 = encodeStacksRecipient(MAINNET_ADDRESS);
      const encoded2 = encodeStacksRecipient(TESTNET_ADDRESS);
      expect(encoded1).not.toBe(encoded2);
    });

    it('should throw for invalid addresses', () => {
      expect(() => encodeStacksRecipient('INVALID')).toThrow();
    });
  });

  // ============================================================================
  // USDC Formatting
  // ============================================================================

  describe('formatUSDC', () => {
    it('should format whole numbers correctly', () => {
      expect(formatUSDC(1_000_000n)).toBe('1.00');
      expect(formatUSDC(10_000_000n)).toBe('10.00');
      expect(formatUSDC(100_000_000n)).toBe('100.00');
    });

    it('should format decimal amounts correctly', () => {
      expect(formatUSDC(1_500_000n)).toBe('1.50');
      expect(formatUSDC(10_550_000n)).toBe('10.55');
    });

    it('should respect decimal places parameter', () => {
      expect(formatUSDC(1_234_567n, 6)).toBe('1.234567');
      expect(formatUSDC(1_234_567n, 4)).toBe('1.2346');
    });

    it('should handle zero', () => {
      expect(formatUSDC(0n)).toBe('0.00');
    });

    it('should handle large amounts', () => {
      expect(formatUSDC(1_000_000_000_000n)).toBe('1000000.00');
    });
  });

  describe('parseUSDC', () => {
    it('should parse whole numbers', () => {
      expect(parseUSDC('1')).toBe(1_000_000n);
      expect(parseUSDC('10')).toBe(10_000_000n);
      expect(parseUSDC('100')).toBe(100_000_000n);
    });

    it('should parse decimal amounts', () => {
      expect(parseUSDC('1.5')).toBe(1_500_000n);
      expect(parseUSDC('10.55')).toBe(10_550_000n);
    });

    it('should parse small decimal amounts', () => {
      expect(parseUSDC('0.000001')).toBe(1n);
      expect(parseUSDC('0.01')).toBe(10_000n);
    });

    it('should handle invalid input', () => {
      expect(parseUSDC('')).toBe(0n);
      expect(parseUSDC('abc')).toBe(0n);
      expect(parseUSDC('-1')).toBe(0n);
    });
  });

  describe('formatUSDCWithSymbol', () => {
    it('should include $ symbol', () => {
      expect(formatUSDCWithSymbol(1_000_000n)).toBe('$1.00');
      expect(formatUSDCWithSymbol(10_550_000n)).toBe('$10.55');
    });
  });

  // ============================================================================
  // Address Display
  // ============================================================================

  describe('truncateAddress', () => {
    it('should truncate EVM addresses', () => {
      expect(truncateAddress(EVM_ADDRESS, 4)).toBe('0x1234...7890');
    });

    it('should truncate Stacks addresses', () => {
      expect(truncateAddress(MAINNET_ADDRESS, 4)).toBe('SP2J6Z...9EJ7');
    });

    it('should return short addresses unchanged', () => {
      expect(truncateAddress('0x1234', 4)).toBe('0x1234');
    });

    it('should handle empty string', () => {
      expect(truncateAddress('')).toBe('');
    });

    it('should use default chars if not specified', () => {
      expect(truncateAddress(EVM_ADDRESS)).toBe('0x1234...7890');
    });
  });

  // ============================================================================
  // Slippage Calculations
  // ============================================================================

  describe('calculateMinAmountOut', () => {
    it('should calculate 0.5% slippage correctly', () => {
      const amount = 1_000_000n; // 1 USDC
      const result = calculateMinAmountOut(amount, 50); // 50 bps = 0.5%
      expect(result).toBe(995_000n); // 0.995 USDC
    });

    it('should calculate 1% slippage correctly', () => {
      const amount = 1_000_000n;
      const result = calculateMinAmountOut(amount, 100); // 100 bps = 1%
      expect(result).toBe(990_000n);
    });

    it('should handle zero amount', () => {
      expect(calculateMinAmountOut(0n, 50)).toBe(0n);
    });

    it('should handle large amounts', () => {
      const amount = 1_000_000_000_000n; // 1M USDC
      const result = calculateMinAmountOut(amount, 50);
      expect(result).toBe(995_000_000_000n);
    });
  });

  describe('isValidSlippage', () => {
    it('should accept valid slippage values', () => {
      expect(isValidSlippage(10)).toBe(true); // 0.1%
      expect(isValidSlippage(50)).toBe(true); // 0.5%
      expect(isValidSlippage(100)).toBe(true); // 1%
    });

    it('should reject slippage below minimum', () => {
      expect(isValidSlippage(5)).toBe(false);
      expect(isValidSlippage(0)).toBe(false);
    });

    it('should reject slippage above maximum', () => {
      expect(isValidSlippage(101)).toBe(false);
      expect(isValidSlippage(200)).toBe(false);
    });
  });

  describe('bpsToPercent', () => {
    it('should convert basis points to percentage', () => {
      expect(bpsToPercent(50)).toBe('0.5%');
      expect(bpsToPercent(100)).toBe('1.0%');
      expect(bpsToPercent(10)).toBe('0.1%');
    });
  });

  // ============================================================================
  // Explorer URLs
  // ============================================================================

  describe('getEtherscanUrl', () => {
    const txHash = '0x1234567890abcdef';

    it('should generate Ethereum mainnet URLs', () => {
      expect(getEtherscanUrl(txHash, 1)).toBe(`https://etherscan.io/tx/${txHash}`);
    });

    it('should generate Sepolia testnet URLs', () => {
      expect(getEtherscanUrl(txHash, 11155111)).toBe(`https://sepolia.etherscan.io/tx/${txHash}`);
    });

    it('should generate Base URLs', () => {
      expect(getEtherscanUrl(txHash, 8453)).toBe(`https://basescan.org/tx/${txHash}`);
    });

    it('should generate Arbitrum URLs', () => {
      expect(getEtherscanUrl(txHash, 42161)).toBe(`https://arbiscan.io/tx/${txHash}`);
    });

    it('should default to Etherscan for unknown chains', () => {
      expect(getEtherscanUrl(txHash, 999)).toBe(`https://etherscan.io/tx/${txHash}`);
    });
  });

  describe('getHiroExplorerUrl', () => {
    const txId = '0x1234567890abcdef';

    it('should generate mainnet URLs', () => {
      expect(getHiroExplorerUrl(txId, 'mainnet')).toBe(`https://explorer.hiro.so/txid/${txId}`);
    });

    it('should generate testnet URLs with chain parameter', () => {
      expect(getHiroExplorerUrl(txId, 'testnet')).toBe(`https://explorer.hiro.so/txid/${txId}?chain=testnet`);
    });
  });

  // ============================================================================
  // Validation Utilities
  // ============================================================================

  describe('validateBridgeAmount', () => {
    it('should accept amounts above minimum', () => {
      const result = validateBridgeAmount(10_000_000n); // 10 USDC
      expect(result.valid).toBe(true);
    });

    it('should accept amounts equal to minimum', () => {
      const result = validateBridgeAmount(10_000_000n);
      expect(result.valid).toBe(true);
    });

    it('should reject amounts below minimum', () => {
      const result = validateBridgeAmount(9_000_000n); // 9 USDC
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Minimum');
    });

    it('should reject zero amount', () => {
      const result = validateBridgeAmount(0n);
      expect(result.valid).toBe(false);
    });
  });

  describe('isValidEVMAddress', () => {
    it('should validate correct EVM addresses', () => {
      expect(isValidEVMAddress(EVM_ADDRESS)).toBe(true);
      expect(isValidEVMAddress('0xAbCdEf1234567890123456789012345678901234')).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(isValidEVMAddress('0x123')).toBe(false); // Too short
      expect(isValidEVMAddress('1234567890123456789012345678901234567890')).toBe(false); // No 0x
      expect(isValidEVMAddress('0xGGGG567890123456789012345678901234567890')).toBe(false); // Invalid chars
    });
  });
});
