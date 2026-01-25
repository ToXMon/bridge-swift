#!/usr/bin/env node
/**
 * Circle Attestation Monitoring Service
 * 
 * This service monitors bridge transactions and automatically fetches attestations
 * with retry logic for any stuck transactions.
 * 
 * Usage:
 *   node scripts/monitor-attestations.js
 * 
 * Can be run as:
 *   - Cron job (every 5-10 minutes)
 *   - Background service
 *   - Serverless function
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Check transactions from the last N hours
  LOOKBACK_HOURS: 24,
  
  // Consider transaction stuck after N minutes
  STUCK_THRESHOLD_MINUTES: 30,
  
  // Networks to monitor
  NETWORKS: ['mainnet', 'testnet'],
  
  // Storage path for transaction history
  STORAGE_PATH: path.join(__dirname, '../.attestation-cache'),
  
  // Retry configuration
  RETRY_CONFIG: {
    maxRetries: 10,
    initialDelayMs: 2000,
    maxDelayMs: 60000,
    backoffMultiplier: 2,
  },
};

// Circle Iris API endpoints
const IRIS_API = {
  mainnet: 'https://iris-api.circle.com',
  testnet: 'https://iris-api-sandbox.circle.com',
};

// RPC endpoints
const RPC_ENDPOINTS = {
  mainnet: process.env.ETH_RPC_MAINNET || 'https://rpc.ankr.com/eth',
  testnet: process.env.ETH_RPC_SEPOLIA || 'https://rpc.ankr.com/eth_sepolia',
};

/**
 * Load transaction history from localStorage or file
 */
function loadTransactionHistory() {
  try {
    if (fs.existsSync(CONFIG.STORAGE_PATH)) {
      const data = fs.readFileSync(CONFIG.STORAGE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading transaction history:', error.message);
  }
  return { transactions: [] };
}

/**
 * Save transaction history
 */
function saveTransactionHistory(history) {
  try {
    fs.writeFileSync(CONFIG.STORAGE_PATH, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Error saving transaction history:', error.message);
  }
}

/**
 * Find stuck transactions
 */
function findStuckTransactions(history) {
  const now = Date.now();
  const stuckThreshold = CONFIG.STUCK_THRESHOLD_MINUTES * 60 * 1000;
  const lookbackTime = CONFIG.LOOKBACK_HOURS * 60 * 60 * 1000;
  
  return history.transactions.filter(tx => {
    // Skip if already processed
    if (tx.attestation) return false;
    
    // Skip if too old
    const txAge = now - new Date(tx.timestamp).getTime();
    if (txAge > lookbackTime) return false;
    
    // Check if stuck
    return txAge > stuckThreshold;
  });
}

/**
 * Fetch attestation with retry logic (imported from fetch-attestation.js)
 */
async function fetchAttestationWithRetry(messageHash, network, config = CONFIG.RETRY_CONFIG) {
  const apiUrl = IRIS_API[network];
  const endpoint = `${apiUrl}/attestations/${messageHash}`;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      if (!response.ok) {
        if (attempt < config.maxRetries) {
          const delay = Math.min(
            config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt),
            config.maxDelayMs
          );
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'complete' && data.attestation) {
        return data;
      }
      
      if (data.status === 'pending' && attempt < config.maxRetries) {
        const delay = Math.min(
          config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelayMs
        );
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw new Error('Attestation pending after max retries');
      
    } catch (error) {
      if (attempt === config.maxRetries) throw error;
      
      const delay = Math.min(
        config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelayMs
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

/**
 * Process a stuck transaction
 */
async function processStuckTransaction(tx) {
  console.log(`\n🔄 Processing stuck transaction: ${tx.hash}`);
  console.log(`   Network: ${tx.network}`);
  console.log(`   Age: ${Math.floor((Date.now() - new Date(tx.timestamp).getTime()) / 60000)} minutes`);
  
  try {
    // In a real implementation, we'd extract the message hash from the transaction
    // For now, we'll use the transaction hash as identifier
    const messageHash = tx.hash;
    
    const attestation = await fetchAttestationWithRetry(messageHash, tx.network);
    
    console.log(`   ✅ Attestation retrieved!`);
    
    // Update transaction with attestation
    tx.attestation = attestation.attestation;
    tx.attestationFetchedAt = new Date().toISOString();
    
    return { success: true, tx };
    
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    
    // Update last attempt time
    tx.lastAttestationAttempt = new Date().toISOString();
    
    return { success: false, tx, error: error.message };
  }
}

/**
 * Monitor and process stuck transactions
 */
async function monitorAttestations() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔍 Circle Attestation Monitoring Service');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\n⏰ Started at: ${new Date().toISOString()}`);
  
  // Load transaction history
  const history = loadTransactionHistory();
  console.log(`\n📚 Loaded ${history.transactions.length} transactions`);
  
  // Find stuck transactions
  const stuckTxs = findStuckTransactions(history);
  console.log(`\n⚠️  Found ${stuckTxs.length} stuck transactions`);
  
  if (stuckTxs.length === 0) {
    console.log(`\n✅ No stuck transactions to process`);
    console.log('═══════════════════════════════════════════════════════════\n');
    return;
  }
  
  // Process each stuck transaction
  const results = [];
  for (const tx of stuckTxs) {
    const result = await processStuckTransaction(tx);
    results.push(result);
    
    // Update the transaction in history
    const index = history.transactions.findIndex(t => t.hash === tx.hash);
    if (index !== -1) {
      history.transactions[index] = result.tx;
    }
  }
  
  // Save updated history
  saveTransactionHistory(history);
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log('📊 Summary');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Total processed: ${results.length}`);
  console.log(`   ✅ Successful: ${successful}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`\n⏰ Completed at: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Return results for programmatic use
  return {
    processed: results.length,
    successful,
    failed,
    results,
  };
}

/**
 * Add a transaction to monitor
 * This can be called from the bridge UI when a transaction is initiated
 */
function addTransactionToMonitor(txHash, network, recipient, amount) {
  const history = loadTransactionHistory();
  
  const transaction = {
    hash: txHash,
    network,
    recipient,
    amount,
    timestamp: new Date().toISOString(),
    attestation: null,
    lastAttestationAttempt: null,
    attestationFetchedAt: null,
  };
  
  history.transactions.push(transaction);
  saveTransactionHistory(history);
  
  console.log(`✅ Added transaction to monitoring: ${txHash}`);
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Check for add-transaction command
  if (args[0] === 'add') {
    const [, txHash, network, recipient, amount] = args;
    if (!txHash || !network) {
      console.log('Usage: node monitor-attestations.js add <tx-hash> <network> [recipient] [amount]');
      process.exit(1);
    }
    addTransactionToMonitor(txHash, network, recipient, amount);
    return;
  }
  
  // Run monitoring
  try {
    await monitorAttestations();
  } catch (error) {
    console.error('❌ Monitoring error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

// Export for use as a module
module.exports = {
  monitorAttestations,
  addTransactionToMonitor,
  processStuckTransaction,
  fetchAttestationWithRetry,
};
