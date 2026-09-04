import React from 'react';
import {
  Play,
  Video,
  Download,
  Upload,
  FileCode,
  Printer,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  HelpCircle,
  Sun,
  Moon,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Presentation } from '../types/presentation';

interface NavbarProps {
  presentation: Presentation;
  onUpdateTitle: (title: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFitToScreen: () => void;
  onStartPresenting: () => void;
  onOpenExportModal: () => void;
  onOpenPreviewModal: () => void;
  onExportJSON: () => void;
  onImportJSON: () => void;
  onExportHTML: () => void;
  onPrint: () => void;
  onOpenShortcuts: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isSaved: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  presentation,
  onUpdateTitle,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  onFitToScreen,
  onStartPresenting,
  onOpenExportModal,
  onOpenPreviewModal,
  onExportJSON,
  onImportJSON,
  onExportHTML,
  onPrint,
  onOpenShortcuts,
  isDarkMode,
  onToggleDarkMode,
  isSaved,
}) => {
  return (
    <header className="h-14 border-b border-[#2A2A2A] bg-[#161616] px-4 flex items-center justify-between select-none z-30 shrink-0 text-gray-300">
      {/* Left: Brand & Title & Save Status */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2.5 pr-3 border-r border-[#2A2A2A]">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-white hidden sm:inline">
            SlideCast <span className="text-xs font-normal text-gray-500 ml-1.5 italic">v2.4 Pro</span>
          </span>
        </div>

        <input
          type="text"
          value={presentation.title}
          onChange={(e) => onUpdateTitle(e.target.value)}
          className="bg-transparent hover:bg-[#222] focus:bg-[#1A1A1A] px-2.5 py-1 rounded text-sm font-semibold text-gray-100 border border-transparent focus:border-blue-600 outline-none w-48 sm:w-64 md:w-80 truncate transition-colors"
          placeholder="Untitled Presentation"
          title="Click to rename presentation"
        />

        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium hidden md:flex" title="Auto-saved to local storage">
          <CheckCircle2 className={`w-3.5 h-3.5 ${isSaved ? 'text-blue-400' : 'text-amber-400 animate-pulse'}`} />
          <span className="text-[11px]">{isSaved ? 'Autosaved' : 'Saving...'}</span>
        </div>
      </div>

      {/* Center: History & Zoom in Elegant Dark Pill */}
      <div className="flex items-center bg-[#222] rounded-lg p-1 border border-[#333]">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1 rounded hover:bg-[#333] text-gray-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1 rounded hover:bg-[#333] text-gray-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-[1px] h-3.5 bg-[#444] mx-1.5 hidden lg:block" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 hidden lg:flex">
          <button
            onClick={() => onZoomChange(Math.max(25, zoom - 10))}
            title="Zoom Out"
            className="p-1 rounded hover:bg-[#333] text-gray-300 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-gray-300 w-9 text-center">
            {Math.round(zoom)}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(200, zoom + 10))}
            title="Zoom In"
            className="p-1 rounded hover:bg-[#333] text-gray-300 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onFitToScreen}
            title="Fit to Screen"
            className="px-1.5 py-0.5 rounded hover:bg-[#333] text-gray-300 text-[10px] transition-colors"
          >
            Fit
          </button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Help */}
        <button
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts (?)"
          className="p-1.5 rounded hover:bg-[#222] text-gray-400 hover:text-gray-200 transition-colors hidden sm:flex"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Import/Export utilities */}
        <div className="flex items-center gap-0.5 border-r border-[#2A2A2A] pr-2 mr-0.5 hidden xl:flex">
          <button
            onClick={onImportJSON}
            title="Import Presentation (.json)"
            className="px-2 py-1 rounded hover:bg-[#222] text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-1 text-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>
          <button
            onClick={onExportJSON}
            title="Export as JSON"
            className="px-2 py-1 rounded hover:bg-[#222] text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-1 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
          <button
            onClick={onExportHTML}
            title="Export as Standalone HTML presentation"
            className="px-2 py-1 rounded hover:bg-[#222] text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-1 text-xs"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>HTML</span>
          </button>
          <button
            onClick={onPrint}
            title="Print / Save as PDF"
            className="px-2 py-1 rounded hover:bg-[#222] text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-1 text-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>

        {/* UI Theme toggle */}
        <button
          onClick={onToggleDarkMode}
          title={isDarkMode ? 'Switch to Light Editor' : 'Switch to Dark Editor'}
          className="p-1.5 rounded hover:bg-[#222] text-gray-400 hover:text-gray-200 transition-colors hidden md:flex"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Preview Button */}
        <button
          onClick={onOpenPreviewModal}
          title="Preview with AI audio narration"
          className="px-3 py-1.5 bg-[#222] hover:bg-[#2A2A2A] text-gray-300 text-xs font-medium rounded border border-[#333] flex items-center gap-1.5 transition"
        >
          <Play className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
          <span className="hidden sm:inline">Preview</span>
        </button>

        {/* Fullscreen Present (F5) */}
        <button
          onClick={onStartPresenting}
          title="Enter Fullscreen Presentation Mode (F5)"
          className="px-3 py-1.5 bg-[#222] hover:bg-[#2A2A2A] text-gray-300 text-xs font-medium rounded border border-[#333] flex items-center gap-1.5 transition"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Present</span>
        </button>

        {/* Export Video (Main CTA) */}
        <button
          onClick={onOpenExportModal}
          title="Export 1080p Video with AI Audio Narration"
          className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded shadow-lg shadow-blue-900/20 transition active:scale-95"
        >
          <Video className="w-3.5 h-3.5" />
          <span>Export Video</span>
        </button>
      </div>
    </header>
  );
};
