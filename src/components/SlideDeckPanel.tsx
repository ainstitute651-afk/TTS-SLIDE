import React, { useState } from 'react';
import {
  Plus,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  Layout,
  Mic,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Slide, MasterSlide } from '../types/presentation';
import { SLIDE_LAYOUTS } from '../constants/layouts';

interface SlideDeckPanelProps {
  slides: Slide[];
  currentSlideIndex: number;
  onSelectSlide: (index: number) => void;
  onAddSlide: (layoutId: string) => void;
  onDuplicateSlide: (index: number) => void;
  onDeleteSlide: (index: number) => void;
  onMoveSlide: (fromIndex: number, toIndex: number) => void;
  masterSlide: MasterSlide;
}

export const SlideDeckPanel: React.FC<SlideDeckPanelProps> = ({
  slides,
  currentSlideIndex,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onMoveSlide,
}) => {
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      onMoveSlide(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
  };

  return (
    <div className="w-56 lg:w-64 border-r border-[#2A2A2A] bg-[#121212] flex flex-col select-none shrink-0 z-10 text-gray-300">
      {/* Header with "New Slide" button */}
      <div className="p-3 border-b border-[#2A2A2A] flex items-center justify-between relative">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Slides ({slides.length})</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowLayoutMenu(!showLayoutMenu)}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-lg shadow-blue-900/20 transition-all active:scale-95"
            title="Add Slide (Ctrl+M)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Slide</span>
          </button>

          {/* Layout Picker Dropdown */}
          {showLayoutMenu && (
            <div className="absolute top-full right-0 mt-1.5 w-60 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 py-1 mb-1 border-b border-[#2A2A2A]">
                Choose Layout
              </div>
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {SLIDE_LAYOUTS.map((layout) => (
                  <button
                    key={layout.id}
                    onClick={() => {
                      onAddSlide(layout.id);
                      setShowLayoutMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#222] text-gray-300 transition-colors flex items-start gap-2.5 group"
                  >
                    <div className="p-1 rounded bg-[#222] group-hover:bg-blue-600/30 text-blue-400 shrink-0 mt-0.5 border border-[#333]">
                      <Layout className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-200 group-hover:text-white">
                        {layout.name}
                      </div>
                      <div className="text-[10px] text-gray-500 line-clamp-1">
                        {layout.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide Thumbnails List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 scrollbar-thin scrollbar-thumb-[#333]">
        {slides.map((slide, index) => {
          const isActive = index === currentSlideIndex;
          const bgType = slide.background.type;
          const bgStyle: React.CSSProperties = {};

          if (bgType === 'solid') {
            bgStyle.backgroundColor = slide.background.color || '#0F0F0F';
          } else if (bgType === 'linear-gradient') {
            bgStyle.backgroundImage = `linear-gradient(${slide.background.gradientAngle || 135}deg, ${slide.background.gradientStart || '#0F0F0F'}, ${slide.background.gradientEnd || '#1E1E1E'})`;
          } else if (bgType === 'radial-gradient') {
            bgStyle.backgroundImage = `radial-gradient(circle, ${slide.background.gradientStart || '#1E1E1E'}, ${slide.background.gradientEnd || '#0F0F0F'})`;
          } else if (bgType === 'image' && slide.background.imageUrl) {
            bgStyle.backgroundImage = `url(${slide.background.imageUrl})`;
            bgStyle.backgroundSize = 'cover';
            bgStyle.backgroundPosition = 'center';
          } else {
            bgStyle.backgroundColor = '#0F0F0F';
          }

          return (
            <div
              key={slide.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => onSelectSlide(index)}
              className={`group relative rounded border transition-all cursor-pointer p-1.5 ${
                isActive
                  ? 'border-blue-600 bg-[#1E1E1E] shadow-xl shadow-blue-950/30'
                  : 'border-[#2A2A2A] hover:border-[#444] bg-[#1E1E1E]/80 opacity-75 hover:opacity-100'
              }`}
            >
              {/* Active Indicator Accent Bar */}
              {isActive && (
                <div className="absolute -left-1 top-2 bottom-2 w-1 bg-blue-600 rounded-full" />
              )}

              {/* Slide Number & Title Header */}
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                    isActive ? 'bg-blue-600 text-white' : 'bg-[#222] text-gray-400 border border-[#333]'
                  }`}>
                    {index + 1 < 10 ? `0${index + 1}` : index + 1}
                  </span>
                  <span className={`text-xs truncate ${isActive ? 'font-medium text-blue-400' : 'text-gray-400'}`}>
                    {slide.title || `Slide ${index + 1}`}
                  </span>
                </div>

                {/* Quick actions on hover */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (index > 0) onMoveSlide(index, index - 1);
                    }}
                    disabled={index === 0}
                    className="p-1 text-gray-500 hover:text-white disabled:opacity-20"
                    title="Move Up"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (index < slides.length - 1) onMoveSlide(index, index + 1);
                    }}
                    disabled={index === slides.length - 1}
                    className="p-1 text-gray-500 hover:text-white disabled:opacity-20"
                    title="Move Down"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateSlide(index);
                    }}
                    className="p-1 text-gray-500 hover:text-blue-400"
                    title="Duplicate Slide (Ctrl+D)"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {slides.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSlide(index);
                      }}
                      className="p-1 text-gray-500 hover:text-red-400"
                      title="Delete Slide"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* 16:9 Aspect Ratio Thumbnail Box */}
              <div
                style={bgStyle}
                className="w-full aspect-video rounded-sm border border-[#2A2A2A] overflow-hidden relative shadow-inner flex flex-col justify-center items-center p-2 text-center"
              >
                {/* Mini representation of elements */}
                <div className="scale-100 max-w-[90%] pointer-events-none">
                  <div className="text-[9px] font-bold text-gray-200 line-clamp-1">
                    {slide.elements.find(el => el.type === 'text')?.text || slide.title}
                  </div>
                  <div className="text-[7px] text-gray-500 line-clamp-1 mt-0.5">
                    {slide.layout}
                  </div>
                </div>

                {/* Bottom badges: Transition & Narration */}
                <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between text-[9px] text-gray-400 font-mono px-1">
                  <div className="flex items-center gap-1 bg-[#161616]/90 px-1 py-0.5 rounded text-[8px] border border-[#333]">
                    <Clock className="w-2.5 h-2.5 text-gray-400" />
                    <span>{Math.round(slide.duration || 5)}s</span>
                  </div>

                  {slide.script && slide.script.trim() ? (
                    <div className="flex items-center gap-0.5 bg-blue-900/60 text-blue-300 px-1 py-0.5 rounded text-[8px] border border-blue-700/50" title="AI Narration Script attached">
                      <Mic className="w-2.5 h-2.5" />
                      <span>TTS</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
