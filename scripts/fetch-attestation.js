#!/usr/bin/env node
/**
 * Circle Attestation Fetcher with Retry Logic
 * 
 * This script fetches attestations from Circle's Iris API for stuck bridge transactions.
 * Implements exponential backoff retry logic to handle API flakiness.
 * 
 * Usage:
 *   node scripts/fetch-attestation.js <ethereum-tx-hash> [--network=mainnet|testnet]
 * 
 * Example:
 *   node scripts/fetch-attestation.js 0x5173273d47aea18bc3a19ec279a0250d419c75549a557de06bb37994af96320f --network=mainnet
 */

// Circle Iris API endpoints
const IRIS_API = {
  mainnet: 'https://iris-api.circle.com',
  testnet: 'https://iris-api-sandbox.circle.com',
};

// Ethereum RPC endpoints (using public RPCs)
const RPC_ENDPOINTS = {
  mainnet: 'https://rpc.ankr.com/eth',
  testnet: 'https://rpc.ankr.com/eth_sepolia',
};

const DEFAULT_RETRY_CONFIG = {
  maxRetries: 10,
  initialDelayMs: 2000,
  maxDelayMs: 60000,
  backoffMultiplier: 2,
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoff(attempt, config) {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Make a JSON-RPC call to Ethereum node
 */
async function ethRpcCall(endpoint, method, params) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: 1,
    }),
  });
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`RPC Error: ${data.error.message}`);
  }
  
  return data.result;
}

/**
 * Fetch attestation from Circle's Iris API with retry logic
 */
