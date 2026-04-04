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
  
  
  
  const minAmount = Number(BRIDGE_CONFIG.MIN_AMOUNT) / 1_000_000;
  const bridgeFee = Number(BRIDGE_CONFIG.BRIDGE_FEE_USDC) / 1_000_000;
  
  if (minAmount >= 10) {
  } else {
  }
  
  if (bridgeFee === 4.8) {
  } else {
  }
  
  if (CONTRACTS.STACKS_DOMAIN === 10003) {
  } else {
  }
}

function verifyAddressEncoding(stacksAddress: string) {
  
  // Validate address
  if (!isValidStacksAddress(stacksAddress)) {
    return;
  }
  
  
  // Decode address
  const address = createAddress(stacksAddress);
  
  // Encode for xReserve
  const encoded = encodeStacksRecipient(stacksAddress);
  
  // Show byte breakdown
  const bytes = hex.decode(encoded.slice(2));
  
  // Verify encoding
  const hash160Bytes = hex.decode(address.hash160);
  const encodedHash160 = bytes.slice(12, 32);
  const encodedVersion = bytes[11];
  
  if (encodedVersion === address.version) {
  } else {
  }
  
  if (hex.encode(encodedHash160) === address.hash160) {
  } else {
  }
  
}

function main() {
  const args = process.argv.slice(2);
  
  verifyBridgeConfig();
  
  if (args.length > 0) {
    const stacksAddress = args[0];
    verifyAddressEncoding(stacksAddress);
  } else {
  }
  
}

main();
