# Circle Attestation Retry Tool

## Problem

Circle's CCTP attestation service can be flaky, causing bridge transactions to get stuck for hours even though the deposit transaction succeeded on Ethereum.

## Solution

This directory contains tools to manually fetch attestations and implement retry logic for the Circle Iris API.

## Files

- **fetch-attestation.js** - Standalone script to fetch attestations with exponential backoff retry
- **monitor-attestations.js** - Continuous monitoring service (recommended for production)

## Quick Start - Manual Attestation Fetch

For a stuck transaction:

```bash
node scripts/fetch-attestation.js <ethereum-tx-hash> --network=mainnet
```

### Example - Mainnet Transaction

```bash
node scripts/fetch-attestation.js 0x5173273d47aea18bc3a19ec279a0250d419c75549a557de06bb37994af96320f --network=mainnet
```

### Example - Testnet Transaction

```bash
node scripts/fetch-attestation.js 0xabc123... --network=testnet
```

## How It Works

### Step 1: Extract Message Hash

The script:
1. Fetches the Ethereum transaction receipt
2. Finds the `MessageSent` event emitted by Circle's CCTP contracts
3. Extracts the message bytes from the event
4. Computes the message hash (keccak256 of message bytes)

### Step 2: Fetch Attestation with Retry

Using exponential backoff:
- **Initial delay**: 2 seconds
- **Max delay**: 60 seconds
- **Max retries**: 10 attempts
- **Backoff multiplier**: 2x

```
Attempt 1: Wait 2s
Attempt 2: Wait 4s
Attempt 3: Wait 8s
Attempt 4: Wait 16s
Attempt 5: Wait 32s
Attempt 6+: Wait 60s (capped)
```

### Step 3: Return Attestation

Once Circle's API returns `status: "complete"`, the attestation signature is saved and can be used to manually trigger the mint on Stacks.

## Circle API Endpoints

### Mainnet
```
https://iris-api.circle.com/attestations/{messageHash}
```

### Testnet (Sepolia)
```
https://iris-api-sandbox.circle.com/attestations/{messageHash}
```

## Response Format

```json
{
  "status": "complete",
  "attestation": "0x..."
}
```

## Integration with Bridge Deployment

### Option 1: Cron Job (Recommended)

Run the monitoring script as a cron job:

```bash
# Check for stuck attestations every 5 minutes
*/5 * * * * cd /path/to/bridge-swift && node scripts/monitor-attestations.js
```

### Option 2: Serverless Function

Deploy as a serverless function (Vercel, AWS Lambda, etc):

```javascript
export async function POST(request) {
  const { txHash, network } = await request.json();
  // Call fetch-attestation logic
  return Response.json({ attestation });
}
```

### Option 3: Background Worker

Use a task queue (Bull, BullMQ, etc) to process attestations:

```javascript
attestationQueue.process(async (job) => {
  const { txHash, network } = job.data;
  return await fetchAttestationWithRetry(txHash, network);
});
```

## Troubleshooting

### Attestation Not Found (404)

**Possible causes:**
- Transaction hasn't been processed by Circle yet (wait ~5 minutes)
- Wrong network selected (mainnet vs testnet)
- Transaction wasn't a bridge deposit
- Incorrect message hash extracted

**Solution:** Wait and retry. Circle's service can take 5-30 minutes.

### Attestation Pending

**Possible causes:**
- Circle is still processing the transaction
- High network congestion
- Circle's service experiencing delays

**Solution:** The script will automatically retry with exponential backoff.

### Network Errors

**Possible causes:**
- RPC endpoint is down
- Rate limiting
- Network connectivity issues

**Solution:** The script tries multiple RPC providers automatically.

## Advanced Usage

### Custom Retry Configuration

Edit `fetch-attestation.js` to adjust retry parameters:

```javascript
const CUSTOM_RETRY_CONFIG = {
  maxRetries: 20,           // More retries
  initialDelayMs: 5000,     // Start with 5s delay
  maxDelayMs: 120000,       // Max 2 minute delay
  backoffMultiplier: 1.5,   // Gentler backoff
};
```

### Batch Processing

Process multiple stuck transactions:

```bash
#!/bin/bash
# process-stuck-txs.sh

TRANSACTIONS=(
  "0x5173273d47aea18bc3a19ec279a0250d419c75549a557de06bb37994af96320f"
  "0xabc123..."
  "0xdef456..."
)

for tx in "${TRANSACTIONS[@]}"; do
  echo "Processing $tx..."
  node scripts/fetch-attestation.js "$tx" --network=mainnet
  sleep 5
done
```

## Manual Mint Trigger (Stacks)

Once you have the attestation, you can manually trigger the mint on Stacks:

### Using Stacks.js

```javascript
import { makeContractCall } from '@stacks/transactions';

const txOptions = {
  contractAddress: 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR',
  contractName: 'usdcx-v1',
  functionName: 'mint',
  functionArgs: [
    // Add required arguments from attestation
  ],
  network: mainnetNetwork,
  anchorMode: AnchorMode.Any,
};

const transaction = await makeContractCall(txOptions);
```

### Using Hiro Platform API

```bash
curl -X POST https://api.hiro.so/v2/transactions \
  -H "Content-Type: application/json" \
  -d '{"tx": "..."}'
```

## Production Deployment

### Prerequisites

1. **RPC Access**: Use a reliable RPC provider (Alchemy, Infura, QuickNode)
2. **Monitoring**: Set up alerts for stuck transactions
3. **Logging**: Store attestation results for audit trail

### Deployment Checklist

- [ ] Configure RPC endpoints in production
- [ ] Set up error monitoring (Sentry, etc)
- [ ] Configure retry parameters for production load
- [ ] Set up alerts for failed attestations
- [ ] Create dashboard for monitoring
- [ ] Document manual mint process
- [ ] Test with testnet first

### Environment Variables

```bash
# .env.production
ETH_RPC_MAINNET=https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY
ETH_RPC_SEPOLIA=https://eth-sepolia.alchemyapi.io/v2/YOUR_KEY
CIRCLE_API_MAINNET=https://iris-api.circle.com
CIRCLE_API_TESTNET=https://iris-api-sandbox.circle.com
```

## Support

For issues with this tool:
1. Check the transaction on Etherscan to verify it succeeded
2. Verify you're using the correct network (mainnet vs testnet)
3. Wait at least 15-30 minutes before assuming the transaction is stuck
4. Check Circle's status page for known outages

## References

- [Circle CCTP Documentation](https://developers.circle.com/stablecoins/docs/cctp-getting-started)
- [Circle Iris API Reference](https://developers.circle.com/stablecoins/docs/cctp-technical-reference)
- [Stacks Bridge Documentation](https://docs.stacks.co/learn/bridging/usdcx)
