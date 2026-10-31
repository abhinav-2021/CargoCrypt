export interface TelemetryData {
  seq: number;
  timestamp: number;
  lat: number;
  lng: number;
  temp: number; // in Celsius (-20 to +40)
  lux: number;  // light level 0 to 1000
  battery: number; // percentage 0-100%
  shockG: number; // G-force accelerometer 0.0 to 5.0
  humidity?: number; // %
  pressure?: number; // hPa
  status?: string;
  waypointName?: string;
  doorSealed?: boolean;
}

export interface EncryptedPacket {
  seq: number;
  prev_hash: string;
  current_hash: string;
  iv: string; // 12-byte hex
  ciphertext: string; // hex
  device_sig: string; // hex signature from hardware enclave
  timestamp: number;
  tampered?: boolean;
  tamperReason?: string;
  isReplay?: boolean;
  originalCiphertext?: string;
  originalHash?: string;
}

export interface Waypoint {
  id: number;
  name: string;
  seaRegion: string;
  lat: number;
  lng: number;
  nominalTemp: number;
  nominalLux: number;
  eta: string;
  description: string;
  heading: number; // degrees
  speedKnots: number;
}

export type AttackType = 'none' | 'mitm' | 'replay' | 'physical';

export type AppViewMode = 'split' | 'iot' | 'relay' | 'consignee';

export interface ConsigneeLogEntry {
  id: string;
  seq: number;
  timestamp: number;
  status: 'VERIFIED' | 'TAMPER_HASH_FAIL' | 'TAMPER_AEAD_FAIL' | 'REPLAY_DROPPED' | 'PHYSICAL_BREACH' | 'KEY_MISSING_LOCKED';
  prevHashMatch: boolean;
  currentHashMatch: boolean;
  aeadValid: boolean;
  signatureValid: boolean;
  replayCheckValid: boolean;
  physicalCheckValid: boolean;
  receivedHash: string;
  calculatedHash: string;
  message: string;
  errorCode?: string; // e.g. "Error 0x4B2"
  telemetry?: TelemetryData;
  processingTimeMs: number;
  rawCiphertextSnippet?: string;
}

export interface CryptoKeysState {
  aesKey: CryptoKey | null;
  aesKeyHex: string;
  deviceKeyPair: CryptoKeyPair | null;
  devicePubKeyHex: string;
  deviceFingerprint: string;
}

export interface VerificationFailureDetails {
  blockSeq: number;
  expectedHash: string;
  calculatedHash: string;
  errorCode: string;
  reason: string;
  timestamp: number;
  receivedCiphertext: string;
}
