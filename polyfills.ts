// Polyfills for React Native with Hermes engine
import 'react-native-get-random-values';
// Buffer polyfill
import { Buffer } from 'buffer';
global.Buffer = Buffer;

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

// Setup PRNG for tweetnacl
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nacl = require('tweetnacl');
if (nacl.setPRNG) {
  nacl.setPRNG((x: Uint8Array, n: number) => {
    global.crypto.getRandomValues(x.subarray(0, n));
  });
}

export {};
