import React, { useState } from 'react';
import { X, Table as TableIcon } from 'lucide-react';

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertTable: (rows: number, cols: number) => void;
}

export const TableModal: React.FC<TableModalProps> = ({
  isOpen,
  onClose,
  onInsertTable,
}) => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [hoverRow, setHoverRow] = useState(3);
  const [hoverCol, setHoverCol] = useState(3);

  if (!isOpen) return null;

  const MAX_GRID = 6;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl shadow-2xl w-full max-w-xs overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-4 py-3 border-b border-[#2A2A2A] bg-[#121212] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-sm text-gray-100">Insert Table</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="text-center text-xs font-mono text-gray-300">
            {hoverRow} Rows × {hoverCol} Columns
          </div>

          {/* Grid visual selector */}
          <div className="grid grid-cols-6 gap-1 bg-[#121212] p-3 rounded-lg border border-[#2A2A2A] mx-auto w-fit">
            {Array.from({ length: MAX_GRID }).map((_, r) =>
              Array.from({ length: MAX_GRID }).map((_, c) => {
                const isHovered = r < hoverRow && c < hoverCol;
                return (
                  <div
                    key={`${r}-${c}`}
                    onMouseEnter={() => {
                      setHoverRow(r + 1);
                      setHoverCol(c + 1);
                    }}
                    onClick={() => {
                      onInsertTable(r + 1, c + 1);
                      onClose();
                    }}
                    className={`w-6 h-6 rounded-sm border cursor-pointer transition-colors ${
                      isHovered
                        ? 'bg-blue-600/30 border-blue-400'
                        : 'bg-[#222] border-[#333] hover:border-[#555]'
                    }`}
                  />
                );
              })
            )}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-[#2A2A2A] bg-[#121212] flex items-center justify-between">
          <button onClick={onClose} className="text-xs text-gray-400 hover:text-white transition">
            Cancel
          </button>
          <button
            onClick={() => {
              onInsertTable(hoverRow, hoverCol);
              onClose();
            }}
            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition"
          >
            Insert {hoverRow}×{hoverCol}
          </button>
        </div>
      </div>
    </div>
  );
};
