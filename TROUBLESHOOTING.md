# Bridge Swift - Troubleshooting Guide

## 🔴 Common Issues & Solutions

### Issue: Sepolia Transaction Succeeded but No USDCx Minted on Stacks

**Symptoms:**
- USDC was deducted from your Sepolia wallet
- Transaction shows as successful on Sepolia Etherscan
- No USDCx appears in your Stacks wallet after 15+ minutes

**Root Cause:**
The bridge amount was below the required minimum of **10 USDC**. Circle's xReserve attestation service rejects transactions under this threshold.

**Solution:**
1. Ensure you bridge at least **10 USDC** (not 1 USDC)
2. The bridge fee is 4.8 USDC, so you'll receive approximately `amount - 4.8` USDCx
3. Retry your bridge with the correct minimum amount

**Why 10 USDC?**
- Bridge fee: 4.8 USDC
- Minimum viable amount: 10 USDC
- This ensures economic viability and matches the official bridge at bridge.stacks.co

---

### Issue: "Invalid Stacks Address" Error

**Symptoms:**
- Red error message appears when entering Stacks address
- Cannot submit bridge transaction

**Solution:**
1. Verify your Stacks address starts with:
   - `ST` for testnet addresses
   - `SP` for mainnet addresses
2. Address should be 30-50 characters long
3. Copy address directly from your Stacks wallet to avoid typos

**Example Valid Addresses:**
- Testnet: `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM`
- Mainnet: `SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7`

---

### Issue: Transaction Pending for More Than 15 Minutes

**Possible Causes:**
1. **Network Congestion:** Ethereum or Stacks network is congested
2. **Insufficient Gas:** Transaction used too little gas and is stuck
3. **Attestation Service Delay:** Circle's attestation service is experiencing delays

**Solutions:**
1. Wait up to 30 minutes before investigating further
2. Check transaction status on Sepolia Etherscan
3. Verify the transaction was successful on Ethereum side
4. Check Stacks Explorer for any pending transactions to your address

**How to Check:**
```bash
# Sepolia Etherscan
https://sepolia.etherscan.io/tx/<your-tx-hash>

# Stacks Explorer (Testnet)
https://explorer.hiro.so/address/<your-stacks-address>?chain=testnet
```

---

### Issue: "Insufficient USDC Balance" Error

**Symptoms:**
- Cannot complete bridge transaction
- Balance shows 0 or insufficient amount

**Solution:**
1. Get Sepolia USDC from Circle's faucet: https://faucet.circle.com/
2. Ensure you have enough for:
   - Bridge amount (min 10 USDC)
   - Ethereum gas fees (usually < 0.01 ETH)
3. Wait for faucet transaction to confirm before bridging

---

### Issue: Wallet Connection Problems

**Symptoms:**
- Cannot connect MetaMask
- Wrong network selected

**Solution:**
1. Ensure MetaMask is installed and unlocked
2. Switch to **Sepolia Testnet** in MetaMask:
   - Click network dropdown
   - Select "Sepolia test network"
   - If not visible, enable "Show test networks" in MetaMask settings
3. Refresh the page and try connecting again

---

## 🔍 Diagnostic Tools

### Verify Bridge Configuration

Run the diagnostic script to verify your setup:

```bash
npx ts-node scripts/verify-bridge.ts <your-stacks-address>
```

**Example:**
```bash
npx ts-node scripts/verify-bridge.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
```

This will verify:
- ✅ Contract addresses are correct
- ✅ Domain ID is correct (10003 for Stacks)
- ✅ Minimum amount meets requirements
- ✅ Bridge fee is accurate
- ✅ Address encoding is valid

---

## 📊 Understanding Bridge Parameters

### Current Configuration

| Parameter | Value | Purpose |
|-----------|-------|---------|
| **Min Amount** | 10 USDC | Minimum bridge amount (Circle requirement) |
| **Bridge Fee** | 4.8 USDC | Fee charged by xReserve |
| **Domain ID** | 10003 | Stacks network identifier |
| **Est. Time** | ~15 min | Time for attestation and minting |

### How Fees Work

If you bridge **15 USDC**:
- Amount sent: 15 USDC
- Bridge fee: -4.8 USDC
- You receive: **~10.2 USDCx** on Stacks

---

## 🛠️ Advanced Debugging

### Check Transaction on Sepolia Etherscan

1. Go to https://sepolia.etherscan.io/
2. Search for your transaction hash
3. Verify:
   - Status: Success ✅
   - To: `0x008888878f94C0d87defdf0B07f46B93C1934442` (xReserve)
   - Function: `depositToRemote`
   - Value transferred matches your amount

### Verify Stacks Address Encoding

The bridge encodes your Stacks address as bytes32:
- Byte 11: Version (26 for testnet, 22 for mainnet)
- Bytes 12-31: Hash160 of your address

Use the diagnostic script to verify encoding is correct.

### Check Circle Attestation Service

The attestation flow:
1. You deposit USDC → xReserve contract (Ethereum)
2. Circle's attestation service detects deposit
3. Circle signs attestation
4. Stacks attestation service fetches signed attestation
5. USDCx is minted on Stacks

If step 2-4 fail, no USDCx will be minted.

---

## 📞 Getting Help

### Before Asking for Help

1. ✅ Verify minimum amount is ≥10 USDC
2. ✅ Check transaction succeeded on Sepolia
3. ✅ Wait at least 20 minutes
4. ✅ Run diagnostic script
5. ✅ Check both Sepolia and Stacks explorers

### Information to Provide

When reporting issues, include:
- Sepolia transaction hash
- Stacks recipient address
- Amount bridged
- Time elapsed since transaction
- Output from diagnostic script

### Resources

- **Official Stacks Bridge:** https://bridge.stacks.co/usdc/eth/stx
- **Circle xReserve Docs:** https://developers.circle.com/xreserve
- **Stacks USDCx Docs:** https://docs.stacks.co/learn/bridging/usdcx
- **Sepolia Etherscan:** https://sepolia.etherscan.io/
- **Stacks Explorer:** https://explorer.hiro.so/?chain=testnet

---

## ✅ Checklist for Successful Bridge

Before bridging, ensure:

- [ ] Connected to Sepolia testnet in MetaMask
- [ ] Have at least 10 USDC in wallet
- [ ] Have some Sepolia ETH for gas (~0.01 ETH)
- [ ] Stacks address is valid (starts with ST for testnet)
- [ ] Understand you'll receive `amount - 4.8` USDCx
- [ ] Ready to wait ~15 minutes for completion

---

## 🔄 Recovery Options

### If Your Transaction Failed

Unfortunately, if the attestation service rejected your transaction (e.g., amount too low), the USDC is locked in the xReserve contract. 

**Options:**
1. Contact Circle support with your transaction hash
2. Check if there's a recovery mechanism in the xReserve contract
3. For future transactions, ensure minimum 10 USDC

**Prevention:**
Always use the updated bridge with correct minimum amounts to avoid this issue.
