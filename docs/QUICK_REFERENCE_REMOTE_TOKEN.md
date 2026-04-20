# Quick Reference: remoteToken Parameter

## TL;DR

The `remoteToken` parameter (as displayed in transaction explorers) is the ABI parameter `remoteRecipient`—**not a token address**, but the **encoded Stacks recipient address** in bytes32 format.

## From the Transaction (IMG_0326.jpeg)

```
remoteToken (bytes32): 661237037DC811823D8B2DE17AAABB8EF2AC9B713CA7DB3B01FC7F7BAF7DB562
```

This hex value is a Stacks address encoded to bytes32. 

> **Note**: Transaction explorers display this as `remoteToken`, but the smart contract ABI parameter name is `remoteRecipient`.

## How It Works

```typescript
// Step 1: User provides Stacks address
const stacksAddress = 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7';

// Step 2: Encode to bytes32
const remoteRecipient = encodeStacksRecipient(stacksAddress);
// Result: '0x00000000000000000000001a...'

// Step 3: Pass to bridge contract
await depositToRemote(
  amount,            // 12000000 (12 USDC)
  remoteDomain,      // 10001 (Stacks mainnet)
  remoteRecipient,   // Encoded Stacks address
  localToken,        // USDC contract address
  maxFee,            // 4800000 (4.8 USDC)
  hookData           // '0x' (empty)
);
```

## The Encoding Function

```typescript
function encodeStacksRecipient(stacksAddress: string): `0x${string}` {
  const address = createAddress(stacksAddress);
  const encoded = new Uint8Array(32);
  encoded[11] = address.version;        // Version byte at position 11
  const hash160Bytes = hex.decode(address.hash160);
  encoded.set(hash160Bytes, 12);        // Hash160 bytes at positions 12-31
  return `0x${hex.encode(encoded)}`;
}
```

## Why This Matters

1. **Cross-chain compatibility**: CCTP needs a standard 32-byte format
2. **Preserves network info**: Version byte indicates mainnet vs testnet
3. **No confusion**: The actual token address (USDC) is passed separately in `localToken`
4. **Terminology**: Explorers show `remoteToken`, but the ABI parameter is `remoteRecipient`

## Key Files

- Full explanation: [`docs/REMOTE_TOKEN_ENCODING.md`](./REMOTE_TOKEN_ENCODING.md)
- Encoding implementation: [`lib/encoding.ts`](../lib/encoding.ts), [`sdk/utils.ts`](../sdk/utils.ts)
- Bridge logic: [`lib/bridge.ts`](../lib/bridge.ts)

## Testing

Run SDK tests to validate encoding:
```bash
npm run test:sdk
```

All 120 tests passing ✓
