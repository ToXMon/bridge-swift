import { createAddress } from '@stacks/transactions';
import { hex } from '@scure/base';

export type StacksNetwork = 'mainnet' | 'testnet';

export function encodeStacksRecipient(stacksAddress: string): `0x${string}` {
  const address = createAddress(stacksAddress);
  const encoded = new Uint8Array(32);
  encoded[11] = address.version;
  const hash160Bytes = hex.decode(address.hash160);
  encoded.set(hash160Bytes, 12);
  return `0x${hex.encode(encoded)}` as `0x${string}`;
}

// Based on c32check library official version bytes:
// Mainnet: p2pkh=22 (SP prefix), p2sh=20 (SM prefix)
// Testnet: p2pkh=26 (ST prefix), p2sh=21 (SN prefix)
const MAINNET_VALID_PREFIXES = ['SP', 'SM'];
const TESTNET_VALID_PREFIXES = ['ST', 'SN'];

export function isValidStacksAddress(
  address: string,
  network?: StacksNetwork
): boolean {
  try {
    if (!address || typeof address !== 'string') {
      return false;
    }

    // If network is specified, check prefix matches network
    if (network) {
      const validPrefixes = network === 'mainnet' 
        ? MAINNET_VALID_PREFIXES 
        : TESTNET_VALID_PREFIXES;
      
      const hasValidPrefix = validPrefixes.some(prefix => address.startsWith(prefix));
      if (!hasValidPrefix) {
        return false;
      }
    } else {
      // If no network specified, accept any valid Stacks prefix
      const allValidPrefixes = [...MAINNET_VALID_PREFIXES, ...TESTNET_VALID_PREFIXES];
      const hasValidPrefix = allValidPrefixes.some(prefix => address.startsWith(prefix));
      if (!hasValidPrefix) {
        return false;
      }
    }

    // Total address length should be 40-42 characters (including prefix)
    if (address.length < 40 || address.length > 42) {
      return false;
    }

    // Check for valid c32 characters (Crockford base32)
    // Valid: 0-9, A-Z (excluding I, L, O, U)
    if (!/^S[PSMN][0123456789ABCDEFGHJKMNPQRSTVWXYZ]+$/.test(address)) {
      return false;
    }

    // Use Stacks library validation as final check
    createAddress(address);
    return true;
  } catch {
    return false;
  }
}

export function validateStacksAddressForNetwork(
  address: string,
  currentNetwork: StacksNetwork
): { valid: boolean; reason?: string; detectedNetwork?: StacksNetwork } {
  if (!address || typeof address !== 'string') {
    return { valid: false, reason: 'Invalid Stacks address format' };
  }

  // Detect network from address prefix
  let detectedNetwork: StacksNetwork | undefined;
  if (address.startsWith('SP') || address.startsWith('SM')) {
    detectedNetwork = 'mainnet';
  } else if (address.startsWith('ST') || address.startsWith('SN')) {
    detectedNetwork = 'testnet';
  }

  // Check if prefix matches current network
  if (currentNetwork === 'mainnet') {
    if (address.startsWith('ST') || address.startsWith('SN')) {
      return { 
        valid: false, 
        reason: 'This is a testnet address (starts with ST/SN). Switch to testnet or use a mainnet address (SP/SM).',
        detectedNetwork: 'testnet'
      };
    }
    if (!isValidStacksAddress(address, 'mainnet')) {
      return { 
        valid: false, 
        reason: 'Invalid mainnet Stacks address format. Must start with SP or SM.',
        detectedNetwork
      };
    }
  } else { // testnet
    if (address.startsWith('SP') || address.startsWith('SM')) {
      return { 
        valid: false, 
        reason: 'This is a mainnet address (starts with SP/SM). Switch to mainnet or use a testnet address (ST/SN).',
        detectedNetwork: 'mainnet'
      };
    }
    if (!isValidStacksAddress(address, 'testnet')) {
      return { 
        valid: false, 
        reason: 'Invalid testnet Stacks address format. Must start with ST or SN.',
        detectedNetwork
      };
    }
  }

  return { valid: true, detectedNetwork };
}

export function detectStacksNetwork(address: string): StacksNetwork | null {
  if (!address || typeof address !== 'string') {
    return null;
  }
  
  if (address.startsWith('SP') || address.startsWith('SM')) {
    return 'mainnet';
  } else if (address.startsWith('ST') || address.startsWith('SN')) {
    return 'testnet';
  }
  
  return null;
}

export function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
