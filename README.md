# ⚡ Bridge Swift

**One-click USDC → USDCx bridge for Stacks blockchain**

Built for the [DoraHacks Stacks USDCx Hackathon](https://dorahacks.io/hackathon/stacks-usdcx/detail)

![Bridge Swift](https://img.shields.io/badge/Stacks-USDCx-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

## 🎯 Problem

Bridging USDC from Ethereum to USDCx on Stacks currently requires:
- 6-8 manual code steps
- CLI knowledge
- Understanding of bytes32 encoding
- No visual feedback

**Result:** Users abandon at step 3-4, limiting Stacks adoption.

## 💡 Solution

Bridge Swift provides:
- ✅ **One-click bridging** - No coding required
- ✅ **Real-time status** - Know exactly what's happening
- ✅ **Mobile-first design** - Works on any device
- ✅ **Community leaderboard** - Gamified bridging experience

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask wallet
- Sepolia ETH (for gas)
- Sepolia USDC (to bridge)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/bridge-swift.git
cd bridge-swift

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Add your WalletConnect Project ID to .env
# Get one at: https://cloud.walletconnect.com/

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔑 Environment Variables

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key  # Optional
```

## 🧪 Testing on Testnet

1. **Get Sepolia ETH**: [sepoliafaucet.com](https://sepoliafaucet.com/)
2. **Get Sepolia USDC**: [faucet.circle.com](https://faucet.circle.com/)
3. **Get Stacks testnet STX**: [Hiro Faucet](https://explorer.hiro.so/sandbox/faucet?chain=testnet)

### Test Bridge Flow
1. Connect MetaMask (Sepolia network)
2. Enter amount (min 10 USDC - required by Circle xReserve)
3. Enter your Stacks testnet address (ST...)
4. Click "Bridge to Stacks"
5. Approve USDC spending
6. Confirm bridge transaction
7. Wait ~15 minutes for USDCx to arrive

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS |
| Ethereum | Viem + Wagmi |
| Wallet | RainbowKit |
| Stacks | @stacks/transactions |

## 📁 Project Structure

```
bridge-swift/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── BridgeForm.tsx     # Bridge input form
│   ├── BalanceCard.tsx    # Balance display
│   ├── StatusPanel.tsx    # Transaction status
│   └── Leaderboard.tsx    # Top bridgers
├── hooks/                 # Custom React hooks
│   ├── useBridge.ts       # Bridge operations
│   └── useBalances.ts     # Balance fetching
├── lib/                   # Core logic
│   ├── contracts.ts       # ABIs & addresses
│   ├── bridge.ts          # Bridge functions
│   └── encoding.ts        # Stacks encoding
└── .cascade/              # AI session files
    ├── INSTRUCTIONS.md    # Development guide
    ├── PRD.md             # Requirements
    └── CONTEXT.md         # Technical context
```

## 🔗 Smart Contracts Used

| Contract | Address | Chain |
|----------|---------|-------|
| USDC | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | Sepolia |
| xReserve | `0x008888878f94C0d87defdf0B07f46B93C1934442` | Sepolia |
| USDCx | `ST1PQHQKV...usdcx-v1` | Stacks Testnet |

## 🚢 Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
npx vercel --prod
```

## 📜 License

MIT

## 🙏 Acknowledgments

- [Circle](https://www.circle.com/) - xReserve bridge protocol
- [Stacks](https://www.stacks.co/) - Bitcoin L2
- [Katana](https://katana.network/) - Contract patterns & ABIs
