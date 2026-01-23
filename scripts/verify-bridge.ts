#!/usr/bin/env ts-node
/**
 * Diagnostic script to verify bridge configuration and encoding
 * Usage: npx ts-node scripts/verify-bridge.ts <stacks-address>
 */

import { createAddress } from '@stacks/transactions';
import { hex } from '@scure/base';
import { BRIDGE_CONFIG, CONTRACTS, STACKS_CONTRACTS } from '../lib/contracts';
import { encodeStacksRecipient, isValidStacksAddress } from '../lib/encoding';

function verifyBridgeConfig() {
  console.log('🔍 Bridge Configuration Verification\n');
  console.log('═══════════════════════════════════════════════════════════');
  
  console.log('\n📋 Contract Addresses:');
  console.log(`  Sepolia USDC:     ${CONTRACTS.USDC}`);
  console.log(`  xReserve:         ${CONTRACTS.X_RESERVE}`);
  console.log(`  Stacks USDCx:     ${STACKS_CONTRACTS.USDCX}`);
  
  console.log('\n⚙️  Bridge Configuration:');
  console.log(`  Domain ID:        ${CONTRACTS.STACKS_DOMAIN}`);
  console.log(`  Min Amount:       ${Number(BRIDGE_CONFIG.MIN_AMOUNT) / 1_000_000} USDC`);
  console.log(`  Bridge Fee:       ${Number(BRIDGE_CONFIG.BRIDGE_FEE_USDC) / 1_000_000} USDC`);
  console.log(`  Est. Time:        ${BRIDGE_CONFIG.PEG_IN_TIME_MINUTES} minutes`);
  
  console.log('\n✅ Configuration Status:');
  const minAmount = Number(BRIDGE_CONFIG.MIN_AMOUNT) / 1_000_000;
  const bridgeFee = Number(BRIDGE_CONFIG.BRIDGE_FEE_USDC) / 1_000_000;
  
  if (minAmount >= 10) {
    console.log(`  ✓ Minimum amount (${minAmount} USDC) meets Circle requirement (≥10 USDC)`);
  } else {
    console.log(`  ✗ WARNING: Minimum amount (${minAmount} USDC) is below Circle requirement (10 USDC)`);
  }
  
  if (bridgeFee === 4.8) {
    console.log(`  ✓ Bridge fee (${bridgeFee} USDC) matches official bridge`);
  } else {
    console.log(`  ⚠ Bridge fee (${bridgeFee} USDC) differs from official (4.8 USDC)`);
  }
  
  if (CONTRACTS.STACKS_DOMAIN === 10003) {
    console.log(`  ✓ Domain ID (${CONTRACTS.STACKS_DOMAIN}) is correct for Stacks`);
  } else {
    console.log(`  ✗ WARNING: Domain ID (${CONTRACTS.STACKS_DOMAIN}) may be incorrect`);
  }
}

function verifyAddressEncoding(stacksAddress: string) {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('\n🔐 Address Encoding Verification\n');
  
  // Validate address
  if (!isValidStacksAddress(stacksAddress)) {
    console.log(`❌ Invalid Stacks address: ${stacksAddress}`);
    console.log('   Address must start with ST (testnet) or SP (mainnet)');
    return;
  }
  
  console.log(`Input Address:    ${stacksAddress}`);
  
  // Decode address
  const address = createAddress(stacksAddress);
  console.log(`\nDecoded Components:`);
  console.log(`  Version:        ${address.version} (${address.version === 26 ? 'Testnet' : address.version === 22 ? 'Mainnet' : 'Unknown'})`);
  console.log(`  Hash160:        ${address.hash160}`);
  
  // Encode for xReserve
  const encoded = encodeStacksRecipient(stacksAddress);
  console.log(`\nxReserve Encoding:`);
  console.log(`  Bytes32:        ${encoded}`);
  console.log(`  Length:         ${encoded.length - 2} hex chars (${(encoded.length - 2) / 2} bytes)`);
  
  // Show byte breakdown
  const bytes = hex.decode(encoded.slice(2));
  console.log(`\nByte Layout:`);
  console.log(`  Bytes 0-10:     ${hex.encode(bytes.slice(0, 11))} (padding)`);
  console.log(`  Byte 11:        ${bytes[11].toString(16).padStart(2, '0')} (version)`);
  console.log(`  Bytes 12-31:    ${hex.encode(bytes.slice(12, 32))} (hash160)`);
  
  // Verify encoding
  const hash160Bytes = hex.decode(address.hash160);
  const encodedHash160 = bytes.slice(12, 32);
  const encodedVersion = bytes[11];
  
  console.log(`\n✅ Encoding Verification:`);
  if (encodedVersion === address.version) {
    console.log(`  ✓ Version byte matches (${encodedVersion})`);
  } else {
    console.log(`  ✗ Version byte mismatch! Expected ${address.version}, got ${encodedVersion}`);
  }
  
  if (hex.encode(encodedHash160) === address.hash160) {
    console.log(`  ✓ Hash160 matches`);
  } else {
    console.log(`  ✗ Hash160 mismatch!`);
  }
  
  console.log(`\n📝 Use this bytes32 value in depositToRemote:`);
  console.log(`  ${encoded}`);
}

function main() {
  const args = process.argv.slice(2);
  
  verifyBridgeConfig();
  
  if (args.length > 0) {
    const stacksAddress = args[0];
    verifyAddressEncoding(stacksAddress);
  } else {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('\n💡 To verify address encoding, run:');
    console.log('   npx ts-node scripts/verify-bridge.ts <stacks-address>');
    console.log('\n   Example:');
    console.log('   npx ts-node scripts/verify-bridge.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
  }
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main();
