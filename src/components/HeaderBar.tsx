import React from 'react';
import {
  Shield,
  ShieldCheck,
  RotateCcw,
  Volume2,
  VolumeX,
  FileCheck2,
  Layers,
  Cpu,
  Radio,
  Building2,
  Download,
  Keyboard,
} from 'lucide-react';
import type { AppViewMode } from '../types/crypto';

interface HeaderBarProps {
  viewMode: AppViewMode;
  onSetViewMode: (mode: AppViewMode) => void;
  onResetVoyage: () => void;
  onOpenAuditModal: () => void;
  onOpenASVSModal?: () => void;
  onOpenShortcutsModal?: () => void;
  onExportAuditJSON: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  totalBlocksVerified: number;
  totalIncidents: number;
  isKeyLoaded: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  viewMode,
  onSetViewMode,
  onResetVoyage,
  onOpenAuditModal,
  onOpenASVSModal,
  onOpenShortcutsModal,
  onExportAuditJSON,
  soundEnabled,
  onToggleSound,
  totalBlocksVerified,
  totalIncidents,
  isKeyLoaded,
}) => {
  return (
    <header className="w-full bg-[#07090e] border-b border-cyber-border px-4 py-2 flex flex-col xl:flex-row items-center justify-between gap-3 shadow-2xl relative z-30">
      {/* Brand & Connection Indicator */}
      <div className="flex items-center gap-3.5 w-full xl:w-auto justify-between xl:justify-start">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-500/60 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/40">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-950 animate-pulse"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-zinc-100 flex items-center gap-1.5 font-sans">
                CargoCrypt
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Zero-Knowledge Maritime
                </span>
              </h1>
            </div>
            {/* Live Connection Indicator */}
            <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-400 font-semibold">Local WebWorker Ingestion Active</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-300">{totalBlocksVerified} Verified</span>
              {totalIncidents > 0 && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-rose-400 font-bold">{totalIncidents} Incidents</span>
                </>
              )}
              <span className="text-zinc-600">•</span>
              <span className={isKeyLoaded ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                {isKeyLoaded ? 'Consignee Key Mounted' : 'Key Revoked'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW SWITCHER: Split SOC View | IoT Edge | Cloud Interceptor | Consignee Portal */}
      <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-850 text-xs font-mono">
        <button
          onClick={() => onSetViewMode('split')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold transition-all ${
            viewMode === 'split'
              ? 'bg-emerald-600 text-black shadow-lg shadow-emerald-950/50'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Split SOC View</span>
        </button>

        <button
          onClick={() => onSetViewMode('iot')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold transition-all ${
            viewMode === 'iot'
              ? 'bg-emerald-600 text-black shadow-lg shadow-emerald-950/50'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>IoT Edge Terminal</span>
        </button>

        <button
          onClick={() => onSetViewMode('relay')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold transition-all ${
            viewMode === 'relay'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/50'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Cloud Interceptor</span>
        </button>

        <button
          onClick={() => onSetViewMode('consignee')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold transition-all ${
            viewMode === 'consignee'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/50'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Consignee Portal</span>
        </button>
      </div>

      {/* Global Enclave & Export Actions */}
      <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
        {/* Export Cryptographic Audit Trail (JSON) Button */}
        <button
          onClick={onExportAuditJSON}
          title="Directly export and download the complete cryptographic SHA-256 ledger proof certificate"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono font-bold bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-600/70 transition-all shadow-md active:scale-95"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export Audit Trail (JSON)</span>
        </button>

        {/* Hotkeys Guide */}
        {onOpenShortcutsModal && (
          <button
            onClick={onOpenShortcutsModal}
            title="Keyboard Hotkeys (?)"
            className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-mono font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-all hover:text-amber-300"
          >
            <Keyboard className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">Hotkeys</span>
            <kbd className="px-1 py-0.2 rounded bg-black/60 border border-zinc-700 text-[9px] text-amber-300 font-bold">
              ?
            </kbd>
          </button>
        )}

        {/* OWASP ASVS 5.0 Inspector */}
        {onOpenASVSModal && (
          <button
            onClick={onOpenASVSModal}
            title="Inspect OWASP ASVS 5.0 Level 3 Verification Matrix & Run Live Cryptographic Assertions"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono font-bold bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-600/70 transition-all shadow-md active:scale-95"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">OWASP ASVS 5.0</span>
            <span className="px-1 py-0.2 rounded bg-cyan-900/80 border border-cyan-700/60 text-[9px] text-cyan-200 font-bold">
              L3
            </span>
          </button>
        )}

        {/* View Modal Certificate */}
        <button
          onClick={onOpenAuditModal}
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-mono font-semibold bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-zinc-600 transition-all"
        >
          <FileCheck2 className="w-3.5 h-3.5 text-zinc-400" />
          <span>Certificate</span>
        </button>

        {/* Sound FX Toggle */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Cyber Audio' : 'Unmute Cyber Audio'}
          className={`p-1.5 rounded text-xs transition-all border ${
            soundEnabled
              ? 'bg-zinc-900 text-emerald-400 border-zinc-700'
              : 'bg-zinc-900 text-zinc-600 border-zinc-800'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Reset Voyage Button */}
        <button
          onClick={onResetVoyage}
          title="Reset voyage, generate new WebCrypto ephemeral keys, and clear ledger"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-zinc-500 transition-all active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </header>
  );
};
