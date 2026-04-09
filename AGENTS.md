# Bridge Swift — Agent Documentation

## Repo Purpose
Cross-chain bridge interface for transferring assets between EVM chains (Ethereum, Base, etc.) and Stacks (Bitcoin L2). Features a Next.js web app with WalletConnect auth, real-time fee display, attestation monitoring, leaderboard, and an exportable SDK for developers.

## Tech Stack
- **Framework**: Next.js 15 (App Router, React 19, TypeScript)
- **Web3**: wagmi + viem + RainbowKit (EVM), @stacks/transactions (Stacks)
- **Auth**: WalletConnect v2 via RainbowKit
- **Bridge**: Custom cross-chain encoding (EVM ↔ Stacks attestation-based)
- **SDK**: Exportable bridge SDK in `sdk/` with config, types, utils
- **Testing**: Jest (unit), Playwright (E2E)
- **Deployment**: IPFS (Fleek/Web3.Storage), Docker
- **UI**: Tailwind CSS, confetti animations, skeleton loading

## Module Map

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js App Router — layout, main page |
| `components/` | UI components — BridgeForm, BalanceCard, NetworkSwitcher, StatusPanel, etc. |
| `hooks/` | React hooks — useBalances, useBridge, useLeaderboard, useMultiChainBalances |
| `lib/` | Core logic — bridge encoding, contract ABIs, fee calculation, wagmi config |
| `sdk/` | Exportable SDK — config, types, utils for programmatic bridge access |
| `scripts/` | Deployment scripts — IPFS upload, attestation monitoring, bridge verification |
| `tests/` | Playwright E2E tests |
| `types/` | Shared TypeScript type definitions |

## Global Standards
- TypeScript strict mode
- Bridge encoding uses @noble/hashes + @scure/base for cryptographic operations
- All cross-chain messages follow attestation-based verification pattern
- wagmi config in `lib/wagmi.ts` defines supported chains
- SDK exports from `sdk/index.ts` — all types in `sdk/types.ts`

## Environment Setup
Key env vars in `.env.example`:
- **Required**: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID (WalletConnect auth)
- **Optional**: NEXT_PUBLIC_ALCHEMY_API_KEY (RPC provider), NEXT_PUBLIC_ENABLE_TESTNETS (testnet mode)
- **Deployment**: FLEEK_API_KEY, WEB3_STORAGE_TOKEN, INFURA_IPFS_* (IPFS hosting)

## Key Patterns

### Bridge Flow
User connects wallet → selects source/destination chain → BridgeForm encodes transaction → wagmi sends TX → attestation tracking monitors confirmation → StatusPanel shows progress → SuccessCelebration on completion.

### Cross-Chain Encoding
`lib/encoding.ts` handles message serialization between EVM and Stacks formats using @noble/hashes for hashing and @scure/base for encoding.

### SDK Pattern
`sdk/` provides programmatic access: `BridgeSDK` class with `config.ts` (chain endpoints), `types.ts` (interfaces), `utils.ts` (helpers). Independently testable.

### Attestation Monitoring
`lib/attestation-tracking.ts` + `components/AttestationMonitor.tsx` track cross-chain transaction attestations in real-time.
