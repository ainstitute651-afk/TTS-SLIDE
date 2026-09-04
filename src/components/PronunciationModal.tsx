import React, { useState } from 'react';
import { X, Plus, Trash2, BookOpen, Volume2 } from 'lucide-react';
import { PronunciationEntry } from '../types/presentation';

interface PronunciationModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: PronunciationEntry[];
  onSaveEntries: (entries: PronunciationEntry[]) => void;
}

export const PronunciationModal: React.FC<PronunciationModalProps> = ({
  isOpen,
  onClose,
  entries,
  onSaveEntries,
}) => {
  const [list, setList] = useState<PronunciationEntry[]>(entries || []);
  const [newWord, setNewWord] = useState('');
  const [newPronunciation, setNewPronunciation] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newWord.trim() || !newPronunciation.trim()) return;
    setList([...list, { word: newWord.trim(), pronunciation: newPronunciation.trim() }]);
    setNewWord('');
    setNewPronunciation('');
  };

  const handleRemove = (idx: number) => {
    setList(list.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    onSaveEntries(list);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-5 py-3 border-b border-[#2A2A2A] bg-[#121212] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-sm text-gray-100">Pronunciation Dictionary</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 text-xs">
          <p className="text-gray-400">
            Define custom phonetic pronunciations for acronyms, brand names, or technical terms in your script.
          </p>

          {/* Add New Word Form */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Word (e.g. AI Studio)"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              className="flex-1 bg-[#121212] border border-[#2A2A2A] rounded px-2.5 py-1.5 text-gray-200 outline-none focus:border-blue-600 text-xs"
            />
            <input
              type="text"
              placeholder="Pronounce as (e.g. A I Studio)"
              value={newPronunciation}
              onChange={(e) => setNewPronunciation(e.target.value)}
              className="flex-1 bg-[#121212] border border-[#2A2A2A] rounded px-2.5 py-1.5 text-gray-200 outline-none focus:border-blue-600 text-xs"
            />
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1 shrink-0 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {/* Existing Rules List */}
          <div className="max-h-56 overflow-y-auto space-y-1.5 border border-[#2A2A2A] rounded-lg p-2 bg-[#121212]">
            {list.length === 0 ? (
              <div className="text-gray-500 text-center py-4">No custom pronunciation rules added yet.</div>
            ) : (
              list.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded bg-[#1A1A1A] border border-[#2A2A2A] text-gray-200">
                  <div>
                    <span className="font-semibold text-white">{item.word}</span>
                    <span className="text-gray-500 mx-2">➔</span>
                    <span className="text-blue-400 font-mono">{item.pronunciation}</span>
                  </div>
                  <button
                    onClick={() => handleRemove(idx)}
                    className="p-1 text-gray-400 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-[#2A2A2A] bg-[#121212] flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded text-gray-400 hover:text-white text-xs transition">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition"
          >
            Save Dictionary
          </button>
        </div>
      </div>
    </div>
  );
};
