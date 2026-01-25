/**
 * Bridge Swift SDK Configuration
 * 
 * Provides network configurations and utility functions for the SDK.
 */

import type { 
  NetworkConfig, 
  SupportedNetwork, 
  BridgeSDKConfig 
} from './types';

// ============================================================================
// Network Configurations
// ============================================================================

/**
 * Complete network configurations for all supported chains
 */
export const NETWORK_CONFIGS: Record<SupportedNetwork, NetworkConfig> = {
  ethereum: {
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const,
    X_RESERVE: '0x8888888199b2Df864bf678259607d6D5EBb4e3Ce' as const,
    CHAIN_ID: 1,
    STACKS_DOMAIN: 10001,
    STACKS_USDCX: 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.usdcx-v1',
    STACKS_NETWORK: 'mainnet',
    NAME: 'Ethereum',
    ICON: '⟠',
  },
  arbitrum: {
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as const,
    X_RESERVE: '0x19330d10D9Cc8751218eaf51E8885D058642E08A' as const,
    CHAIN_ID: 42161,
    STACKS_DOMAIN: 10001,
    STACKS_USDCX: 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.usdcx-v1',
    STACKS_NETWORK: 'mainnet',
    NAME: 'Arbitrum',
    ICON: '🔵',
  },
  optimism: {
    USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' as const,
    X_RESERVE: '0x2B4069517957735bE00ceE0fadAE88a26365528f' as const,
    CHAIN_ID: 10,
    STACKS_DOMAIN: 10001,
    STACKS_USDCX: 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.usdcx-v1',
    STACKS_NETWORK: 'mainnet',
    NAME: 'Optimism',
    ICON: '🔴',
  },
  base: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const,
    X_RESERVE: '0x1682Ae6375C4E4A97e4B583BC394c861A46D8962' as const,
    CHAIN_ID: 8453,
    STACKS_DOMAIN: 10001,
    STACKS_USDCX: 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.usdcx-v1',
    STACKS_NETWORK: 'mainnet',
    NAME: 'Base',
    ICON: '🔷',
  },
  polygon: {
    USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' as const,
    X_RESERVE: '0x9daF8c91AEFAE50b9c0E69629D3F6Ca40cA3B3FE' as const,
    CHAIN_ID: 137,
    STACKS_DOMAIN: 10001,
    STACKS_USDCX: 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.usdcx-v1',
    STACKS_NETWORK: 'mainnet',
    NAME: 'Polygon',
    ICON: '🟣',
  },
  avalanche: {
    USDC: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E' as const,
    X_RESERVE: '0x6b25532e1060CE10cc3B0A99e5683b91BFDe6982' as const,
    CHAIN_ID: 43114,
    STACKS_DOMAIN: 10001,
    STACKS_USDCX: 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.usdcx-v1',
    STACKS_NETWORK: 'mainnet',
    NAME: 'Avalanche',
    ICON: '🔺',
  },
  sepolia: {
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as const,
    X_RESERVE: '0x008888878f94C0d87defdf0B07f46B93C1934442' as const,
    CHAIN_ID: 11155111,
    STACKS_DOMAIN: 10003,
    STACKS_USDCX: 'ST1PQHQKVORJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx-v1',
    STACKS_NETWORK: 'testnet',
    NAME: 'Sepolia',
    ICON: '🧪',
  },
};

// ============================================================================
// Bridge Constants
// ============================================================================

/**
 * Bridge protocol constants
 */
export const BRIDGE_CONSTANTS = {
  /** Minimum bridge amount in USDC (10 USDC = 10_000_000 units) */
  MIN_AMOUNT: 10_000_000n,
  /** Bridge fee in USDC (4.80 USDC) */
  BRIDGE_FEE_USDC: 4_800_000n,
  /** Empty hook data for standard bridges */
  HOOK_DATA: '0x' as `0x${string}`,
  /** Expected peg-in time in minutes */
  PEG_IN_TIME_MINUTES: 15,
  /** Maximum approval amount per transaction ($1000) */
  MAX_APPROVAL: 1_000_000_000n,
  /** Default slippage in basis points (0.5% = 50 bps) */
  DEFAULT_SLIPPAGE_BPS: 50,
  /** Minimum slippage in basis points (0.1% = 10 bps) */
  MIN_SLIPPAGE_BPS: 10,
  /** Maximum slippage in basis points (1% = 100 bps) */
  MAX_SLIPPAGE_BPS: 100,
  /** USDC decimals */
  USDC_DECIMALS: 6,
} as const;

