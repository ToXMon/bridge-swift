# Bridge Swift - Demo Guide for Mainnet Functionality

## Overview
This guide will help you create a compelling demo video showcasing the bridge's mainnet functionality alongside testnet capabilities.

## Pre-Demo Checklist

### 1. Wallet Setup
- ✅ Ensure you have real USDC on Ethereum mainnet (minimum 10 USDC for bridge)
- ✅ Have some ETH for gas fees on mainnet (~$20-50 recommended)
- ✅ Have Sepolia ETH and test USDC for testnet comparison
- ✅ Install MetaMask or your preferred Web3 wallet

### 2. Environment Setup
```bash
# Make sure your .env.local has:
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key (optional but recommended)
```

### 3. Start the Application
```bash
npm install
npm run dev
```

## Demo Script

### Part 1: Introduction (30 seconds)
**What to show:**
- Open the application at `http://localhost:3000`
- Show the clean, modern UI
- Point out the "Pro Bridge & Leaderboard" title

**What to say:**
> "Welcome to Bridge Swift, a production-ready USDC bridge between Ethereum and Stacks blockchain. This bridge supports both testnet for development and mainnet for real transactions."

### Part 2: Network Switching Feature (1 minute)
**What to show:**
1. Click "Connect Wallet" button
2. Connect your wallet
3. Show the Network Switcher component with two buttons:
   - 🌐 Mainnet (Real USDC)
   - 🧪 Testnet (Test USDC)
4. Click between networks to demonstrate switching
5. Show how the Network Health status updates

**What to say:**
> "The bridge features seamless network switching. Users can toggle between Ethereum mainnet for real transactions and Sepolia testnet for testing. Notice how the network health indicator updates in real-time."

**Key Points to Highlight:**
- Instant network detection
- Visual feedback with gradient highlighting
- Network health monitoring

### Part 3: Testnet Demo (1 minute)
**What to show:**
1. Switch to Sepolia testnet
2. Show your test USDC balance
3. Enter a Stacks address (testnet format: ST...)
4. Enter an amount (e.g., 15 USDC)
5. Click "Bridge to Stacks"
6. Show the approval transaction
7. Show the bridge transaction

**What to say:**
> "Let's start with testnet to demonstrate the flow safely. I'll bridge 15 test USDC to my Stacks testnet address. The process involves two transactions: first, approving the bridge contract to spend USDC, then executing the bridge transfer."

### Part 4: Mainnet Demo - THE MAIN EVENT (2-3 minutes)
**What to show:**
1. **Switch to Mainnet**
   - Click the "🌐 Mainnet" button
   - Show wallet switching to Ethereum mainnet
   - Point out the network indicator changing

2. **Show Real Balances**
   - Display your actual USDC balance on mainnet
   - Show ETH balance for gas
   - Emphasize these are real funds

3. **Execute Real Bridge Transaction**
   - Enter your Stacks mainnet address (SP... format)
   - Enter amount (recommend 10-20 USDC for demo)
   - Click "Bridge to Stacks"
   - **Show the approval transaction in MetaMask**
     - Point out the real gas fees
     - Confirm the transaction
   - **Show the bridge transaction**
     - Highlight the USDC amount being bridged
     - Show the gas estimation
     - Confirm the transaction

4. **Transaction Confirmation**
   - Show the success message
   - Display the transaction hash
   - Open Etherscan to show the real transaction
   - Show the Circle CCTP contract interaction

**What to say:**
> "Now for the exciting part - a real mainnet transaction. I'm switching to Ethereum mainnet where I have actual USDC. This is not a simulation; these are real funds moving through Circle's Cross-Chain Transfer Protocol.
>
> I'll bridge [X] USDC to my Stacks mainnet address. Notice the real gas fees in MetaMask - this is a production transaction on Ethereum mainnet.
>
> The bridge uses Circle's official CCTP contracts:
> - USDC Token: 0xA0b8...eB48
> - TokenMessenger (xReserve): 0xBd3f...3155
>
> And here's the transaction confirmed on Etherscan - completely verifiable on-chain."

