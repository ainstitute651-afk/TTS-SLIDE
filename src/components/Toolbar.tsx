import React, { useState } from 'react';
import {
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  Triangle,
  ArrowRight,
  Minus,
  Star,
  Table as TableIcon,
  Smile,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Layers,
  Trash2,
  Copy,
  ChevronDown,
  Sparkles,
  Upload,
  Link,
  Plus,
} from 'lucide-react';
import { SlideElement, TextElement, ShapeType } from '../types/presentation';

interface ToolbarProps {
  selectedElement: SlideElement | null;
  onUpdateElement: (updated: Partial<SlideElement>) => void;
  onAddText: (type: 'heading' | 'subheading' | 'body' | 'callout') => void;
  onAddShape: (shapeType: ShapeType) => void;
  onAddImage: (url: string) => void;
  onOpenTableModal: () => void;
  onOpenIconPicker: () => void;
  onDuplicateElement: () => void;
  onDeleteElement: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
}

const FONT_FAMILIES = [
  { label: 'Outfit (Modern)', value: 'Outfit, sans-serif' },
  { label: 'Inter (Clean)', value: 'Inter, sans-serif' },
  { label: 'Plus Jakarta Sans', value: 'Plus Jakarta Sans, sans-serif' },
  { label: 'Playfair Display (Serif)', value: 'Playfair Display, serif' },
  { label: 'Montserrat (Bold)', value: 'Montserrat, sans-serif' },
  { label: 'Merriweather (Classic)', value: 'Merriweather, serif' },
  { label: 'Fira Code (Tech/Mono)', value: 'Fira Code, monospace' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  selectedElement,
  onUpdateElement,
  onAddText,
  onAddShape,
  onAddImage,
  onOpenTableModal,
  onOpenIconPicker,
  onDuplicateElement,
  onDeleteElement,
  onBringForward,
  onSendBackward,
}) => {
  const [showTextMenu, setShowTextMenu] = useState(false);
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const isText = selectedElement?.type === 'text';
  const textEl = isText ? (selectedElement as TextElement) : null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onAddImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
    setShowImageMenu(false);
  };

  return (
    <div className="h-11 border-b border-[#2A2A2A] bg-[#161616] px-3 flex items-center gap-1.5 overflow-x-auto select-none z-20 shrink-0 text-gray-300">
      {/* Insert Group */}
      <div className="flex items-center gap-1 pr-2 border-r border-[#2A2A2A] shrink-0">
        {/* Text Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowTextMenu(!showTextMenu); setShowShapeMenu(false); setShowImageMenu(false); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded hover:bg-[#222] text-xs font-medium text-gray-200 border border-transparent hover:border-[#333] transition-colors"
            title="Insert Text Box"
          >
            <Type className="w-3.5 h-3.5 text-blue-400" />
            <span>Text</span>
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </button>

          {showTextMenu && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg shadow-2xl py-1 z-50 animate-in fade-in slide-in-from-top-1">
              <button
                onClick={() => { onAddText('heading'); setShowTextMenu(false); }}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#222] flex items-center justify-between text-gray-200"
              >
                <span className="font-bold text-sm">Heading</span>
                <span className="text-[10px] text-gray-500 font-mono">54px</span>
              </button>
              <button
                onClick={() => { onAddText('subheading'); setShowTextMenu(false); }}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#222] flex items-center justify-between text-gray-200"
              >
                <span className="font-semibold">Subheading</span>
                <span className="text-[10px] text-gray-500 font-mono">32px</span>
              </button>
              <button
                onClick={() => { onAddText('body'); setShowTextMenu(false); }}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#222] flex items-center justify-between text-gray-200"
              >
                <span>Body Text</span>
                <span className="text-[10px] text-gray-500 font-mono">24px</span>
              </button>
              <button
                onClick={() => { onAddText('callout'); setShowTextMenu(false); }}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#222] flex items-center justify-between text-gray-200 border-t border-[#2A2A2A] mt-1 pt-1.5"
              >
                <span className="text-blue-400 font-medium">Badge / Pill</span>
                <span className="text-[10px] text-gray-500 font-mono">16px</span>
              </button>
            </div>
          )}
        </div>

        {/* Shapes Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowShapeMenu(!showShapeMenu); setShowTextMenu(false); setShowImageMenu(false); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded hover:bg-[#222] text-xs font-medium text-gray-200 border border-transparent hover:border-[#333] transition-colors"
            title="Insert Geometric Shape"
          >
            <Square className="w-3.5 h-3.5 text-blue-400" />
            <span>Shape</span>
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </button>

          {showShapeMenu && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg shadow-2xl p-2 z-50 grid grid-cols-4 gap-1.5 animate-in fade-in slide-in-from-top-1">
              <button
                onClick={() => { onAddShape('rectangle'); setShowShapeMenu(false); }}
                title="Rectangle"
                className="p-2 rounded hover:bg-[#222] flex flex-col items-center justify-center text-gray-300 hover:text-white"
              >
                <Square className="w-4 h-4" />
                <span className="text-[9px] mt-1">Rect</span>
              </button>
              <button
                onClick={() => { onAddShape('rounded-rect'); setShowShapeMenu(false); }}
                title="Rounded Card"
                className="p-2 rounded hover:bg-[#222] flex flex-col items-center justify-center text-gray-300 hover:text-white"
              >
                <div className="w-4 h-4 rounded border border-current" />
                <span className="text-[9px] mt-1">Card</span>
              </button>
              <button
                onClick={() => { onAddShape('circle'); setShowShapeMenu(false); }}
                title="Circle"
                className="p-2 rounded hover:bg-[#222] flex flex-col items-center justify-center text-gray-300 hover:text-white"
              >
                <Circle className="w-4 h-4" />
                <span className="text-[9px] mt-1">Circle</span>
              </button>
              <button
                onClick={() => { onAddShape('triangle'); setShowShapeMenu(false); }}
                title="Triangle"
                className="p-2 rounded hover:bg-[#222] flex flex-col items-center justify-center text-gray-300 hover:text-white"
              >
                <Triangle className="w-4 h-4" />
                <span className="text-[9px] mt-1">Triangle</span>
              </button>
              <button
                onClick={() => { onAddShape('arrow-right'); setShowShapeMenu(false); }}
                title="Arrow Right"
                className="p-2 rounded hover:bg-[#222] flex flex-col items-center justify-center text-gray-300 hover:text-white"
              >
                <ArrowRight className="w-4 h-4" />
                <span className="text-[9px] mt-1">Arrow</span>
              </button>
              <button
                onClick={() => { onAddShape('line'); setShowShapeMenu(false); }}
                title="Divider Line"
                className="p-2 rounded hover:bg-[#222] flex flex-col items-center justify-center text-gray-300 hover:text-white"
              >
                <Minus className="w-4 h-4" />
                <span className="text-[9px] mt-1">Line</span>
              </button>
              <button
                onClick={() => { onAddShape('star'); setShowShapeMenu(false); }}
                title="Star"
                className="p-2 rounded hover:bg-[#222] flex flex-col items-center justify-center text-gray-300 hover:text-white"
              >
                <Star className="w-4 h-4" />
                <span className="text-[9px] mt-1">Star</span>
              </button>
              <button
                onClick={() => { onAddShape('speech-bubble'); setShowShapeMenu(false); }}
                title="Speech Bubble"
                className="p-2 rounded hover:bg-[#222] flex flex-col items-center justify-center text-gray-300 hover:text-white"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-[9px] mt-1">Bubble</span>
              </button>
            </div>
          )}
        </div>

        {/* Image Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowImageMenu(!showImageMenu); setShowTextMenu(false); setShowShapeMenu(false); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded hover:bg-[#222] text-xs font-medium text-gray-200 border border-transparent hover:border-[#333] transition-colors"
            title="Insert Image (Upload or URL)"
          >
            <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
            <span>Image</span>
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </button>

          {showImageMenu && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-1 space-y-2">
              <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-medium cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload from Device</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>

              <div className="text-[11px] text-gray-500 text-center font-medium">or paste image URL</div>

              <div className="flex gap-1">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 bg-[#222] border border-[#333] rounded px-2 py-1 text-xs text-gray-200 outline-none focus:border-blue-600"
                />
                <button
                  onClick={() => {
                    if (imageUrlInput.trim()) {
                      onAddImage(imageUrlInput.trim());
                      setImageUrlInput('');
                      setShowImageMenu(false);
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-900/20"
                >
                  Add
                </button>
              </div>

              {/* Sample stock presets */}
              <div className="pt-2 border-t border-[#2A2A2A]">
                <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1.5">Quick Stock Photos:</div>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => {
                      onAddImage('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80');
                      setShowImageMenu(false);
                    }}
                    className="text-[10px] p-1 bg-[#222] hover:bg-[#2A2A2A] border border-[#333] rounded text-gray-300 truncate text-left transition"
                  >
                    Tech Circuit
                  </button>
                  <button
                    onClick={() => {
                      onAddImage('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80');
                      setShowImageMenu(false);
                    }}
                    className="text-[10px] p-1 bg-[#222] hover:bg-[#2A2A2A] border border-[#333] rounded text-gray-300 truncate text-left transition"
                  >
                    Cyber Matrix
                  </button>
                  <button
                    onClick={() => {
                      onAddImage('https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80');
                      setShowImageMenu(false);
                    }}
                    className="text-[10px] p-1 bg-[#222] hover:bg-[#2A2A2A] border border-[#333] rounded text-gray-300 truncate text-left transition"
                  >
                    Deep Space
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table Button */}
        <button
          onClick={onOpenTableModal}
          className="flex items-center gap-1 px-2.5 py-1 rounded hover:bg-[#222] text-xs font-medium text-gray-200 border border-transparent hover:border-[#333] transition-colors"
          title="Insert NxM Grid Table"
        >
          <TableIcon className="w-3.5 h-3.5 text-blue-400" />
          <span>Table</span>
        </button>

        {/* Icon Library Button */}
        <button
          onClick={onOpenIconPicker}
          className="flex items-center gap-1 px-2.5 py-1 rounded hover:bg-[#222] text-xs font-medium text-gray-200 border border-transparent hover:border-[#333] transition-colors"
          title="Insert SVG Icon"
        >
          <Smile className="w-3.5 h-3.5 text-blue-400" />
          <span>Icon</span>
        </button>
      </div>

      {/* Rich Text Toolbar (Contextual when text element selected) */}
      {isText && textEl ? (
        <div className="flex items-center gap-1 px-2 border-r border-[#2A2A2A] shrink-0">
          {/* Font Family */}
          <select
            value={textEl.fontFamily || 'Inter, sans-serif'}
            onChange={(e) => onUpdateElement({ fontFamily: e.target.value })}
            className="bg-[#222] text-gray-200 border border-[#333] rounded px-2 py-1 text-xs outline-none max-w-[130px] focus:border-blue-600"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          {/* Font Size */}
          <div className="flex items-center bg-[#222] border border-[#333] rounded px-1.5 py-0.5">
            <button
              onClick={() => onUpdateElement({ fontSize: Math.max(12, (textEl.fontSize || 24) - 2) })}
              className="px-1 text-gray-400 hover:text-white"
            >
              -
            </button>
            <span className="text-xs font-mono text-gray-200 w-6 text-center">{textEl.fontSize || 24}</span>
            <button
              onClick={() => onUpdateElement({ fontSize: Math.min(120, (textEl.fontSize || 24) + 2) })}
              className="px-1 text-gray-400 hover:text-white"
            >
              +
            </button>
          </div>

          {/* Bold, Italic, Underline, Strike */}
          <button
            onClick={() => onUpdateElement({ fontWeight: textEl.fontWeight === '700' || textEl.fontWeight === 'bold' ? 'normal' : '700' })}
            className={`p-1 rounded ${textEl.fontWeight === '700' || textEl.fontWeight === 'bold' ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40' : 'text-gray-300 hover:bg-[#222]'}`}
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onUpdateElement({ fontStyle: textEl.fontStyle === 'italic' ? 'normal' : 'italic' })}
            className={`p-1 rounded ${textEl.fontStyle === 'italic' ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40' : 'text-gray-300 hover:bg-[#222]'}`}
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onUpdateElement({ textDecoration: textEl.textDecoration === 'underline' ? 'none' : 'underline' })}
            className={`p-1 rounded ${textEl.textDecoration === 'underline' ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40' : 'text-gray-300 hover:bg-[#222]'}`}
            title="Underline"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onUpdateElement({ textDecoration: textEl.textDecoration === 'line-through' ? 'none' : 'line-through' })}
            className={`p-1 rounded ${textEl.textDecoration === 'line-through' ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40' : 'text-gray-300 hover:bg-[#222]'}`}
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          {/* Text Color Picker */}
          <div className="flex items-center gap-1 ml-1" title="Text Color">
            <input
              type="color"
              value={textEl.color || '#ffffff'}
              onChange={(e) => onUpdateElement({ color: e.target.value })}
              className="w-5 h-5 rounded cursor-pointer border border-[#333] bg-transparent p-0"
            />
          </div>

          {/* Text Alignment */}
          <div className="flex items-center bg-[#222] border border-[#333] rounded p-0.5 ml-1">
            <button
              onClick={() => onUpdateElement({ textAlign: 'left' })}
              className={`p-1 rounded ${textEl.textAlign === 'left' ? 'bg-[#333] text-white' : 'text-gray-400 hover:text-gray-200'}`}
              title="Align Left"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUpdateElement({ textAlign: 'center' })}
              className={`p-1 rounded ${textEl.textAlign === 'center' ? 'bg-[#333] text-white' : 'text-gray-400 hover:text-gray-200'}`}
              title="Align Center"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUpdateElement({ textAlign: 'right' })}
              className={`p-1 rounded ${textEl.textAlign === 'right' ? 'bg-[#333] text-white' : 'text-gray-400 hover:text-gray-200'}`}
              title="Align Right"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUpdateElement({ textAlign: 'justify' })}
              className={`p-1 rounded ${textEl.textAlign === 'justify' ? 'bg-[#333] text-white' : 'text-gray-400 hover:text-gray-200'}`}
              title="Justify"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Selected Element Controls (Z-Index, Duplicate, Delete) */}
      {selectedElement && (
        <div className="flex items-center gap-1 ml-auto shrink-0">
          <button
            onClick={onBringForward}
            title="Bring Forward"
            className="p-1.5 rounded hover:bg-[#222] text-gray-400 hover:text-white"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDuplicateElement}
            title="Duplicate Element (Ctrl+D)"
            className="p-1.5 rounded hover:bg-[#222] text-gray-400 hover:text-white"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDeleteElement}
            title="Delete Element (Del)"
            className="p-1.5 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
