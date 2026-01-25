# Manual Attestation Fetch for Stuck Transaction

## Immediate Action Required

For the stuck mainnet transaction:
- **TX Hash**: `0x5173273d47aea18bc3a19ec279a0250d419c75549a557de06bb37994af96320f`
- **Recipient**: `SP1TDJDKP9KZRXS3C5C4HAKVGBBVF6SQ6AW0GPCQS`
- **Amount**: 12 USDC → 12 USDCx
- **Network**: Mainnet
- **Status**: Stuck for 7+ hours

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Attestation Fetcher

```bash
node scripts/fetch-attestation.js 0x5173273d47aea18bc3a19ec279a0250d419c75549a557de06bb37994af96320f --network=mainnet
```

## What This Script Does

1. **Fetches Transaction Receipt**: Gets the Ethereum transaction details from an RPC endpoint
2. **Extracts Message Hash**: Finds the `MessageSent` event from Circle's CCTP contracts, parses the ABI-encoded event data, and computes the keccak256 hash of the message bytes
3. **Queries Circle's Iris API**: Calls `https://iris-api.circle.com/attestations/{messageHash}` with exponential backoff retry logic
4. **Returns Attestation**: Provides the signed attestation needed to mint USDCx on Stacks

## Retry Logic Details

The script implements exponential backoff:
- **Max Retries**: 10 attempts
- **Initial Delay**: 2 seconds
- **Max Delay**: 60 seconds
- **Backoff Multiplier**: 2x

This handles Circle's API flakiness automatically.

## Expected Output

```
═══════════════════════════════════════════════════════════
🌉 Circle Attestation Fetcher with Retry Logic
═══════════════════════════════════════════════════════════

🔍 Analyzing transaction: 0x5173...320f
   Network: Ethereum
   Fetching transaction receipt...
   ✅ Receipt found
   Status: success
   Block: 21738291
   Logs: 8 events

🔎 Searching for MessageSent event...
   ✅ Found MessageSent event
   Message hash: 0xabc123...

🔄 Fetching attestation from Circle's Iris API...
   📡 Attempt 1/11...
   ✅ Attestation received!

═══════════════════════════════════════════════════════════
✅ SUCCESS - Attestation Retrieved
═══════════════════════════════════════════════════════════

📋 Results:
   Message Hash: 0xabc123...
   Status: complete
   Attestation: 0xdef456...

💾 Full Attestation:
0xdef456789...

✨ Next Steps:
   1. Use this attestation to manually trigger the mint on Stacks
   2. Call the receiveMessage function on Stacks
   3. Or integrate this retry logic into monitoring
```

## Troubleshooting

### Network Access Issues

If you're running this in an environment with restricted network access:

1. **Use a VPN or different network**
2. **Set custom RPC endpoints**:
   ```bash
   export ETH_RPC_MAINNET="https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY"
   node scripts/fetch-attestation.js 0x5173...320f --network=mainnet
   ```
3. **Run on a server with network access** (AWS, DigitalOcean, etc.)

### Still Not Working?

1. **Verify the transaction on Etherscan**: https://etherscan.io/tx/0x5173273d47aea18bc3a19ec279a0250d419c75549a557de06bb37994af96320f
2. **Check if it's a bridge deposit**: Look for interaction with xReserve contract `0x8888888199b2Df864bf678259607d6D5EBb4e3Ce`
3. **Wait longer**: Circle's service can take up to 30 minutes
4. **Check Circle's status**: https://status.circle.com/

## Next Steps After Getting Attestation

Once you have the attestation, you need to manually trigger the mint on Stacks.

### Option 1: Using Stacks CLI

```bash
# Install Stacks CLI
npm install -g @stacks/cli

# Call the mint function
stacks call_contract_func \
  SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR \
  usdcx-v1 \
  mint \
  --network mainnet
```

### Option 2: Using Hiro Platform

1. Go to https://platform.hiro.so/
2. Connect your Stacks wallet
3. Navigate to Contract Call
4. Enter contract: `SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.usdcx-v1`
5. Enter function: `mint` or `receiveMessage`
6. Provide the attestation as parameter

### Option 3: Programmatic (Recommended)

```javascript
import { makeContractCall } from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';

const network = new StacksMainnet();

const txOptions = {
  contractAddress: 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR',
  contractName: 'usdcx-v1',
  functionName: 'receiveMessage',
  functionArgs: [
    // TODO: Add arguments based on Circle's message format
    // - message bytes
    // - attestation signature
  ],
  network,
  anchorMode: AnchorMode.Any,
};

const transaction = await makeContractCall(txOptions);
```

## For Future Transactions

### Automated Monitoring

Set up the monitoring service to automatically check for stuck transactions:

```bash
# Add to crontab to run every 5 minutes
*/5 * * * * cd /path/to/bridge-swift && node scripts/monitor-attestations.js

# Or run as a background service
node scripts/monitor-attestations.js &
```

### Integration with Bridge UI

See `scripts/README.md` for details on integrating the retry logic into the bridge deployment.

## Support

If you continue to experience issues:
1. Check the detailed logs with `DEBUG=1`
2. Review Circle's CCTP documentation
3. Contact Circle support with the transaction hash
4. Post in Stacks Discord #support channel

## References

- [Circle CCTP Documentation](https://developers.circle.com/stablecoins/docs/cctp-getting-started)
- [Circle Iris API](https://developers.circle.com/stablecoins/docs/cctp-technical-reference)
- [Stacks USDCx Documentation](https://docs.stacks.co/learn/bridging/usdcx)
- [Transaction on Etherscan](https://etherscan.io/tx/0x5173273d47aea18bc3a19ec279a0250d419c75549a557de06bb37994af96320f)
