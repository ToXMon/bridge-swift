import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia, arbitrum, optimism, base, polygon, avalanche } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Bridge Swift',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains: [mainnet, arbitrum, optimism, base, polygon, avalanche, sepolia],
  ssr: true,
});
