import React, { useState } from 'react';
import {
  Cpu,
  Sun,
  Thermometer,
  BatteryCharging,
  Compass,
  Key,
  Eye,
  EyeOff,
  Activity,
  Layers,
} from 'lucide-react';
import type { TelemetryData, EncryptedPacket, CryptoKeysState } from '../types/crypto';

interface LeftPanelIoTProps {
  currentTelemetry: TelemetryData | null;
  latestPacket: EncryptedPacket | null;
  cryptoKeys: CryptoKeysState;
  packetBuildingStep: number; // 0 to 6
  isPhysicalBreached: boolean;
}

export const LeftPanelIoT: React.FC<LeftPanelIoTProps> = ({
  currentTelemetry,
  latestPacket,
  cryptoKeys,
  packetBuildingStep,
  isPhysicalBreached,
}) => {
  const [showKeyHex, setShowKeyHex] = useState(false);
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');

  const lux = currentTelemetry?.lux ?? 2;
  const tempC = currentTelemetry?.temp ?? 23.2;
  const displayTemp = tempUnit === 'C' ? `${tempC.toFixed(1)}°C` : `${((tempC * 9) / 5 + 32).toFixed(1)}°F`;
  const batteryPct = currentTelemetry?.battery ?? 98.4;
  const shock = currentTelemetry?.shockG ?? 0.05;

  const pipelineSteps = [
    { id: 1, label: 'Sensor Sampling', detail: 'Lux, Temp, Accel read from tamper pins' },
    { id: 2, label: 'JSON Serialization', detail: 'Deterministic canonical payload' },
    { id: 3, label: 'WebCrypto IV Generation', detail: '12-byte cryptographically secure random IV' },
    { id: 4, label: 'AES-256-GCM Encryption', detail: 'Authenticated cipher with 128-bit tag' },
    { id: 5, label: 'SHA-256 Chaining', detail: 'Linked to previous block hash' },
    { id: 6, label: 'ECDSA P-256 Signing', detail: 'Hardware enclave non-repudiation' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0a0d16] border border-cyber-border rounded-xl overflow-hidden shadow-xl">
      {/* Panel Header */}
      <div className="px-4 py-3 bg-[#0d121f] border-b border-cyber-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-100 flex items-center gap-2">
              IoT Edge Transmitter
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </h2>
            <div className="text-[10px] text-zinc-400 font-mono">
              Model: TransCrypt Smart-Seal HSM • ATECC608B
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800">
            ENCLAVE ARMED
          </div>
          {latestPacket && (
            <div className="text-[9px] font-mono text-zinc-500 mt-0.5">
              LAST SENT: #{latestPacket.seq}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
        {/* Physical Tamper & Lux Sensor Card */}
        <div
          className={`p-3.5 rounded-lg border transition-all ${
            isPhysicalBreached || lux > 100
              ? 'bg-rose-950/40 border-rose-500 text-rose-200 animate-glow-crimson'
              : 'bg-zinc-950/60 border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sun
                className={`w-4 h-4 ${
                  isPhysicalBreached || lux > 100 ? 'text-rose-400 animate-bounce' : 'text-amber-400'
                }`}
              />
              <span className="text-xs font-mono font-bold text-zinc-200">Container Light (Lux)</span>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                isPhysicalBreached || lux > 100
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              }`}
            >
              {isPhysicalBreached || lux > 100 ? 'DOOR OPEN / SEAL BREACH' : 'HERMETIC SEAL INTACT'}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-mono font-extrabold text-zinc-100 tracking-tight">
              {lux}{' '}
              <span className="text-xs font-normal text-zinc-400">
                {lux > 100 ? 'LUX (High Daylight Intrusion!)' : 'lux (nominal pitch dark <15)'}
              </span>
            </div>
          </div>

          {/* Lux Gauge bar */}
          <div className="w-full bg-zinc-900 rounded-full h-2 mt-2 overflow-hidden border border-zinc-800">
            <div
              className={`h-full transition-all duration-500 ${
                lux > 100 ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (lux / 900) * 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[9px] font-mono text-zinc-500 mt-1">
            <span>0 lx (Dark)</span>
            <span>Threshold: 50 lx</span>
            <span>1000 lx (Sun)</span>
          </div>
        </div>

        {/* Multi-Sensor Grid: Temp, Battery, Shock, Heading */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Temperature */}
          <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-lg">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[10px] font-mono flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                Cargo Temp
              </span>
              <button
                onClick={() => setTempUnit(tempUnit === 'C' ? 'F' : 'C')}
                className="text-[9px] font-mono text-zinc-400 hover:text-cyan-400 border border-zinc-800 px-1 rounded"
              >
                °{tempUnit}
              </button>
            </div>
            <div className="text-lg font-mono font-bold text-zinc-100">{displayTemp}</div>
            <div className="text-[10px] font-mono text-emerald-400 mt-0.5">Reefer: Active Stable</div>
          </div>

          {/* Battery */}
          <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-lg">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[10px] font-mono flex items-center gap-1">
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                Lithium Cell
              </span>
              <span className="text-[10px] font-mono text-emerald-400">3.88 V</span>
            </div>
            <div className="text-lg font-mono font-bold text-zinc-100">{batteryPct.toFixed(1)}%</div>
            <div className="text-[10px] font-mono text-zinc-500 mt-0.5">Est. 42 days left</div>
          </div>

          {/* Accelerometer / Shock */}
          <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-lg">
            <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 mb-1">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              Swell / Shock G
            </div>
            <div className="text-lg font-mono font-bold text-zinc-100">{shock.toFixed(2)} G</div>
            <div className="text-[10px] font-mono text-zinc-500 mt-0.5">No impact detected</div>
          </div>

          {/* Heading & GPS */}
          <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-lg">
            <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 mb-1">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              Compass & Spd
            </div>
            <div className="text-lg font-mono font-bold text-zinc-100">
              {currentTelemetry?.lat.toFixed(2)}°, {currentTelemetry?.lng.toFixed(2)}°
            </div>
            <div className="text-[10px] font-mono text-amber-400 mt-0.5">
              Seq #{currentTelemetry?.seq ?? 1}
            </div>
          </div>
        </div>

        {/* Cryptographic Pipeline Progression */}
        <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-200">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Packet Construction</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">SubtleCrypto</span>
          </div>

          <div className="space-y-1.5">
            {pipelineSteps.map((step) => {
              const isDone = packetBuildingStep >= step.id;
              const isCurrent = packetBuildingStep === step.id - 1;

              return (
                <div
                  key={step.id}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] font-mono transition-all ${
                    isDone
                      ? 'bg-emerald-950/30 border border-emerald-900/60 text-emerald-300'
                      : isCurrent
                      ? 'bg-amber-950/40 border border-amber-600/70 text-amber-200 animate-pulse'
                      : 'bg-zinc-900/40 border border-zinc-900 text-zinc-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                        isDone
                          ? 'bg-emerald-500 text-black'
                          : isCurrent
                          ? 'bg-amber-500 text-black'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {step.id}
                    </span>
                    <span className="font-semibold">{step.label}</span>
                  </div>
                  <span className="text-[10px] opacity-80">{isDone ? 'COMPLETED' : isCurrent ? 'EXECUTING...' : 'PENDING'}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Crypto Keys Enclave Details */}
        <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-200">
              <Key className="w-4 h-4 text-emerald-400" />
              <span>Edge Hardware Enclave Keys</span>
            </div>
            <button
              onClick={() => setShowKeyHex(!showKeyHex)}
              className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 hover:text-zinc-200"
            >
              {showKeyHex ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{showKeyHex ? 'Hide' : 'Reveal'}</span>
            </button>
          </div>

          {/* AES-GCM 256 Key */}
          <div className="p-2 rounded bg-black/60 border border-zinc-850 text-[10px] font-mono space-y-1">
            <div className="flex justify-between text-zinc-400">
              <span className="text-emerald-400 font-semibold">AES-GCM-256 Session Key:</span>
              <span className="text-zinc-500">256-bit</span>
            </div>
            <div className="text-zinc-300 font-mono break-all selection:bg-emerald-500 selection:text-black">
              {showKeyHex
                ? cryptoKeys.aesKeyHex || 'GENERATING...'
                : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
            </div>
          </div>

          {/* Device ECDSA Key Fingerprint */}
          <div className="p-2 rounded bg-black/60 border border-zinc-850 text-[10px] font-mono space-y-1">
            <div className="flex justify-between text-zinc-400">
              <span className="text-purple-400 font-semibold">ECDSA P-256 Device PubKey:</span>
              <span className="text-zinc-500">SPKI</span>
            </div>
            <div className="text-zinc-400 font-mono break-all">
              {cryptoKeys.devicePubKeyHex
                ? `${cryptoKeys.devicePubKeyHex.substring(0, 36)}...`
                : 'INITIALIZING...'}
            </div>
          </div>

          {/* Device Fingerprint */}
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1 border-t border-zinc-850">
            <span>Hardware UUID:</span>
            <span className="text-zinc-300 font-bold">{cryptoKeys.deviceFingerprint}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
