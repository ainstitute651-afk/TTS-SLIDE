import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { category: 'Slide Management', items: [
      { keys: 'Ctrl + M', desc: 'Add new slide' },
      { keys: 'Ctrl + D', desc: 'Duplicate current slide / element' },
      { keys: 'Delete / Backspace', desc: 'Delete selected slide / element' },
      { keys: 'Ctrl + Z', desc: 'Undo' },
      { keys: 'Ctrl + Y', desc: 'Redo' },
    ]},
    { category: 'Canvas & Selection', items: [
      { keys: 'Arrow Keys', desc: 'Nudge element by 1px (Shift + Arrow for 10px)' },
      { keys: 'Shift + Drag', desc: 'Constrain proportional aspect ratio' },
      { keys: 'Shift + Rotate', desc: 'Snap rotation to 15° increments' },
      { keys: 'Double Click', desc: 'Inline edit text box' },
      { keys: 'Esc', desc: 'Deselect element / Exit fullscreen' },
    ]},
    { category: 'Presentation Mode', items: [
      { keys: 'F5', desc: 'Start presentation from current slide' },
      { keys: 'Space / Right Arrow', desc: 'Next slide' },
      { keys: 'Left Arrow / Backspace', desc: 'Previous slide' },
      { keys: 'B', desc: 'Black screen pause toggle' },
      { keys: 'W', desc: 'White screen pause toggle' },
      { keys: 'L', desc: 'Toggle virtual laser pointer' },
      { keys: 'N', desc: 'Toggle speaker notes window' },
      { keys: 'G / O', desc: 'Toggle slide grid overview' },
    ]},
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-5 py-3 border-b border-[#2A2A2A] bg-[#121212] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-sm text-gray-100">Keyboard Shortcuts</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4 text-xs">
          {shortcuts.map((sec, idx) => (
            <div key={idx} className="space-y-1.5">
              <h4 className="font-semibold text-blue-400 uppercase tracking-wider text-[11px]">
                {sec.category}
              </h4>
              <div className="space-y-1 bg-[#121212] p-2.5 rounded-lg border border-[#2A2A2A]">
                {sec.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1 text-gray-300">
                    <span>{item.desc}</span>
                    <kbd className="px-2 py-0.5 rounded bg-[#222] border border-[#333] font-mono text-[10px] text-gray-200">
                      {item.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-[#2A2A2A] bg-[#121212] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#222] hover:bg-[#2A2A2A] border border-[#333] text-gray-200 text-xs font-semibold transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
