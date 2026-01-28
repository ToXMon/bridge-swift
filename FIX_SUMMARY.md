# Fix Summary: Corrected Stacks Domain ID Configuration

## Problem Identified

The bridge application was using an **incorrect domain ID** when sending cross-chain transfer requests to Stacks via Circle's CCTP protocol.

### Technical Details
- **Incorrect Configuration**: All mainnet chains (Ethereum, Arbitrum, Optimism, Base, Polygon, Avalanche) were configured with `STACKS_DOMAIN: 10001`
- **Correct Configuration**: According to Circle's CCTP specification and feedback on the stuck transaction, Stacks domain ID should be `10003`
- **Root Cause**: The user's transaction (0x5173273d47aea18bc3a19ec279a0250d419c75549a557de06bb37994af96320f) failed to complete because it was sent to domain 10001 instead of 10003

## Changes Made

### 1. SDK Configuration (`sdk/config.ts`)
Updated `STACKS_DOMAIN` from 10001 to 10003 for:
- Ethereum mainnet (chain ID: 1)
- Arbitrum (chain ID: 42161)
- Optimism (chain ID: 10)
- Base (chain ID: 8453)
- Polygon (chain ID: 137)
- Avalanche (chain ID: 43114)

### 2. Library Contracts (`lib/contracts.ts`)
Updated the same `STACKS_DOMAIN` values for all mainnet chains.

### 3. Documentation (`docs/development/DEMO_GUIDE.md`)
Corrected the outdated documentation that showed the wrong domain ID.

## Verification

✅ **All 120 SDK unit tests passed** - No regressions introduced
✅ **TypeScript type checking passed** - No compilation errors
✅ **CodeQL security scan passed** - No security vulnerabilities found

## Impact on User's Stuck Transaction

### The Bad News
**This fix cannot retroactively complete the stuck transaction** from Jan 24, 2026 (TX: 0x5173273d47aea18bc3a19ec279a0250d419c75549a557de06bb37994af96320f). The transaction was already sent to the wrong domain (10001), and the Ethereum funds are locked in Circle's contract.

### The Good News
**All future transactions will work correctly** - New bridge transactions will now use the correct domain ID (10003), allowing proper attestation and minting on Stacks.

## What the User Can Do About the Stuck Transaction

Unfortunately, the stuck transaction cannot be automatically recovered because:
1. The Ethereum transaction used the wrong `remoteDomain` parameter (10001)
2. Circle's attestation service on domain 10001 doesn't recognize Stacks
3. The message cannot be re-routed to the correct domain

### Possible Recovery Options

1. **Contact Circle Support** - They may be able to manually intervene or provide a refund
   - Transaction Hash: `0x5173273d47aea18bc3a19ec279a0250d419c75549a557de06bb37994af96320f`
   - Amount: 12 USDC
   - Recipient: `SP1TDJDKP9KZRXS3C5C4HAKVGBBVF6SQ6AW0GPCQS`

2. **Check xReserve Contract** - In some cases, there may be a recovery mechanism built into the xReserve contract at `0x8888888199b2Df864bf678259607d6D5EBb4e3Ce`

3. **Community Support** - Post in Stacks Discord or forums to see if anyone else has encountered and resolved this issue

## Prevention

This issue has now been fixed application-wide. The incorrect configuration has been corrected in:
- ✅ SDK configuration layer
- ✅ Application contracts layer
- ✅ Documentation

All new bridge transactions will automatically use the correct domain ID (10003) for Stacks.

## Testing Recommendations

Before deploying to production:
1. ✅ Unit tests passed (120 tests)
2. ✅ Type checking passed
3. ✅ Security scan passed
4. ⚠️ **Recommended**: Test a small amount (e.g., 11 USDC minimum) on mainnet to verify the fix works end-to-end

## References

- Feedback source: https://github.com/hirosystems/stacks-blockchain-api/issues/2438
- Circle CCTP Documentation: https://developers.circle.com/stablecoins/docs/cctp-getting-started
- Repository TROUBLESHOOTING.md confirms domain 10003 is correct for Stacks
