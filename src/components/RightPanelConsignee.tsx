import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Thermometer,
  Sun,
  Battery,
  Compass,
  Lock,
  Unlock,
  FileWarning,
  Copy,
  Check,
} from 'lucide-react';
import type {
  ConsigneeLogEntry,
  TelemetryData,
  Waypoint,
  CryptoKeysState,
  VerificationFailureDetails,
} from '../types/crypto';
import { MapView } from './MapView';

interface RightPanelConsigneeProps {
  logs: ConsigneeLogEntry[];
  latestVerifiedTelemetry: TelemetryData | null;
  waypoints: Waypoint[];
  currentWaypointIndex: number;
  cryptoKeys: CryptoKeysState;

  // Key Status & Management
  isKeyLoaded: boolean;
  onToggleKeyLoaded: () => void;
  onReloadSessionKey: () => void;

  // Live Verification Alert & Incidents
  activeAlert: {
    type: 'TAMPER_HASH_FAIL' | 'TAMPER_AEAD_FAIL' | 'REPLAY_DROPPED' | 'PHYSICAL_BREACH' | 'KEY_MISSING_LOCKED' | null;
    message: string;
    blockSeq?: number;
    errorCode?: string;
  } | null;
  lastFailureDetails: VerificationFailureDetails | null;
  onDismissFailureModal: () => void;

  // Map coordinate picker
  stagedCoords: { lat: number; lng: number } | null;
  onSelectCoords: (lat: number, lng: number) => void;
}