/**
 * Contract ABIs for ERC20 and xReserve interactions
 */
export const CONTRACT_ABIS = {
  ERC20: [
    {
      name: 'approve',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'spender', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      outputs: [{ type: 'bool' }],
    },
    {
      name: 'balanceOf',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'account', type: 'address' }],
      outputs: [{ type: 'uint256' }],
    },
    {
      name: 'allowance',
      type: 'function',
      stateMutability: 'view',
      inputs: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
      ],
      outputs: [{ type: 'uint256' }],
    },
    {
      name: 'decimals',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ type: 'uint8' }],
    },
  ] as const,
  
  X_RESERVE: [
    {
      name: 'depositToRemote',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'value', type: 'uint256' },
        { name: 'remoteDomain', type: 'uint32' },
        { name: 'remoteRecipient', type: 'bytes32' },
        { name: 'localToken', type: 'address' },
        { name: 'maxFee', type: 'uint256' },
        { name: 'hookData', type: 'bytes' },
      ],
      outputs: [],
    },
  ] as const,
} as const;

// ============================================================================
// Configuration Utilities
// ============================================================================

/**
 * Default SDK configuration
 */
export const DEFAULT_CONFIG: Required<BridgeSDKConfig> = {
  defaultChainId: NETWORK_CONFIGS.sepolia.CHAIN_ID,
  debug: false,
  rpcUrls: {},
  maxAttestationRetries: 10,
  defaultSlippageBps: BRIDGE_CONSTANTS.DEFAULT_SLIPPAGE_BPS,
};

/**
 * Get network configuration by chain ID
 */
export function getNetworkConfig(chainId: number): NetworkConfig {
  const network = Object.values(NETWORK_CONFIGS).find(
    config => config.CHAIN_ID === chainId
  );
  return network || NETWORK_CONFIGS.sepolia;
}

/**
 * Get network configuration by network name
 */
export function getNetworkConfigByName(network: SupportedNetwork): NetworkConfig {
  return NETWORK_CONFIGS[network];
}

/**
 * Get all supported chain IDs
 */
export function getSupportedChainIds(): number[] {
  return Object.values(NETWORK_CONFIGS).map(config => config.CHAIN_ID);
}

/**
 * Check if a chain ID is supported
 */
export function isChainSupported(chainId: number): boolean {
  return getSupportedChainIds().includes(chainId);
}

/**
 * Check if a chain supports xReserve for Stacks bridging
 * Currently only Ethereum mainnet and Sepolia support direct bridging to Stacks
 */
export function isXReserveSupported(chainId: number): boolean {
  return chainId === 1 || chainId === 11155111;
}

/**
 * Get chains that support xReserve for Stacks bridging
 */
export function getXReserveSupportedChains(): number[] {
  return [1, 11155111];
}

/**
 * Determine if a chain is a Layer 2 network
 * L2s benefit from different fee optimization strategies
 */
export function isL2Chain(chainId: number): boolean {
  const l2Chains = [8453, 42161, 10, 11155111]; // Base, Arbitrum, Optimism, Sepolia
  return l2Chains.includes(chainId);
}

/**
 * Validate SDK configuration
 */
export function validateConfig(config: BridgeSDKConfig): Required<BridgeSDKConfig> {
  return {
    defaultChainId: config.defaultChainId ?? DEFAULT_CONFIG.defaultChainId,
    debug: config.debug ?? DEFAULT_CONFIG.debug,
    rpcUrls: config.rpcUrls ?? DEFAULT_CONFIG.rpcUrls,
    maxAttestationRetries: config.maxAttestationRetries ?? DEFAULT_CONFIG.maxAttestationRetries,
    defaultSlippageBps: config.defaultSlippageBps ?? DEFAULT_CONFIG.defaultSlippageBps,
  };
}

/**
 * Create a merged configuration with defaults
 */
export function createConfig(userConfig?: BridgeSDKConfig): Required<BridgeSDKConfig> {
  if (!userConfig) return { ...DEFAULT_CONFIG };
  return validateConfig(userConfig);
}
