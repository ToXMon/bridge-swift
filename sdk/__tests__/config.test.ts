/**
 * Bridge Swift SDK Tests - Configuration
 * 
 * Tests for SDK configuration utilities and network settings.
 */

import { describe, it, expect } from '@jest/globals';
import {
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
  validateConfig,
} from '../config';

describe('SDK Configuration', () => {
  describe('NETWORK_CONFIGS', () => {
    it('should have all required networks configured', () => {
      const requiredNetworks = ['ethereum', 'arbitrum', 'optimism', 'base', 'polygon', 'avalanche', 'sepolia'];
      
      requiredNetworks.forEach(network => {
        expect(NETWORK_CONFIGS).toHaveProperty(network);
      });
    });

    it('should have valid USDC addresses for all networks', () => {
      Object.entries(NETWORK_CONFIGS).forEach(([network, config]) => {
        expect(config.USDC).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });
    });

    it('should have valid xReserve addresses for all networks', () => {
      Object.entries(NETWORK_CONFIGS).forEach(([network, config]) => {
        expect(config.X_RESERVE).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });
    });

    it('should have correct chain IDs', () => {
      expect(NETWORK_CONFIGS.ethereum.CHAIN_ID).toBe(1);
      expect(NETWORK_CONFIGS.sepolia.CHAIN_ID).toBe(11155111);
      expect(NETWORK_CONFIGS.base.CHAIN_ID).toBe(8453);
      expect(NETWORK_CONFIGS.arbitrum.CHAIN_ID).toBe(42161);
      expect(NETWORK_CONFIGS.optimism.CHAIN_ID).toBe(10);
      expect(NETWORK_CONFIGS.polygon.CHAIN_ID).toBe(137);
      expect(NETWORK_CONFIGS.avalanche.CHAIN_ID).toBe(43114);
    });

    it('should have correct Stacks network assignments', () => {
      expect(NETWORK_CONFIGS.ethereum.STACKS_NETWORK).toBe('mainnet');
      expect(NETWORK_CONFIGS.sepolia.STACKS_NETWORK).toBe('testnet');
      expect(NETWORK_CONFIGS.base.STACKS_NETWORK).toBe('mainnet');
    });
  });

  describe('BRIDGE_CONSTANTS', () => {
    it('should have correct minimum amount (10 USDC)', () => {
      expect(BRIDGE_CONSTANTS.MIN_AMOUNT).toBe(10_000_000n);
    });

    it('should have correct bridge fee (4.80 USDC)', () => {
      expect(BRIDGE_CONSTANTS.BRIDGE_FEE_USDC).toBe(4_800_000n);
    });

    it('should have max approval set to $1000', () => {
      expect(BRIDGE_CONSTANTS.MAX_APPROVAL).toBe(1_000_000_000n);
    });

    it('should have valid slippage bounds', () => {
      expect(BRIDGE_CONSTANTS.MIN_SLIPPAGE_BPS).toBe(10);
      expect(BRIDGE_CONSTANTS.MAX_SLIPPAGE_BPS).toBe(100);
      expect(BRIDGE_CONSTANTS.DEFAULT_SLIPPAGE_BPS).toBe(50);
    });

    it('should have USDC decimals set to 6', () => {
      expect(BRIDGE_CONSTANTS.USDC_DECIMALS).toBe(6);
    });
  });

  describe('CONTRACT_ABIS', () => {
    it('should have ERC20 ABI with required functions', () => {
      const functionNames = CONTRACT_ABIS.ERC20.map(f => f.name);
      expect(functionNames).toContain('approve');
      expect(functionNames).toContain('balanceOf');
      expect(functionNames).toContain('allowance');
      expect(functionNames).toContain('decimals');
    });

    it('should have xReserve ABI with depositToRemote', () => {
      const functionNames = CONTRACT_ABIS.X_RESERVE.map(f => f.name);
      expect(functionNames).toContain('depositToRemote');
    });
  });

  describe('getNetworkConfig', () => {
    it('should return correct config for known chain IDs', () => {
      expect(getNetworkConfig(1).NAME).toBe('Ethereum');
      expect(getNetworkConfig(11155111).NAME).toBe('Sepolia');
      expect(getNetworkConfig(8453).NAME).toBe('Base');
    });

    it('should return Sepolia config for unknown chain IDs', () => {
      expect(getNetworkConfig(999999).NAME).toBe('Sepolia');
    });
  });

  describe('getNetworkConfigByName', () => {
    it('should return config by network name', () => {
      expect(getNetworkConfigByName('ethereum').CHAIN_ID).toBe(1);
      expect(getNetworkConfigByName('sepolia').CHAIN_ID).toBe(11155111);
    });
  });

  describe('isXReserveSupported', () => {
    it('should return true for Ethereum mainnet', () => {
      expect(isXReserveSupported(1)).toBe(true);
    });

    it('should return true for Sepolia testnet', () => {
      expect(isXReserveSupported(11155111)).toBe(true);
    });

    it('should return false for other chains', () => {
      expect(isXReserveSupported(8453)).toBe(false); // Base
      expect(isXReserveSupported(42161)).toBe(false); // Arbitrum
      expect(isXReserveSupported(10)).toBe(false); // Optimism
    });
  });

  describe('isL2Chain', () => {
    it('should identify L2 chains correctly', () => {
      expect(isL2Chain(8453)).toBe(true); // Base
      expect(isL2Chain(42161)).toBe(true); // Arbitrum
      expect(isL2Chain(10)).toBe(true); // Optimism
      expect(isL2Chain(11155111)).toBe(true); // Sepolia (treated as L2 for fee optimization)
    });

    it('should identify L1 chains correctly', () => {
      expect(isL2Chain(1)).toBe(false); // Ethereum mainnet
      expect(isL2Chain(137)).toBe(false); // Polygon
    });
  });

  describe('getSupportedChainIds', () => {
    it('should return all supported chain IDs', () => {
      const chainIds = getSupportedChainIds();
      expect(chainIds).toContain(1);
      expect(chainIds).toContain(11155111);
      expect(chainIds).toContain(8453);
      expect(chainIds).toHaveLength(7);
    });
  });

  describe('isChainSupported', () => {
    it('should return true for supported chains', () => {
      expect(isChainSupported(1)).toBe(true);
      expect(isChainSupported(11155111)).toBe(true);
    });

    it('should return false for unsupported chains', () => {
      expect(isChainSupported(999999)).toBe(false);
    });
  });

  describe('getXReserveSupportedChains', () => {
    it('should return Ethereum and Sepolia', () => {
      const chains = getXReserveSupportedChains();
      expect(chains).toContain(1);
      expect(chains).toContain(11155111);
      expect(chains).toHaveLength(2);
    });
  });

  describe('createConfig', () => {
    it('should return default config when no config provided', () => {
      const config = createConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should merge user config with defaults', () => {
      const config = createConfig({ debug: true });
      expect(config.debug).toBe(true);
      expect(config.defaultChainId).toBe(DEFAULT_CONFIG.defaultChainId);
    });

    it('should allow overriding all config values', () => {
      const config = createConfig({
        defaultChainId: 1,
        debug: true,
        maxAttestationRetries: 20,
        defaultSlippageBps: 100,
      });
      
      expect(config.defaultChainId).toBe(1);
      expect(config.debug).toBe(true);
      expect(config.maxAttestationRetries).toBe(20);
      expect(config.defaultSlippageBps).toBe(100);
    });
  });
});