**Key Points to Emphasize:**
- Real USDC being transferred
- Production Circle CCTP contracts
- Actual gas fees paid
- Verifiable on Etherscan
- Professional UX even for mainnet transactions

### Part 5: Technical Highlights (1 minute)
**What to show:**
- Open the code briefly to show:
  - `lib/contracts.ts` - Network configurations
  - `components/NetworkSwitcher.tsx` - Switching logic
  - `lib/wagmi.ts` - Multi-chain support

**What to say:**
> "The implementation is production-ready with:
> - Network-specific contract addresses for mainnet and testnet
> - Dynamic configuration based on connected chain
> - Secure transaction handling with proper approvals
> - Real-time balance updates
> - Professional error handling"

### Part 6: Leaderboard & Closing (30 seconds)
**What to show:**
- Scroll to the leaderboard
- Show recent bridge transactions
- Highlight your transaction appearing

**What to say:**
> "The leaderboard tracks all bridge activity, creating a transparent view of cross-chain transfers. This bridge is ready for production use, supporting both development workflows on testnet and real value transfer on mainnet."

## Technical Details for Q&A

### Mainnet Configuration
```typescript
mainnet: {
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  X_RESERVE: '0xBd3fa81B58Ba92a82136038B25aDec7066af3155'
  CHAIN_ID: 1
  STACKS_DOMAIN: 10003
}
```

### Testnet Configuration
```typescript
testnet: {
  USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
  X_RESERVE: '0x008888878f94C0d87defdf0B07f46B93C1934442'
  CHAIN_ID: 11155111 (Sepolia)
  STACKS_DOMAIN: 10003
}
```

### Security Features
- ✅ No hardcoded private keys
- ✅ User-controlled wallet transactions
- ✅ Proper approval flow before transfers
- ✅ Network validation before transactions
- ✅ Real-time balance checks
- ✅ Transaction confirmation waiting

## Troubleshooting

### If Network Switch Fails
- Ensure MetaMask has both networks added
- Check that you have gas on the target network
- Refresh the page and reconnect wallet

### If Transaction Fails
- Verify sufficient USDC balance (minimum 10 USDC)
- Ensure enough ETH for gas
- Check that the Stacks address format is correct (SP... for mainnet, ST... for testnet)
- Confirm you're on the correct network

### If Balances Don't Update
- Wait 10 seconds (auto-refresh interval)
- Manually refresh the page
- Check wallet connection status

## Video Recording Tips

1. **Use Screen Recording Software**
   - OBS Studio (free)
   - Loom (easy to use)
   - QuickTime (Mac)

2. **Prepare Your Screen**
   - Close unnecessary tabs
   - Clear browser console
   - Have Etherscan ready in another tab
   - Zoom browser to 125% for visibility

3. **Audio Tips**
   - Use a good microphone
   - Speak clearly and confidently
   - Pause between sections
   - Emphasize "mainnet" and "real USDC"

4. **Editing**
   - Speed up transaction waiting times
   - Add text overlays for key points
   - Highlight important UI elements
   - Add background music (optional)

## Key Selling Points

1. **Production Ready**: Real mainnet support with Circle's official CCTP
2. **User Friendly**: Seamless network switching with clear visual feedback
3. **Transparent**: All transactions verifiable on-chain
4. **Secure**: Proper approval flow and wallet-controlled transactions
5. **Professional**: Modern UI with real-time updates and error handling

## Mainnet Transaction Checklist

Before recording your mainnet demo:
- [ ] Have 10+ USDC on Ethereum mainnet
- [ ] Have 0.01+ ETH for gas fees
- [ ] Know your Stacks mainnet address (starts with SP)
- [ ] Test the flow on testnet first
- [ ] Have Etherscan ready to verify transaction
- [ ] Clear browser cache for clean demo
- [ ] Practice the demo flow 2-3 times

## Post-Demo

After your successful mainnet transaction:
1. Save the Etherscan transaction link
2. Check your Stacks address for the bridged USDC
3. Screenshot the success state
4. Note the transaction time for the video

---

**Good luck with your demo! You've got a production-ready bridge that works on real mainnet - that's impressive! 🚀**
