import React, { useState, useEffect } from 'react';
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
  Edit3,
  RefreshCw,
  Send,
} from 'lucide-react';
import type { EncryptedPacket } from '../types/crypto';
import { HexViewer } from './HexViewer';
import { calculateEntropy, tamperCiphertext } from '../crypto/webcrypto';

interface CenterPanelRelayProps {
  packetHistory: EncryptedPacket[];
  selectedPacket: EncryptedPacket | null;
  onSelectPacket: (pkt: EncryptedPacket) => void;

  // Staged packet in transit (Waiting at MITM workbench)
  stagedTransitPacket: EncryptedPacket | null;
  onForwardPacket: (packet: EncryptedPacket) => void;
  onCorruptAndForward: (customTamperedCiphertext?: string) => void;
  onInjectReplay: () => void;
}

export const CenterPanelRelay: React.FC<CenterPanelRelayProps> = ({
  packetHistory,
  selectedPacket,
  onSelectPacket,
  stagedTransitPacket,
  onForwardPacket,
  onCorruptAndForward,
  onInjectReplay,
}) => {
  const [copiedPkt, setCopiedPkt] = useState<number | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  // Editable textarea for live MITM manipulation
  const [editableCiphertext, setEditableCiphertext] = useState('');
  const [editableIV, setEditableIV] = useState('');

  // Sync editable fields whenever a new packet arrives at transit workbench
  useEffect(() => {
    if (stagedTransitPacket) {
      setEditableCiphertext(stagedTransitPacket.ciphertext);
      setEditableIV(stagedTransitPacket.iv);
    }
  }, [stagedTransitPacket]);

  const activePkt =
    stagedTransitPacket || selectedPacket || packetHistory[packetHistory.length - 1] || null;
  const entropy = activePkt ? calculateEntropy(activePkt.ciphertext) : 0;

  const handleCopy = (pkt: EncryptedPacket) => {
    navigator.clipboard.writeText(JSON.stringify(pkt, null, 2));
    setCopiedPkt(pkt.seq);
    setTimeout(() => setCopiedPkt(null), 2000);
  };

  const handleCorruptOneBit = () => {
    if (!editableCiphertext) return;
    const { tamperedHex } = tamperCiphertext(editableCiphertext);
    setEditableCiphertext(tamperedHex);
    onCorruptAndForward(tamperedHex);
  };

  const handleManualForwardModified = () => {
    if (!stagedTransitPacket) return;
    const isAltered =
      editableCiphertext !== stagedTransitPacket.ciphertext ||
      editableIV !== stagedTransitPacket.iv;

    const modifiedPacket: EncryptedPacket = {
      ...stagedTransitPacket,
      ciphertext: editableCiphertext,
      iv: editableIV,
      tampered: isAltered,
      tamperReason: isAltered
        ? 'Manual Hex Tamper via MITM Workbench'
        : stagedTransitPacket.tamperReason,
    };
    onForwardPacket(modifiedPacket);
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
              Untrusted Relay • MITM Workbench
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            </h2>
            <div className="text-[10px] text-zinc-400 font-mono">
              Inmarsat-C Maritime Satellite Uplink • Zero-Knowledge Air Gap
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {stagedTransitPacket ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500 text-black animate-pulse">
              PACKET #{stagedTransitPacket.seq} IN TRANSIT
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-900 text-zinc-400 border border-zinc-800">
              RELAY IDLE
            </span>
          )}
        </div>
      </div>

      {/* Zero Knowledge Security Guarantee Banner */}
      <div className="px-3.5 py-1.5 bg-black/50 border-b border-zinc-850 flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-2 text-zinc-400">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero-Knowledge: Entropy =</span>
          <span className="text-emerald-400 font-bold">{entropy} / 8.00 bits</span>
          <span className="text-zinc-600 hidden sm:inline">(True pseudorandom noise)</span>
        </div>
        <span className="text-[10px] text-zinc-500">AES-256-GCM Air Gap</span>
      </div>

      <div className="flex-1 flex flex-col p-3 space-y-3 overflow-y-auto custom-scrollbar">
        {/* INTERACTIVE MITM TAMPER WORKBENCH */}
        <div className="p-3.5 bg-zinc-950/90 border border-amber-900/60 rounded-lg space-y-3 shadow-lg shadow-black/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Edit3 className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-zinc-100 flex items-center gap-2">
                  MITM In-Transit Interceptor Workbench
                </span>
                <span className="text-[10px] font-mono text-zinc-400 block">
                  Intercept, inspect, or modify bytes in flight before forwarding to Consignee
                </span>
              </div>
            </div>

            {stagedTransitPacket && (
              <span className="text-[10px] font-mono text-amber-400 font-bold border border-amber-500/30 px-2 py-0.5 rounded bg-amber-950/40">
                Awaiting Forward
              </span>
            )}
          </div>

          {/* Editable Ciphertext Payload Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-zinc-400 flex items-center gap-1">
                <span>Intercepted Raw Ciphertext Hex:</span>
                <span className="text-zinc-500">({editableCiphertext.length / 2} bytes)</span>
              </span>
              <span className="text-zinc-500">Type or click 'Corrupt Bit' to inject payload errors</span>
            </div>

            <textarea
              rows={3}
              value={editableCiphertext}
              onChange={(e) => setEditableCiphertext(e.target.value)}
              placeholder="Waiting for telemetry packet in transit..."
              className="w-full p-2.5 rounded bg-black border border-zinc-800 text-amber-300 font-mono text-[11px] leading-relaxed focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 select-all"
            />
          </div>

          {/* 12-Byte IV Editable Input */}
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="text-cyan-400 w-24 shrink-0 font-bold">12-Byte IV:</span>
            <input
              type="text"
              value={editableIV}
              onChange={(e) => setEditableIV(e.target.value)}
              className="flex-1 bg-black border border-zinc-800 text-zinc-300 rounded px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Workbench Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-900">
            {/* Button 1: Corrupt Bit & Forward */}
            <button
              onClick={handleCorruptOneBit}
              disabled={!stagedTransitPacket}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition-all shadow-md active:scale-95 ${
                stagedTransitPacket
                  ? 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 shadow-rose-950/60'
                  : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-white" />
              <span>Corrupt Bit & Forward</span>
            </button>

            {/* Button 2: Forward (As-Is or Manually Modified) */}
            <button
              onClick={handleManualForwardModified}
              disabled={!stagedTransitPacket}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition-all shadow-md active:scale-95 ${
                stagedTransitPacket
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-black border border-emerald-400'
                  : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Forward to Consignee</span>
            </button>

            {/* Button 3: Inject Replay Block */}
            <button
              onClick={onInjectReplay}
              disabled={packetHistory.length < 2}
              title="Inject an expired sequence block to test Consignee sequence regression rejection"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold bg-zinc-900 hover:bg-amber-950 hover:text-amber-300 text-zinc-300 border border-zinc-800 hover:border-amber-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-3 h-3 text-amber-400" />
              <span>Inject Replay Attack</span>
            </button>
          </div>
        </div>

        {/* Selected Packet Deep Hex Inspector */}
        {activePkt && (
          <div className="p-3 bg-zinc-950/90 border border-zinc-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-bold text-zinc-200">
                  Packet #{activePkt.seq} Cryptographic Inspection
                </span>
                {activePkt.tampered && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-600 text-white font-bold animate-pulse">
                    TAMPERED
                  </span>
                )}
              </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="p-2 bg-black/60 rounded border border-zinc-900">
                <div className="text-zinc-500 mb-0.5">PREV HASH (H[i-1]):</div>
                <div className="text-zinc-400 truncate select-all">{activePkt.prev_hash}</div>
              </div>

              <div className="p-2 bg-black/60 rounded border border-zinc-900">
                <div className="text-amber-400 mb-0.5">CURRENT HASH (H[i]):</div>
                <div className="text-amber-300 truncate select-all">{activePkt.current_hash}</div>
              </div>
            </div>

            {/* Hex Dump */}
            <HexViewer
              hexData={activePkt.ciphertext}
              label={`AES-256-GCM Ciphertext Hex (Packet #${activePkt.seq})`}
              highlightByteIndex={activePkt.tampered ? 16 : -1}
            />
          </div>
        )}

        {/* Intercepted Packets Stream */}
        <div className="flex-1 flex flex-col bg-zinc-950/70 border border-zinc-850 rounded-lg overflow-hidden min-h-[180px]">
          <div className="px-3 py-2 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-300">
              <Binary className="w-3.5 h-3.5 text-amber-400" />
              <span>Intercepted Packets Log ({packetHistory.length})</span>
            </div>

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
              <div className="text-center py-6 text-xs font-mono text-zinc-650">
                No intercepted packets in log yet. Click "Transmit Encrypted Packet" to dispatch.
              </div>
            ) : (
              filteredHistory
                .slice()
                .reverse()
                .map((pkt) => {
                  const isSelected = activePkt?.seq === pkt.seq;
                  return (
                    <div
                      key={`${pkt.seq}-${pkt.timestamp}`}
                      onClick={() => onSelectPacket(pkt)}
                      className={`p-2 rounded border cursor-pointer transition-all text-xs font-mono flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-950/30 border-amber-500 ring-1 ring-amber-500/50'
                          : pkt.tampered
                          ? 'bg-rose-950/40 border-rose-600 hover:border-rose-400'
                          : 'bg-zinc-900/60 border-zinc-850 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] ${
                            pkt.tampered
                              ? 'bg-rose-600 text-white'
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
                              CIPHER: {pkt.ciphertext.substring(0, 18)}...
                            </span>
                            {pkt.tampered && (
                              <span className="text-[9px] px-1 rounded bg-rose-500/30 text-rose-300 border border-rose-500/50">
                                TAMPERED
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500 truncate">
                            Hash: {pkt.current_hash.substring(0, 16)}... • IV: {pkt.iv.substring(0, 8)}...
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
