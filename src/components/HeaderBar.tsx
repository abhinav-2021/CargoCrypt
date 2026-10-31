import React from 'react';
import {
  Shield,
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FileCheck2,
  Zap,
  Radio,
  Lock,
  Sun,
  Copy,
  FastForward,
} from 'lucide-react';
import type { AttackType } from '../types/crypto';

interface HeaderBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  speedMultiplier: number;
  onCycleSpeed: () => void;
  onManualStep: () => void;
  onTriggerAttack: (type: AttackType) => void;
  onResetVoyage: () => void;
  onOpenAuditModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  activeAttack: AttackType | null;
  pendingAttack: AttackType | null;
  currentWaypointNum: number;
  totalWaypoints: number;
  totalBlocksVerified: number;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  isPlaying,
  onTogglePlay,
  speedMultiplier,
  onCycleSpeed,
  onManualStep,
  onTriggerAttack,
  onResetVoyage,
  onOpenAuditModal,
  soundEnabled,
  onToggleSound,
  activeAttack,
  pendingAttack,
  currentWaypointNum,
  totalWaypoints,
  totalBlocksVerified,
}) => {
  return (
    <header className="w-full bg-[#07090e] border-b border-cyber-border px-4 py-2.5 flex flex-col xl:flex-row items-center justify-between gap-3 shadow-2xl relative z-30">
      {/* Brand & Mission Status */}
      <div className="flex items-center gap-3.5 w-full xl:w-auto justify-between xl:justify-start">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-500/60 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/40">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-950 animate-pulse"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-zinc-100 flex items-center gap-1.5 font-sans">
                CargoCrypt
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Zero-Knowledge Maritime
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-2">
              <span>SGP ➔ BOM Corridor</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-300">WP {currentWaypointNum}/{totalWaypoints}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-emerald-400 font-bold">{totalBlocksVerified} Blocks Sealed</span>
            </p>
          </div>
        </div>

        {/* Global Enclave Indicator */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-900/80 border border-zinc-800 text-[11px] font-mono text-zinc-300">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>SubtleCrypto AES-256-GCM + SHA-256</span>
        </div>
      </div>

      {/* Red Team Attack Suite (Header Buttons) */}
      <div className="flex flex-wrap items-center justify-center gap-2 w-full xl:w-auto">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-950/30 border border-rose-900/60 text-[10px] font-mono font-bold text-rose-400 tracking-wider uppercase mr-1">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          <span>Red Team Suite:</span>
        </div>

        {/* Attack 1: MITM Tamper */}
        <button
          onClick={() => onTriggerAttack('mitm')}
          disabled={pendingAttack === 'mitm'}
          title="Corrupts 1 byte of the encrypted payload in transit to trigger AES-GCM and SHA-256 hash mismatch"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all shadow-md active:scale-95 ${
            pendingAttack === 'mitm' || activeAttack === 'mitm'
              ? 'bg-rose-600 text-white border border-rose-400 ring-2 ring-rose-500 animate-pulse'
              : 'bg-zinc-900 hover:bg-rose-950/70 text-rose-300 border border-rose-900/70 hover:border-rose-500'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-rose-400" />
          <span>Trigger MITM Tamper</span>
        </button>

        {/* Attack 2: Replay Attack */}
        <button
          onClick={() => onTriggerAttack('replay')}
          disabled={pendingAttack === 'replay'}
          title="Injects an expired sequence packet into the transport network to test sequence regression rejection"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all shadow-md active:scale-95 ${
            pendingAttack === 'replay' || activeAttack === 'replay'
              ? 'bg-amber-600 text-white border border-amber-400 ring-2 ring-amber-500 animate-pulse'
              : 'bg-zinc-900 hover:bg-amber-950/70 text-amber-300 border border-amber-900/70 hover:border-amber-500'
          }`}
        >
          <Copy className="w-3.5 h-3.5 text-amber-400" />
          <span>Trigger Replay Attack</span>
        </button>

        {/* Attack 3: Physical Breach */}
        <button
          onClick={() => onTriggerAttack('physical')}
          disabled={pendingAttack === 'physical'}
          title="Simulates container door unauthorized opening at sea by spiking Lux light sensors to 900+ lux"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all shadow-md active:scale-95 ${
            pendingAttack === 'physical' || activeAttack === 'physical'
              ? 'bg-rose-600 text-white border border-rose-400 ring-2 ring-rose-500 animate-pulse'
              : 'bg-zinc-900 hover:bg-rose-950/70 text-rose-300 border border-rose-900/70 hover:border-rose-500'
          }`}
        >
          <Sun className="w-3.5 h-3.5 text-rose-400" />
          <span>Trigger Physical Breach</span>
        </button>

        {/* Reset Voyage Button */}
        <button
          onClick={onResetVoyage}
          title="Generates fresh WebCrypto keys, resets route to Waypoint 1, and clears tamper history"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-zinc-500 transition-all shadow-md active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
          <span>Reset Voyage</span>
        </button>
      </div>

      {/* Simulation Controls & Ledger Export */}
      <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
        {/* Play / Pause Toggle */}
        <button
          onClick={onTogglePlay}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all ${
            isPlaying
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/80 shadow-md shadow-emerald-950/50'
              : 'bg-zinc-900 text-zinc-300 border border-zinc-700 hover:border-emerald-500'
          }`}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
          <span>{isPlaying ? 'PAUSE (3.5s)' : 'RESUME AUTO'}</span>
        </button>

        {/* Speed toggle */}
        <button
          onClick={onCycleSpeed}
          title="Simulation Speed Multiplier"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-mono font-semibold bg-zinc-900 text-cyan-300 border border-zinc-800 hover:border-cyan-500 transition-all"
        >
          <FastForward className="w-3 h-3 text-cyan-400" />
          <span>{speedMultiplier}x</span>
        </button>

        {/* Manual Step */}
        <button
          onClick={onManualStep}
          title="Emit single sequential packet right now"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-mono font-semibold bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-zinc-600 transition-all"
        >
          <Radio className="w-3 h-3 text-emerald-400" />
          <span className="hidden sm:inline">Step</span>
        </button>

        {/* Sound FX Toggle */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Cyber Audio FX' : 'Enable Cyber Audio FX'}
          className={`p-1.5 rounded text-xs transition-all border ${
            soundEnabled
              ? 'bg-zinc-900 text-emerald-400 border-zinc-700'
              : 'bg-zinc-900 text-zinc-600 border-zinc-800'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Audit Certificate Modal Button */}
        <button
          onClick={onOpenAuditModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono font-semibold bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-600/70 transition-all shadow-md"
        >
          <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Audit Trail</span>
        </button>
      </div>
    </header>
  );
};
