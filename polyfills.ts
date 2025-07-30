// Polyfills for React Native with Hermes engine
import 'react-native-get-random-values';
// Buffer polyfill
import { Buffer } from 'buffer';
// Crypto polyfill for digest functions (required by Solana/Swig)
// Use expo-crypto for better Expo compatibility
import * as Crypto from 'expo-crypto';
global.Buffer = Buffer;

// Polyfill crypto.subtle for digest operations
if (!global.crypto.subtle) {
  // Create a new crypto object with subtle support
  const originalCrypto = global.crypto;
  global.crypto = {
    ...originalCrypto,
    subtle: {
      digest: async (algorithm: string, data: ArrayBuffer | Uint8Array) => {
        // Map Web Crypto API algorithm names to expo-crypto algorithms
        let expoCryptoAlgorithm;
        const algoName = algorithm.toUpperCase().replace('-', '');
        
        switch (algoName) {
          case 'SHA1':
            expoCryptoAlgorithm = Crypto.CryptoDigestAlgorithm.SHA1;
            break;
          case 'SHA256':
            expoCryptoAlgorithm = Crypto.CryptoDigestAlgorithm.SHA256;
            break;
          case 'SHA384':
            expoCryptoAlgorithm = Crypto.CryptoDigestAlgorithm.SHA384;
            break;
          case 'SHA512':
            expoCryptoAlgorithm = Crypto.CryptoDigestAlgorithm.SHA512;
            break;
          case 'MD5':
            expoCryptoAlgorithm = Crypto.CryptoDigestAlgorithm.MD5;
            break;
          default:
            // Default to SHA256 for unknown algorithms
            console.warn(`Unknown crypto algorithm: ${algorithm}, defaulting to SHA256`);
            expoCryptoAlgorithm = Crypto.CryptoDigestAlgorithm.SHA256;
        }
        
        // Convert data to proper format for expo-crypto
        const dataArray = new Uint8Array(data);
        
        // Use Buffer for proper binary-to-string conversion
        const dataString = Buffer.from(dataArray).toString('binary');
        
        const result = await Crypto.digestStringAsync(
          expoCryptoAlgorithm,
          dataString,
          { encoding: Crypto.CryptoEncoding.HEX }
        );
        
        // Convert hex string back to ArrayBuffer using Buffer (more reliable)
        const resultBuffer = Buffer.from(result, 'hex');
        return resultBuffer.buffer;
      },
    } as any,
  };
}

// Crypto polyfill - ensure it's available before any crypto operations
if (typeof global.crypto === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getRandomValues } = require('react-native-get-random-values');
  global.crypto = {
    getRandomValues,
    subtle: undefined as any,
    randomUUID: undefined as any,
  };
}

// Ensure crypto.getRandomValues is available globally
if (!global.crypto.getRandomValues) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getRandomValues } = require('react-native-get-random-values');
  global.crypto.getRandomValues = getRandomValues;
}

// Additional polyfill for older versions of bs58
if (typeof global.process === 'undefined') {
  global.process = { env: {} } as any;
}

// Base64 polyfill for react-native-quick-base64
if (typeof (global as any).base64ToArrayBuffer === 'undefined') {
  (global as any).base64ToArrayBuffer = (base64: string) => {
    const binaryString = Buffer.from(base64, 'base64').toString('binary');
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };
}

if (typeof (global as any).arrayBufferToBase64 === 'undefined') {
  (global as any).arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return Buffer.from(binary, 'binary').toString('base64');
  };
}

// Setup PRNG for tweetnacl
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nacl = require('tweetnacl');
if (nacl.setPRNG) {
  nacl.setPRNG((x: Uint8Array, n: number) => {
    global.crypto.getRandomValues(x.subarray(0, n));
  });
}

export {};
