import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia, arbitrum, optimism, base, polygon, avalanche } from 'wagmi/chains';
import { http } from 'wagmi';

// Custom RPC transports to override RainbowKit's default (unreliable) thirdweb endpoints
const transports = {
  [mainnet.id]: http('https://eth.llamarpc.com'),
  [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
  [optimism.id]: http('https://mainnet.optimism.io'),
  [base.id]: http('https://mainnet.base.org'),
  [polygon.id]: http('https://polygon-rpc.com'),
  [avalanche.id]: http('https://api.avax.network/ext/bc/C/rpc'),
  [sepolia.id]: http('https://rpc.sepolia.org'),
};

export const config = getDefaultConfig({
  appName: 'Bridge Swift',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains: [mainnet, arbitrum, optimism, base, polygon, avalanche, sepolia],
  transports,
  ssr: true,
});