export const RightPanelConsignee: React.FC<RightPanelConsigneeProps> = ({
  logs,
  latestVerifiedTelemetry,
  waypoints,
  currentWaypointIndex,
  cryptoKeys,
  isKeyLoaded,
  onToggleKeyLoaded,
  onReloadSessionKey,
  activeAlert,
  lastFailureDetails,
  onDismissFailureModal,
  stagedCoords,
  onSelectCoords,
}) => {
  const [activeTab, setActiveTab] = useState<'map' | 'incidents' | 'telemetry' | 'keys'>('map');
  const [copiedHash, setCopiedHash] = useState(false);
  const [incidentFilter, setIncidentFilter] = useState<'all' | 'incidentsOnly'>('all');

  const currentWp = waypoints[currentWaypointIndex] || waypoints[0];
  const isBreached = activeAlert !== null;

  // Filter incidents vs verified
  const filteredLogs = logs.filter((l) => {
    if (incidentFilter === 'incidentsOnly') {
      return l.status !== 'VERIFIED';
    }
    return true;
  });

  const tempHistory = logs
    .filter((l) => l.telemetry !== undefined)
    .slice(-12)
    .map((l) => l.telemetry!.temp);

  const handleCopyExpectedHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#090c14] border border-cyber-border rounded-xl overflow-hidden shadow-xl relative">
      {/* Consignee Header */}
      <div className="px-4 py-3 bg-[#0d121f] border-b border-cyber-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              !isKeyLoaded
                ? 'bg-rose-950/60 border border-rose-500/50 text-rose-400'
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            }`}
          >
            {!isKeyLoaded ? <Lock className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          </div>
          <div>
            <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-100 flex items-center gap-2">
              Authorized Consignee Terminal
              <span
                className={`w-2 h-2 rounded-full ${
                  isKeyLoaded ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`}
              ></span>
            </h2>
            <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
              <span>Port of Mumbai (JNPT Ops)</span>
              <span>•</span>
              <span className={isKeyLoaded ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                {isKeyLoaded
                  ? `Key: ${cryptoKeys.aesKeyHex ? cryptoKeys.aesKeyHex.substring(0, 10) : 'Active'}...`
                  : 'UNAUTHORIZED (KEY UNLOADED)'}
              </span>
            </div>
          </div>
        </div>

        {/* Consignee Key Status Toggle & Tab switchers */}
        <div className="flex items-center gap-2">
          {/* Key Loaded Toggle */}
          <button
            onClick={onToggleKeyLoaded}
            title={
              isKeyLoaded
                ? 'Revoke / Unload Session Key to simulate unauthorized view'
                : 'Load Session Key to authorize decryption'
            }
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all shadow-md ${
              isKeyLoaded
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-500'
                : 'bg-rose-600 text-white border border-rose-400 animate-pulse hover:bg-rose-500'
            }`}
          >
            {isKeyLoaded ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            <span>{isKeyLoaded ? 'Key Loaded (Authorized)' : 'Revoked (Unauthorized)'}</span>
          </button>

          {/* Tab Switcher */}
          <div className="hidden sm:flex items-center gap-1 bg-zinc-950 p-1 rounded border border-zinc-800 text-[10px] font-mono">
            <button
              onClick={() => setActiveTab('map')}
              className={`px-2 py-0.5 rounded transition-all font-semibold ${
                activeTab === 'map'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Map
            </button>
            <button
              onClick={() => setActiveTab('incidents')}
              className={`px-2 py-0.5 rounded transition-all font-semibold ${
                activeTab === 'incidents'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Incident Ledger ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`px-2 py-0.5 rounded transition-all font-semibold ${
                activeTab === 'telemetry'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Health HUD
            </button>
            <button
              onClick={() => setActiveTab('keys')}
              className={`px-2 py-0.5 rounded transition-all font-semibold ${
                activeTab === 'keys'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Keys
            </button>
          </div>
        </div>
      </div>

      {/* Prominent High-Visibility Breach Alert Banner */}
      {activeAlert && (
        <div className="px-4 py-2.5 bg-rose-950/95 border-b-2 border-rose-500 text-rose-100 flex items-start gap-3 animate-glow-crimson relative z-10">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-1 font-mono">
            <div className="text-xs font-black tracking-wider text-rose-300 uppercase flex items-center justify-between">
              <span>SECURITY BREACH INCIDENT</span>
              {activeAlert.errorCode && (
                <span className="px-2 py-0.5 rounded bg-rose-800 text-white text-[10px] font-bold">
                  {activeAlert.errorCode}
                </span>
              )}
            </div>
            <div className="text-xs font-extrabold text-white mt-0.5 leading-snug drop-shadow">
              {activeAlert.message}
            </div>
          </div>
        </div>
      )}

      {/* Live Cryptographic Verification Modal / Card (Triggered upon MITM Tamper) */}
      {lastFailureDetails && (
        <div className="p-3.5 bg-[#14060a] border-b-2 border-rose-600 space-y-2 animate-fade-in text-xs font-mono">
          <div className="flex items-center justify-between text-rose-300">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px]">
              <FileWarning className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>CRYPTOGRAPHIC VERIFICATION FAILURE ({lastFailureDetails.errorCode})</span>
            </div>
            <button
              onClick={onDismissFailureModal}
              className="text-[10px] text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
            <div className="p-2 bg-black/70 rounded border border-rose-950 space-y-0.5">
              <div className="text-zinc-500">EXPECTED SHA-256 (IN PACKET HEADER):</div>
              <div className="text-amber-300 font-mono truncate select-all">
                {lastFailureDetails.expectedHash}
              </div>
            </div>

            <div className="p-2 bg-black/70 rounded border border-rose-950 space-y-0.5">
              <div className="text-rose-400 font-bold">CALCULATED SHA-256 (PAYLOAD DIGEST):</div>
              <div className="text-rose-400 font-mono truncate font-bold select-all">
                {lastFailureDetails.calculatedHash}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1">
            <span>Result: <strong className="text-rose-400">INTEGRITY FAILURE (Error 0x4B2)</strong> — Route rendering halted.</span>
            <button
              onClick={() => handleCopyExpectedHash(lastFailureDetails.calculatedHash)}
              className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200"
            >
              {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>Copy Calculated Hash</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-3 space-y-3 overflow-hidden">
        {/* Tab 1: Map View */}
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
              pendingTargetCoords={stagedCoords}
              onSelectCoords={onSelectCoords}
              isConsigneeKeyLoaded={isKeyLoaded}
            />
          </div>
        )}

        {/* Tab 2: Incident & Verification Ledger */}
        {activeTab === 'incidents' && (
          <div className="flex-1 flex flex-col bg-zinc-950/80 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-zinc-200">Interactive Security & Hash Ledger</span>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  onClick={() => setIncidentFilter('all')}
                  className={`px-2 py-0.5 rounded font-semibold ${
                    incidentFilter === 'all'
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  All ({logs.length})
                </button>
                <button
                  onClick={() => setIncidentFilter('incidentsOnly')}
                  className={`px-2 py-0.5 rounded font-semibold ${
                    incidentFilter === 'incidentsOnly'
                      ? 'bg-rose-900/60 text-rose-300 border border-rose-700'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Incidents ({logs.filter((l) => l.status !== 'VERIFIED').length})
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-10 font-mono text-xs text-zinc-650">
                  No records matching current filter.
                </div>
              ) : (
                filteredLogs
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
                                ? 'CRYPTOGRAPHICALLY VERIFIED'
                                : log.status === 'REPLAY_DROPPED'
                                ? 'REPLAY ATTACK DROPPED'
                                : 'INTEGRITY BREACH / QUARANTINED'}
                            </span>
                          </div>

                          <span className="text-[10px] text-zinc-500">
                            {log.errorCode ? (
                              <span className="text-rose-400 font-bold mr-2">{log.errorCode}</span>
                            ) : null}
                            {log.processingTimeMs.toFixed(1)}ms
                          </span>
                        </div>

                        <div className="space-y-0.5 text-[10px] bg-black/40 p-1.5 rounded border border-zinc-850">
                          <div className="flex justify-between truncate">
                            <span className="text-zinc-500">Calculated Hash:</span>
                            <span className="text-zinc-300 truncate max-w-[280px]">
                              {log.calculatedHash}
                            </span>
                          </div>
                          <div className="flex justify-between truncate">
                            <span className="text-zinc-500">Received Hash:</span>
                            <span
                              className={`truncate max-w-[280px] ${
                                log.currentHashMatch ? 'text-zinc-300' : 'text-rose-400 font-bold'
                              }`}
                            >
                              {log.receivedHash}
                            </span>
                          </div>
                        </div>

                        <div className="mt-1 text-[10px] font-bold text-rose-400">
                          {log.message}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Decrypted Health HUD */}
        {activeTab === 'telemetry' && (
          <div className="flex-1 flex flex-col bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 space-y-3 overflow-y-auto custom-scrollbar">
            {!isKeyLoaded ? (
              <div className="text-center py-12 text-zinc-500 font-mono text-xs space-y-2">
                <Lock className="w-8 h-8 text-rose-500 mx-auto" />
                <div className="font-bold text-rose-400">SESSION KEY REVOKED / UNLOADED</div>
                <div className="text-zinc-500 max-w-xs mx-auto">
                  Container health diagnostics cannot be decrypted without a valid AES-256 session key.
                </div>
                <button
                  onClick={onReloadSessionKey}
                  className="px-3 py-1.5 rounded bg-emerald-600 text-black font-bold text-xs"
                >
                  Reload Session Key
                </button>
              </div>
            ) : latestVerifiedTelemetry ? (
              <div className="space-y-3 font-mono text-xs">
                {/* GPS */}
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

                {/* Light */}
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

                {/* Temperature */}
                <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-zinc-400 text-[10px]">CARGO REEFER TEMPERATURE</span>
                    <span className="text-emerald-400 font-bold">
                      {latestVerifiedTelemetry.temp.toFixed(1)}°C
                    </span>
                  </div>
                  <div className="h-8 flex items-end gap-1.5 mt-2 pt-2 border-t border-zinc-800">
                    {tempHistory.map((t, idx) => (
                      <div
                        key={idx}
                        className="flex-1 bg-emerald-500/80 rounded-t transition-all"
                        style={{ height: `${Math.max(15, (t / 30) * 100)}%` }}
                        title={`${t}°C`}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 font-mono text-zinc-650 text-xs">
                No verified telemetry data in session. Click "Transmit Encrypted Packet" to begin.
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Cryptographic Key Exchange & Enclave */}
        {activeTab === 'keys' && (
          <div className="flex-1 flex flex-col bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 space-y-3 font-mono text-xs overflow-y-auto custom-scrollbar">
            <div className="font-bold text-zinc-200 flex items-center justify-between">
              <span>Cryptographic Key Handshake Manager</span>
              <span className="text-[10px] text-emerald-400">AES-GCM-256 + ECDSA P-256</span>
            </div>

            <div className="p-3 bg-black/60 rounded border border-zinc-850 space-y-2">
              <div className="flex justify-between text-zinc-400">
                <span className="text-emerald-400 font-bold">Active AES-256 Key (Consignee):</span>
                <span className="text-[10px] text-zinc-500">256-bit</span>
              </div>
              <div className="text-zinc-300 break-all select-all text-[11px]">
                {isKeyLoaded ? cryptoKeys.aesKeyHex : 'KEY REVOKED — UNAUTHORIZED'}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-zinc-850">
                <button
                  onClick={onToggleKeyLoaded}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    isKeyLoaded
                      ? 'bg-rose-950 text-rose-300 border border-rose-700'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isKeyLoaded ? 'Revoke Key' : 'Load Key'}
                </button>
                <button
                  onClick={onReloadSessionKey}
                  className="px-3 py-1 rounded bg-zinc-900 text-zinc-300 border border-zinc-700 hover:border-zinc-500"
                >
                  Generate New Ephemeral Handshake
                </button>
              </div>
            </div>

            <div className="p-3 bg-black/60 rounded border border-zinc-850 space-y-1">
              <span className="text-purple-400 font-bold block">Enclave ECDSA Public Key SPKI:</span>
              <span className="text-zinc-400 break-all select-all text-[10px] block">
                {cryptoKeys.devicePubKeyHex}
              </span>
            </div>
          </div>
        )}

        {/* Bottom Consignee Metrics Bar */}
        <div className="p-2.5 bg-zinc-950/90 border border-zinc-850 rounded-lg text-xs font-mono">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="flex items-center gap-2 p-1.5 bg-black/50 rounded border border-zinc-900">
              <Sun
                className={`w-4 h-4 ${
                  (latestVerifiedTelemetry?.lux ?? 0) > 100 ? 'text-rose-400' : 'text-amber-400'
                }`}
              />
              <div>
                <div className="text-[9px] text-zinc-500">DECRYPTED LUX</div>
                <div className="font-bold text-zinc-200">
                  {isKeyLoaded ? `${latestVerifiedTelemetry?.lux ?? 2} lx` : '••••'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-1.5 bg-black/50 rounded border border-zinc-900">
              <Thermometer className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-[9px] text-zinc-500">CARGO TEMP</div>
                <div className="font-bold text-zinc-200">
                  {isKeyLoaded ? `${latestVerifiedTelemetry?.temp.toFixed(1) ?? '23.2'}°C` : '••••'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-1.5 bg-black/50 rounded border border-zinc-900">
              <Battery className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[9px] text-zinc-500">BATTERY</div>
                <div className="font-bold text-zinc-200">
                  {isKeyLoaded ? `${latestVerifiedTelemetry?.battery.toFixed(1) ?? '98.4'}%` : '••••'}
                </div>
              </div>
            </div>

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
