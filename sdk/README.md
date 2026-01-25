# Bridge Swift SDK

A comprehensive TypeScript SDK for building USDC to USDCx bridges on the Stacks blockchain. This SDK provides a developer-friendly API for bridging operations, fee estimation, and transaction tracking.

## Features

- 🚀 **Simple API** - Bridge USDC to Stacks with minimal code
- 🔗 **Multi-Chain Support** - Bridge from Ethereum, Base, Arbitrum, Optimism, Polygon, Avalanche
- 🛡️ **Type-Safe** - Full TypeScript support with comprehensive types
- 💰 **Fee Estimation** - Accurate gas and protocol fee calculation
- 🔄 **Slippage Protection** - Configurable slippage tolerance
- 📊 **Event System** - Track bridge progress with event listeners
- ✅ **Validation** - Built-in address and amount validation

## Installation

The SDK is included in the Bridge Swift project. For external use:

```typescript
// Import from the sdk folder
import { BridgeSwiftSDK, createBridgeSDK } from './sdk';
```

## Quick Start

```typescript
import { BridgeSwiftSDK } from './sdk';
import { createPublicClient, createWalletClient, http } from 'viem';
import { sepolia } from 'viem/chains';

// 1. Initialize the SDK
const sdk = new BridgeSwiftSDK({ debug: true });

// 2. Create viem clients
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http()
});

const walletClient = createWalletClient({
  chain: sepolia,
  transport: http()
});

// 3. Execute a bridge
const result = await sdk.bridge({
  amount: sdk.parseUSDC('100'),      // 100 USDC
  stacksRecipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  account: '0x...',                   // Your EVM address
  chainId: 11155111,                  // Sepolia
}, publicClient, walletClient);

console.log('Bridge hash:', result.bridgeHash);
```

## API Reference

### SDK Initialization

```typescript
// Using constructor
const sdk = new BridgeSwiftSDK(config?: BridgeSDKConfig);

// Using factory function
const sdk = createBridgeSDK(config?: BridgeSDKConfig);
```

#### Configuration Options

```typescript
interface BridgeSDKConfig {
  /** Default EVM chain ID (default: 11155111 - Sepolia) */
  defaultChainId?: number;
  
  /** Enable debug logging (default: false) */
  debug?: boolean;
  
  /** Custom RPC endpoints per chain */
  rpcUrls?: Partial<Record<SupportedNetwork, string>>;
  
  /** Max attestation retry attempts (default: 10) */
  maxAttestationRetries?: number;
  
  /** Default slippage in basis points (default: 50 = 0.5%) */
  defaultSlippageBps?: number;
}
```

### Core Methods

#### `bridge(params, publicClient, walletClient)`

Execute a complete bridge operation.

```typescript
const result = await sdk.bridge({
  amount: sdk.parseUSDC('100'),
  stacksRecipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  account: '0x1234...',
  chainId: 11155111,
}, publicClient, walletClient);
```

Returns:
```typescript
interface BridgeResult {
  approvalHash?: Hash;  // If approval was needed
  bridgeHash: Hash;     // Bridge transaction hash
  network?: 'mainnet' | 'testnet';
}
```

#### `estimateFees(params, publicClient)`

Get comprehensive fee estimates.

```typescript
const fees = await sdk.estimateFees({
  amount: sdk.parseUSDC('100'),
  stacksRecipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  account: '0x...',
  chainId: 11155111,
}, publicClient);

console.log('Estimated gas:', fees.estimatedGas);
console.log('Bridge fee:', sdk.formatUSDC(fees.bridgeFeeUsdc)); // $4.80
```

#### `getUSDCBalance(address, publicClient, chainId)`

Get USDC balance for an address.

```typescript
const balance = await sdk.getUSDCBalance(
  '0x1234...',
  publicClient,
  11155111
);
console.log('Balance:', sdk.formatUSDC(balance));
```

### Validation Methods

