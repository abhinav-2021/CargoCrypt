import { useState, useEffect, useRef, useCallback } from 'react';
import { MARITIME_WAYPOINTS } from './data/waypoints';
import type {
  TelemetryData,
  EncryptedPacket,
  ConsigneeLogEntry,
  CryptoKeysState,
  AppViewMode,
  VerificationFailureDetails,
} from './types/crypto';
import {
  generateSessionKey,
  exportKeyToHex,
  generateDeviceKeyPair,
  exportPublicKeyToHex,
  signTelemetryHash,
  verifyTelemetrySignature,
  encryptTelemetry,
  decryptTelemetry,
  computeHashChain,
  tamperCiphertext,
} from './crypto/webcrypto';
import { sounds } from './sound/audioEffects';
import { HeaderBar } from './components/HeaderBar';
import { RedTeamToolbar } from './components/RedTeamToolbar';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { LeftPanelIoT } from './components/LeftPanelIoT';
import { CenterPanelRelay } from './components/CenterPanelRelay';
import { RightPanelConsignee } from './components/RightPanelConsignee';
import { AuditLedgerModal } from './components/AuditLedgerModal';

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
const CRUISE_INTERVAL_MS = 3000;

export function App() {
  // Cryptographic Keys State
  const [cryptoKeys, setCryptoKeys] = useState<CryptoKeysState>({
    aesKey: null,
    aesKeyHex: '',
    deviceKeyPair: null,
    devicePubKeyHex: '',
    deviceFingerprint: '',
  });

  // Consignee Key Status (Authorized Loaded vs Revoked Unauthorized)
  const [isConsigneeKeyLoaded, setIsConsigneeKeyLoaded] = useState(true);

  // Layout View Switcher
  const [viewMode, setViewMode] = useState<AppViewMode>('split');

  // Simulation & Dual Mode Controls
  const [isCruiseMode, setIsCruiseMode] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [packetBuildingStep, setPacketBuildingStep] = useState(0);

  // Interactive Sensor Sliders State
  const [tempInput, setTempInput] = useState(21.4);
  const [luxInput, setLuxInput] = useState(2);
  const [shockInput, setShockInput] = useState(0.05);

  // Staged Map Coordinates (from Map Click or Waypoint Click)
  const [stagedCoords, setStagedCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Navigation Progress
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);
  const [sequenceNumber, setSequenceNumber] = useState(0);
  const [lastChainedHash, setLastChainedHash] = useState(GENESIS_HASH);

  // Packet Queues & Transit Workbench
  const [stagedTransitPacket, setStagedTransitPacket] = useState<EncryptedPacket | null>(null);
  const [packetHistory, setPacketHistory] = useState<EncryptedPacket[]>([]);
  const [selectedPacket, setSelectedPacket] = useState<EncryptedPacket | null>(null);

  // Telemetry States
  const [currentTelemetry, setCurrentTelemetry] = useState<TelemetryData | null>(null);
  const [latestVerifiedTelemetry, setLatestVerifiedTelemetry] = useState<TelemetryData | null>(null);
  const [consigneeLogs, setConsigneeLogs] = useState<ConsigneeLogEntry[]>([]);

  // Verification Failure & Alerts
  const [lastFailureDetails, setLastFailureDetails] = useState<VerificationFailureDetails | null>(null);
  const [activeAlert, setActiveAlert] = useState<{
    type: 'TAMPER_HASH_FAIL' | 'TAMPER_AEAD_FAIL' | 'REPLAY_DROPPED' | 'PHYSICAL_BREACH' | 'KEY_MISSING_LOCKED' | null;
    message: string;
    blockSeq?: number;
    errorCode?: string;
  } | null>(null);

  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // Keep stateRef for background cruise intervals
  const stateRef = useRef({
    currentWaypointIndex,
    sequenceNumber,
    lastChainedHash,
    cryptoKeys,
    isConsigneeKeyLoaded,
    tempInput,
    luxInput,
    shockInput,
    stagedCoords,
    packetHistory,
  });

  useEffect(() => {
    stateRef.current = {
      currentWaypointIndex,
      sequenceNumber,
      lastChainedHash,
      cryptoKeys,
      isConsigneeKeyLoaded,
      tempInput,
      luxInput,
      shockInput,
      stagedCoords,
      packetHistory,
    };
  }, [
    currentWaypointIndex,
    sequenceNumber,
    lastChainedHash,
    cryptoKeys,
    isConsigneeKeyLoaded,
    tempInput,
    luxInput,
    shockInput,
    stagedCoords,
    packetHistory,
  ]);

  // Sync sound settings
  useEffect(() => {
    sounds.setEnabled(soundEnabled);
  }, [soundEnabled]);

  /**
   * 1. Initialize or Reset Ephemeral Cryptographic Keys
   */
  const initCrypto = useCallback(async () => {
    try {
      sounds.playKeygen();
      const aesKey = await generateSessionKey();
      const aesKeyHex = await exportKeyToHex(aesKey);

      const deviceKeyPair = await generateDeviceKeyPair();
      const devicePubKeyHex = await exportPublicKeyToHex(deviceKeyPair.publicKey);

      const randHex = Math.random().toString(16).substring(2, 8).toUpperCase();
      const fingerprint = `ATECC608B-SG-${randHex}`;

      const newKeys: CryptoKeysState = {
        aesKey,
        aesKeyHex,
        deviceKeyPair,
        devicePubKeyHex,
        deviceFingerprint: fingerprint,
      };

      setCryptoKeys(newKeys);
      return newKeys;
    } catch (err) {
      console.error('Failed to initialize WebCrypto keys:', err);
      return null;
    }
  }, []);

  /**
   * Reset Voyage & Enclave Keys
   */
  const handleResetVoyage = useCallback(async () => {
    setIsCruiseMode(false);
    setIsTransmitting(false);
    setActiveAlert(null);
    setLastFailureDetails(null);
    setStagedTransitPacket(null);
    setCurrentWaypointIndex(0);
    setSequenceNumber(0);
    setLastChainedHash(GENESIS_HASH);
    setPacketHistory([]);
    setSelectedPacket(null);
    setConsigneeLogs([]);
    setCurrentTelemetry(null);
    setLatestVerifiedTelemetry(null);
    setPacketBuildingStep(0);
    setStagedCoords(null);
    setIsConsigneeKeyLoaded(true);

    await initCrypto();
  }, [initCrypto]);

  /**
   * 2. Forward Packet from Transit/MITM Workbench to Consignee Enclave
   */
  const forwardPacketToConsignee = useCallback(async (packet: EncryptedPacket) => {
    const {
      cryptoKeys: keys,
      sequenceNumber: currentSeq,
      lastChainedHash: prevHash,
      isConsigneeKeyLoaded: keyLoaded,
    } = stateRef.current;

    const startTime = performance.now();
    setStagedTransitPacket(null);

    // Log packet into history
    setPacketHistory((prev) => [...prev, packet]);
    setSelectedPacket(packet);

    // CHECK: Is Consignee Session Key Loaded or Revoked?
    if (!keyLoaded || !keys.aesKey) {
      sounds.playBreach();
      const failLog: ConsigneeLogEntry = {
        id: `block-${packet.seq}-${packet.timestamp}`,
        seq: packet.seq,
        timestamp: packet.timestamp,
        status: 'KEY_MISSING_LOCKED',
        prevHashMatch: false,
        currentHashMatch: false,
        aeadValid: false,
        signatureValid: false,
        replayCheckValid: false,
        physicalCheckValid: false,
        receivedHash: packet.current_hash,
        calculatedHash: 'LOCKED: SESSION KEY NOT MOUNTED',
        message: 'LOCKED: VALID SESSION KEY REQUIRED (Zero-Knowledge Concealment Active)',
        errorCode: '0x10A_NO_KEY',
        processingTimeMs: performance.now() - startTime,
        rawCiphertextSnippet: packet.ciphertext.substring(0, 32) + '...',
      };

      setConsigneeLogs((prev) => [...prev, failLog]);
      setActiveAlert({
        type: 'KEY_MISSING_LOCKED',
        message: 'LOCKED: VALID SESSION KEY REQUIRED — Real-time telemetry locked in zero-knowledge enclave.',
        errorCode: '0x10A_NO_KEY',
      });
      return;
    }

    // CHECK A: Sequence Replay Check
    if (packet.seq <= currentSeq && packet.isReplay) {
      sounds.playBreach();
      const failLog: ConsigneeLogEntry = {
        id: `block-${packet.seq}-${packet.timestamp}`,
        seq: packet.seq,
        timestamp: packet.timestamp,
        status: 'REPLAY_DROPPED',
        prevHashMatch: true,
        currentHashMatch: false,
        aeadValid: false,
        signatureValid: false,
        replayCheckValid: false,
        physicalCheckValid: true,
        receivedHash: packet.current_hash,
        calculatedHash: 'N/A_EXPIRED_SEQ',
        message: `REPLAY DETECTED: Sequence #${packet.seq} is expired or duplicate (expected #${currentSeq + 1}). Packet dropped.`,
        errorCode: '0x3F1_REPLAY',
        processingTimeMs: performance.now() - startTime,
      };

      setConsigneeLogs((prev) => [...prev, failLog]);
      setActiveAlert({
        type: 'REPLAY_DROPPED',
        message: `REPLAY DETECTED: Sequence #${packet.seq} is expired or duplicate. Dropped.`,
        blockSeq: packet.seq,
        errorCode: '0x3F1_REPLAY',
      });
      return;
    }

    // CHECK B: SHA-256 Hash Recalculation
    const calculatedHash = await computeHashChain(
      prevHash,
      packet.ciphertext,
      packet.seq,
      packet.timestamp
    );

    const isHashValid = calculatedHash.toLowerCase() === packet.current_hash.toLowerCase();

    // CHECK C: AES-GCM AEAD Tag Decryption
    let aeadValid = false;
    let decryptedData: TelemetryData | null = null;
    try {
      decryptedData = await decryptTelemetry(keys.aesKey, packet.ciphertext, packet.iv);
      aeadValid = true;
    } catch {
      aeadValid = false;
    }

    // CHECK D: ECDSA P-256 Enclave Signature Verification
    const signatureValid = await verifyTelemetrySignature(
      keys.deviceKeyPair!.publicKey,
      packet.device_sig,
      packet.current_hash
    );

    const processingTime = performance.now() - startTime;

    // SCENARIO 1: INTEGRITY BREACH / TAMPER DETECTED
    if (!isHashValid || !aeadValid) {
      sounds.playBreach();
      const errorCode = 'Error 0x4B2';
      const failureReason = !isHashValid
        ? `Expected Hash: ${packet.current_hash.substring(0, 16)}... vs Calculated Hash: ${calculatedHash.substring(0, 16)}... -> INTEGRITY FAILURE (${errorCode})`
        : `AES-GCM AEAD Authentication Tag mismatch (${errorCode})`;

      setLastFailureDetails({
        blockSeq: packet.seq,
        expectedHash: packet.current_hash,
        calculatedHash: calculatedHash,
        errorCode,
        reason: failureReason,
        timestamp: packet.timestamp,
        receivedCiphertext: packet.ciphertext,
      });

      const failLog: ConsigneeLogEntry = {
        id: `block-${packet.seq}-${packet.timestamp}`,
        seq: packet.seq,
        timestamp: packet.timestamp,
        status: 'TAMPER_HASH_FAIL',
        prevHashMatch: true,
        currentHashMatch: isHashValid,
        aeadValid,
        signatureValid,
        replayCheckValid: true,
        physicalCheckValid: true,
        receivedHash: packet.current_hash,
        calculatedHash,
        message: `INTEGRITY FAILURE (${errorCode}): Payload modified in transit. Route rendering halted.`,
        errorCode,
        processingTimeMs: processingTime,
      };

      setConsigneeLogs((prev) => [...prev, failLog]);
      setActiveAlert({
        type: 'TAMPER_HASH_FAIL',
        message: `INTEGRITY FAILURE (${errorCode}): Expected Hash [${packet.current_hash.substring(0, 12)}...] vs Calculated Hash [${calculatedHash.substring(0, 12)}...]`,
        blockSeq: packet.seq,
        errorCode,
      });
      return;
    }

    // SCENARIO 2: PHYSICAL DOOR BREACH (Lux > 50)
    if (decryptedData && decryptedData.lux > 50) {
      sounds.playBreach();
      const failLog: ConsigneeLogEntry = {
        id: `block-${packet.seq}-${packet.timestamp}`,
        seq: packet.seq,
        timestamp: packet.timestamp,
        status: 'PHYSICAL_BREACH',
        prevHashMatch: true,
        currentHashMatch: true,
        aeadValid: true,
        signatureValid,
        replayCheckValid: true,
        physicalCheckValid: false,
        receivedHash: packet.current_hash,
        calculatedHash,
        message: `PHYSICAL CONTAINER BREACH: CARGO DOOR OPENED (LUX ${decryptedData.lux}). GEO-COORDINATES FLAGGED ON MARITIME MAP.`,
        errorCode: '0x99A_LUX_SPIKE',
        telemetry: decryptedData,
        processingTimeMs: processingTime,
      };

      setConsigneeLogs((prev) => [...prev, failLog]);
      setLatestVerifiedTelemetry(decryptedData);
      setActiveAlert({
        type: 'PHYSICAL_BREACH',
        message: `PHYSICAL CONTAINER BREACH: CARGO DOOR OPENED (LUX ${decryptedData.lux}). GEO-COORDINATES FLAGGED ON MARITIME MAP.`,
        blockSeq: packet.seq,
        errorCode: '0x99A_LUX_SPIKE',
      });

      // Advance sequence and position
      setSequenceNumber(packet.seq);
      setLastChainedHash(packet.current_hash);
      setCurrentWaypointIndex((prev) => (prev + 1) % MARITIME_WAYPOINTS.length);
      setStagedCoords(null);
      return;
    }

    // SCENARIO 3: AUTHENTIC VERIFIED BLOCK
    sounds.playVerified();
    setActiveAlert(null);
    setLastFailureDetails(null);
    setLatestVerifiedTelemetry(decryptedData);

    const verifiedLog: ConsigneeLogEntry = {
      id: `block-${packet.seq}-${packet.timestamp}`,
      seq: packet.seq,
      timestamp: packet.timestamp,
      status: 'VERIFIED',
      prevHashMatch: true,
      currentHashMatch: true,
      aeadValid: true,
      signatureValid,
      replayCheckValid: true,
      physicalCheckValid: true,
      receivedHash: packet.current_hash,
      calculatedHash,
      message: `Block #${packet.seq} cryptographically verified. SHA-256 chained into audit ledger.`,
      telemetry: decryptedData || undefined,
      processingTimeMs: processingTime,
    };

    setConsigneeLogs((prev) => [...prev, verifiedLog]);

    // Advance cryptographic chain
    setSequenceNumber(packet.seq);
    setLastChainedHash(packet.current_hash);
    setCurrentWaypointIndex((prev) => (prev + 1) % MARITIME_WAYPOINTS.length);
    setStagedCoords(null);
  }, []);

  /**
   * 3. Edge Transmitter: Build & Dispatch Encrypted Packet
   */
  const handleTransmitPacket = useCallback(
    async (
      autoForwardToConsignee: boolean = false,
      overrideTelemetry?: Partial<TelemetryData>,
      tamperInTransit?: boolean
    ): Promise<EncryptedPacket | null> => {
      const {
        currentWaypointIndex: wpIdx,
        sequenceNumber: currentSeq,
        lastChainedHash: prevHash,
        cryptoKeys: keys,
        tempInput: temp,
        luxInput: lux,
        shockInput: shock,
        stagedCoords: targetCoords,
      } = stateRef.current;

      if (!keys.aesKey || !keys.deviceKeyPair) return null;

      setIsTransmitting(true);
      const nextSeq = currentSeq + 1;
      const defaultWp = MARITIME_WAYPOINTS[wpIdx % MARITIME_WAYPOINTS.length];
      const timestamp = Date.now();

      const lat = overrideTelemetry?.lat ?? (targetCoords?.lat ?? defaultWp.lat);
      const lng = overrideTelemetry?.lng ?? (targetCoords?.lng ?? defaultWp.lng);
      const waypointName = targetCoords ? 'Custom GPS Target' : defaultWp.name;
      const finalTemp = overrideTelemetry?.temp ?? temp;
      const finalLux = overrideTelemetry?.lux ?? lux;
      const finalShock = overrideTelemetry?.shockG ?? shock;

      const telemetryData: TelemetryData = {
        seq: nextSeq,
        timestamp,
        lat,
        lng,
        temp: finalTemp,
        lux: finalLux,
        battery: Math.max(12, 98.4 - nextSeq * 0.15),
        shockG: finalShock,
        doorSealed: finalLux <= 50,
        waypointName,
      };

      setCurrentTelemetry(telemetryData);

      // Visual step sequence
      setPacketBuildingStep(1);
      await new Promise((r) => setTimeout(r, 40));
      setPacketBuildingStep(2);
      await new Promise((r) => setTimeout(r, 40));
      setPacketBuildingStep(3);
      await new Promise((r) => setTimeout(r, 40));

      // AES-GCM 256-bit Encryption
      const encryptionResult = await encryptTelemetry(keys.aesKey, telemetryData);
      setPacketBuildingStep(4);

      // SHA-256 Hash Chain
      const currentHash = await computeHashChain(
        prevHash,
        encryptionResult.ciphertext,
        nextSeq,
        timestamp
      );
      setPacketBuildingStep(5);

      // ECDSA P-256 Enclave Signature
      const deviceSig = await signTelemetryHash(keys.deviceKeyPair.privateKey, currentHash);
      setPacketBuildingStep(6);

      let finalCiphertext = encryptionResult.ciphertext;
      let isTampered = false;
      let tamperReason: string | undefined = undefined;

      if (tamperInTransit) {
        finalCiphertext = tamperCiphertext(encryptionResult.ciphertext).tamperedHex;
        isTampered = true;
        tamperReason = 'In-Flight Bit Mutation via Red Team MITM Suite';
      }

      const newPacket: EncryptedPacket = {
        seq: nextSeq,
        prev_hash: prevHash,
        current_hash: currentHash,
        iv: encryptionResult.iv,
        ciphertext: finalCiphertext,
        device_sig: deviceSig,
        timestamp,
        tampered: isTampered,
        tamperReason,
        originalCiphertext: encryptionResult.ciphertext,
        originalHash: currentHash,
      };

      sounds.playTransmit();
      setIsTransmitting(false);

      // Stage packet in the Untrusted Relay / MITM Workbench
      setStagedTransitPacket(newPacket);
      setSelectedPacket(newPacket);

      // If in Live Cruise mode or auto-forward requested, forward through transit immediately
      if (autoForwardToConsignee) {
        setTimeout(() => {
          forwardPacketToConsignee(newPacket);
        }, 200);
      }

      return newPacket;
    },
    [forwardPacketToConsignee]
  );

  /**
   * 4. Corrupt Bit & Forward action from MITM Workbench
   */
  const handleCorruptAndForward = useCallback(
    (customTamperedHex?: string) => {
      if (!stagedTransitPacket) return;

      const tamperedCiphertext =
        customTamperedHex || tamperCiphertext(stagedTransitPacket.ciphertext).tamperedHex;

      const corruptedPacket: EncryptedPacket = {
        ...stagedTransitPacket,
        ciphertext: tamperedCiphertext,
        tampered: true,
        tamperReason: 'Corrupted Bit in Transit via MITM Workbench',
      };

      forwardPacketToConsignee(corruptedPacket);
    },
    [stagedTransitPacket, forwardPacketToConsignee]
  );

  /**
   * 5. Inject Replay Attack
   */
  const handleInjectReplay = useCallback(() => {
    if (packetHistory.length < 1) return;
    const pastPacket = packetHistory[Math.max(0, packetHistory.length - 2)] || packetHistory[0];
    const replayPacket: EncryptedPacket = {
      ...pastPacket,
      isReplay: true,
      tamperReason: `Replay Attack: Injected Expired Sequence #${pastPacket.seq}`,
    };
    forwardPacketToConsignee(replayPacket);
  }, [packetHistory, forwardPacketToConsignee]);

  /**
   * Red Team Quick Scenario 1: MITM Ciphertext Tamper (Error 0x4B2)
   */
  const handleTriggerMitmTamperScenario = useCallback(async () => {
    if (stagedTransitPacket) {
      handleCorruptAndForward();
    } else {
      await handleTransmitPacket(true, undefined, true);
    }
  }, [stagedTransitPacket, handleCorruptAndForward, handleTransmitPacket]);

  /**
   * Red Team Quick Scenario 2: Replay Attack Injection (Error 0x3F1)
   */
  const handleTriggerReplayScenario = useCallback(async () => {
    const history = stateRef.current.packetHistory;
    if (history.length > 0) {
      const pastPacket = history[Math.max(0, history.length - 2)] || history[0];
      const replayPacket: EncryptedPacket = {
        ...pastPacket,
        isReplay: true,
        tamperReason: `Red Team Replay Attack: Injected Expired Sequence #${pastPacket.seq}`,
      };
      await forwardPacketToConsignee(replayPacket);
    } else {
      const pkt = await handleTransmitPacket(true);
      if (pkt) {
        setTimeout(async () => {
          const replayPacket: EncryptedPacket = {
            ...pkt,
            isReplay: true,
            tamperReason: `Red Team Replay Attack: Injected Expired Sequence #${pkt.seq}`,
          };
          await forwardPacketToConsignee(replayPacket);
        }, 300);
      }
    }
  }, [forwardPacketToConsignee, handleTransmitPacket]);

  /**
   * Red Team Quick Scenario 3: Physical Seal Breach (Lux > 50, Error 0x99A)
   */
  const handleTriggerPhysicalBreachScenario = useCallback(async () => {
    setLuxInput(940);
    setShockInput(3.8);
    await handleTransmitPacket(true, { lux: 940, shockG: 3.8, doorSealed: false });
  }, [handleTransmitPacket]);

  /**
   * Red Team Quick Scenario 4: Cold-Chain Reefer Spoilage (+38.5°C)
   */
  const handleTriggerColdChainScenario = useCallback(async () => {
    setTempInput(38.5);
    await handleTransmitPacket(true, { temp: 38.5 });
  }, [handleTransmitPacket]);

  /**
   * Red Team Quick Scenario 5: Zero-Knowledge Eavesdropper Test (0x10A_NO_KEY)
   */
  const handleTriggerZeroKnowledgeScenario = useCallback(async () => {
    const currentlyLoaded = stateRef.current.isConsigneeKeyLoaded;
    if (currentlyLoaded) {
      setIsConsigneeKeyLoaded(false);
      await handleTransmitPacket(true);
    } else {
      setIsConsigneeKeyLoaded(true);
    }
  }, [handleTransmitPacket]);

  /**
   * Red Team Quick Scenario 6: Clean Verified Telemetry Burst
   */
  const handleTriggerNormalBurstScenario = useCallback(async () => {
    setTempInput(21.4);
    setLuxInput(2);
    setShockInput(0.05);
    setIsConsigneeKeyLoaded(true);
    await handleTransmitPacket(true, { temp: 21.4, lux: 2, shockG: 0.05, doorSealed: true });
  }, [handleTransmitPacket]);

  // Operational Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not fire shortcuts if the user is typing inside an input, textarea, or select
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleTriggerNormalBurstScenario();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setIsCruiseMode((prev) => !prev);
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleTriggerMitmTamperScenario();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleTriggerReplayScenario();
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        handleTriggerPhysicalBreachScenario();
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        setIsConsigneeKeyLoaded((prev) => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setSoundEnabled((prev) => !prev);
      } else if (e.key === '1') {
        e.preventDefault();
        setViewMode('split');
      } else if (e.key === '2') {
        e.preventDefault();
        setViewMode('iot');
      } else if (e.key === '3') {
        e.preventDefault();
        setViewMode('relay');
      } else if (e.key === '4') {
        e.preventDefault();
        setViewMode('consignee');
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsShortcutsModalOpen(false);
        setIsAuditModalOpen(false);
        setActiveAlert(null);
        setLastFailureDetails(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleTriggerNormalBurstScenario,
    handleTriggerMitmTamperScenario,
    handleTriggerReplayScenario,
    handleTriggerPhysicalBreachScenario,
  ]);

  /**
   * 6. Direct JSON Export of Cryptographic Audit Trail
   */
  const handleExportAuditJSON = useCallback(() => {
    const certificate = {
      title: 'CargoCrypt Tamper-Evident Maritime Audit Certificate',
      timestamp: new Date().toISOString(),
      standards: 'NIST FIPS 197 (AES-256-GCM), FIPS 180-4 (SHA-256), FIPS 186-4 (ECDSA P-256)',
      cryptoImplementation: 'W3C Browser-Native Web Crypto API (SubtleCrypto)',
      genesisHash: GENESIS_HASH,
      deviceFingerprint: cryptoKeys.deviceFingerprint,
      devicePublicKeySPKI: cryptoKeys.devicePubKeyHex,
      summary: {
        totalBlocks: consigneeLogs.length,
        verifiedBlocks: consigneeLogs.filter((l) => l.status === 'VERIFIED').length,
        incidentsCaught: consigneeLogs.filter((l) => l.status !== 'VERIFIED').length,
      },
      auditLedgerChain: consigneeLogs.map((l) => ({
        seq: l.seq,
        timestamp: l.timestamp,
        status: l.status,
        calculatedHash: l.calculatedHash,
        receivedHash: l.receivedHash,
        hashMatch: l.currentHashMatch,
        aeadValid: l.aeadValid,
        signatureValid: l.signatureValid,
        message: l.message,
        errorCode: l.errorCode || null,
        telemetry: l.telemetry || null,
      })),
    };

    const blob = new Blob([JSON.stringify(certificate, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cargocrypt-audit-trail-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [consigneeLogs, cryptoKeys]);

  // Initial setup: generate keys and stage block #1
  useEffect(() => {
    let mounted = true;
    (async () => {
      const keys = await initCrypto();
      if (keys && mounted) {
        setTimeout(() => {
          handleTransmitPacket(true);
        }, 500);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [initCrypto, handleTransmitPacket]);

  // Live Cruise mode: Automatically emit every 3 seconds
  useEffect(() => {
    if (!isCruiseMode) return;

    const interval = setInterval(() => {
      handleTransmitPacket(true);
    }, CRUISE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isCruiseMode, handleTransmitPacket]);

  return (
    <div className="flex flex-col min-h-screen bg-[#05070b] text-zinc-100 selection:bg-emerald-500 selection:text-black">
      {/* Header Bar with View Switcher, Live Indicator, and Audit Export */}
      <HeaderBar
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        onResetVoyage={handleResetVoyage}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        onExportAuditJSON={handleExportAuditJSON}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        totalBlocksVerified={consigneeLogs.filter((l) => l.status === 'VERIFIED').length}
        totalIncidents={consigneeLogs.filter((l) => l.status !== 'VERIFIED').length}
        isKeyLoaded={isConsigneeKeyLoaded}
      />

      {/* Red Team Attack Suite & Operational Launcher */}
      <RedTeamToolbar
        onTriggerMitmTamper={handleTriggerMitmTamperScenario}
        onTriggerReplayAttack={handleTriggerReplayScenario}
        onTriggerPhysicalBreach={handleTriggerPhysicalBreachScenario}
        onTriggerColdChainSpike={handleTriggerColdChainScenario}
        onTriggerZeroKnowledgeTest={handleTriggerZeroKnowledgeScenario}
        onTriggerNormalBurst={handleTriggerNormalBurstScenario}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        isTransmitting={isTransmitting}
        activeAlert={activeAlert}
        isKeyLoaded={isConsigneeKeyLoaded}
        canReplay={packetHistory.length >= 1}
      />

      {/* Main Content Area based on View Mode */}
      <main className="flex-1 p-2.5 md:p-3 overflow-hidden flex flex-col">
        {/* VIEW 1: Split SOC View (Tri-Panel) */}
        {viewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 md:gap-3 flex-1 min-h-0">
            {/* Left Panel: IoT Edge Transmitter (3 cols) */}
            <div className="lg:col-span-3 h-full flex flex-col">
              <LeftPanelIoT
                currentTelemetry={currentTelemetry}
                latestPacket={packetHistory[packetHistory.length - 1] || null}
                cryptoKeys={cryptoKeys}
                packetBuildingStep={packetBuildingStep}
                isPhysicalBreached={activeAlert?.type === 'PHYSICAL_BREACH'}
                isCruiseMode={isCruiseMode}
                onToggleCruiseMode={() => setIsCruiseMode(!isCruiseMode)}
                onManualTransmit={() => handleTransmitPacket(false)}
                isTransmitting={isTransmitting}
                tempInput={tempInput}
                onTempChange={setTempInput}
                luxInput={luxInput}
                onLuxChange={setLuxInput}
                shockInput={shockInput}
                onShockChange={setShockInput}
                stagedCoords={stagedCoords}
                waypoints={MARITIME_WAYPOINTS}
                currentWaypointIndex={currentWaypointIndex}
                onSelectWaypointIndex={(idx) => {
                  setCurrentWaypointIndex(idx);
                  setStagedCoords(null);
                }}
              />
            </div>

            {/* Center Panel: Untrusted Relay / MITM Workbench (4 cols) */}
            <div className="lg:col-span-4 h-full flex flex-col">
              <CenterPanelRelay
                packetHistory={packetHistory}
                selectedPacket={selectedPacket}
                onSelectPacket={setSelectedPacket}
                stagedTransitPacket={stagedTransitPacket}
                onForwardPacket={forwardPacketToConsignee}
                onCorruptAndForward={handleCorruptAndForward}
                onInjectReplay={handleInjectReplay}
              />
            </div>

            {/* Right Panel: Authorized Consignee & Map (5 cols) */}
            <div className="lg:col-span-5 h-full flex flex-col">
              <RightPanelConsignee
                logs={consigneeLogs}
                latestVerifiedTelemetry={latestVerifiedTelemetry}
                waypoints={MARITIME_WAYPOINTS}
                currentWaypointIndex={currentWaypointIndex}
                cryptoKeys={cryptoKeys}
                isKeyLoaded={isConsigneeKeyLoaded}
                onToggleKeyLoaded={() => setIsConsigneeKeyLoaded(!isConsigneeKeyLoaded)}
                onReloadSessionKey={initCrypto}
                activeAlert={activeAlert}
                lastFailureDetails={lastFailureDetails}
                onDismissFailureModal={() => setLastFailureDetails(null)}
                stagedCoords={stagedCoords}
                onSelectCoords={(lat, lng) => setStagedCoords({ lat, lng })}
              />
            </div>
          </div>
        )}

        {/* VIEW 2: IoT Edge Terminal Only */}
        {viewMode === 'iot' && (
          <div className="max-w-4xl w-full mx-auto flex-1 min-h-0">
            <LeftPanelIoT
              currentTelemetry={currentTelemetry}
              latestPacket={packetHistory[packetHistory.length - 1] || null}
              cryptoKeys={cryptoKeys}
              packetBuildingStep={packetBuildingStep}
              isPhysicalBreached={activeAlert?.type === 'PHYSICAL_BREACH'}
              isCruiseMode={isCruiseMode}
              onToggleCruiseMode={() => setIsCruiseMode(!isCruiseMode)}
              onManualTransmit={() => handleTransmitPacket(false)}
              isTransmitting={isTransmitting}
              tempInput={tempInput}
              onTempChange={setTempInput}
              luxInput={luxInput}
              onLuxChange={setLuxInput}
              shockInput={shockInput}
              onShockChange={setShockInput}
              stagedCoords={stagedCoords}
              waypoints={MARITIME_WAYPOINTS}
              currentWaypointIndex={currentWaypointIndex}
              onSelectWaypointIndex={(idx) => {
                setCurrentWaypointIndex(idx);
                setStagedCoords(null);
              }}
            />
          </div>
        )}

        {/* VIEW 3: Cloud Interceptor / MITM Workbench Only */}
        {viewMode === 'relay' && (
          <div className="max-w-5xl w-full mx-auto flex-1 min-h-0">
            <CenterPanelRelay
              packetHistory={packetHistory}
              selectedPacket={selectedPacket}
              onSelectPacket={setSelectedPacket}
              stagedTransitPacket={stagedTransitPacket}
              onForwardPacket={forwardPacketToConsignee}
              onCorruptAndForward={handleCorruptAndForward}
              onInjectReplay={handleInjectReplay}
            />
          </div>
        )}

        {/* VIEW 4: Consignee Portal Only */}
        {viewMode === 'consignee' && (
          <div className="max-w-6xl w-full mx-auto flex-1 min-h-0">
            <RightPanelConsignee
              logs={consigneeLogs}
              latestVerifiedTelemetry={latestVerifiedTelemetry}
              waypoints={MARITIME_WAYPOINTS}
              currentWaypointIndex={currentWaypointIndex}
              cryptoKeys={cryptoKeys}
              isKeyLoaded={isConsigneeKeyLoaded}
              onToggleKeyLoaded={() => setIsConsigneeKeyLoaded(!isConsigneeKeyLoaded)}
              onReloadSessionKey={initCrypto}
              activeAlert={activeAlert}
              lastFailureDetails={lastFailureDetails}
              onDismissFailureModal={() => setLastFailureDetails(null)}
              stagedCoords={stagedCoords}
              onSelectCoords={(lat, lng) => setStagedCoords({ lat, lng })}
            />
          </div>
        )}
      </main>

      {/* Audit Certificate Modal */}
      <AuditLedgerModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        logs={consigneeLogs}
        cryptoKeys={cryptoKeys}
        genesisHash={GENESIS_HASH}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
}

export default App;
