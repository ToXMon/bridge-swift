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
 * 
 * Requirements:
 *   npm install viem @noble/hashes
 */

const { createPublicClient, http, keccak256 } = require('viem');
const { mainnet, sepolia } = require('viem/chains');

// Circle Iris API endpoints
const IRIS_API = {
  mainnet: 'https://iris-api.circle.com',
  testnet: 'https://iris-api-sandbox.circle.com',
};

// Use environment variables if available, otherwise use public RPCs
const RPC_ENDPOINTS = {
  mainnet: process.env.ETH_RPC_MAINNET || 'https://rpc.ankr.com/eth',
  testnet: process.env.ETH_RPC_SEPOLIA || 'https://rpc.ankr.com/eth_sepolia',
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
 * Fetch attestation from Circle's Iris API with retry logic
 */
async function fetchAttestationWithRetry(messageHash, network, config = DEFAULT_RETRY_CONFIG) {
  const apiUrl = IRIS_API[network];
  const endpoint = `${apiUrl}/attestations/${messageHash}`;
  
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
        } else {
        }
        
        if (attempt < config.maxRetries) {
          const delay = calculateBackoff(attempt, config);
          await sleep(delay);
          continue;
        }
        
        throw new Error(`Failed to fetch attestation: HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'complete' && data.attestation) {
        return data;
      }
      
      if (data.status === 'pending') {
        
        if (attempt < config.maxRetries) {
          const delay = calculateBackoff(attempt, config);
          await sleep(delay);
          continue;
        }
      }
      
      throw new Error(`Attestation still pending after ${config.maxRetries} retries`);
      
    } catch (error) {
      if (attempt === config.maxRetries) {
        throw error;
      }
      
      const delay = calculateBackoff(attempt, config);
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
  
  const chain = network === 'mainnet' ? mainnet : sepolia;
  const rpcEndpoint = RPC_ENDPOINTS[network];
  
  
  const publicClient = createPublicClient({
    chain,
    transport: http(rpcEndpoint),
  });
  
  const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
  
  if (!receipt) {
    throw new Error('Transaction receipt not found');
  }
  
  
  if (receipt.status !== 'success') {
    throw new Error('Transaction failed');
  }
  
  // Look for MessageSent event in the logs
  // MessageSent event signature: MessageSent(bytes message)
  // Topic[0] = keccak256("MessageSent(bytes)")
  // = 0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036
  
  
  const MESSAGE_SENT_TOPIC = '0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036';
  
  const messageSentLog = receipt.logs.find(log => 
    log.topics[0]?.toLowerCase() === MESSAGE_SENT_TOPIC.toLowerCase()
  );
  
  if (!messageSentLog) {
    const uniqueTopics = [...new Set(receipt.logs.map(log => log.topics[0]))];
    uniqueTopics.forEach(topic => {
    });
    throw new Error('MessageSent event not found in transaction logs. This may not be a bridge transaction.');
  }
  
  
  // The message bytes are in the data field (ABI-encoded)
  // For a bytes parameter, the first 32 bytes (64 hex chars + 0x) are the offset,
  // next 32 bytes are the length, then the actual message
  
  // Note: For production, consider using viem's decodeEventLog with proper ABI:
  // const decoded = decodeEventLog({
  //   abi: MESSAGE_SENT_ABI,
  //   data: messageSentLog.data,
  //   topics: messageSentLog.topics,
  // });
  // However, manual parsing works reliably for this simple case.
  
  const data = messageSentLog.data;
  
  // Remove 0x prefix
  const hexData = data.startsWith('0x') ? data.slice(2) : data;
  
  // First 32 bytes (64 hex chars) = offset to data start
  // Next 32 bytes (64 hex chars) = length of message
  // Remaining bytes = actual message
  
  const offset = parseInt(hexData.slice(0, 64), 16);
  const lengthStart = offset * 2; // Convert byte offset to hex char position
  const length = parseInt(hexData.slice(lengthStart, lengthStart + 64), 16);
  const messageStart = lengthStart + 64;
  const messageEnd = messageStart + (length * 2);
  const messageHex = hexData.slice(messageStart, messageEnd);
  
  
  // Calculate message hash using keccak256 from viem
  const messageHashBytes = keccak256(`0x${messageHex}`);
  const messageHash = messageHashBytes;
  
  
  return messageHash;
}

/**
 * Main entry point
 */
async function main() {
  
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    process.exit(1);
  }
  
  const txHash = args[0];
  const networkArg = args.find(arg => arg.startsWith('--network='));
  const network = (networkArg?.split('=')[1] || 'mainnet');
  
  if (network !== 'mainnet' && network !== 'testnet') {
    process.exit(1);
  }
  
  try {
    let messageHash;
    
    // Test mode with mock message hash
    if (txHash === 'test') {
      messageHash = '0x' + '1'.repeat(64); // Mock hash for testing
    } else {
      // Step 1: Extract message hash from transaction
      messageHash = await extractMessageHash(txHash, network);
    }
    
    // Step 2: Fetch attestation with retry logic
    const attestation = await fetchAttestationWithRetry(messageHash, network);
    
    // Step 3: Display results
    if (attestation.attestation) {
    }
    
  } catch (error) {
    if (error.stack && process.env.DEBUG) {
    }
    process.exit(1);
  }
}

main();
