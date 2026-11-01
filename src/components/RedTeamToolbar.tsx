import React, { useState } from 'react';
import {
  Zap,
  RefreshCw,
  Sun,
  Lock,
  Send,
  Keyboard,
  ChevronDown,
  ChevronUp,
  Flame,
  Info,
} from 'lucide-react';

interface RedTeamToolbarProps {
  onTriggerMitmTamper: () => void;
  onTriggerReplayAttack: () => void;
  onTriggerPhysicalBreach: () => void;
  onTriggerColdChainSpike: () => void;
  onTriggerZeroKnowledgeTest: () => void;
  onTriggerNormalBurst: () => void;
  onOpenShortcutsModal: () => void;
  isTransmitting: boolean;
  activeAlert: {
    type: string | null;
    message: string;
    errorCode?: string;
  } | null;
  isKeyLoaded: boolean;
  canReplay: boolean;
}

export const RedTeamToolbar: React.FC<RedTeamToolbarProps> = ({
  onTriggerMitmTamper,
  onTriggerReplayAttack,
  onTriggerPhysicalBreach,
  onTriggerColdChainSpike,
  onTriggerZeroKnowledgeTest,
  onTriggerNormalBurst,
  onOpenShortcutsModal,
  isTransmitting,
  activeAlert,
  isKeyLoaded,
  canReplay,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredScenario, setHoveredScenario] = useState<string | null>(null);

  const scenarioDescriptions: Record<string, string> = {
    mitm: 'Flips a single byte in ciphertext during satellite relay transit. Demonstrates AES-GCM AEAD tag and SHA-256 integrity failure (Error 0x4B2).',
    replay: 'Injects an expired or duplicate sequence packet. Demonstrates Layer-1 monotonic counter rejection (Error 0x3F1_REPLAY).',
    breach: 'Spikes container optical sensor to 940 Lux (door opened) with 3.5G impact. Demonstrates Layer-5 hermetic breach detection (Error 0x99A).',
    coldchain: 'Drifts reefer temperature to +38.5°C. Simulates perishable biologics cold-chain failure warning.',
    zk: 'Unmounts/revokes Consignee key. Demonstrates zero-knowledge ciphertext opacity (coordinates & sensors remain strictly masked).',
    normal: 'Dispatches nominal sea-state telemetry burst and validates all 5 cryptographic verification layers.',
  };

  return (
    <div className="w-full bg-[#080b13] border-b border-cyber-border transition-all duration-200 relative z-20">
      {/* Top Bar Strip */}
      <div className="px-4 py-1.5 flex items-center justify-between gap-3 text-xs font-mono">
        {/* Left: Suite Badge & Current Threat Level */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-rose-950/60 border border-rose-500/50 text-rose-300 font-bold tracking-wider uppercase text-[11px] shadow-sm">
            <Zap className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Red Team Attack Suite</span>
          </div>

          {/* Dynamic Status Pill */}
          {activeAlert ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-rose-900/70 border border-rose-600 text-rose-200 text-[10px] font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              <span>
                QUARANTINED: {activeAlert.errorCode || activeAlert.type}
              </span>
            </div>
          ) : !isKeyLoaded ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-purple-950/70 border border-purple-600 text-purple-200 text-[10px] font-bold">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              <span>ZERO-KNOWLEDGE CONCEALMENT (Key Revoked)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Defense Enclave Armed • Normal State</span>
            </div>
          )}
        </div>

        {/* Right Controls: Hotkeys & Collapse */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenShortcutsModal}
            title="View operational keyboard shortcuts (Press ?)"
            className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-750 text-[11px] transition-all hover:text-amber-300"
          >
            <Keyboard className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Hotkeys</span>
            <kbd className="px-1 py-0.2 rounded bg-black/60 border border-zinc-700 text-[9px] text-amber-300 font-bold ml-0.5">
              ?
            </kbd>
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Attack Toolbar' : 'Minimize Attack Toolbar'}
            className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 text-xs"
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Scenario Buttons Row */}
      {!isCollapsed && (
        <div className="px-4 pb-2.5 pt-0.5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {/* 1. MITM Bit-Flip */}
            <button
              onClick={onTriggerMitmTamper}
              disabled={isTransmitting}
              onMouseEnter={() => setHoveredScenario('mitm')}
              onMouseLeave={() => setHoveredScenario(null)}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/70 border border-rose-700/60 hover:border-rose-500 text-rose-200 text-xs font-mono font-bold transition-all shadow-md active:scale-95 shrink-0 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
              <span>MITM Bit-Flip</span>
              <kbd className="px-1.5 py-0.2 rounded bg-black/60 border border-rose-800/80 text-[10px] text-rose-300 font-bold">
                T
              </kbd>
            </button>

            {/* 2. Replay Injection */}
            <button
              onClick={onTriggerReplayAttack}
              disabled={isTransmitting || !canReplay}
              onMouseEnter={() => setHoveredScenario('replay')}
              onMouseLeave={() => setHoveredScenario(null)}
              title={canReplay ? 'Inject duplicate or expired sequence block' : 'Transmit at least 1 block before replaying'}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/70 border border-amber-700/60 hover:border-amber-500 text-amber-200 text-xs font-mono font-bold transition-all shadow-md active:scale-95 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-180 transition-transform duration-500" />
              <span>Replay Attack</span>
              <kbd className="px-1.5 py-0.2 rounded bg-black/60 border border-amber-800/80 text-[10px] text-amber-300 font-bold">
                R
              </kbd>
            </button>

            {/* 3. Physical Seal Breach */}
            <button
              onClick={onTriggerPhysicalBreach}
              disabled={isTransmitting}
              onMouseEnter={() => setHoveredScenario('breach')}
              onMouseLeave={() => setHoveredScenario(null)}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-950/40 hover:bg-orange-900/70 border border-orange-700/60 hover:border-orange-500 text-orange-200 text-xs font-mono font-bold transition-all shadow-md active:scale-95 shrink-0 disabled:opacity-50"
            >
              <Sun className="w-3.5 h-3.5 text-orange-400 group-hover:scale-110 transition-transform animate-pulse" />
              <span>Seal Breach (940 lx)</span>
              <kbd className="px-1.5 py-0.2 rounded bg-black/60 border border-orange-800/80 text-[10px] text-orange-300 font-bold">
                B
              </kbd>
            </button>

            {/* 4. Reefer Cold-Chain Spoilage */}
            <button
              onClick={onTriggerColdChainSpike}
              disabled={isTransmitting}
              onMouseEnter={() => setHoveredScenario('coldchain')}
              onMouseLeave={() => setHoveredScenario(null)}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/70 border border-cyan-700/60 hover:border-cyan-500 text-cyan-200 text-xs font-mono font-bold transition-all shadow-md active:scale-95 shrink-0 disabled:opacity-50"
            >
              <Flame className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Cold-Chain Spoilage</span>
            </button>

            {/* 5. Zero-Knowledge Eavesdropper Test */}
            <button
              onClick={onTriggerZeroKnowledgeTest}
              disabled={isTransmitting}
              onMouseEnter={() => setHoveredScenario('zk')}
              onMouseLeave={() => setHoveredScenario(null)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all shadow-md active:scale-95 shrink-0 disabled:opacity-50 ${
                !isKeyLoaded
                  ? 'bg-purple-900/70 border-purple-500 text-purple-200'
                  : 'bg-purple-950/40 hover:bg-purple-900/70 border-purple-700/60 hover:border-purple-500 text-purple-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
              <span>{isKeyLoaded ? 'Revoke Key (ZK Test)' : 'Restore Key'}</span>
              <kbd className="px-1.5 py-0.2 rounded bg-black/60 border border-purple-800/80 text-[10px] text-purple-300 font-bold">
                K
              </kbd>
            </button>

            {/* 6. Clean Burst */}
            <button
              onClick={onTriggerNormalBurst}
              disabled={isTransmitting}
              onMouseEnter={() => setHoveredScenario('normal')}
              onMouseLeave={() => setHoveredScenario(null)}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/70 border border-emerald-700/60 hover:border-emerald-500 text-emerald-300 text-xs font-mono font-bold transition-all shadow-md active:scale-95 shrink-0 ml-auto disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              <span>Clean Verified Burst</span>
              <kbd className="px-1.5 py-0.2 rounded bg-black/60 border border-emerald-800/80 text-[10px] text-emerald-300 font-bold">
                Space
              </kbd>
            </button>
          </div>

          {/* Interactive Scenario Explanation Footer Strip */}
          {hoveredScenario && (
            <div className="mt-1 px-3 py-1 rounded bg-black/60 border border-zinc-850 text-[11px] font-mono text-zinc-300 flex items-center gap-2 animate-fade-in">
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{scenarioDescriptions[hoveredScenario]}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
