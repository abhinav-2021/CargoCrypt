import React from 'react';
import { X, Keyboard, Zap, Play, Layers, Lock } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      category: 'Telemetry & Simulation Controls',
      icon: <Play className="w-4 h-4 text-emerald-400" />,
      items: [
        { key: 'Space', desc: 'Transmit next encrypted telemetry burst' },
        { key: 'C', desc: 'Toggle automated Cruise Mode (3-second sailing bursts)' },
        { key: 'M', desc: 'Toggle procedural cyber sound synthesis (Mute/Unmute)' },
      ],
    },
    {
      category: 'Red Team Attack Triggers',
      icon: <Zap className="w-4 h-4 text-rose-400" />,
      items: [
        { key: 'T', desc: 'Trigger in-flight MITM byte corruption (Error 0x4B2)' },
        { key: 'R', desc: 'Inject expired sequence replay attack (Error 0x3F1)' },
        { key: 'B', desc: 'Trigger high-seas physical seal breach (940 Lux, Error 0x99A)' },
        { key: 'K', desc: 'Toggle Consignee key mount/revoke (Zero-Knowledge test)' },
      ],
    },
    {
      category: 'SOC Dashboard View Switcher',
      icon: <Layers className="w-4 h-4 text-cyan-400" />,
      items: [
        { key: '1', desc: 'Switch to Split SOC View (Tri-Panel)' },
        { key: '2', desc: 'Focus IoT Edge Terminal only' },
        { key: '3', desc: 'Focus Cloud Interceptor (MITM Workbench)' },
        { key: '4', desc: 'Focus Consignee Portal & Nautical GIS' },
        { key: '?', desc: 'Open / Close this keyboard shortcuts guide' },
        { key: 'Esc', desc: 'Close modals & dismiss active alerts' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-[#090d16] border border-cyber-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0d121f] border-b border-cyber-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-2">
                Operational Keyboard Shortcuts
              </h3>
              <div className="text-[10px] font-mono text-zinc-400">
                Tactical hotkeys for rapid live hackathon presentation & judging
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {shortcutGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider pb-1 border-b border-zinc-850">
                {group.icon}
                <span>{group.category}</span>
              </div>

              <div className="space-y-1.5">
                {group.items.map((item, iIdx) => (
                  <div
                    key={iIdx}
                    className="flex items-center justify-between py-1.5 px-3 rounded bg-zinc-950/60 border border-zinc-900 text-xs font-mono hover:border-zinc-800 transition-colors"
                  >
                    <span className="text-zinc-300">{item.desc}</span>
                    <kbd className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-amber-300 font-bold shadow text-[11px] min-w-[28px] text-center">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-[11px] font-mono text-emerald-300/90 flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              <strong>Presenter Tip:</strong> Press <kbd className="px-1.5 py-0.2 rounded bg-zinc-900 border border-emerald-500/40 text-emerald-300 text-[10px]">T</kbd> to trigger a live bit corruption in flight, or <kbd className="px-1.5 py-0.2 rounded bg-zinc-900 border border-emerald-500/40 text-emerald-300 text-[10px]">B</kbd> for an instant optical breach alert!
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-[#0d121f] border-t border-cyber-border flex items-center justify-between text-xs font-mono text-zinc-400">
          <span>Shortcuts disabled while typing in text inputs</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-semibold transition-all"
          >
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
