import React, { useState } from 'react';
import {
  Cpu,
  Sun,
  Thermometer,
  Compass,
  Key,
  Eye,
  EyeOff,
  Activity,
  Layers,
  Send,
  Play,
  Pause,
  MapPin,
  Flame,
  Snowflake,
  ShieldAlert,
} from 'lucide-react';
import type { TelemetryData, EncryptedPacket, CryptoKeysState, Waypoint } from '../types/crypto';

interface LeftPanelIoTProps {
  currentTelemetry: TelemetryData | null;
  latestPacket: EncryptedPacket | null;
  cryptoKeys: CryptoKeysState;
  packetBuildingStep: number; // 0 to 6
  isPhysicalBreached: boolean;

  // Dual mode controls
  isCruiseMode: boolean;
  onToggleCruiseMode: () => void;
  onManualTransmit: () => void;
  isTransmitting: boolean;

  // Interactive slider values
  tempInput: number;
  onTempChange: (val: number) => void;
  luxInput: number;
  onLuxChange: (val: number) => void;
  shockInput: number;
  onShockChange: (val: number) => void;

  // Staged coordinates
  stagedCoords: { lat: number; lng: number } | null;
  waypoints: Waypoint[];
  currentWaypointIndex: number;
  onSelectWaypointIndex: (idx: number) => void;
}

