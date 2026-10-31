import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Thermometer,
  Sun,
  Battery,
  CheckCircle2,
  XCircle,
  Compass,
} from 'lucide-react';
import type {
  ConsigneeLogEntry,
  TelemetryData,
  Waypoint,
  CryptoKeysState,
} from '../types/crypto';
import { MapView } from './MapView';

interface RightPanelConsigneeProps {
  logs: ConsigneeLogEntry[];
  latestVerifiedTelemetry: TelemetryData | null;
  waypoints: Waypoint[];
  currentWaypointIndex: number;
  cryptoKeys: CryptoKeysState;
  activeAlert: {
    type: 'TAMPER_HASH_FAIL' | 'TAMPER_AEAD_FAIL' | 'REPLAY_DROPPED' | 'PHYSICAL_BREACH' | null;
    message: string;
    blockSeq?: number;
  } | null;
}

export const RightPanelConsignee: React.FC<RightPanelConsigneeProps> = ({
  logs,
  latestVerifiedTelemetry,
  waypoints,
  currentWaypointIndex,
  cryptoKeys,
  activeAlert,
}) => {
  const [activeTab, setActiveTab] = useState<'map' | 'ledger' | 'telemetry'>('map');

  const currentWp = waypoints[currentWaypointIndex] || waypoints[0];
  const isBreached = activeAlert !== null;

  // Temperature sparkline data from verified logs
  const tempHistory = logs
    .filter((l) => l.telemetry !== undefined)
    .slice(-12)
    .map((l) => l.telemetry!.temp);

  return (
    <div className="flex flex-col h-full bg-[#090c14] border border-cyber-border rounded-xl overflow-hidden shadow-xl">
      {/* Consignee Header */}
      <div className="px-4 py-3 bg-[#0d121f] border-b border-cyber-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-100 flex items-center gap-2">
              Authorized Consignee Enclave
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </h2>
            <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
              <span>Port of Mumbai (JNPT Ops)</span>
              <span>•</span>
              <span className="text-emerald-400">Key: {cryptoKeys.aesKeyHex ? `${cryptoKeys.aesKeyHex.substring(0, 10)}...` : 'AES-256'}</span>
            </div>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded border border-zinc-800 text-[10px] font-mono">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-2.5 py-1 rounded transition-all font-semibold ${
              activeTab === 'map'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Nautical Map
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-2.5 py-1 rounded transition-all font-semibold ${
              activeTab === 'ledger'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Audit Ledger ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-2.5 py-1 rounded transition-all font-semibold ${
              activeTab === 'telemetry'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Health HUD
          </button>
        </div>
      </div>

      {/* Prominent High-Visibility Breach Alert Banner */}
      {activeAlert && (
        <div className="px-4 py-3 bg-rose-950/90 border-b-2 border-rose-500 text-rose-100 flex items-start gap-3 animate-glow-crimson relative z-10">
          <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-1 font-mono">
            <div className="text-xs font-black tracking-wider text-rose-300 uppercase flex items-center justify-between">
              <span>SECURITY BREACH ENCOUNTERED</span>
              {activeAlert.blockSeq && (
                <span className="px-2 py-0.5 rounded bg-rose-800 text-white text-[10px]">
                  BLOCK #{activeAlert.blockSeq}
                </span>
              )}
            </div>
            <div className="text-sm font-extrabold text-white mt-0.5 leading-snug drop-shadow">
              {activeAlert.message}
            </div>
            <div className="text-[10px] text-rose-200/90 mt-1 flex items-center gap-2">
              <span>ZERO-KNOWLEDGE POLICY: Tampered or unauthenticated packet immediately quarantined.</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Consignee Content Area */}
      <div className="flex-1 flex flex-col p-3 space-y-3 overflow-hidden">
        {/* Top: View Switch (Map, Ledger, or HUD) */}
        {activeTab === 'map' && (
          <div className="flex-1 flex flex-col min-h-[300px]">
            <MapView
              waypoints={waypoints}
              currentWaypointIndex={currentWaypointIndex}
              isBreached={isBreached}
              breachType={activeAlert?.message ?? null}
              currentCoords={
                latestVerifiedTelemetry
                  ? { lat: latestVerifiedTelemetry.lat, lng: latestVerifiedTelemetry.lng }
                  : null
              }
            />
          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="flex-1 flex flex-col bg-zinc-950/80 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-300">
              <span className="font-bold">Zero-Knowledge SHA-256 Audit Ledger</span>
              <span className="text-[10px] text-emerald-400">{logs.length} Blocks Recorded</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
              {logs.length === 0 ? (
                <div className="text-center py-10 font-mono text-xs text-zinc-650">
                  Awaiting first incoming encrypted packet...
                </div>
              ) : (
                logs
                  .slice()
                  .reverse()
                  .map((log) => {
                    const isFail = log.status !== 'VERIFIED';

                    return (
                      <div
                        key={log.id}
                        className={`p-2.5 rounded border text-xs font-mono transition-all ${
                          isFail
                            ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                            : 'bg-zinc-900/50 border-zinc-800 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${
                                isFail ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                              }`}
                            >
                              #{log.seq}
                            </span>
                            <span className="font-bold text-zinc-100">
                              {log.status === 'VERIFIED'
                                ? 'CRYPTOGRAPHICALLY SEALED'
                                : log.status === 'REPLAY_DROPPED'
                                ? 'REPLAY ATTACK REJECTED'
                                : 'INTEGRITY VERIFICATION FAILED'}
                            </span>
                          </div>

                          <div className="text-[10px] text-zinc-500">
                            Verified in {log.processingTimeMs.toFixed(1)}ms
                          </div>
                        </div>

                        {/* Verification details table */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] bg-black/40 p-1.5 rounded border border-zinc-850">
                          <div className="flex items-center gap-1">
                            {log.currentHashMatch ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="w-3 h-3 text-rose-500 shrink-0" />
                            )}
                            <span className="text-zinc-400">SHA-256 Hash</span>
                          </div>

                          <div className="flex items-center gap-1">
                            {log.aeadValid ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="w-3 h-3 text-rose-500 shrink-0" />
                            )}
                            <span className="text-zinc-400">AES-GCM AEAD</span>
                          </div>

                          <div className="flex items-center gap-1">
                            {log.signatureValid ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="w-3 h-3 text-rose-500 shrink-0" />
                            )}
                            <span className="text-zinc-400">ECDSA P-256</span>
                          </div>

                          <div className="flex items-center gap-1">
                            {log.replayCheckValid ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="w-3 h-3 text-amber-500 shrink-0" />
                            )}
                            <span className="text-zinc-400">Seq Monotonic</span>
                          </div>
                        </div>

                        <div className="mt-1.5 text-[10px] text-zinc-400 truncate">
                          <span className="text-zinc-500">Recv Hash:</span>{' '}
                          <span className="font-mono text-zinc-300">{log.receivedHash.substring(0, 24)}...</span>
                        </div>

                        {log.message && (
                          <div
                            className={`mt-1 text-[10px] font-bold ${
                              isFail ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {log.message}
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {activeTab === 'telemetry' && (
          <div className="flex-1 flex flex-col bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 space-y-3 overflow-y-auto custom-scrollbar">
            <div className="text-xs font-mono font-bold text-zinc-200 flex items-center justify-between">
              <span>Decrypted Telemetry Health Diagnostic</span>
              <span className="text-emerald-400 text-[10px]">Active Decryption Key</span>
            </div>

            {latestVerifiedTelemetry ? (
              <div className="space-y-3 font-mono text-xs">
                {/* Geo Location */}
                <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="text-zinc-400 text-[10px]">DECRYPTED GPS POSITION</div>
                    <div className="text-base font-bold text-zinc-100">
                      {latestVerifiedTelemetry.lat.toFixed(4)}°N, {latestVerifiedTelemetry.lng.toFixed(4)}°E
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      Waypoint: {latestVerifiedTelemetry.waypointName || currentWp.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-zinc-400 text-[10px]">SPEED & HEADING</div>
                    <div className="text-sm font-bold text-cyan-400">
                      {currentWp.speedKnots} kts • {currentWp.heading}°
                    </div>
                  </div>
                </div>

                {/* Cargo Seal & Lux */}
                <div
                  className={`p-3 rounded-lg border ${
                    latestVerifiedTelemetry.lux > 100
                      ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                      : 'bg-zinc-900/60 border-zinc-800'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-zinc-400 text-[10px]">HERMETIC LIGHT SENSOR</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        latestVerifiedTelemetry.lux > 100
                          ? 'bg-rose-600 text-white'
                          : 'bg-emerald-950 text-emerald-400'
                      }`}
                    >
                      {latestVerifiedTelemetry.lux > 100 ? 'TAMPERED / BREACH' : 'SEAL VERIFIED'}
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-zinc-100">
                    {latestVerifiedTelemetry.lux} Lux
                  </div>
                </div>

                {/* Temperature history */}
                <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-zinc-400 text-[10px]">CARGO COMPARTMENT TEMPERATURE</span>
                    <span className="text-emerald-400 font-bold">
                      {latestVerifiedTelemetry.temp.toFixed(1)}°C
                    </span>
                  </div>
                  {/* Visual mini-bar sparkline */}
                  <div className="h-8 flex items-end gap-1.5 mt-2 pt-2 border-t border-zinc-800">
                    {tempHistory.map((t, idx) => (
                      <div
                        key={idx}
                        className="flex-1 bg-emerald-500/80 hover:bg-emerald-400 rounded-t transition-all"
                        style={{ height: `${Math.max(15, (t / 30) * 100)}%` }}
                        title={`${t}°C`}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 font-mono text-zinc-650 text-xs">
                No verified telemetry data in session.
              </div>
            )}
          </div>
        )}

        {/* Bottom Consignee Metrics Bar */}
        <div className="p-3 bg-zinc-950/90 border border-zinc-850 rounded-lg text-xs font-mono">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            {/* Decrypted Lux */}
            <div className="flex items-center gap-2 p-1.5 bg-black/50 rounded border border-zinc-900">
              <Sun
                className={`w-4 h-4 ${
                  (latestVerifiedTelemetry?.lux ?? 0) > 100 ? 'text-rose-400' : 'text-amber-400'
                }`}
              />
              <div>
                <div className="text-[9px] text-zinc-500">DECRYPTED LUX</div>
                <div className="font-bold text-zinc-200">{latestVerifiedTelemetry?.lux ?? 2} lx</div>
              </div>
            </div>

            {/* Decrypted Temp */}
            <div className="flex items-center gap-2 p-1.5 bg-black/50 rounded border border-zinc-900">
              <Thermometer className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-[9px] text-zinc-500">CARGO TEMP</div>
                <div className="font-bold text-zinc-200">
                  {latestVerifiedTelemetry?.temp.toFixed(1) ?? '23.2'}°C
                </div>
              </div>
            </div>

            {/* Battery */}
            <div className="flex items-center gap-2 p-1.5 bg-black/50 rounded border border-zinc-900">
              <Battery className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[9px] text-zinc-500">BATTERY</div>
                <div className="font-bold text-zinc-200">
                  {latestVerifiedTelemetry?.battery.toFixed(1) ?? '98.4'}%
                </div>
              </div>
            </div>

            {/* Voyage Progress */}
            <div className="flex items-center gap-2 p-1.5 bg-black/50 rounded border border-zinc-900">
              <Compass className="w-4 h-4 text-purple-400" />
              <div>
                <div className="text-[9px] text-zinc-500">PROGRESS</div>
                <div className="font-bold text-zinc-200">
                  WP {currentWaypointIndex + 1} / {waypoints.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
