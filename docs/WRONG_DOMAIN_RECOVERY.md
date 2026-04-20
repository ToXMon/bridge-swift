# Recovery Guide: Wrong Domain Used in Bridge Transaction

## Your Situation

Based on the transaction in IMG_0326.jpeg, you sent:
- **Amount**: 12 USDC
- **remoteDomain**: `10001` (Stacks **mainnet**)
- **remoteToken**: `661237037DC811823D8B2DE17AAABB8EF2AC9B713CA7DB3B01FC7F7BAF7DB562` (correctly encoded Stacks address)
- **maxFee**: 4.8 USDC

## The Problem

You used **`remoteDomain: 10001`** which is for **Stacks mainnet**, but based on the transaction being on Sepolia (testnet), you likely intended to use **`remoteDomain: 10003`** for **Stacks testnet**.

### What This Means:
- ✅ Your `remoteToken` parameter was **correctly encoded** - this is NOT the issue
- ❌ The domain mismatch means the attestation service directed funds to mainnet instead of testnet
- The actual USDC token address (passed separately in `localToken`) was correct

## Understanding the Domain Parameter

| remoteDomain | Network | When to Use |
|--------------|---------|-------------|
| `10001` | Stacks Mainnet | Production transactions on Ethereum mainnet |
| `10003` | Stacks Testnet | Testing transactions on Sepolia testnet |

**Key Point**: The domain MUST match your source chain:
- Sepolia → `10003` (testnet)
- Ethereum Mainnet → `10001` (mainnet)

## Impact on Your Transaction

Your funds went through the Circle CCTP protocol with:
1. ✅ Correct Stacks address encoding (remoteToken)
2. ✅ Correct USDC amount
3. ❌ **Wrong destination domain**

This creates a cross-chain routing issue where:
- Sepolia USDC was locked in the testnet xReserve contract
- Attestation was requested for mainnet domain (`10001`)
- The attestation service may reject this as an invalid configuration

## Recovery Options

### Option 1: Check if Funds Arrived on Mainnet (Unlikely but Possible)

If the attestation somehow processed, check your Stacks **mainnet** address:

1. Decode your remoteToken to get the Stacks address:
   ```bash
   # The remoteToken encodes your actual Stacks address
   # Check the mainnet version of this address
   ```

2. Check on Stacks mainnet explorer:
   ```
   https://explorer.hiro.so/address/<your-stacks-address>
   ```

3. Look for USDCx token: `SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.usdcx-v1`

**Likelihood**: Very low, as Sepolia USDC cannot typically mint mainnet USDCx.

### Option 2: Contact Circle Support (Recommended)

Circle's CCTP protocol handles the cross-chain transfer. They may be able to:
- Identify if the transaction is stuck in attestation
- Provide a manual recovery process
- Clarify the status of the locked funds

**Contact Information**:
- Circle Developer Support: https://developers.circle.com/support
- Provide them with:
  - Transaction hash from Sepolia Etherscan
  - Expected domain: `10003` (testnet)
  - Actual domain used: `10001` (mainnet)
  - Your Stacks address (decoded from remoteToken)

### Option 3: Check xReserve Contract for Recovery Functions

The xReserve contract may have admin functions to recover misrouted funds:

1. Review the contract on Sepolia Etherscan:
   ```
   https://sepolia.etherscan.io/address/0x008888878f94C0d87defdf0B07f46B93C1934442
   ```

2. Look for functions like:
   - `recoverFunds`
   - `cancelBurn`
   - `adminWithdraw`

**Note**: These typically require contract owner permissions.

### Option 4: Wait for Attestation Timeout

Some CCTP implementations have timeout mechanisms:
- If attestation cannot be fulfilled, funds may become reclaimable after a timeout period
- This could be 24-48 hours or longer
- Check the contract documentation for timeout parameters

## Preventing This Issue in the Future

### For Users:
1. **Always verify the domain matches your source chain**:
   - Sepolia → use `10003`
   - Ethereum Mainnet → use `10001`

2. **Use the Bridge Swift UI instead of manual transactions**:
   - The UI automatically sets the correct domain based on connected network
   - Go to: https://bridge-swift.vercel.app

3. **Double-check all parameters before signing**

### For Developers:
The Bridge Swift codebase already handles this correctly:

```typescript
// From lib/contracts.ts
sepolia: {
  STACKS_DOMAIN: 10003,  // Automatically uses testnet domain
  STACKS_NETWORK: 'testnet'
}

ethereum: {
  STACKS_DOMAIN: 10001,  // Automatically uses mainnet domain
  STACKS_NETWORK: 'mainnet'
}
```

When using `getNetworkConfig(chainId)`, the correct domain is automatically selected.

## About the remoteToken Parameter

**Important**: The `remoteToken` parameter in your transaction was **NOT** the problem. It was correctly encoded as:

```
remoteToken: 661237037DC811823D8B2DE17AAABB8EF2AC9B713CA7DB3B01FC7F7BAF7DB562
```

This is your Stacks address properly encoded to bytes32 format. The question from the developer relations expert was asking "how did you pass this parameter?" to understand your process, not to indicate it was wrong.

For full details on how remoteToken encoding works, see:
- [REMOTE_TOKEN_ENCODING.md](./REMOTE_TOKEN_ENCODING.md)
- [QUICK_REFERENCE_REMOTE_TOKEN.md](./QUICK_REFERENCE_REMOTE_TOKEN.md)

## Summary

| Parameter | Your Value | Status | Notes |
|-----------|------------|--------|-------|
| value | 12000000 | ✅ Correct | 12 USDC |
| remoteDomain | 10001 | ❌ **Wrong** | Should be 10003 for Sepolia |
| remoteToken | 661237...7DB562 | ✅ Correct | Properly encoded Stacks address |
| maxFee | 4800000 | ✅ Correct | 4.8 USDC fee |
| hookData | (empty) | ✅ Correct | No hook needed |

## Next Steps

1. **Immediate**: Contact Circle support with your transaction hash
2. **Short-term**: Monitor Stacks mainnet and testnet explorers for any token arrival
3. **Long-term**: Use Bridge Swift UI to avoid manual parameter errors

## Need Help?

- **Circle Support**: https://developers.circle.com/support
- **Stacks Discord**: https://discord.gg/stacks
- **Bridge Swift Issues**: https://github.com/ToXMon/bridge-swift/issues

Include this information when asking for help:
- Sepolia transaction hash
- Expected domain: 10003 (testnet)
- Actual domain: 10001 (mainnet)  
- Amount: 12 USDC
- Your decoded Stacks address from the remoteToken parameter
