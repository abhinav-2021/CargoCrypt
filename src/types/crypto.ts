export interface TelemetryData {
  seq: number;
  timestamp: number;
  lat: number;
  lng: number;
  temp: number; // in Celsius
  lux: number;  // light level (normal sealed container: 0-5 lux)
  battery: number; // percentage 0-100%
  humidity?: number; // %
  pressure?: number; // hPa
  shockG?: number; // G-force accelerometer
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

export interface ConsigneeLogEntry {
  id: string;
  seq: number;
  timestamp: number;
  status: 'VERIFIED' | 'TAMPER_HASH_FAIL' | 'TAMPER_AEAD_FAIL' | 'REPLAY_DROPPED' | 'PHYSICAL_BREACH';
  prevHashMatch: boolean;
  currentHashMatch: boolean;
  aeadValid: boolean;
  signatureValid: boolean;
  replayCheckValid: boolean;
  physicalCheckValid: boolean;
  receivedHash: string;
  calculatedHash: string;
  message: string;
  telemetry?: TelemetryData;
  processingTimeMs: number;
}

export interface CryptoKeysState {
  aesKey: CryptoKey | null;
  aesKeyHex: string;
  deviceKeyPair: CryptoKeyPair | null;
  devicePubKeyHex: string;
  deviceFingerprint: string;
}

export interface SimulationState {
  currentWaypointIndex: number;
  isPlaying: boolean;
  speedMultiplier: number;
  activeAttack: AttackType | null;
  attackPending: AttackType | null;
  soundEnabled: boolean;
  genesisHash: string;
  packetCount: number;
  lastEmittedTime: number;
}

