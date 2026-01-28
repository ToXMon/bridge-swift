export const NETWORK_CONFIGS = {
  ethereum: {
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const,
    X_RESERVE: '0x8888888199b2Df864bf678259607d6D5EBb4e3Ce' as const, // Official Circle xReserve for Stacks
    CHAIN_ID: 1,
    STACKS_DOMAIN: 10003,
    STACKS_USDCX: 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.usdcx-v1',
    STACKS_NETWORK: 'mainnet' as const,
    NAME: 'Ethereum',
    ICON: '⟠',
  },
  arbitrum: {
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as const,
    X_RESERVE: '0x19330d10D9Cc8751218eaf51E8885D058642E08A' as const,
    CHAIN_ID: 42161,
    STACKS_DOMAIN: 10003,
    STACKS_USDCX: 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.usdcx-v1',
    STACKS_NETWORK: 'mainnet' as const,
    NAME: 'Arbitrum',
    ICON: '🔵',
  },
  optimism: {
    USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' as const,
    X_RESERVE: '0x2B4069517957735bE00ceE0fadAE88a26365528f' as const,
    CHAIN_ID: 10,
    STACKS_DOMAIN: 10003,
    STACKS_USDCX: 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.usdcx-v1',
    STACKS_NETWORK: 'mainnet' as const,
    NAME: 'Optimism',
    ICON: '🔴',
  },
  base: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const,
    X_RESERVE: '0x1682Ae6375C4E4A97e4B583BC394c861A46D8962' as const,
    CHAIN_ID: 8453,
    STACKS_DOMAIN: 10003,
    STACKS_USDCX: 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.usdcx-v1',
    STACKS_NETWORK: 'mainnet' as const,
    NAME: 'Base',
    ICON: '🔷',
  },
  polygon: {
    USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' as const,
    X_RESERVE: '0x9daF8c91AEFAE50b9c0E69629D3F6Ca40cA3B3FE' as const,
    CHAIN_ID: 137,
    STACKS_DOMAIN: 10003,
    STACKS_USDCX: 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.usdcx-v1',
    STACKS_NETWORK: 'mainnet' as const,
    NAME: 'Polygon',
    ICON: '🟣',
  },
  avalanche: {
    USDC: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E' as const,
    X_RESERVE: '0x6b25532e1060CE10cc3B0A99e5683b91BFDe6982' as const,
    CHAIN_ID: 43114,
    STACKS_DOMAIN: 10003,
    STACKS_USDCX: 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.usdcx-v1',
    STACKS_NETWORK: 'mainnet' as const,
    NAME: 'Avalanche',
    ICON: '🔺',
  },
  sepolia: {
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as const,
    X_RESERVE: '0x008888878f94C0d87defdf0B07f46B93C1934442' as const,
    CHAIN_ID: 11155111,
    STACKS_DOMAIN: 10003,
    STACKS_USDCX: 'ST1PQHQKVORJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx-v1',
    STACKS_NETWORK: 'testnet' as const,
    NAME: 'Sepolia',
    ICON: '🧪',
  },
} as const;

export type NetworkType = keyof typeof NETWORK_CONFIGS;

export function getNetworkConfig(chainId: number) {
  switch (chainId) {
    case 1: return NETWORK_CONFIGS.ethereum;
    case 42161: return NETWORK_CONFIGS.arbitrum;
    case 10: return NETWORK_CONFIGS.optimism;
    case 8453: return NETWORK_CONFIGS.base;
    case 137: return NETWORK_CONFIGS.polygon;
    case 43114: return NETWORK_CONFIGS.avalanche;
    case 11155111: return NETWORK_CONFIGS.sepolia;
    default: return NETWORK_CONFIGS.sepolia;
  }
}

export function getNetworkName(chainId: number): string {
  return getNetworkConfig(chainId).NAME;
}

export function isMainnet(chainId: number): boolean {
  return chainId !== 11155111;
}

// xReserve for Stacks bridging is ONLY available on Ethereum mainnet and Sepolia testnet
export function isXReserveSupported(chainId: number): boolean {
  return chainId === 1 || chainId === 11155111; // Ethereum mainnet or Sepolia
}

export function getXReserveSupportedChains(): number[] {
  return [1, 11155111]; // Only Ethereum and Sepolia support xReserve->Stacks
}

export const CONTRACTS = NETWORK_CONFIGS.sepolia;

export const STACKS_CONTRACTS = {
  USDCX: NETWORK_CONFIGS.sepolia.STACKS_USDCX,
  NETWORK: NETWORK_CONFIGS.sepolia.STACKS_NETWORK,
} as const;

export const BRIDGE_CONFIG = {
  MIN_AMOUNT: 10_000_000n,
  BRIDGE_FEE_USDC: 4_800_000n,
  HOOK_DATA: '0x' as `0x${string}`,
  PEG_IN_TIME_MINUTES: 15,
} as const;

export const ERC20_ABI = [
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
] as const;

export const X_RESERVE_ABI = [
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
] as const;
