import React, { useState } from 'react';
import {
  Palette,
  Sliders,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronDown,
  Wand2,
  Move,
  Maximize2,
  RotateCw,
  Sun,
  Image as ImageIcon,
  Grid,
  Check,
} from 'lucide-react';
import {
  Slide,
  SlideElement,
  Presentation,
  Theme,
  TransitionType,
  BackgroundType,
  PatternType,
  MasterSlide,
  ElementAnimation,
} from '../types/presentation';
import { PRESET_THEMES } from '../constants/themes';

interface PropertiesPanelProps {
  selectedElement: SlideElement | null;
  currentSlide: Slide;
  presentation: Presentation;
  onUpdateElement: (updates: Partial<SlideElement>) => void;
  onUpdateSlideBackground: (bg: Slide['background'], applyToAll?: boolean) => void;
  onUpdateSlideTransition: (tr: Slide['transition'], applyToAll?: boolean) => void;
  onApplyTheme: (theme: Theme) => void;
  onUpdateMasterSlide: (master: Partial<MasterSlide>) => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

const TRANSITIONS: { id: TransitionType; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'fade', label: 'Fade' },
  { id: 'slide-left', label: 'Slide Left' },
  { id: 'slide-right', label: 'Slide Right' },
  { id: 'slide-up', label: 'Slide Up' },
  { id: 'slide-down', label: 'Slide Down' },
  { id: 'zoom-in', label: 'Zoom In' },
  { id: 'zoom-out', label: 'Zoom Out' },
  { id: 'flip-x', label: 'Flip Horizontal' },
  { id: 'flip-y', label: 'Flip Vertical' },
  { id: 'rotate-cw', label: 'Rotate Clockwise' },
  { id: 'rotate-ccw', label: 'Rotate Counter' },
  { id: 'wipe-left', label: 'Wipe Left' },
  { id: 'wipe-right', label: 'Wipe Right' },
  { id: 'push-left', label: 'Push Left' },
  { id: 'push-right', label: 'Push Right' },
  { id: 'cube-left', label: '3D Cube Left' },
  { id: 'cube-right', label: '3D Cube Right' },
  { id: 'split-horizontal', label: 'Split Horizontal' },
  { id: 'split-vertical', label: 'Split Vertical' },
  { id: 'dissolve', label: 'Dissolve' },
  { id: 'blur-fade', label: 'Blur Fade' },
];

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  currentSlide,
  presentation,
  onUpdateElement,
  onUpdateSlideBackground,
  onUpdateSlideTransition,
  onApplyTheme,
  onUpdateMasterSlide,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
}) => {
  const [activeTab, setActiveTab] = useState<'element' | 'background' | 'theme' | 'transition' | 'master'>(
    selectedElement ? 'element' : 'background'
  );

  // Auto-switch to element tab if element is selected
  React.useEffect(() => {
    if (selectedElement) {
      setActiveTab('element');
    }
  }, [selectedElement?.id]);

  const bg = currentSlide.background;
  const transition = currentSlide.transition || { type: 'fade', duration: 0.6, easing: 'ease-in-out' };

  return (
    <aside className="w-72 lg:w-80 border-l border-[#2A2A2A] bg-[#161616] flex flex-col select-none shrink-0 z-10 text-gray-300">
      {/* Tabs Header */}
      <div className="flex items-center border-b border-[#2A2A2A] p-1 bg-[#121212] text-xs overflow-x-auto gap-1">
        {selectedElement && (
          <button
            onClick={() => setActiveTab('element')}
            className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1 shrink-0 transition ${
              activeTab === 'element' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-gray-200 hover:bg-[#1E1E1E]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Element</span>
          </button>
        )}
        <button
          onClick={() => setActiveTab('background')}
          className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1 shrink-0 transition ${
            activeTab === 'background' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-gray-200 hover:bg-[#1E1E1E]'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Background</span>
        </button>
        <button
          onClick={() => setActiveTab('theme')}
          className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1 shrink-0 transition ${
            activeTab === 'theme' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-gray-200 hover:bg-[#1E1E1E]'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Themes</span>
        </button>
        <button
          onClick={() => setActiveTab('transition')}
          className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1 shrink-0 transition ${
            activeTab === 'transition' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-gray-200 hover:bg-[#1E1E1E]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Transitions</span>
        </button>
        <button
          onClick={() => setActiveTab('master')}
          className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1 shrink-0 transition ${
            activeTab === 'master' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-gray-200 hover:bg-[#1E1E1E]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Master</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs text-gray-300 scrollbar-thin scrollbar-thumb-[#333]">
        {/* ELEMENT PROPERTIES TAB */}
        {activeTab === 'element' && selectedElement && (
          <div className="space-y-4">
            <div className="font-semibold text-gray-100 flex items-center justify-between pb-1 border-b border-[#2A2A2A]">
              <span className="capitalize">{selectedElement.type} Properties</span>
              <span className="text-[10px] text-gray-500 font-mono">ID: {selectedElement.id.slice(0, 8)}</span>
            </div>

            {/* Position & Dimensions */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Position & Size</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-0.5">X Position (px)</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.x)}
                    onChange={(e) => onUpdateElement({ x: Number(e.target.value) })}
                    className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-2 py-1 text-gray-100 font-mono outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-0.5">Y Position (px)</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.y)}
                    onChange={(e) => onUpdateElement({ y: Number(e.target.value) })}
                    className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-2 py-1 text-gray-100 font-mono outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-0.5">Width (px)</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.width)}
                    onChange={(e) => onUpdateElement({ width: Math.max(10, Number(e.target.value)) })}
                    className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-2 py-1 text-gray-100 font-mono outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-0.5">Height (px)</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.height)}
                    onChange={(e) => onUpdateElement({ height: Math.max(10, Number(e.target.value)) })}
                    className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-2 py-1 text-gray-100 font-mono outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Rotation & Opacity */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Rotation</span>
                <span className="font-mono text-gray-200">{Math.round(selectedElement.rotation || 0)}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={Math.round(selectedElement.rotation || 0)}
                onChange={(e) => onUpdateElement({ rotation: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />

              <div className="flex justify-between items-center pt-1">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Opacity</span>
                <span className="font-mono text-gray-200">{Math.round((selectedElement.opacity ?? 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={Math.round((selectedElement.opacity ?? 1) * 100)}
                onChange={(e) => onUpdateElement({ opacity: Number(e.target.value) / 100 })}
                className="w-full accent-blue-600"
              />
            </div>

            {/* Z-Index Controls */}
            <div className="space-y-1.5 pt-1 border-t border-[#2A2A2A]">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Layering Order</div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={onBringForward}
                  className="px-2 py-1.5 bg-[#222] hover:bg-[#2A2A2A] border border-[#333] rounded text-gray-200 text-[11px] transition"
                >
                  Bring Forward
                </button>
                <button
                  onClick={onSendBackward}
                  className="px-2 py-1.5 bg-[#222] hover:bg-[#2A2A2A] border border-[#333] rounded text-gray-200 text-[11px] transition"
                >
                  Send Backward
                </button>
                <button
                  onClick={onBringToFront}
                  className="px-2 py-1.5 bg-[#222] hover:bg-[#2A2A2A] border border-[#333] rounded text-gray-200 text-[11px] transition"
                >
                  Bring to Front
                </button>
                <button
                  onClick={onSendToBack}
                  className="px-2 py-1.5 bg-[#222] hover:bg-[#2A2A2A] border border-[#333] rounded text-gray-200 text-[11px] transition"
                >
                  Send to Back
                </button>
              </div>
            </div>

            {/* Shape-specific styling */}
            {selectedElement.type === 'shape' && (
              <div className="space-y-2 pt-1 border-t border-[#2A2A2A]">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Shape Styling</div>
                <div className="flex items-center justify-between">
                  <span>Fill Color</span>
                  <input
                    type="color"
                    value={(selectedElement as any).fillColor || '#2563eb'}
                    onChange={(e) => onUpdateElement({ fillColor: e.target.value } as any)}
                    className="w-6 h-6 rounded cursor-pointer border border-[#333] bg-transparent"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Border Color</span>
                  <input
                    type="color"
                    value={(selectedElement as any).borderColor || '#3b82f6'}
                    onChange={(e) => onUpdateElement({ borderColor: e.target.value } as any)}
                    className="w-6 h-6 rounded cursor-pointer border border-[#333] bg-transparent"
                  />
                </div>
                <div>
                  <div className="flex justify-between">
                    <span>Border Width</span>
                    <span className="font-mono">{(selectedElement as any).borderWidth || 0}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={(selectedElement as any).borderWidth || 0}
                    onChange={(e) => onUpdateElement({ borderWidth: Number(e.target.value) } as any)}
                    className="w-full accent-blue-600"
                  />
                </div>
                <div>
                  <div className="flex justify-between">
                    <span>Corner Radius</span>
                    <span className="font-mono">{(selectedElement as any).borderRadius || 0}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={(selectedElement as any).borderRadius || 0}
                    onChange={(e) => onUpdateElement({ borderRadius: Number(e.target.value) } as any)}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>
            )}

            {/* Border & Shadow */}
            <div className="space-y-2 pt-1 border-t border-[#2A2A2A]">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Drop Shadow</div>
              <div className="flex items-center justify-between">
                <span>Shadow Color</span>
                <input
                  type="color"
                  value={selectedElement.shadowColor || '#000000'}
                  onChange={(e) => onUpdateElement({ shadowColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border border-[#333] bg-transparent"
                />
              </div>
              <div>
                <div className="flex justify-between">
                  <span>Shadow Blur</span>
                  <span className="font-mono">{selectedElement.shadowBlur || 0}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={selectedElement.shadowBlur || 0}
                  onChange={(e) => onUpdateElement({ shadowBlur: Number(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* SLIDE BACKGROUND DESIGNER */}
        {activeTab === 'background' && (
          <div className="space-y-4">
            <div className="font-semibold text-gray-100 pb-1 border-b border-[#2A2A2A]">
              Background Designer
            </div>

            {/* Background Type Selector */}
            <div className="grid grid-cols-3 gap-1 bg-[#121212] p-1 rounded border border-[#2A2A2A]">
              {(['solid', 'linear-gradient', 'radial-gradient', 'image', 'pattern'] as BackgroundType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => onUpdateSlideBackground({ ...bg, type })}
                  className={`px-2 py-1 rounded text-[11px] font-medium capitalize transition ${
                    bg.type === type ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {type === 'linear-gradient' ? 'Linear' : type === 'radial-gradient' ? 'Radial' : type}
                </button>
              ))}
            </div>

            {/* Solid Color */}
            {bg.type === 'solid' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Solid Color</span>
                  <input
                    type="color"
                    value={bg.color || '#0F0F0F'}
                    onChange={(e) => onUpdateSlideBackground({ ...bg, color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer border border-[#333] bg-transparent"
                  />
                </div>
              </div>
            )}

            {/* Gradients */}
            {(bg.type === 'linear-gradient' || bg.type === 'radial-gradient') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Start Color</span>
                  <input
                    type="color"
                    value={bg.gradientStart || '#0F0F0F'}
                    onChange={(e) => onUpdateSlideBackground({ ...bg, gradientStart: e.target.value })}
                    className="w-7 h-7 rounded cursor-pointer border border-[#333] bg-transparent"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>End Color</span>
                  <input
                    type="color"
                    value={bg.gradientEnd || '#1A1A1A'}
                    onChange={(e) => onUpdateSlideBackground({ ...bg, gradientEnd: e.target.value })}
                    className="w-7 h-7 rounded cursor-pointer border border-[#333] bg-transparent"
                  />
                </div>

                {bg.type === 'linear-gradient' && (
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Gradient Angle</span>
                      <span className="font-mono">{bg.gradientAngle ?? 135}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={bg.gradientAngle ?? 135}
                      onChange={(e) => onUpdateSlideBackground({ ...bg, gradientAngle: Number(e.target.value) })}
                      className="w-full accent-blue-600"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Image Background */}
            {bg.type === 'image' && (
              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={bg.imageUrl || ''}
                    onChange={(e) => onUpdateSlideBackground({ ...bg, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-2 py-1 text-gray-100 text-xs outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Image Blur</span>
                    <span className="font-mono">{bg.imageBlur || 0}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={bg.imageBlur || 0}
                    onChange={(e) => onUpdateSlideBackground({ ...bg, imageBlur: Number(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Dark Overlay</span>
                    <span className="font-mono">{Math.round((bg.overlayOpacity || 0) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={Math.round((bg.overlayOpacity || 0) * 100)}
                    onChange={(e) => onUpdateSlideBackground({ ...bg, overlayOpacity: Number(e.target.value) / 100 })}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>
            )}

            {/* Pattern Background */}
            {bg.type === 'pattern' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-1.5">
                  {(['dots', 'grid', 'waves', 'diagonal-stripes'] as PatternType[]).map((pattern) => (
                    <button
                      key={pattern}
                      onClick={() => onUpdateSlideBackground({ ...bg, pattern })}
                      className={`px-2 py-1.5 rounded text-xs capitalize transition ${
                        bg.pattern === pattern ? 'bg-blue-600 text-white' : 'bg-[#222] text-gray-300 hover:bg-[#2A2A2A]'
                      }`}
                    >
                      {pattern}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Apply to all slides button */}
            <div className="pt-2 border-t border-[#2A2A2A]">
              <button
                onClick={() => onUpdateSlideBackground(bg, true)}
                className="w-full py-1.5 rounded bg-[#222] hover:bg-[#2A2A2A] border border-[#333] text-xs font-medium text-gray-200 transition-colors"
              >
                Apply Background to All Slides
              </button>
            </div>
          </div>
        )}

        {/* THEMES GALLERY TAB */}
        {activeTab === 'theme' && (
          <div className="space-y-3">
            <div className="font-semibold text-gray-100 pb-1 border-b border-[#2A2A2A]">
              Professional Themes (11)
            </div>
            <div className="space-y-2">
              {PRESET_THEMES.map((theme) => {
                const isSelected = presentation.themeId === theme.id;
                return (
                  <div
                    key={theme.id}
                    onClick={() => onApplyTheme(theme)}
                    style={{ background: theme.previewGradient }}
                    className={`p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-[#2A2A2A] hover:border-[#444]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs" style={{ color: theme.textColor }}>
                        {theme.name}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <div className="text-[10px] mb-2 line-clamp-1" style={{ color: theme.mutedColor }}>
                      {theme.description}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.secondaryColor }} />
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.accentColor }} />
                      <span className="text-[10px] font-mono ml-auto opacity-70" style={{ color: theme.textColor }}>
                        {theme.headingFont.split(',')[0]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TRANSITIONS TAB */}
        {activeTab === 'transition' && (
          <div className="space-y-4">
            <div className="font-semibold text-gray-100 pb-1 border-b border-[#2A2A2A]">
              Slide Transitions (20+)
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider">Transition Style</label>
              <select
                value={transition.type}
                onChange={(e) => onUpdateSlideTransition({ ...transition, type: e.target.value as TransitionType })}
                className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-2 py-1.5 text-xs text-gray-100 outline-none focus:border-blue-600"
              >
                {TRANSITIONS.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Duration</span>
                <span className="font-mono text-blue-400">{transition.duration || 0.6}s</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.0"
                step="0.1"
                value={transition.duration || 0.6}
                onChange={(e) => onUpdateSlideTransition({ ...transition, duration: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider">Easing</label>
              <select
                value={transition.easing || 'ease-in-out'}
                onChange={(e) => onUpdateSlideTransition({ ...transition, easing: e.target.value as any })}
                className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-2 py-1 text-xs text-gray-100 outline-none focus:border-blue-600"
              >
                <option value="ease-in-out">Ease In Out</option>
                <option value="ease-out">Ease Out</option>
                <option value="ease-in">Ease In</option>
                <option value="linear">Linear</option>
              </select>
            </div>

            <div className="pt-2 border-t border-[#2A2A2A]">
              <button
                onClick={() => onUpdateSlideTransition(transition, true)}
                className="w-full py-1.5 rounded bg-[#222] hover:bg-[#2A2A2A] border border-[#333] text-xs font-medium text-gray-200 transition-colors"
              >
                Apply Transition to All Slides
              </button>
            </div>
          </div>
        )}

        {/* MASTER SLIDE TAB */}
        {activeTab === 'master' && (
          <div className="space-y-4">
            <div className="font-semibold text-gray-100 pb-1 border-b border-[#2A2A2A]">
              Master Slide Templates
            </div>

            {/* Header Text */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={presentation.masterSlide.showHeader}
                  onChange={(e) => onUpdateMasterSlide({ showHeader: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-0 accent-blue-600"
                />
                <span className="text-xs font-semibold text-gray-200">Show Header</span>
              </label>
              {presentation.masterSlide.showHeader && (
                <input
                  type="text"
                  value={presentation.masterSlide.headerText}
                  onChange={(e) => onUpdateMasterSlide({ headerText: e.target.value })}
                  placeholder="e.g. Company Innovation Deck"
                  className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-2 py-1 text-xs text-gray-100 outline-none focus:border-blue-600"
                />
              )}
            </div>

            {/* Footer Text */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={presentation.masterSlide.showFooter}
                  onChange={(e) => onUpdateMasterSlide({ showFooter: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-0 accent-blue-600"
                />
                <span className="text-xs font-semibold text-gray-200">Show Footer</span>
              </label>
              {presentation.masterSlide.showFooter && (
                <input
                  type="text"
                  value={presentation.masterSlide.footerText}
                  onChange={(e) => onUpdateMasterSlide({ footerText: e.target.value })}
                  placeholder="e.g. Confidential & Proprietary"
                  className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-2 py-1 text-xs text-gray-100 outline-none focus:border-blue-600"
                />
              )}
            </div>

            {/* Slide Number */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={presentation.masterSlide.showSlideNumber}
                  onChange={(e) => onUpdateMasterSlide({ showSlideNumber: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-0 accent-blue-600"
                />
                <span className="text-xs font-semibold text-gray-200">Show Slide Number</span>
              </label>
              {presentation.masterSlide.showSlideNumber && (
                <select
                  value={presentation.masterSlide.slideNumberPosition}
                  onChange={(e) => onUpdateMasterSlide({ slideNumberPosition: e.target.value as any })}
                  className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-2 py-1 text-xs text-gray-100 outline-none focus:border-blue-600"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                </select>
              )}
            </div>

            {/* Global Branding Badge */}
            <div className="space-y-1.5 pt-1 border-t border-[#2A2A2A]">
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider">Branding Badge</label>
              <input
                type="text"
                value={presentation.masterSlide.brandingText || ''}
                onChange={(e) => onUpdateMasterSlide({ brandingText: e.target.value })}
                placeholder="e.g. SLIDECAST"
                className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-2 py-1 text-xs text-gray-100 outline-none focus:border-blue-600 uppercase"
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
