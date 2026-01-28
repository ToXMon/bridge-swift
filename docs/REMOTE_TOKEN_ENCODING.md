# How the `remoteToken` Argument is Passed

## Transaction Analysis

Based on the transaction depicted in [IMG_0326.jpeg](../IMG_0326.jpeg), here's how the `remoteToken` argument was passed:

### Transaction Parameters Shown:
```
value (uint256): 12000000
remoteDomain (uint32): 10001
remoteToken (bytes32): 661237037DC811823D8B2DE17AAABB8EF2AC9B713CA7DB3B01FC7F7BAF7DB562
maxFee (uint256): 4800000
hookData (bytes): [empty]
```

## Answer: How `remoteToken` Was Passed

The `remoteToken` argument is **NOT** the actual token address. Instead, it's the **encoded Stacks recipient address** in bytes32 format. This is a critical distinction in the Circle CCTP (Cross-Chain Transfer Protocol) bridging process.

### The Encoding Process

#### Step 1: Stacks Address Input
A user provides their Stacks address in the standard format:
- Testnet addresses start with `ST` or `SN`
- Mainnet addresses start with `SP` or `SM`

Example: `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM`

#### Step 2: Address Encoding to bytes32
The Stacks address is encoded into a bytes32 format using the `encodeStacksRecipient()` function:

```typescript
// From lib/encoding.ts and sdk/utils.ts
export function encodeStacksRecipient(stacksAddress: string): `0x${string}` {
  const address = createAddress(stacksAddress);
  const encoded = new Uint8Array(32);
  encoded[11] = address.version;
  const hash160Bytes = hex.decode(address.hash160);
  encoded.set(hash160Bytes, 12);
  return `0x${hex.encode(encoded)}` as `0x${string}`;
}
```

**Encoding Logic:**
1. Creates a 32-byte array (256 bits)
2. Sets byte 11 to the Stacks address version byte
3. Sets bytes 12-31 to the address's hash160 (20 bytes)
4. Returns as a hexadecimal string with `0x` prefix

#### Step 3: Passing to Smart Contract
The encoded bytes32 value is passed as the `remoteRecipient` parameter (which the xReserve contract calls `remoteToken`):

```typescript
// From lib/bridge.ts
export async function executeBridge(
  params: BridgeParams,
  walletClient: WalletClient,
  publicClient: PublicClient
): Promise<Hash> {
  const { amount, stacksRecipient, account, chainId } = params;
  const config = getNetworkConfig(chainId);
  const remoteRecipient = encodeStacksRecipient(stacksRecipient);

  return walletClient.writeContract({
    address: config.X_RESERVE,
    abi: X_RESERVE_ABI,
    functionName: 'depositToRemote',
    args: [
      amount,                              // value: uint256
      config.STACKS_DOMAIN,                // remoteDomain: uint32 (10001 for mainnet, 10003 for testnet)
      remoteRecipient,                     // remoteToken: bytes32 (encoded Stacks address)
      config.USDC,                         // localToken: address (USDC contract)
      BRIDGE_CONFIG.BRIDGE_FEE_USDC,      // maxFee: uint256 (4800000 = 4.8 USDC)
      BRIDGE_CONFIG.HOOK_DATA,            // hookData: bytes (empty: '0x')
    ],
    account,
    chain: walletClient.chain,
    gas: estimatedGas,
    maxFeePerGas: feeData.maxFeePerGas,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
  });
}
```

### Smart Contract ABI

The xReserve contract's `depositToRemote` function signature:

```typescript
// From lib/contracts.ts
{
  name: 'depositToRemote',
  type: 'function',
  stateMutability: 'nonpayable',
  inputs: [
    { name: 'value', type: 'uint256' },
    { name: 'remoteDomain', type: 'uint32' },
    { name: 'remoteRecipient', type: 'bytes32' },  // This is what gets passed as remoteToken
    { name: 'localToken', type: 'address' },
    { name: 'maxFee', type: 'uint256' },
    { name: 'hookData', type: 'bytes' },
  ],
  outputs: [],
}
```

## Why This Encoding is Necessary

1. **Cross-Chain Compatibility**: Stacks uses a different address format than Ethereum. The bytes32 encoding allows the CCTP protocol to handle addresses from different blockchain architectures.

2. **Standard Format**: The CCTP protocol expects a 32-byte recipient identifier, regardless of the destination chain's native address format.

3. **Version Information**: By embedding the version byte at position 11, the encoded format preserves information about the address type (P2PKH or P2SH) and network (mainnet vs testnet).

## Transaction in the Image

Looking at the specific transaction in IMG_0326.jpeg:

- **remoteToken**: `661237037DC811823D8B2DE17AAABB8EF2AC9B713CA7DB3B01FC7F7BAF7DB562`
- **remoteDomain**: `10001` (Stacks mainnet)

This bytes32 value represents an encoded Stacks mainnet address. To decode it:
- Byte 11 contains the version byte
- Bytes 12-31 contain the hash160 of the Stacks address

## Code Flow Summary

```
User Input (Stacks Address)
    ↓
encodeStacksRecipient() function
    ↓
bytes32 encoded value
    ↓
Passed as remoteRecipient/remoteToken parameter
    ↓
depositToRemote() contract call
    ↓
CCTP bridge processing
    ↓
USDCx arrives on Stacks at the decoded address
```

## Key Files Reference

- **Encoding Logic**: `lib/encoding.ts` and `sdk/utils.ts` (lines 42-49, 6-12)
- **Bridge Execution**: `lib/bridge.ts` (lines 147-180)
- **Contract ABI**: `lib/contracts.ts` (lines 157-172)
- **Network Configuration**: `lib/contracts.ts` (lines 1-72)

## Testing the Encoding

You can test the encoding using the SDK:

```typescript
import { BridgeSwiftSDK } from '@bridge-swift/sdk';

const sdk = new BridgeSwiftSDK();

// Example Stacks address
const stacksAddress = 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7';

// This internally calls encodeStacksRecipient()
const result = await sdk.bridge({
  amount: sdk.parseUSDC('100'),
  stacksRecipient: stacksAddress,
  account: '0x...',
  chainId: 1,
}, publicClient, walletClient);

console.log('Bridge hash:', result.bridgeHash);
```

## Additional Notes

- The parameter is called `remoteToken` in the contract interface but represents the **recipient address**, not a token address
- The actual token address (USDC) is passed separately in the `localToken` parameter
- The encoding ensures that Stacks addresses can be safely transmitted through the Ethereum/CCTP infrastructure
- This encoding is reversible on the Stacks side, allowing the CCTP protocol to correctly identify the recipient
