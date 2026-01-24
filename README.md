# Bridge Swift

**One-click USDC to USDCx bridge for Stacks blockchain**

Built for the DoraHacks Stacks USDCx Hackathon

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Bridge Swift simplifies cross-chain USDC bridging from Ethereum-compatible networks to Stacks blockchain. The application reduces the traditional 6-8 manual CLI steps into a single-click user experience, making Stacks DeFi accessible to mainstream users.

**Live Demo**: [bridge-swift.vercel.app](https://bridge-swift.vercel.app)  
**Repository**: [github.com/ToXMon/bridge-swift](https://github.com/ToXMon/bridge-swift)

## Problem Statement

Current USDC bridging to Stacks requires:
- Manual CLI operations with 6-8 steps
- Understanding of bytes32 encoding for Stacks addresses
- Technical knowledge of blockchain transactions
- No visual feedback during the bridging process

This complexity results in user abandonment rates exceeding 70% at steps 3-4, significantly limiting Stacks ecosystem adoption.

## Solution

Bridge Swift provides a production-ready web application with:

### Core Features
- **One-Click Bridging**: Complete bridge transactions with minimal user interaction
- **Multi-Chain Support**: Bridge from 6 EVM networks (Ethereum, Base, Arbitrum, Optimism, Polygon, Avalanche)
- **Real-Time Status Tracking**: Visual progress indicators with transaction links to both Etherscan and Hiro Explorer
- **Live Fee Calculation**: Dynamic gas and bridge fee estimation
- **Security-First Design**: Limited token approvals, slippage protection, network validation
- **Transaction History**: Persistent storage of bridge transactions with explorer links
- **Gamified Leaderboard**: Community engagement through bridge volume tracking

### Technical Highlights
- Circle CCTP (Cross-Chain Transfer Protocol) integration
- Stacks address validation with network detection (mainnet/testnet)
- Multi-chain balance verification
- Responsive mobile-first UI
- Comprehensive error handling and user feedback

## Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.x |
| Styling | TailwindCSS |
| Ethereum Integration | Viem + Wagmi |
| Wallet Connection | RainbowKit |
| Stacks Integration | @stacks/transactions |
| State Management | TanStack Query |
| Testing | Playwright |

### Smart Contracts

| Contract | Network | Address |
|----------|---------|---------|
| USDC | Sepolia | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |
| xReserve | Sepolia | `0x008888878f94C0d87defdf0B07f46B93C1934442` |
| USDC | Base | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| xReserve | Base | `0x0085560a3F2b0BfA5cCdb88d5Ff82D7dE3F28d6B` |

### Project Structure

```
bridge-swift/
├── app/                    # Next.js App Router pages
├── components/            # React components
│   ├── BridgeForm.tsx     # Main bridge interface
│   ├── BridgeProgress.tsx # Transaction status tracker
│   ├── LiveFeeDisplay.tsx # Real-time fee calculation
│   ├── TransactionHistory.tsx # Historical transactions
│   └── ...
├── hooks/                 # Custom React hooks
│   ├── useBridge.ts       # Bridge operations
│   ├── useBalances.ts     # Balance fetching
│   └── useMultiChainBalances.ts # Multi-chain support
├── lib/                   # Core business logic
│   ├── bridge.ts          # Bridge functions
│   ├── contracts.ts       # Contract ABIs and addresses
│   ├── encoding.ts        # Stacks address encoding
│   ├── fees.ts            # Fee calculations
│   └── transaction-history.ts # Transaction storage
├── tests/                 # Playwright tests
└── docs/                  # Additional documentation
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- MetaMask or compatible Web3 wallet
- Sepolia ETH for gas fees (testnet)
- Sepolia USDC for bridging (testnet)

### Installation

```bash
# Clone the repository
git clone https://github.com/ToXMon/bridge-swift.git
cd bridge-swift

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and add your WalletConnect Project ID
# Get one at: https://cloud.walletconnect.com/

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

```env
# Required
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Optional
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_ENABLE_TESTNETS=true
```

## Testing

### Testnet Resources

1. **Sepolia ETH**: [sepoliafaucet.com](https://sepoliafaucet.com/)
2. **Sepolia USDC**: [faucet.circle.com](https://faucet.circle.com/)
3. **Stacks Testnet STX**: [Hiro Faucet](https://explorer.hiro.so/sandbox/faucet?chain=testnet)

### Bridge Flow Testing

1. Connect wallet (MetaMask on Sepolia network)
2. Enter bridge amount (minimum 10 USDC per Circle CCTP requirements)
3. Enter Stacks testnet address (starts with ST)
4. Review fees and estimated arrival time
5. Approve USDC spending (limited approval for security)
6. Confirm bridge transaction
7. Monitor progress through visual tracker
8. Verify USDCx arrival on Stacks (approximately 15 minutes)

### Automated Testing

```bash
# Run Playwright tests
npm run test

# Run type checking
npm run type-check
```

## Security Features

### Implemented Protections

1. **Limited Token Approvals**: Maximum $1,000 per transaction to minimize exposure
2. **Slippage Protection**: Configurable slippage tolerance (0.1% - 1.0%)
3. **Network Validation**: Prevents bridging to incorrect network addresses
4. **Input Sanitization**: All user inputs validated and sanitized
5. **CSP Headers**: Content Security Policy prevents XSS attacks
6. **No Custodial Risk**: Non-custodial architecture using Circle CCTP

### Security Best Practices

- Environment variables properly configured in `.gitignore`
- No hardcoded secrets in codebase
- Rate limiting on API endpoints
- Comprehensive error handling without exposing sensitive information

## Deployment

### Production Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
npm run deploy:vercel

# Deploy to Cloudflare Pages
npm run deploy:cloudflare

# Deploy to IPFS
npm run ipfs:deploy
```

See `docs/deployment/` folder for detailed deployment guides for each platform.

## Implementation Summary

### Completed Features (Tasks 1-10)

1. **Security Enhancements**: Limited token approvals, slippage protection
2. **Address Validation**: Network-specific Stacks address validation
3. **Trust Signals**: Protocol statistics and security badges
4. **Progress Tracking**: Real-time bridge status with dual explorer links
5. **Fee Display**: Live gas and bridge fee calculations
6. **Quick Actions**: Preset amount buttons for improved UX
7. **Success Feedback**: Confetti animation on completion
8. **Multi-Chain Balances**: Parallel balance fetching across networks
9. **Gas Optimization**: Dynamic gas estimation
10. **Transaction History**: Persistent storage with explorer integration

See `docs/implementation/` folder for detailed implementation notes.

## Contributing

Contributions are welcome. Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Commit changes with descriptive messages
4. Push to your fork and submit a pull request
5. Ensure all tests pass before submitting

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments

- **Circle**: Cross-Chain Transfer Protocol (CCTP) infrastructure
- **Stacks**: Bitcoin Layer 2 blockchain
- **Katana Network**: Contract patterns and technical guidance
- **DoraHacks**: Hackathon platform and community support

## Contact

For questions or support:
- GitHub Issues: [github.com/ToXMon/bridge-swift/issues](https://github.com/ToXMon/bridge-swift/issues)
- Documentation: See `docs/` folder for detailed guides

---

**Built for DoraHacks Stacks USDCx Hackathon 2024**
