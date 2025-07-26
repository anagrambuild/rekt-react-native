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
