import React, { useState } from 'react';
import {
  Radio,
  Terminal,
  Lock,
  Binary,
  Zap,
  ChevronRight,
  Copy,
  Check,
  Search,
} from 'lucide-react';
import type { EncryptedPacket } from '../types/crypto';
import { HexViewer } from './HexViewer';
import { calculateEntropy } from '../crypto/webcrypto';

interface CenterPanelRelayProps {
  packetHistory: EncryptedPacket[];
  selectedPacket: EncryptedPacket | null;
  onSelectPacket: (pkt: EncryptedPacket) => void;
  onTamperCurrentPayload: () => void;
  activeTamperedPacketSeq: number | null;
}

export const CenterPanelRelay: React.FC<CenterPanelRelayProps> = ({
  packetHistory,
  selectedPacket,
  onSelectPacket,
  onTamperCurrentPayload,
  activeTamperedPacketSeq,
}) => {
  const [copiedPkt, setCopiedPkt] = useState<number | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  const activePkt = selectedPacket || packetHistory[packetHistory.length - 1] || null;
  const entropy = activePkt ? calculateEntropy(activePkt.ciphertext) : 0;

  const handleCopy = (pkt: EncryptedPacket) => {
    navigator.clipboard.writeText(JSON.stringify(pkt, null, 2));
    setCopiedPkt(pkt.seq);
    setTimeout(() => setCopiedPkt(null), 2000);
  };

  const filteredHistory = packetHistory.filter((p) => {
    if (!filterQuery) return true;
    return (
      p.seq.toString().includes(filterQuery) ||
      p.current_hash.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.ciphertext.toLowerCase().includes(filterQuery.toLowerCase())
    );
  });

  return (
    <div className="flex flex-col h-full bg-[#090c14] border border-cyber-border rounded-xl overflow-hidden shadow-xl">
      {/* Relay Header */}
      <div className="px-4 py-3 bg-[#0d121f] border-b border-cyber-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-100 flex items-center gap-2">
              Untrusted Relay • Hacker Intercept
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            </h2>
            <div className="text-[10px] text-zinc-400 font-mono">
              Inmarsat-C Maritime Satellite Uplink • Zero-Knowledge Air Gap
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950/60 text-amber-400 border border-amber-800">
            RAW CIPHERTEXT STREAM
          </span>
        </div>
      </div>

      {/* Zero Knowledge Security Guarantee Banner */}
      <div className="px-3.5 py-2 bg-black/40 border-b border-zinc-850 flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-2 text-zinc-400">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero-Knowledge: Ciphertext entropy =</span>
          <span className="text-emerald-400 font-bold">{entropy} / 8.00 bits</span>
          <span className="text-zinc-600">(Indistinguishable from true random noise)</span>
        </div>
        <button
          onClick={onTamperCurrentPayload}
          title="Manually alter a byte in the latest transmitted packet to demonstrate zero-knowledge integrity failure"
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700 transition-all active:scale-95"
        >
          <Zap className="w-3 h-3 text-rose-400" />
          <span>Inject MITM Tamper</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col p-3 space-y-3 overflow-hidden">
        {/* Packet Inspector (Top portion of Center Panel) */}
        {activePkt ? (
          <div className="p-3 bg-zinc-950/90 border border-zinc-800 rounded-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-bold text-zinc-200">
                  Packet #{activePkt.seq} Deep Inspector
                </span>
                {activePkt.tampered && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-600 text-white font-bold animate-pulse">
                    CORRUPTED BY MITM
                  </span>
                )}
                {activePkt.isReplay && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-600 text-white font-bold animate-pulse">
                    REPLAY INJECTION
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleCopy(activePkt)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                >
                  {copiedPkt === activePkt.seq ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Cryptographic Hashes Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="p-2 bg-black/60 rounded border border-zinc-900">
                <div className="text-zinc-500 mb-0.5 flex items-center justify-between">
                  <span>PREVIOUS HASH (H[i-1]):</span>
                  <span className="text-[9px] text-zinc-650">SHA-256</span>
                </div>
                <div className="text-zinc-400 truncate font-mono select-all" title={activePkt.prev_hash}>
                  {activePkt.prev_hash}
                </div>
              </div>

              <div className="p-2 bg-black/60 rounded border border-zinc-900">
                <div className="text-amber-400 mb-0.5 flex items-center justify-between">
                  <span>CURRENT HASH (H[i]):</span>
                  <span className="text-[9px] text-amber-500/70">SHA-256 Chained</span>
                </div>
                <div
                  className={`truncate font-mono select-all ${
                    activePkt.tampered ? 'text-rose-400 line-through' : 'text-amber-300'
                  }`}
                  title={activePkt.current_hash}
                >
                  {activePkt.current_hash}
                </div>
              </div>
            </div>

            {/* 12-Byte IV & ECDSA Signature */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="p-2 bg-black/60 rounded border border-zinc-900">
                <span className="text-cyan-400 block mb-0.5">AES-GCM IV (12-Bytes / 96-Bit):</span>
                <span className="text-zinc-300 truncate block select-all">{activePkt.iv}</span>
              </div>
              <div className="p-2 bg-black/60 rounded border border-zinc-900">
                <span className="text-purple-400 block mb-0.5">ECDSA P-256 Hardware Sig:</span>
                <span className="text-zinc-400 truncate block select-all">
                  {activePkt.device_sig ? `${activePkt.device_sig.substring(0, 28)}...` : 'N/A'}
                </span>
              </div>
            </div>

            {/* Raw Hex Dump of Ciphertext */}
            <HexViewer
              hexData={activePkt.ciphertext}
              label={`AES-256-GCM Ciphertext Payload (Block #${activePkt.seq})`}
              highlightByteIndex={activePkt.tampered ? 16 : -1}
            />
          </div>
        ) : null}

        {/* Live Intercept Stream List */}
        <div className="flex-1 flex flex-col bg-zinc-950/70 border border-zinc-850 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-300">
              <Binary className="w-3.5 h-3.5 text-amber-400" />
              <span>Intercepted Packets Log ({packetHistory.length})</span>
            </div>

            {/* Quick search */}
            <div className="relative">
              <Search className="w-3 h-3 text-zinc-500 absolute left-2 top-2" />
              <input
                type="text"
                placeholder="Search seq/hash..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="pl-6 pr-2 py-0.5 rounded bg-black text-[10px] font-mono text-zinc-300 border border-zinc-800 focus:outline-none focus:border-amber-500 w-32"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-xs font-mono text-zinc-650">
                Waiting for satellite burst packet transmission...
              </div>
            ) : (
              filteredHistory
                .slice()
                .reverse()
                .map((pkt) => {
                  const isSelected = activePkt?.seq === pkt.seq;
                  const isTampered = pkt.tampered || activeTamperedPacketSeq === pkt.seq;

                  return (
                    <div
                      key={`${pkt.seq}-${pkt.timestamp}`}
                      onClick={() => onSelectPacket(pkt)}
                      className={`p-2 rounded border cursor-pointer transition-all text-xs font-mono flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-950/30 border-amber-500 ring-1 ring-amber-500/50'
                          : isTampered
                          ? 'bg-rose-950/40 border-rose-600 hover:border-rose-400'
                          : 'bg-zinc-900/60 border-zinc-850 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] ${
                            isTampered
                              ? 'bg-rose-600 text-white animate-pulse'
                              : pkt.isReplay
                              ? 'bg-amber-600 text-white'
                              : 'bg-zinc-800 text-amber-400'
                          }`}
                        >
                          #{pkt.seq}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-300 font-bold truncate">
                              CIPHERTEXT: {pkt.ciphertext.substring(0, 18)}...
                            </span>
                            {isTampered && (
                              <span className="text-[9px] px-1 rounded bg-rose-500/30 text-rose-300 border border-rose-500/50">
                                MITM TAMPERED
                              </span>
                            )}
                            {pkt.isReplay && (
                              <span className="text-[9px] px-1 rounded bg-amber-500/30 text-amber-300 border border-amber-500/50">
                                REPLAY
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500 truncate flex items-center gap-2">
                            <span>Hash: {pkt.current_hash.substring(0, 16)}...</span>
                            <span>•</span>
                            <span>IV: {pkt.iv.substring(0, 10)}...</span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