export const LeftPanelIoT: React.FC<LeftPanelIoTProps> = ({
  currentTelemetry,
  latestPacket,
  cryptoKeys,
  packetBuildingStep,
  isPhysicalBreached,
  isCruiseMode,
  onToggleCruiseMode,
  onManualTransmit,
  isTransmitting,
  tempInput,
  onTempChange,
  luxInput,
  onLuxChange,
  shockInput,
  onShockChange,
  stagedCoords,
  waypoints,
  currentWaypointIndex,
  onSelectWaypointIndex,
}) => {
  const [showKeyHex, setShowKeyHex] = useState(false);
  const activeWp = waypoints[currentWaypointIndex] || waypoints[0];

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
            ENCLAVE ARMED {currentTelemetry ? `• ${currentTelemetry.battery.toFixed(0)}%` : ''}
          </div>
          {latestPacket && (
            <div className="text-[9px] font-mono text-zinc-500 mt-0.5">
              LAST SENT: #{latestPacket.seq}
            </div>
          )}
        </div>
      </div>

      <div className="p-3.5 space-y-3.5 overflow-y-auto flex-1 custom-scrollbar">
        {/* Mode Selector & Primary Dispatch Action */}
        <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase text-zinc-300">
              Telemetry Dispatch Mode
            </span>
            <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800 text-[10px] font-mono">
              <button
                onClick={() => isCruiseMode && onToggleCruiseMode()}
                className={`px-2 py-0.5 rounded font-bold transition-all ${
                  !isCruiseMode ? 'bg-emerald-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Manual Ping
              </button>
              <button
                onClick={() => !isCruiseMode && onToggleCruiseMode()}
                className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 transition-all ${
                  isCruiseMode ? 'bg-amber-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {isCruiseMode ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>Live Cruise (3s)</span>
              </button>
            </div>
          </div>

          {/* Primary Action Button: Transmit Encrypted Packet */}
          <button
            onClick={onManualTransmit}
            disabled={isTransmitting}
            className={`w-full py-2.5 px-4 rounded-lg font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 ${
              isTransmitting
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-black border border-emerald-400 shadow-emerald-950/50 hover:shadow-emerald-500/30'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{isTransmitting ? 'Encrypting & Chaining...' : 'Transmit Encrypted Packet'}</span>
          </button>
        </div>

        {/* Interactive Sensor Slider 1: Container Temperature */}
        <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-200 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Container Cargo Temp</span>
            </span>
            <span
              className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded ${
                tempInput > 30
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : tempInput < 0
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {tempInput.toFixed(1)}°C
            </span>
          </div>

          <input
            type="range"
            min={-20}
            max={40}
            step={0.5}
            value={tempInput}
            onChange={(e) => onTempChange(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />

          {/* Quick presets */}
          <div className="flex items-center justify-between gap-1 text-[9px] font-mono text-zinc-400">
            <button
              onClick={() => onTempChange(-18)}
              className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-cyan-950 hover:text-cyan-300 border border-zinc-800 flex items-center gap-0.5"
            >
              <Snowflake className="w-2.5 h-2.5" /> -18°C Freeze
            </button>
            <button
              onClick={() => onTempChange(4)}
              className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-emerald-950 hover:text-emerald-300 border border-zinc-800"
            >
              +4°C Reefer
            </button>
            <button
              onClick={() => onTempChange(24)}
              className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-amber-950 hover:text-amber-300 border border-zinc-800"
            >
              +24°C Ambient
            </button>
            <button
              onClick={() => onTempChange(38)}
              className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-rose-950 hover:text-rose-300 border border-zinc-800 flex items-center gap-0.5"
            >
              <Flame className="w-2.5 h-2.5" /> +38°C Heat
            </button>
          </div>
        </div>

        {/* Interactive Sensor Slider 2: Door Ambient Light (Lux) */}
        <div
          className={`p-3 rounded-lg border transition-all space-y-2 ${
            luxInput > 100 || isPhysicalBreached
              ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-950/50'
              : 'bg-zinc-950/80 border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-200 flex items-center gap-1.5">
              <Sun
                className={`w-3.5 h-3.5 ${
                  luxInput > 100 ? 'text-rose-400 animate-bounce' : 'text-amber-400'
                }`}
              />
              <span>Container Light Sensor (Lux)</span>
            </span>
            <span
              className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded ${
                luxInput > 100
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {luxInput} Lux
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={1000}
            step={5}
            value={luxInput}
            onChange={(e) => onLuxChange(parseInt(e.target.value, 10))}
            className="w-full accent-amber-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />

          {/* Quick presets */}
          <div className="flex items-center justify-between gap-1 text-[9px] font-mono text-zinc-400">
            <button
              onClick={() => onLuxChange(2)}
              className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-emerald-950 hover:text-emerald-300 border border-zinc-800"
            >
              2 lx (Sealed)
            </button>
            <button
              onClick={() => onLuxChange(65)}
              className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-amber-950 hover:text-amber-300 border border-zinc-800"
            >
              65 lx (Warning)
            </button>
            <button
              onClick={() => onLuxChange(920)}
              className="px-1.5 py-0.5 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700 flex items-center gap-0.5 font-bold"
            >
              <ShieldAlert className="w-2.5 h-2.5" /> 920 lx (Door Breach!)
            </button>
          </div>
        </div>

        {/* Interactive Sensor Slider 3: Shock / Accelerometer */}
        <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-200 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <span>Swell & Impact Shock (G)</span>
            </span>
            <span
              className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded ${
                shockInput > 2.5
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : shockInput > 1.0
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {shockInput.toFixed(2)} G
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={5}
            step={0.05}
            value={shockInput}
            onChange={(e) => onShockChange(parseFloat(e.target.value))}
            className="w-full accent-purple-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />

          {/* Quick presets */}
          <div className="flex items-center justify-between gap-1 text-[9px] font-mono text-zinc-400">
            <button
              onClick={() => onShockChange(0.05)}
              className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800"
            >
              0.05G Calm
            </button>
            <button
              onClick={() => onShockChange(0.85)}
              className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-amber-950 hover:text-amber-300 border border-zinc-800"
            >
              0.85G Swell
            </button>
            <button
              onClick={() => onShockChange(3.4)}
              className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-rose-950 hover:text-rose-300 border border-zinc-800"
            >
              3.40G Hard Impact
            </button>
          </div>
        </div>

        {/* GPS Location & Waypoint Selector */}
        <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-zinc-200 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Target GPS Coordinates</span>
            </span>
            <span className="text-[10px] text-zinc-400">
              {stagedCoords ? 'Custom Map Click' : `Waypoint #${activeWp.id}`}
            </span>
          </div>

          <div className="p-2 bg-black/60 rounded border border-zinc-850 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span className="text-zinc-200 font-bold">
                {stagedCoords
                  ? `${stagedCoords.lat.toFixed(4)}°N, ${stagedCoords.lng.toFixed(4)}°E`
                  : `${activeWp.lat.toFixed(4)}°N, ${activeWp.lng.toFixed(4)}°E`}
              </span>
            </div>
            <select
              value={currentWaypointIndex}
              onChange={(e) => onSelectWaypointIndex(parseInt(e.target.value, 10))}
              className="bg-zinc-900 border border-zinc-700 text-[10px] text-zinc-300 rounded px-1.5 py-0.5 font-mono focus:outline-none focus:border-emerald-500"
            >
              {waypoints.map((w, idx) => (
                <option key={w.id} value={idx}>
                  WP #{w.id}: {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cryptographic Pipeline Progression */}
        <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-200">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Edge Cryptographic Pipeline</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">SubtleCrypto</span>
          </div>

          <div className="space-y-1">
            {pipelineSteps.map((step) => {
              const isDone = packetBuildingStep >= step.id;
              const isCurrent = packetBuildingStep === step.id - 1 && isTransmitting;

              return (
                <div
                  key={step.id}
                  className={`flex items-center justify-between px-2.5 py-1 rounded text-[10px] font-mono transition-all ${
                    isDone
                      ? 'bg-emerald-950/30 border border-emerald-900/60 text-emerald-300'
                      : isCurrent
                      ? 'bg-amber-950/40 border border-amber-600/70 text-amber-200 animate-pulse'
                      : 'bg-zinc-900/40 border border-zinc-900 text-zinc-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
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
                  <span className="text-[9px] opacity-80">
                    {isDone ? 'READY' : isCurrent ? 'RUNNING...' : 'WAITING'}
                  </span>
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
              <span>Hardware Enclave Keys</span>
            </div>
            <button
              onClick={() => setShowKeyHex(!showKeyHex)}
              className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 hover:text-zinc-200"
            >
              {showKeyHex ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{showKeyHex ? 'Hide' : 'Reveal'}</span>
            </button>
          </div>

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

          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1 border-t border-zinc-850">
            <span>Hardware UUID:</span>
            <span className="text-zinc-300 font-bold">{cryptoKeys.deviceFingerprint}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
