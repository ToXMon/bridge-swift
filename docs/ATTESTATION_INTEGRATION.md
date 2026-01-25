# Attestation Retry Integration Guide

## Overview

This guide explains how to integrate the automatic attestation retry logic into the Bridge Swift application.

## Components Added

### 1. Backend Scripts (`scripts/`)

- **fetch-attestation.js** - Manual attestation fetcher with retry logic
- **monitor-attestations.js** - Continuous monitoring service
- **README.md** - Comprehensive documentation

### 2. Frontend Utilities (`lib/`)

- **attestation-tracking.ts** - Client-side attestation status tracking and retry logic

### 3. React Components (`components/`)

- **AttestationMonitor.tsx** - Background monitoring component

## Integration Steps

### Step 1: Add AttestationMonitor to App Layout

Edit `app/layout.tsx` to include the monitor:

```typescript
import { AttestationMonitor } from '@/components/AttestationMonitor';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <Providers>
          {/* Add this line - it monitors transactions in the background */}
          <AttestationMonitor enabled={true} />
          
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### Step 2: Update Bridge Hook to Track Message Hash

Edit `hooks/useBridge.ts` to extract and store the message hash:

```typescript
import { extractMessageHash } from '@/lib/attestation-tracking';

// After successful bridge transaction
const receipt = await publicClient.waitForTransactionReceipt({ 
  hash: bridgeResult.bridgeHash 
});

// Extract message hash from transaction logs
const messageHash = await extractMessageHashFromReceipt(receipt);

const transaction: BridgeTransaction = {
  // ... existing fields
  messageHash, // Add this field
};

saveTransaction(transaction);
```

### Step 3: Display Attestation Status in Transaction History

Edit `components/TransactionHistory.tsx`:

```typescript
import { AttestationRetryStatus } from '@/components/AttestationMonitor';

function TransactionItem({ tx }: { tx: BridgeTransaction }) {
  return (
    <div>
      {/* Existing transaction details */}
      
      {/* Add attestation status */}
      <AttestationRetryStatus txHash={tx.evmTxHash} />
    </div>
  );
}
```

### Step 4: (Optional) Add Manual Retry Button

```typescript
import { fetchAttestationWithRetry } from '@/lib/attestation-tracking';

function ManualRetryButton({ tx }: { tx: BridgeTransaction }) {
  const handleRetry = async () => {
    if (!tx.messageHash) {
      // Need to extract message hash first
      alert('Message hash not available. Use scripts/fetch-attestation.js');
      return;
    }
    
    await fetchAttestationWithRetry(
      tx.evmTxHash,
      tx.messageHash,
      tx.network
    );
  };
  
  return (
    <button onClick={handleRetry}>
      Retry Attestation Fetch
    </button>
  );
}
```

## Backend Service Integration

For production, you should run the monitoring service on a server:

### Option 1: Cron Job

```bash
# Add to crontab
*/5 * * * * cd /path/to/bridge-swift && node scripts/monitor-attestations.js
```

### Option 2: Systemd Service

Create `/etc/systemd/system/bridge-attestation-monitor.service`:

```ini
[Unit]
Description=Bridge Swift Attestation Monitor
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/bridge-swift
ExecStart=/usr/bin/node scripts/monitor-attestations.js
Restart=always
RestartSec=60

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable bridge-attestation-monitor
sudo systemctl start bridge-attestation-monitor
```

### Option 3: Vercel Cron Job

Create `app/api/cron/attestations/route.ts`:

```typescript
import { monitorAttestations } from '@/scripts/monitor-attestations';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const results = await monitorAttestations();
  
  return Response.json(results);
}
```

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/attestations",
    "schedule": "*/5 * * * *"
  }]
}
```

## Environment Variables

Add to `.env.local`:

```bash
# RPC endpoints (recommended to use paid providers for reliability)
ETH_RPC_MAINNET=https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY
ETH_RPC_SEPOLIA=https://eth-sepolia.alchemyapi.io/v2/YOUR_KEY

# Cron secret for Vercel (optional)
CRON_SECRET=your-random-secret-here
```

## Testing

### Test Backend Script

```bash
# Test with a real mainnet transaction
node scripts/fetch-attestation.js 0x5173273d47aea18bc3a19ec279a0250d419c75549a557de06bb37994af96320f --network=mainnet

# Test mode (doesn't require network access)
node scripts/fetch-attestation.js test --network=mainnet
```

### Test Frontend Component

```typescript
// In a test file
import { saveAttestationStatus, getAttestationStatus } from '@/lib/attestation-tracking';

// Simulate stuck transaction
saveAttestationStatus({
  txHash: '0xtest123',
  status: 'pending',
  attempts: 3,
  lastAttempt: Date.now() - 10000,
});

// Check status
const status = getAttestationStatus('0xtest123');
console.log(status);
```

## Monitoring and Alerts

### Add Logging

```typescript
// In attestation-tracking.ts
if (status.attempts > 5) {
  // Send alert - transaction stuck after many attempts
  sendSlackAlert(`Transaction ${txHash} stuck after ${status.attempts} attempts`);
}
```

### Dashboard Integration

Track metrics:
- Number of stuck transactions
- Average attestation time
- Retry success rate
- Failed attestations requiring manual intervention

## Troubleshooting

### CORS Issues with Circle API

**Important**: The Circle Iris API does not support CORS requests from browsers. This means:

1. ✅ **Backend scripts work**: `fetch-attestation.js` and `monitor-attestations.js` work perfectly when run on a server
2. ❌ **Browser calls fail**: Direct API calls from `lib/attestation-tracking.ts` will fail with CORS errors
3. ✅ **Solution**: Deploy the monitoring service on a backend or use API routes

**Recommended Production Setup**:
```typescript
// app/api/attestations/[messageHash]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { messageHash: string } }
) {
  const { messageHash } = params;
  const network = new URL(request.url).searchParams.get('network') || 'mainnet';
  
  // This runs server-side, no CORS issues
  const response = await fetch(
    `https://iris-api.circle.com/attestations/${messageHash}`,
    { headers: { 'Accept': 'application/json' } }
  );
  
  return Response.json(await response.json());
}
```

Then update the frontend to use this API route instead of calling Circle directly.

### CORS Issues with Circle API (Original Section)

If you get CORS errors when calling Circle's API from the browser:

1. Move attestation fetching to a backend API route
2. Use a CORS proxy (not recommended for production)
3. Use the scripts with a backend service instead

### Message Hash Not Available

If the message hash isn't being extracted:

1. Check that the transaction has a MessageSent event
2. Verify the event signature matches Circle's CCTP contracts
3. Use the manual script: `node scripts/fetch-attestation.js <tx-hash>`

### High Retry Attempts

If transactions are retrying too many times:

1. Check Circle's status page for outages
2. Verify your RPC endpoints are working
3. Increase the backoff delay
4. Check transaction on Etherscan to confirm it's a bridge deposit

## Future Improvements

- [ ] Webhook integration with Circle for real-time attestation notifications
- [ ] GraphQL API for querying attestation status
- [ ] Mobile app notifications for stuck transactions
- [ ] Automatic mint triggering on Stacks when attestation is received
- [ ] Analytics dashboard for bridge performance

## References

- [Circle CCTP Documentation](https://developers.circle.com/stablecoins/docs/cctp-getting-started)
- [Circle Iris API](https://developers.circle.com/stablecoins/docs/cctp-technical-reference)
- [Stacks.js Documentation](https://docs.stacks.co/build/guides/transaction-signing)