#### `validateStacksAddress(address, network?)`

Validate a Stacks address.

```typescript
const result = sdk.validateStacksAddress('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
// { valid: true, detectedNetwork: 'testnet' }

// Validate for specific network
const result = sdk.validateStacksAddress('SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7', 'mainnet');
// { valid: true, detectedNetwork: 'mainnet' }
```

### Utility Methods

#### USDC Formatting

```typescript
// Parse string to bigint (6 decimals)
sdk.parseUSDC('100');       // 100_000_000n
sdk.parseUSDC('10.50');     // 10_500_000n

// Format bigint to string
sdk.formatUSDC(100_000_000n);       // '100.00'
sdk.formatUSDCWithSymbol(100_000_000n); // '$100.00'
```

#### Address Utilities

```typescript
// Truncate for display
sdk.truncateAddress('0x1234567890...', 4); // '0x1234...7890'

// Detect Stacks network
sdk.detectStacksNetwork('ST1PQHQKV0...');  // 'testnet'
sdk.detectStacksNetwork('SP2J6ZY48G...');  // 'mainnet'

// Encode for CCTP
sdk.encodeStacksRecipient('ST1PQHQKV0...'); // '0x...' (bytes32)
```

#### Slippage Calculation

```typescript
// Calculate minimum output with slippage
const minOut = sdk.calculateMinAmountOut(100_000_000n, 50); // 99_500_000n (0.5% slippage)

// Validate slippage
sdk.isValidSlippage(50);   // true (0.5%)
sdk.isValidSlippage(5);    // false (below 0.1% minimum)

// Convert to percentage
sdk.bpsToPercent(50);      // '0.5%'
```

#### Explorer URLs

```typescript
// EVM explorer
sdk.getEtherscanUrl('0x123...', 1);        // Etherscan mainnet
sdk.getEtherscanUrl('0x123...', 11155111); // Sepolia

// Stacks explorer
sdk.getHiroExplorerUrl('0x123...', 'mainnet');  // Hiro mainnet
sdk.getHiroExplorerUrl('0x123...', 'testnet');  // Hiro testnet
```

### Network Configuration

```typescript
// Get config by chain ID
const config = sdk.getNetworkConfig(1);
// { USDC: '0x...', X_RESERVE: '0x...', NAME: 'Ethereum', ... }

// Check support
sdk.isChainSupported(1);      // true
sdk.isXReserveSupported(1);   // true (direct Stacks bridging)
sdk.isXReserveSupported(8453); // false (Base - no direct bridging)

// Get supported chains
sdk.getSupportedChainIds();   // [1, 42161, 10, 8453, ...]
```

### Event System

Track bridge progress with events:

```typescript
const unsubscribe = sdk.on((event) => {
  switch (event.type) {
    case 'approval_started':
      console.log('Starting approval...');
      break;
    case 'approval_confirmed':
      console.log('Approval confirmed:', event.txHash);
      break;
    case 'bridge_submitted':
      console.log('Bridge submitted:', event.txHash);
      break;
  }
});

// Later: unsubscribe();
```

#### Event Types

| Event | Description |
|-------|-------------|
| `approval_started` | USDC approval initiated |
| `approval_submitted` | Approval transaction submitted |
| `approval_confirmed` | Approval confirmed on-chain |
| `bridge_started` | Bridge deposit initiated |
| `bridge_submitted` | Bridge transaction submitted |
| `bridge_confirmed` | Bridge confirmed on-chain |
| `attestation_received` | Circle attestation received |
| `mint_complete` | USDCx minted on Stacks |
| `error` | Error occurred |

## Constants

Access bridge constants:

```typescript
const constants = sdk.getBridgeConstants();

// {
//   MIN_AMOUNT: 10_000_000n,      // 10 USDC minimum
//   BRIDGE_FEE_USDC: 4_800_000n,  // $4.80 bridge fee
//   MAX_APPROVAL: 1_000_000_000n, // $1000 max per tx
//   DEFAULT_SLIPPAGE_BPS: 50,     // 0.5% default slippage
//   PEG_IN_TIME_MINUTES: 15,      // ~15 min confirmation
//   USDC_DECIMALS: 6,
// }
```

