import { 
  isValidStacksAddress, 
  validateStacksAddressForNetwork, 
  detectStacksNetwork,
  type StacksNetwork 
} from '../encoding';

describe('Stacks Address Validation', () => {
  // Official test addresses from c32check and CAIP-10 documentation
  const MAINNET_ADDRESS = 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7';
  const TESTNET_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
  
  describe('detectStacksNetwork', () => {
    it('should detect mainnet addresses (SP prefix)', () => {
      expect(detectStacksNetwork(MAINNET_ADDRESS)).toBe('mainnet');
      expect(detectStacksNetwork('SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE')).toBe('mainnet');
    });

    it('should detect mainnet multisig addresses (SM prefix)', () => {
      expect(detectStacksNetwork('SM1Y6EXF21RZ9739DFTEQKB1H044BMM0XVCM4A4NY')).toBe('mainnet');
    });

    it('should detect testnet addresses (ST prefix)', () => {
      expect(detectStacksNetwork(TESTNET_ADDRESS)).toBe('testnet');
      expect(detectStacksNetwork('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG')).toBe('testnet');
    });

    it('should detect testnet multisig addresses (SN prefix)', () => {
      expect(detectStacksNetwork('SN1Y6EXF21RZ9739DFTEQKB1H044BMM0XVCM4A4NY')).toBe('testnet');
    });

    it('should return null for invalid addresses', () => {
      expect(detectStacksNetwork('INVALID')).toBe(null);
      expect(detectStacksNetwork('0x1234')).toBe(null);
      expect(detectStacksNetwork('')).toBe(null);
    });
  });

  describe('isValidStacksAddress', () => {
    it('should validate mainnet addresses without network parameter', () => {
      expect(isValidStacksAddress(MAINNET_ADDRESS)).toBe(true);
    });

    it('should validate testnet addresses without network parameter', () => {
      expect(isValidStacksAddress(TESTNET_ADDRESS)).toBe(true);
    });

    it('should validate mainnet addresses with mainnet parameter', () => {
      expect(isValidStacksAddress(MAINNET_ADDRESS, 'mainnet')).toBe(true);
    });

    it('should reject testnet addresses when mainnet is specified', () => {
      expect(isValidStacksAddress(TESTNET_ADDRESS, 'mainnet')).toBe(false);
    });

    it('should validate testnet addresses with testnet parameter', () => {
      expect(isValidStacksAddress(TESTNET_ADDRESS, 'testnet')).toBe(true);
    });

    it('should reject mainnet addresses when testnet is specified', () => {
      expect(isValidStacksAddress(MAINNET_ADDRESS, 'testnet')).toBe(false);
    });

    it('should reject addresses with invalid prefixes', () => {
      expect(isValidStacksAddress('STTEST123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ')).toBe(false);
      expect(isValidStacksAddress('SX2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7')).toBe(false);
    });

    it('should reject addresses that are too short', () => {
      expect(isValidStacksAddress('SP123')).toBe(false);
    });

    it('should reject addresses that are too long', () => {
      expect(isValidStacksAddress('SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7TOOLONG123456')).toBe(false);
    });

    it('should reject addresses with invalid c32 characters', () => {
      expect(isValidStacksAddress('SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJI')).toBe(false); // I is invalid
      expect(isValidStacksAddress('SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJL')).toBe(false); // L is invalid
      expect(isValidStacksAddress('SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJO')).toBe(false); // O is invalid
      expect(isValidStacksAddress('SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJU')).toBe(false); // U is invalid
    });
  });

  describe('validateStacksAddressForNetwork', () => {
    describe('mainnet validation', () => {
      it('should accept valid mainnet addresses', () => {
        const result = validateStacksAddressForNetwork(MAINNET_ADDRESS, 'mainnet');
        expect(result.valid).toBe(true);
        expect(result.detectedNetwork).toBe('mainnet');
      });

      it('should reject testnet addresses with clear error message', () => {
        const result = validateStacksAddressForNetwork(TESTNET_ADDRESS, 'mainnet');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('testnet address');
        expect(result.reason).toContain('ST/SN');
        expect(result.detectedNetwork).toBe('testnet');
      });

      it('should reject invalid mainnet addresses', () => {
        const result = validateStacksAddressForNetwork('SP123INVALID', 'mainnet');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('Invalid mainnet');
      });
    });

    describe('testnet validation', () => {
      it('should accept valid testnet addresses', () => {
        const result = validateStacksAddressForNetwork(TESTNET_ADDRESS, 'testnet');
        expect(result.valid).toBe(true);
        expect(result.detectedNetwork).toBe('testnet');
      });

      it('should reject mainnet addresses with clear error message', () => {
        const result = validateStacksAddressForNetwork(MAINNET_ADDRESS, 'testnet');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('mainnet address');
        expect(result.reason).toContain('SP/SM');
        expect(result.detectedNetwork).toBe('mainnet');
      });

      it('should reject invalid testnet addresses', () => {
        const result = validateStacksAddressForNetwork('ST123INVALID', 'testnet');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('Invalid testnet');
      });
    });

    it('should handle empty or invalid input', () => {
      expect(validateStacksAddressForNetwork('', 'mainnet').valid).toBe(false);
      expect(validateStacksAddressForNetwork('INVALID', 'mainnet').valid).toBe(false);
    });
  });
});
