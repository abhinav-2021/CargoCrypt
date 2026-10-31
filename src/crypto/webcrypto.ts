import type { TelemetryData } from '../types/crypto';

/**
 * Native WebCrypto Utility Suite
 * Uses ONLY browser-native window.crypto.subtle - No external crypto libraries.
 */

// Helper: Convert ArrayBuffer/Uint8Array to hex string
export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper: Convert hex string to Uint8Array
export function hexToUint8Array(hex: string): Uint8Array {
  const cleanHex = hex.trim().replace(/^0x/, '');
  const length = cleanHex.length;
  const bytes = new Uint8Array(Math.ceil(length / 2));
  for (let i = 0; i < length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2) || '0', 16);
  }
  return bytes;
}

/**
 * 1. generateSessionKey()
 * Generates an AES-GCM 256-bit CryptoKey.
 */
export async function generateSessionKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable for demo and consignee verification
    ['encrypt', 'decrypt']
  );
}

/**
 * Export AES CryptoKey to Hex string
 */
export async function exportKeyToHex(key: CryptoKey): Promise<string> {
  const raw = await window.crypto.subtle.exportKey('raw', key);
  return bufferToHex(raw);
}

/**
 * Import AES CryptoKey from Hex string
 */
export async function importKeyFromHex(hex: string): Promise<CryptoKey> {
  const rawBytes = hexToUint8Array(hex);
  return await window.crypto.subtle.importKey(
    'raw',
    rawBytes as unknown as BufferSource,
    {
      name: 'AES-GCM',
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate Device ECDSA P-256 KeyPair (Hardware Security Module simulation)
 */
export async function generateDeviceKeyPair(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify']
  );
}

/**
 * Export Public Key to SubjectPublicKeyInfo Hex string
 */
export async function exportPublicKeyToHex(publicKey: CryptoKey): Promise<string> {
  const spki = await window.crypto.subtle.exportKey('spki', publicKey);
  return bufferToHex(spki);
}

/**
 * Sign data using ECDSA P-256 Private Key
 */
export async function signTelemetryHash(privateKey: CryptoKey, hashHex: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(hashHex);
  const sig = await window.crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    privateKey,
    data as unknown as BufferSource
  );
  return bufferToHex(sig);
}

/**
 * Verify ECDSA signature using Public Key
 */
export async function verifyTelemetrySignature(
  publicKey: CryptoKey,
  sigHex: string,
  hashHex: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(hashHex);
    const sigBytes = hexToUint8Array(sigHex);
    return await window.crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' },
      },
      publicKey,
      sigBytes as unknown as BufferSource,
      data as unknown as BufferSource
    );
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

/**
 * 2. encryptTelemetry(key, data)
 * Encrypts {lat, lng, temp, lux, timestamp, seq, ...} with AES-GCM and 12-byte IV.
 * Returns { ciphertextHex, ivHex, rawLength }
 */
export async function encryptTelemetry(
  key: CryptoKey,
  data: TelemetryData
): Promise<{ ciphertext: string; iv: string; originalSize: number }> {
  // 12-byte (96-bit) cryptographically secure random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Deterministic JSON serialization
  const jsonStr = JSON.stringify({
    seq: data.seq,
    timestamp: data.timestamp,
    lat: Number(data.lat.toFixed(5)),
    lng: Number(data.lng.toFixed(5)),
    temp: Number(data.temp.toFixed(1)),
    lux: Math.round(data.lux),
    battery: Number(data.battery.toFixed(1)),
    humidity: data.humidity ? Number(data.humidity.toFixed(1)) : 72,
    pressure: data.pressure ? Number(data.pressure.toFixed(1)) : 1013,
    shockG: data.shockG ? Number(data.shockG.toFixed(2)) : 0.05,
    doorSealed: data.doorSealed !== false,
    waypointName: data.waypointName || '',
  });

  const encoder = new TextEncoder();
  const encodedData = encoder.encode(jsonStr);

  // AES-GCM encryption with 128-bit authentication tag appended
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
      tagLength: 128, // 128-bit AEAD auth tag
    },
    key,
    encodedData as unknown as BufferSource
  );

  return {
    ciphertext: bufferToHex(encryptedBuffer),
    iv: bufferToHex(iv),
    originalSize: encodedData.byteLength,
  };
}

/**
 * 3. decryptTelemetry(key, ciphertext, iv)
 * Decrypts payload back to object using AES-GCM.
 * Throws OperationError if ciphertext or IV has been tampered with.
 */
export async function decryptTelemetry(
  key: CryptoKey,
  ciphertextHex: string,
  ivHex: string
): Promise<TelemetryData> {
  const ciphertextBytes = hexToUint8Array(ciphertextHex);
  const ivBytes = hexToUint8Array(ivHex);

  // WebCrypto Subtle decrypt will verify the 16-byte GCM tag automatically.
  // If tampered with, it rejects with a DOMException (OperationError).
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes as unknown as BufferSource,
      tagLength: 128,
    },
    key,
    ciphertextBytes as unknown as BufferSource
  );

  const decoder = new TextDecoder();
  const jsonStr = decoder.decode(decryptedBuffer);
  return JSON.parse(jsonStr) as TelemetryData;
}

/**
 * 4. computeHashChain(prevHash, ciphertext, seq, timestamp)
 * Generates SHA-256 hex string linking the current block to the cryptographic chain.
 */
export async function computeHashChain(
  prevHash: string,
  ciphertext: string,
  seq: number,
  timestamp: number
): Promise<string> {
  const canonicalString = `${prevHash}|${ciphertext}|${seq}|${timestamp}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(canonicalString);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data as unknown as BufferSource);
  return bufferToHex(hashBuffer);
}

/**
 * MITM Tamper helper:
 * Modifies characters in the ciphertext hex to simulate byte corruption or injection in transit.
 */
export function tamperCiphertext(originalHex: string): { tamperedHex: string; tamperedIndex: number } {
  if (originalHex.length < 10) return { tamperedHex: originalHex + 'ff', tamperedIndex: 0 };

  const targetIndex = Math.min(16, originalHex.length - 2);
  const char = originalHex.charAt(targetIndex);
  const replacement = char.toLowerCase() === 'a' ? 'f' : char.toLowerCase() === '0' ? '9' : '0';

  const tamperedHex =
    originalHex.substring(0, targetIndex) +
    replacement +
    originalHex.substring(targetIndex + 1);

  return { tamperedHex, tamperedIndex: targetIndex };
}

/**
 * Calculate Shannon Entropy of a hex payload
 */
export function calculateEntropy(hexString: string): number {
  if (!hexString || hexString.length === 0) return 0;
  const bytes = hexToUint8Array(hexString);
  const frequencies = new Array(256).fill(0);
  for (let i = 0; i < bytes.length; i++) {
    frequencies[bytes[i]]++;
  }
  let entropy = 0;
  for (let i = 0; i < 256; i++) {
    if (frequencies[i] > 0) {
      const p = frequencies[i] / bytes.length;
      entropy -= p * Math.log2(p);
    }
  }
  return Number(entropy.toFixed(3));
}