## Supported Networks

| Network | Chain ID | xReserve Support |
|---------|----------|------------------|
| Ethereum | 1 | ✅ Direct to Stacks |
| Arbitrum | 42161 | ❌ Via Ethereum |
| Optimism | 10 | ❌ Via Ethereum |
| Base | 8453 | ❌ Via Ethereum |
| Polygon | 137 | ❌ Via Ethereum |
| Avalanche | 43114 | ❌ Via Ethereum |
| Sepolia (testnet) | 11155111 | ✅ Direct to Stacks |

> **Note**: Only Ethereum mainnet and Sepolia support direct bridging to Stacks. Other chains require bridging to Ethereum first.

## Error Handling

The SDK uses typed errors:

```typescript
import { BridgeError } from './sdk';

try {
  await sdk.bridge(...);
} catch (error) {
  if (error instanceof BridgeError) {
    console.log('Error code:', error.code);
    console.log('Message:', error.message);
    console.log('Details:', error.details);
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `INVALID_CONFIG` | Invalid SDK configuration |
| `INVALID_ADDRESS` | Invalid EVM or Stacks address |
| `INVALID_AMOUNT` | Amount below minimum or invalid |
| `INSUFFICIENT_BALANCE` | Not enough USDC |
| `INSUFFICIENT_ALLOWANCE` | Need to approve more USDC |
| `NETWORK_MISMATCH` | Stacks address doesn't match network |
| `UNSUPPORTED_NETWORK` | Chain doesn't support direct bridging |
| `TRANSACTION_FAILED` | On-chain transaction failed |
| `ATTESTATION_FAILED` | Circle attestation fetch failed |
| `USER_REJECTED` | User rejected transaction |
| `UNKNOWN_ERROR` | Unexpected error |

## TypeScript Types

All types are exported for use in your application:

```typescript
import type {
  BridgeSDKConfig,
  BridgeParams,
  BridgeResult,
  FeeEstimate,
  NetworkConfig,
  StacksNetwork,
  StacksAddressValidation,
  BridgeEvent,
  BridgeTransaction,
  // ... and more
} from './sdk';
```

## Examples

### Complete Bridge Flow

```typescript
import { createBridgeSDK } from './sdk';

async function bridgeUSDC() {
  const sdk = createBridgeSDK({ debug: true });
  
  // 1. Validate the recipient address
  const validation = sdk.validateStacksAddress(
    'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    'testnet'
  );
  
  if (!validation.valid) {
    throw new Error(validation.reason);
  }
  
  // 2. Check balance
  const balance = await sdk.getUSDCBalance(account, publicClient, chainId);
  const amount = sdk.parseUSDC('100');
  
  if (balance < amount) {
    throw new Error('Insufficient balance');
  }
  
  // 3. Estimate fees
  const fees = await sdk.estimateFees({
    amount,
    stacksRecipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    account,
    chainId,
  }, publicClient);
  
  console.log('Estimated cost:', fees.estimatedCostWei);
  console.log('Bridge fee:', sdk.formatUSDC(fees.bridgeFeeUsdc));
  
  // 4. Listen for events
  sdk.on((event) => {
    console.log(`[${event.type}]`, event.txHash || '');
  });
  
  // 5. Execute bridge
  const result = await sdk.bridge({
    amount,
    stacksRecipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    account,
    chainId,
  }, publicClient, walletClient);
  
  // 6. Get explorer links
  console.log('EVM Tx:', sdk.getEtherscanUrl(result.bridgeHash, chainId));
}
```

## Testing

The SDK includes comprehensive unit tests:

```bash
# Run SDK tests
npm run test:sdk
```

## License

MIT
