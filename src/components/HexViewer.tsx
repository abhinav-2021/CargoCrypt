import React, { useMemo } from 'react';
import { hexToUint8Array } from '../crypto/webcrypto';

interface HexViewerProps {
  hexData: string;
  maxBytes?: number;
  highlightByteIndex?: number;
  label?: string;
}

export const HexViewer: React.FC<HexViewerProps> = ({
  hexData,
  maxBytes = 96,
  highlightByteIndex = -1,
  label,
}) => {
  const lines = useMemo(() => {
    if (!hexData) return [];
    const bytes = hexToUint8Array(hexData);
    const displayBytes = bytes.slice(0, maxBytes);
    const result: Array<{
      offset: string;
      hexParts: Array<{ byteHex: string; isHighlighted: boolean; index: number }>;
      ascii: string;
    }> = [];

    for (let i = 0; i < displayBytes.length; i += 16) {
      const slice = displayBytes.slice(i, i + 16);
      const offset = i.toString(16).padStart(8, '0');
      const hexParts: Array<{ byteHex: string; isHighlighted: boolean; index: number }> = [];
      let ascii = '';

      for (let j = 0; j < 16; j++) {
        const byteIndex = i + j;
        if (j < slice.length) {
          const b = slice[j];
          hexParts.push({
            byteHex: b.toString(16).padStart(2, '0'),
            isHighlighted: byteIndex === highlightByteIndex,
            index: byteIndex,
          });
          // Printable ASCII 32-126
          ascii += b >= 32 && b <= 126 ? String.fromCharCode(b) : '.';
        } else {
          hexParts.push({
            byteHex: '  ',
            isHighlighted: false,
            index: byteIndex,
          });
          ascii += ' ';
        }
      }

      result.push({ offset, hexParts, ascii });
    }

    return result;
  }, [hexData, maxBytes, highlightByteIndex]);

  if (!hexData) {
    return (
      <div className="p-4 text-center font-mono text-xs text-zinc-600 bg-black/40 rounded border border-zinc-800">
        NO PACKET DATA IN BUFFER
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-[#06080e] overflow-hidden text-[11px] font-mono select-text">
      {label && (
        <div className="px-3 py-1.5 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between text-zinc-400">
          <span className="font-semibold text-zinc-300">{label}</span>
          <span className="text-[10px] text-zinc-500">{hexData.length / 2} bytes</span>
        </div>
      )}
      <div className="p-3 overflow-x-auto space-y-1 leading-relaxed">
        {lines.map((line, idx) => (
          <div key={idx} className="flex items-center gap-3">
            {/* Memory Offset */}
            <span className="text-zinc-600 select-none">{line.offset}</span>

            {/* Hex Bytes (8 bytes - 8 bytes) */}
            <div className="flex items-center gap-1.5 text-zinc-300">
              <div className="flex gap-1">
                {line.hexParts.slice(0, 8).map((part, pIdx) => (
                  <span
                    key={pIdx}
                    className={`inline-block w-5 text-center ${
                      part.isHighlighted
                        ? 'bg-rose-500 text-white font-bold rounded animate-pulse'
                        : 'text-zinc-400 hover:text-amber-400'
                    }`}
                  >
                    {part.byteHex}
                  </span>
                ))}
              </div>
              <span className="text-zinc-700 select-none">|</span>
              <div className="flex gap-1">
                {line.hexParts.slice(8, 16).map((part, pIdx) => (
                  <span
                    key={pIdx}
                    className={`inline-block w-5 text-center ${
                      part.isHighlighted
                        ? 'bg-rose-500 text-white font-bold rounded animate-pulse'
                        : 'text-zinc-400 hover:text-amber-400'
                    }`}
                  >
                    {part.byteHex}
                  </span>
                ))}
              </div>
            </div>

            {/* ASCII Column */}
            <span className="text-zinc-500 pl-2 border-l border-zinc-800 select-none tracking-wider">
              {line.ascii}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