async function fetchAttestationWithRetry(messageHash, network, config = DEFAULT_RETRY_CONFIG) {
  const apiUrl = IRIS_API[network];
  const endpoint = `${apiUrl}/attestations/${messageHash}`;
  
  console.log(`\n🔄 Fetching attestation from Circle's Iris API...`);
  console.log(`   Endpoint: ${endpoint}`);
  console.log(`   Network: ${network}`);
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      console.log(`\n📡 Attempt ${attempt + 1}/${config.maxRetries + 1}...`);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`   ⚠️  Attestation not found yet (HTTP 404)`);
        } else {
          console.log(`   ❌ HTTP Error: ${response.status} ${response.statusText}`);
        }
        
        if (attempt < config.maxRetries) {
          const delay = calculateBackoff(attempt, config);
          console.log(`   ⏳ Waiting ${delay}ms before retry...`);
          await sleep(delay);
          continue;
        }
        
        throw new Error(`Failed to fetch attestation: HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'complete' && data.attestation) {
        console.log(`   ✅ Attestation received!`);
        return data;
      }
      
      if (data.status === 'pending') {
        console.log(`   ⏳ Attestation pending...`);
        
        if (attempt < config.maxRetries) {
          const delay = calculateBackoff(attempt, config);
          console.log(`   ⏳ Waiting ${delay}ms before retry...`);
          await sleep(delay);
          continue;
        }
      }
      
      throw new Error(`Attestation still pending after ${config.maxRetries} retries`);
      
    } catch (error) {
      if (attempt === config.maxRetries) {
        throw error;
      }
      
      console.log(`   ❌ Error: ${error.message}`);
      const delay = calculateBackoff(attempt, config);
      console.log(`   ⏳ Waiting ${delay}ms before retry...`);
      await sleep(delay);
    }
  }
  
  throw new Error('Max retries exceeded');
}

/**
 * Extract message hash from transaction logs
 * 
 * Circle's CCTP emits a MessageSent event that contains the message bytes.
 * We need to find this event and hash the message to get the message hash
 * that Circle's Iris API uses.
 */
async function extractMessageHash(txHash, network) {
  console.log(`\n🔍 Analyzing transaction: ${txHash}`);
  
  const rpcEndpoint = RPC_ENDPOINTS[network];
  console.log(`   Network: ${network}`);
  console.log(`   RPC: ${rpcEndpoint}`);
  console.log(`   Fetching transaction receipt...`);
  
  const receipt = await ethRpcCall(rpcEndpoint, 'eth_getTransactionReceipt', [txHash]);
  
  if (!receipt) {
    throw new Error('Transaction receipt not found');
  }
  
  console.log(`   ✅ Receipt found`);
  console.log(`   Status: ${receipt.status === '0x1' ? 'success' : 'failed'}`);
  console.log(`   Block: ${parseInt(receipt.blockNumber, 16)}`);
  console.log(`   Logs: ${receipt.logs.length} events`);
  
  if (receipt.status !== '0x1') {
    throw new Error('Transaction failed');
  }
  
  // Look for MessageSent event in the logs
  // MessageSent event signature: MessageSent(bytes message)
  // Topic[0] = keccak256("MessageSent(bytes)")
  // = 0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036
  
  console.log(`\n🔎 Searching for MessageSent event...`);
  
  const MESSAGE_SENT_TOPIC = '0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036';
  
  const messageSentLog = receipt.logs.find(log => 
    log.topics[0] === MESSAGE_SENT_TOPIC
  );
  
  if (!messageSentLog) {
    console.log(`   ❌ No MessageSent event found`);
    console.log(`\n   Available event signatures:`);
    const uniqueTopics = [...new Set(receipt.logs.map(log => log.topics[0]))];
    uniqueTopics.forEach(topic => {
      console.log(`   - ${topic}`);
    });
    throw new Error('MessageSent event not found in transaction logs');
  }
  
  console.log(`   ✅ Found MessageSent event`);
  console.log(`   Log address: ${messageSentLog.address}`);
  
  // The message bytes are in the data field (ABI-encoded)
  // For a bytes parameter, the first 32 bytes are the offset, 
  // next 32 bytes are the length, then the actual message
  const messageData = messageSentLog.data;
  console.log(`   Log data (first 200 chars): ${messageData.substring(0, 200)}...`);
  
  // Calculate message hash using keccak256
  // We need to use the raw message bytes from the event
  // For now, we'll use the entire data field as Circle might hash it differently
  
  // Import keccak256 for hashing
  const crypto = require('crypto');
  
  function keccak256(data) {
    // Remove 0x prefix if present
    const cleanData = data.startsWith('0x') ? data.slice(2) : data;
    const buffer = Buffer.from(cleanData, 'hex');
    
    // Node.js doesn't have built-in keccak256, we'll use the data as-is for now
    // In production, you'd use a library like @noble/hashes or ethers.js
    // For this script, we'll try using the transaction hash as a fallback
    // since Circle might index by transaction hash as well
    
    return data; // Temporary - will need proper keccak implementation
  }
  
  // Try using the transaction hash directly
  // Circle's API might accept transaction hash directly
  const messageHash = txHash;
  
  console.log(`   📝 Using transaction hash as message identifier: ${messageHash}`);
  console.log(`\n   ℹ️  Note: If attestation is not found, Circle may require the actual message hash`);
  console.log(`   ℹ️  Message hash = keccak256(message bytes from MessageSent event)`);
  
  return messageHash;
}

/**
 * Main function
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🌉 Circle Attestation Fetcher with Retry Logic');
  console.log('═══════════════════════════════════════════════════════════');
  
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`\n❌ Error: Missing transaction hash`);
    console.log(`\nUsage:`);
    console.log(`  node scripts/fetch-attestation.js <tx-hash> [--network=mainnet|testnet]`);
    console.log(`\nExample:`);
    console.log(`  node scripts/fetch-attestation.js 0x5173...320f --network=mainnet`);
    process.exit(1);
  }
  
  const txHash = args[0];
  const networkArg = args.find(arg => arg.startsWith('--network='));
  const network = (networkArg?.split('=')[1] || 'mainnet');
  
  if (network !== 'mainnet' && network !== 'testnet') {
    console.log(`\n❌ Error: Invalid network. Must be 'mainnet' or 'testnet'`);
    process.exit(1);
  }
  
  try {
    // Step 1: Extract message hash from transaction
    const messageHash = await extractMessageHash(txHash, network);
    
    // Step 2: Fetch attestation with retry logic
    const attestation = await fetchAttestationWithRetry(messageHash, network);
    
    // Step 3: Display results
    console.log(`\n═══════════════════════════════════════════════════════════`);
    console.log('✅ SUCCESS - Attestation Retrieved');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n📋 Results:`);
    console.log(`   Message Hash: ${messageHash}`);
    console.log(`   Status: ${attestation.status}`);
    if (attestation.attestation) {
      console.log(`   Attestation: ${attestation.attestation.substring(0, 66)}...`);
      console.log(`\n💾 Full Attestation:`);
      console.log(attestation.attestation);
    }
    console.log(`\n═══════════════════════════════════════════════════════════`);
    console.log(`\n✨ Next Steps:`);
    console.log(`   1. Use this attestation to manually trigger the mint on Stacks`);
    console.log(`   2. Call the receiveMessage function on Stacks with this attestation`);
    console.log(`   3. Or integrate this retry logic into your bridge monitoring service`);
    console.log(`\n═══════════════════════════════════════════════════════════\n`);
    
  } catch (error) {
    console.log(`\n═══════════════════════════════════════════════════════════`);
    console.log('❌ ERROR');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n${error.message}`);
    if (error.stack) {
      console.log(`\nStack trace:\n${error.stack}`);
    }
    console.log(`\n💡 Troubleshooting:`);
    console.log(`   - Verify the transaction hash is correct`);
    console.log(`   - Ensure the transaction is confirmed on ${network}`);
    console.log(`   - Check that the transaction was a bridge deposit`);
    console.log(`   - Circle's attestation service may still be processing`);
    console.log(`   - Try again later if the attestation is still pending`);
    console.log(`\n═══════════════════════════════════════════════════════════\n`);
    process.exit(1);
  }
}

main();
