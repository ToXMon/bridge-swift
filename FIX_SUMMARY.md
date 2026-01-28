# Fix Summary: RPC Configuration and Network Detection

## Issue 1: HTTP Request Failed (Thirdweb RPC Error)

### Problem
The deployed Vercel app was showing an error:
```
HTTP request failed. URL: https://l1155111.rpc.thirdweb.com/
Failed to fetch Version: viem@2.44.4
```

### Root Cause
RainbowKit's `getDefaultConfig()` uses thirdweb's RPC endpoints as defaults, which appear to be unreliable or rate-limited. The error URL `https://l1155111.rpc.thirdweb.com/` corresponds to Sepolia testnet (chainId 11155111).

### Solution
Added custom RPC transports in `lib/wagmi.ts` to override the defaults:

```typescript
import { http } from 'wagmi';

const transports = {
  [mainnet.id]: http('https://eth.llamarpc.com'),
  [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
  [optimism.id]: http('https://mainnet.optimism.io'),
  [base.id]: http('https://mainnet.base.org'),
  [polygon.id]: http('https://polygon-rpc.com'),
  [avalanche.id]: http('https://api.avax.network/ext/bc/C/rpc'),
  [sepolia.id]: http('https://rpc.sepolia.org'),
};
```

All these RPCs are:
- Already whitelisted in the CSP headers (`next.config.js`)
- Production-grade public RPC providers
- Used in existing code (hooks already reference these same endpoints)

## Issue 2: Testnet Address Validation Error

### Problem
When users connected with Sepolia (testnet) and entered a testnet address (ST1...), they received an error:
```
This is a testnet address (starts with ST/SN). Switch to testnet or use a mainnet address (SP/SM).
```

### Root Cause
In `components/BridgeForm.tsx`, the network was hardcoded to `'mainnet'`:
```typescript
const [currentNetwork] = useState<StacksNetwork>('mainnet'); // TODO: Make this configurable
```

This meant the form always expected mainnet addresses (SP/SM), even when users were on Sepolia testnet.

### Solution
Changed to dynamically determine the network based on the connected EVM chain:

```typescript
const currentNetwork = getNetworkConfig(chainId).STACKS_NETWORK;
```

Now:
- When on Sepolia (chainId 11155111) → `currentNetwork = 'testnet'` → accepts ST/SN addresses
- When on Ethereum (chainId 1) → `currentNetwork = 'mainnet'` → accepts SP/SM addresses
- All other supported chains (Arbitrum, Optimism, Base, Polygon, Avalanche) → `'mainnet'`

## Files Changed
1. `lib/wagmi.ts` - Added custom RPC transports
2. `components/BridgeForm.tsx` - Fixed network detection logic

## Testing
- ✅ All existing unit tests pass
- ✅ Code review passed with no issues
- ✅ CodeQL security scan passed with no alerts
- ✅ Linting passed on changed files

## Impact
- Users on Sepolia can now use testnet addresses (ST/SN) without errors
- RPC requests will use reliable public endpoints instead of thirdweb
- No breaking changes to existing functionality
- All existing validation logic remains intact
