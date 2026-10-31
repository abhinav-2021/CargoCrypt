import { useState, useEffect, useRef, useCallback } from 'react';
import { MARITIME_WAYPOINTS } from './data/waypoints';
import type {
  TelemetryData,
  EncryptedPacket,
  ConsigneeLogEntry,
  CryptoKeysState,
  AttackType,
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
import { LeftPanelIoT } from './components/LeftPanelIoT';
import { CenterPanelRelay } from './components/CenterPanelRelay';
import { RightPanelConsignee } from './components/RightPanelConsignee';
import { AuditLedgerModal } from './components/AuditLedgerModal';

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
const BASE_EMIT_INTERVAL_MS = 3500;

export function App() {
  // Cryptographic Keys State
  const [cryptoKeys, setCryptoKeys] = useState<CryptoKeysState>({
    aesKey: null,
    aesKeyHex: '',
    deviceKeyPair: null,
    devicePubKeyHex: '',
    deviceFingerprint: '',
  });

  // Simulation & Voyage State
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);
  const [sequenceNumber, setSequenceNumber] = useState(0);
  const [lastChainedHash, setLastChainedHash] = useState(GENESIS_HASH);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [packetBuildingStep, setPacketBuildingStep] = useState(0);

  // Attack Suite State
  const [activeAttack, setActiveAttack] = useState<AttackType | null>(null);
  const [pendingAttack, setPendingAttack] = useState<AttackType | null>(null);
  const [isPhysicalBreached, setIsPhysicalBreached] = useState(false);
  const [activeTamperedSeq, setActiveTamperedSeq] = useState<number | null>(null);

  // Data history
  const [currentTelemetry, setCurrentTelemetry] = useState<TelemetryData | null>(null);
  const [latestVerifiedTelemetry, setLatestVerifiedTelemetry] = useState<TelemetryData | null>(null);
  const [packetHistory, setPacketHistory] = useState<EncryptedPacket[]>([]);
  const [selectedPacket, setSelectedPacket] = useState<EncryptedPacket | null>(null);
  const [consigneeLogs, setConsigneeLogs] = useState<ConsigneeLogEntry[]>([]);

  // Consignee Alert Banner
  const [activeAlert, setActiveAlert] = useState<{
    type: 'TAMPER_HASH_FAIL' | 'TAMPER_AEAD_FAIL' | 'REPLAY_DROPPED' | 'PHYSICAL_BREACH' | null;
    message: string;
    blockSeq?: number;
  } | null>(null);

  // Modal State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Ref to track latest state inside intervals
  const stateRef = useRef({
    currentWaypointIndex: 0,
    sequenceNumber: 0,
    lastChainedHash: GENESIS_HASH,
    cryptoKeys,
    isPhysicalBreached: false,
    pendingAttack: null as AttackType | null,
    packetHistory: [] as EncryptedPacket[],
  });

  useEffect(() => {
    stateRef.current = {
      currentWaypointIndex,
      sequenceNumber,
      lastChainedHash,
      cryptoKeys,
      isPhysicalBreached,
      pendingAttack,
      packetHistory,
    };
  }, [
    currentWaypointIndex,
    sequenceNumber,
    lastChainedHash,
    cryptoKeys,
    isPhysicalBreached,
    pendingAttack,
    packetHistory,
  ]);

  // Sync sound setting
  useEffect(() => {
    sounds.setEnabled(soundEnabled);
  }, [soundEnabled]);

  /**
   * Initialize or Reset Cryptographic Enclave
   */
  const initCrypto = useCallback(async () => {
    try {
      sounds.playKeygen();
      const aesKey = await generateSessionKey();
      const aesKeyHex = await exportKeyToHex(aesKey);

      const deviceKeyPair = await generateDeviceKeyPair();
      const devicePubKeyHex = await exportPublicKeyToHex(deviceKeyPair.publicKey);

      // Random hardware fingerprint for container HSM
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
   * Reset entire voyage
   */
  const handleResetVoyage = useCallback(async () => {
    setIsPlaying(false);
    setActiveAttack(null);
    setPendingAttack(null);
    setIsPhysicalBreached(false);
    setActiveTamperedSeq(null);
    setActiveAlert(null);
    setCurrentWaypointIndex(0);
    setSequenceNumber(0);
    setLastChainedHash(GENESIS_HASH);
    setPacketHistory([]);
    setSelectedPacket(null);
    setConsigneeLogs([]);
    setCurrentTelemetry(null);
    setLatestVerifiedTelemetry(null);
    setPacketBuildingStep(0);

    const keys = await initCrypto();
    if (keys) {
      setIsPlaying(true);
    }
  }, [initCrypto]);

  /**
   * Pipeline: Emit and Process a Single Telemetry Packet
   */
  const emitTelemetryPacket = useCallback(async (forcedAttack?: AttackType) => {
    const {
      currentWaypointIndex: wpIdx,
      sequenceNumber: currentSeq,
      lastChainedHash: prevHash,
      cryptoKeys: keys,
      isPhysicalBreached: physicallyBreached,
      pendingAttack: currentPendingAttack,
    } = stateRef.current;

    if (!keys.aesKey || !keys.deviceKeyPair) return;

    const attackToApply = forcedAttack || currentPendingAttack;
    if (attackToApply) {
      setPendingAttack(null);
      setActiveAttack(attackToApply);
    }

    const nextSeq = currentSeq + 1;
    const wp = MARITIME_WAYPOINTS[wpIdx % MARITIME_WAYPOINTS.length];
    const timestamp = Date.now();

    // 1. Physical breach sensor logic (Lux spike to 924 lux)
    const shouldBreachPhysical = attackToApply === 'physical' || physicallyBreached;
    if (attackToApply === 'physical') {
      setIsPhysicalBreached(true);
    }

    const luxValue = shouldBreachPhysical ? 924 : Math.round(wp.nominalLux + Math.random() * 2);
    const tempValue = Number((wp.nominalTemp + (Math.random() * 0.4 - 0.2)).toFixed(1));
    const batteryValue = Math.max(10, 98.4 - nextSeq * 0.15);

    const telemetryData: TelemetryData = {
      seq: nextSeq,
      timestamp,
      lat: wp.lat,
      lng: wp.lng,
      temp: tempValue,
      lux: luxValue,
      battery: batteryValue,
      shockG: 0.04 + Math.random() * 0.03,
      doorSealed: !shouldBreachPhysical,
      waypointName: wp.name,
    };

    setCurrentTelemetry(telemetryData);

    // Visual step animation
    setPacketBuildingStep(1); // Sensors sampled
    await new Promise((r) => setTimeout(r, 60));
    setPacketBuildingStep(2); // Serialized
    await new Promise((r) => setTimeout(r, 60));
    setPacketBuildingStep(3); // IV generated
    await new Promise((r) => setTimeout(r, 60));

    // 2. AES-GCM 256-bit Encryption
    const encryptionResult = await encryptTelemetry(keys.aesKey, telemetryData);
    setPacketBuildingStep(4); // Encrypted

    // 3. Compute SHA-256 Hash Chain
    const currentHash = await computeHashChain(
      prevHash,
      encryptionResult.ciphertext,
      nextSeq,
      timestamp
    );
    setPacketBuildingStep(5); // Hash chained

    // 4. ECDSA P-256 Device Signature
    const deviceSig = await signTelemetryHash(keys.deviceKeyPair.privateKey, currentHash);
    setPacketBuildingStep(6); // Signed

    // Create raw packet
    let packetToTransmit: EncryptedPacket = {
      seq: nextSeq,
      prev_hash: prevHash,
      current_hash: currentHash,
      iv: encryptionResult.iv,
      ciphertext: encryptionResult.ciphertext,
      device_sig: deviceSig,
      timestamp,
    };

    // 5. In-Transit Attack Manipulations (Simulate attacker on the relay)
    if (attackToApply === 'mitm') {
      // Alter a character in the ciphertext to corrupt payload in transit
      const { tamperedHex } = tamperCiphertext(packetToTransmit.ciphertext);
      packetToTransmit = {
        ...packetToTransmit,
        ciphertext: tamperedHex,
        tampered: true,
        tamperReason: 'MITM Byte Tampered in Transit (Payload Altered)',
      };
      setActiveTamperedSeq(nextSeq);
    } else if (attackToApply === 'replay') {
      // Injects an expired or previously validated sequence packet
      const replaySeq = Math.max(1, nextSeq - 2);
      packetToTransmit = {
        ...packetToTransmit,
        seq: replaySeq,
        isReplay: true,
        tamperReason: `Replay Attack: Injected Expired Sequence #${replaySeq}`,
      };
    }

    // Play transmit sound
    sounds.playTransmit();

    // Broadcast into untrusted relay
    setPacketHistory((prev) => [...prev, packetToTransmit]);
    setSelectedPacket(packetToTransmit);

    // 6. Authorized Consignee Ingestion & Multi-Layer Zero-Knowledge Verification
    const startTime = performance.now();
    let currentHashMatch = false;
    let aeadValid = false;
    let signatureValid = false;
    let replayCheckValid = false;
    let physicalCheckValid = true;
    let decryptedData: TelemetryData | null = null;
    let consigneeStatus: ConsigneeLogEntry['status'] = 'VERIFIED';
    let alertMessage = '';

    // Step A: Sequence Replay Check
    if (packetToTransmit.seq <= currentSeq && packetToTransmit.isReplay) {
      replayCheckValid = false;
      consigneeStatus = 'REPLAY_DROPPED';
      alertMessage = `REPLAY DETECTED: Sequence #${packetToTransmit.seq} is expired or duplicate (expected #${nextSeq}). Packet dropped.`;
      sounds.playBreach();
      setActiveAlert({
        type: 'REPLAY_DROPPED',
        message: alertMessage,
        blockSeq: packetToTransmit.seq,
      });
    } else {
      replayCheckValid = true;

      // Step B: SHA-256 Hash Chain Recalculation
      const calculatedHash = await computeHashChain(
        prevHash,
        packetToTransmit.ciphertext,
        packetToTransmit.seq,
        packetToTransmit.timestamp
      );

      currentHashMatch = calculatedHash.toLowerCase() === packetToTransmit.current_hash.toLowerCase();

      // Step C: ECDSA P-256 Signature Verification
      signatureValid = await verifyTelemetrySignature(
        keys.deviceKeyPair.publicKey,
        packetToTransmit.device_sig,
        packetToTransmit.current_hash
      );

      // Step D: AES-GCM Decryption (AEAD Tag Verification)
      try {
        decryptedData = await decryptTelemetry(
          keys.aesKey,
          packetToTransmit.ciphertext,
          packetToTransmit.iv
        );
        aeadValid = true;
      } catch {
        aeadValid = false;
      }

      // Check for MITM Integrity Failure
      if (!currentHashMatch || !aeadValid) {
        consigneeStatus = 'TAMPER_HASH_FAIL';
        alertMessage = `INTEGRITY BREACH: HASH MISMATCH AT BLOCK #${packetToTransmit.seq} (AES-GCM Auth Tag Failure)`;
        sounds.playBreach();
        setActiveAlert({
          type: 'TAMPER_HASH_FAIL',
          message: alertMessage,
          blockSeq: packetToTransmit.seq,
        });
      } else if (decryptedData && decryptedData.lux > 100) {
        // Step E: Physical Intrusion Check (Lux > 100)
        physicalCheckValid = false;
        consigneeStatus = 'PHYSICAL_BREACH';
        alertMessage = `PHYSICAL CONTAINER BREACH: CARGO DOOR OPENED (LUX ${decryptedData.lux}). GEO-COORDINATES FLAGGED ON MARITIME MAP.`;
        sounds.playBreach();
        setActiveAlert({
          type: 'PHYSICAL_BREACH',
          message: alertMessage,
          blockSeq: packetToTransmit.seq,
        });
        setLatestVerifiedTelemetry(decryptedData);
      } else {
        // Valid packet verified!
        consigneeStatus = 'VERIFIED';
        alertMessage = `Block #${packetToTransmit.seq} cryptographically verified. Sealed into hash ledger.`;
        sounds.playVerified();
        setLatestVerifiedTelemetry(decryptedData);
        // If alert was MITM or Replay, clear it on next successful block
        if (activeAlert?.type !== 'PHYSICAL_BREACH') {
          setActiveAlert(null);
        }
      }

      const processingTime = performance.now() - startTime;

      // Record to Consignee Audit Ledger
      const logEntry: ConsigneeLogEntry = {
        id: `block-${packetToTransmit.seq}-${timestamp}`,
        seq: packetToTransmit.seq,
        timestamp,
        status: consigneeStatus,
        prevHashMatch: true,
        currentHashMatch,
        aeadValid,
        signatureValid,
        replayCheckValid,
        physicalCheckValid,
        receivedHash: packetToTransmit.current_hash,
        calculatedHash,
        message: alertMessage,
        telemetry: decryptedData || undefined,
        processingTimeMs: processingTime,
      };

      setConsigneeLogs((prev) => [...prev, logEntry]);

      // Only advance chain and waypoint if the packet was valid and not tampered/replayed
      if (consigneeStatus === 'VERIFIED' || consigneeStatus === 'PHYSICAL_BREACH') {
        setSequenceNumber(nextSeq);
        setLastChainedHash(packetToTransmit.current_hash);
        setCurrentWaypointIndex((prevIdx) => (prevIdx + 1) % MARITIME_WAYPOINTS.length);
      }
    }
  }, [activeAlert?.type]);

  // Initial load: Generate cryptographic keys and emit block #1
  useEffect(() => {
    let mounted = true;
    (async () => {
      const keys = await initCrypto();
      if (keys && mounted) {
        // Emit initial block
        setTimeout(() => {
          emitTelemetryPacket();
        }, 500);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [initCrypto]);

  // Periodic simulation emission timer (every 3.5s by default)
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = Math.max(800, BASE_EMIT_INTERVAL_MS / speedMultiplier);
    const interval = setInterval(() => {
      emitTelemetryPacket();
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isPlaying, speedMultiplier, emitTelemetryPacket]);

  // Red Team Attack Triggers
  const handleTriggerAttack = (type: AttackType) => {
    setPendingAttack(type);
    // If paused, immediately emit with attack
    if (!isPlaying) {
      emitTelemetryPacket(type);
    }
  };

  const handleManualStep = () => {
    emitTelemetryPacket();
  };

  const handleCycleSpeed = () => {
    setSpeedMultiplier((prev) => (prev === 1 ? 2 : prev === 2 ? 4 : 1));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#05070b] text-zinc-100 selection:bg-emerald-500 selection:text-black">
      {/* Header Bar */}
      <HeaderBar
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        speedMultiplier={speedMultiplier}
        onCycleSpeed={handleCycleSpeed}
        onManualStep={handleManualStep}
        onTriggerAttack={handleTriggerAttack}
        onResetVoyage={handleResetVoyage}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        activeAttack={activeAttack}
        pendingAttack={pendingAttack}
        currentWaypointNum={currentWaypointIndex + 1}
        totalWaypoints={MARITIME_WAYPOINTS.length}
        totalBlocksVerified={consigneeLogs.filter((l) => l.status === 'VERIFIED').length}
      />

      {/* Main 3-Panel Architecture Layout */}
      <main className="flex-1 p-3 md:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 overflow-hidden">
        {/* Left Panel: IoT Edge Device (col-span-3) */}
        <div className="lg:col-span-3 h-[600px] lg:h-[calc(100vh-80px)] flex flex-col">
          <LeftPanelIoT
            currentTelemetry={currentTelemetry}
            latestPacket={packetHistory[packetHistory.length - 1] || null}
            cryptoKeys={cryptoKeys}
            packetBuildingStep={packetBuildingStep}
            isPhysicalBreached={isPhysicalBreached}
          />
        </div>

        {/* Center Panel: Untrusted Relay / Hacker View (col-span-4) */}
        <div className="lg:col-span-4 h-[600px] lg:h-[calc(100vh-80px)] flex flex-col">
          <CenterPanelRelay
            packetHistory={packetHistory}
            selectedPacket={selectedPacket}
            onSelectPacket={setSelectedPacket}
            onTamperCurrentPayload={() => handleTriggerAttack('mitm')}
            activeTamperedPacketSeq={activeTamperedSeq}
          />
        </div>

        {/* Right Panel: Authorized Consignee & Map (col-span-5) */}
        <div className="lg:col-span-5 h-[650px] lg:h-[calc(100vh-80px)] flex flex-col">
          <RightPanelConsignee
            logs={consigneeLogs}
            latestVerifiedTelemetry={latestVerifiedTelemetry}
            waypoints={MARITIME_WAYPOINTS}
            currentWaypointIndex={currentWaypointIndex}
            cryptoKeys={cryptoKeys}
            activeAlert={activeAlert}
          />
        </div>
      </main>

      {/* Cryptographic Audit Certificate Modal */}
      <AuditLedgerModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        logs={consigneeLogs}
        cryptoKeys={cryptoKeys}
        genesisHash={GENESIS_HASH}
      />
    </div>
  );
}

export default App;
