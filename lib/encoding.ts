import { createAddress } from '@stacks/transactions';
import { hex } from '@scure/base';

export function encodeStacksRecipient(stacksAddress: string): `0x${string}` {
  const address = createAddress(stacksAddress);
  const encoded = new Uint8Array(32);
  encoded[11] = address.version;
  const hash160Bytes = hex.decode(address.hash160);
  encoded.set(hash160Bytes, 12);
  return `0x${hex.encode(encoded)}` as `0x${string}`;
}

export function isValidStacksAddress(address: string): boolean {
  try {
    if (!address.startsWith('ST') && !address.startsWith('SP')) {
      return false;
    }
    if (address.length < 30 || address.length > 50) {
      return false;
    }
    createAddress(address);
    return true;
  } catch {
    return false;
  }
}

export function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
