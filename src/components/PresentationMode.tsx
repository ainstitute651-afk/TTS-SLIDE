import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Clock,
  Mic,
  PenTool,
  Highlighter,
  Trash2,
  Grid,
  FileText,
  Radio,
  Eye,
  Volume2,
} from 'lucide-react';
import { Presentation, Slide } from '../types/presentation';
import { renderCompleteSlide } from '../services/canvasRenderer';

interface PresentationModeProps {
  presentation: Presentation;
  initialSlideIndex?: number;
  onExit: () => void;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
  presentation,
  initialSlideIndex = 0,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialSlideIndex);
  const [isBlackScreen, setIsBlackScreen] = useState(false);
  const [isWhiteScreen, setIsWhiteScreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  // Tools: 'pointer' | 'laser' | 'pen' | 'highlighter'
  const [activeTool, setActiveTool] = useState<'pointer' | 'laser' | 'pen' | 'highlighter'>('pointer');
  const [penColor, setPenColor] = useState('#ef4444');

  // Timers
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [slideSeconds, setSlideSeconds] = useState(0);

  // Laser Pointer Coordinates
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);

  // Drawing Canvas
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Slide Canvas
  const slideCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const slides = presentation.slides;
  const currentSlide = slides[currentIndex];
  const nextSlide = currentIndex < slides.length - 1 ? slides[currentIndex + 1] : null;

  // Presentation Timer ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setTotalSeconds((s) => s + 1);
      setSlideSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Reset slide seconds when slide changes
  useEffect(() => {
    setSlideSeconds(0);
    clearDrawingCanvas();
  }, [currentIndex]);

  // Render Slide on Canvas
  useEffect(() => {
    const canvas = slideCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderCompleteSlide(
      ctx,
      currentSlide,
      currentIndex,
      slides.length,
      presentation.masterSlide,
      1920,
      1080
    );
  }, [currentSlide, currentIndex, slides.length, presentation.masterSlide]);

  // Keyboard navigation & hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showGrid) setShowGrid(false);
        else if (isBlackScreen || isWhiteScreen) {
          setIsBlackScreen(false);
          setIsWhiteScreen(false);
        } else {
          onExit();
        }
      } else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        if (currentIndex < slides.length - 1) {
          setCurrentIndex((i) => i + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'Backspace') {
        if (currentIndex > 0) {
          setCurrentIndex((i) => i - 1);
        }
      } else if (e.key === 'Home') {
        setCurrentIndex(0);
      } else if (e.key === 'End') {
        setCurrentIndex(slides.length - 1);
      } else if (e.key.toLowerCase() === 'b') {
        setIsBlackScreen((b) => !b);
        setIsWhiteScreen(false);
      } else if (e.key.toLowerCase() === 'w') {
        setIsWhiteScreen((w) => !w);
        setIsBlackScreen(false);
      } else if (e.key.toLowerCase() === 'l') {
        setActiveTool((t) => (t === 'laser' ? 'pointer' : 'laser'));
      } else if (e.key.toLowerCase() === 'n') {
        setShowNotes((n) => !n);
      } else if (e.key.toLowerCase() === 'g' || e.key.toLowerCase() === 'o') {
        setShowGrid((g) => !g);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, slides.length, isBlackScreen, isWhiteScreen, showGrid, onExit]);

  // Drawing interactions on the transparent drawing overlay canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'pen' && activeTool !== 'highlighter') return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    isDrawingRef.current = true;
    lastPointRef.current = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const curX = (e.clientX - rect.left) * scaleX;
    const curY = (e.clientY - rect.top) * scaleY;

    // Laser pointer coordinate
    if (activeTool === 'laser') {
      setLaserPos({ x: e.clientX, y: e.clientY });
    }

    if (!isDrawingRef.current || !lastPointRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(curX, curY);

    if (activeTool === 'highlighter') {
      ctx.strokeStyle = penColor === '#ef4444' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(234, 179, 8, 0.4)';
      ctx.lineWidth = 24;
      ctx.lineCap = 'square';
    } else {
      ctx.strokeStyle = penColor;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    ctx.stroke();
    lastPointRef.current = { x: curX, y: curY };
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const clearDrawingCanvas = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden cursor-default">
      {/* Black / White Screen Mode Overlay */}
      {isBlackScreen && (
        <div
          onClick={() => setIsBlackScreen(false)}
          className="absolute inset-0 bg-black z-40 cursor-pointer flex items-center justify-center text-slate-800 text-sm font-mono"
        >
          Screen paused. Click or press 'B' to resume.
        </div>
      )}
      {isWhiteScreen && (
        <div
          onClick={() => setIsWhiteScreen(false)}
          className="absolute inset-0 bg-white z-40 cursor-pointer flex items-center justify-center text-slate-400 text-sm font-mono"
        >
          Screen paused. Click or press 'W' to resume.
        </div>
      )}

      {/* Laser Pointer Glowing Dot */}
      {activeTool === 'laser' && laserPos && (
        <div
          style={{ left: `${laserPos.x}px`, top: `${laserPos.y}px` }}
          className="fixed w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 shadow-[0_0_15px_6px_rgba(239,68,68,0.8)] pointer-events-none z-50 animate-pulse"
        />
      )}

      {/* Main Slide 16:9 Canvas Container */}
      <div className="relative w-full h-full max-w-[177.78vh] max-h-[56.25vw] flex items-center justify-center aspect-video">
        <canvas
          ref={slideCanvasRef}
          width={1920}
          height={1080}
          className="w-full h-full object-contain"
        />

        {/* Freehand Drawing Overlay Canvas */}
        <canvas
          ref={drawingCanvasRef}
          width={1920}
          height={1080}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`absolute inset-0 w-full h-full ${
            activeTool === 'laser'
              ? 'cursor-none'
              : activeTool === 'pen' || activeTool === 'highlighter'
              ? 'cursor-crosshair'
              : 'cursor-default'
          }`}
        />
      </div>

      {/* Floating Presenter Bottom Toolbar (Auto-fades on hover) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#121212]/95 hover:bg-[#161616] backdrop-blur-md border border-[#2A2A2A] rounded-full px-4 py-2 flex items-center gap-3 shadow-2xl z-30 transition-opacity opacity-40 hover:opacity-100">
        {/* Prev / Next Buttons */}
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="p-1.5 rounded-full hover:bg-[#222] text-gray-300 disabled:opacity-30 transition"
          title="Previous Slide (Left Arrow)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-xs font-mono text-gray-200 font-semibold px-1">
          {currentIndex + 1} / {slides.length}
        </span>

        <button
          onClick={() => setCurrentIndex((i) => Math.min(slides.length - 1, i + 1))}
          disabled={currentIndex === slides.length - 1}
          className="p-1.5 rounded-full hover:bg-[#222] text-gray-300 disabled:opacity-30 transition"
          title="Next Slide (Right Arrow / Space)"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="w-px h-5 bg-[#2A2A2A] mx-1" />

        {/* Tools: Pointer, Laser, Pen, Highlighter */}
        <button
          onClick={() => setActiveTool('pointer')}
          className={`p-1.5 rounded-full transition ${activeTool === 'pointer' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          title="Arrow Cursor"
        >
          <Radio className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTool(activeTool === 'laser' ? 'pointer' : 'laser')}
          className={`p-1.5 rounded-full transition ${activeTool === 'laser' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
          title="Laser Pointer (L)"
        >
          <div className="w-4 h-4 rounded-full border-2 border-red-400 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
          </div>
        </button>

        <button
          onClick={() => setActiveTool(activeTool === 'pen' ? 'pointer' : 'pen')}
          className={`p-1.5 rounded-full transition ${activeTool === 'pen' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          title="Pen Annotation"
        >
          <PenTool className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTool(activeTool === 'highlighter' ? 'pointer' : 'highlighter')}
          className={`p-1.5 rounded-full transition ${activeTool === 'highlighter' ? 'bg-yellow-500 text-gray-950' : 'text-gray-400 hover:text-white'}`}
          title="Highlighter"
        >
          <Highlighter className="w-4 h-4" />
        </button>

        {(activeTool === 'pen' || activeTool === 'highlighter') && (
          <button
            onClick={clearDrawingCanvas}
            className="p-1.5 rounded-full text-gray-400 hover:text-rose-400 transition"
            title="Clear Ink"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        <div className="w-px h-5 bg-[#2A2A2A] mx-1" />

        {/* Speaker Notes Toggle */}
        <button
          onClick={() => setShowNotes(!showNotes)}
          className={`p-1.5 rounded-full transition ${showNotes ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          title="Speaker Notes (N)"
        >
          <FileText className="w-4 h-4" />
        </button>

        {/* Slide Overview Grid Toggle */}
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-1.5 rounded-full transition ${showGrid ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          title="Slide Overview Grid (G)"
        >
          <Grid className="w-4 h-4" />
        </button>

        {/* Timers */}
        <div className="flex items-center gap-1.5 text-xs font-mono text-gray-400 px-1 border-l border-[#2A2A2A] ml-1">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span title="Total presentation time">{formatTime(totalSeconds)}</span>
          <span className="opacity-50">/</span>
          <span className="text-gray-300" title="Time on current slide">{formatTime(slideSeconds)}</span>
        </div>

        {/* Exit Fullscreen */}
        <button
          onClick={onExit}
          className="p-1.5 rounded-full bg-[#222] hover:bg-rose-500/20 text-gray-300 hover:text-rose-300 ml-1 transition"
          title="Exit Presentation (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Speaker Notes Window */}
      {showNotes && (
        <div className="absolute top-6 right-6 w-96 max-h-[85vh] bg-[#161616]/95 backdrop-blur-md border border-[#2A2A2A] rounded-xl shadow-2xl p-4 flex flex-col z-40 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#2A2A2A] mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-xs text-white">Speaker Notes</span>
            </div>
            <button onClick={() => setShowNotes(false)} className="text-gray-400 hover:text-white transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 text-xs">
            <div>
              <div className="text-[10px] uppercase font-semibold text-gray-400 mb-1">
                Current Slide Script:
              </div>
              <div className="p-3 bg-[#121212] rounded-lg text-gray-200 leading-relaxed font-sans border border-[#2A2A2A]">
                {currentSlide.script || <em className="text-gray-500">No script provided for this slide.</em>}
              </div>
            </div>

            {nextSlide && (
              <div>
                <div className="text-[10px] uppercase font-semibold text-gray-400 mb-1">
                  Next Slide Preview ({currentIndex + 2}):
                </div>
                <div className="p-2.5 bg-[#121212] rounded-lg border border-[#2A2A2A] text-gray-300">
                  <div className="font-semibold text-xs text-blue-300">{nextSlide.title}</div>
                  <div className="text-[11px] text-gray-400 line-clamp-2 mt-0.5">{nextSlide.script}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Slide Overview Grid Modal */}
      {showGrid && (
        <div className="absolute inset-0 bg-[#0F0F0F]/95 backdrop-blur-md z-40 p-8 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-[#2A2A2A]">
            <h3 className="font-bold text-lg text-white">All Slides Overview ({slides.length})</h3>
            <button onClick={() => setShowGrid(false)} className="p-2 rounded-lg bg-[#222] border border-[#333] text-gray-300 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
            {slides.map((s, idx) => (
              <div
                key={s.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setShowGrid(false);
                }}
                className={`p-2 rounded-lg border-2 cursor-pointer transition-all ${
                  idx === currentIndex ? 'border-blue-500 bg-[#1A1A1A]' : 'border-[#2A2A2A] bg-[#161616] hover:border-[#444]'
                }`}
              >
                <div className="aspect-video bg-[#0F0F0F] rounded flex items-center justify-center p-2 mb-2 text-center border border-[#2A2A2A]">
                  <span className="text-xs font-semibold text-gray-300 line-clamp-2">{s.title || `Slide ${idx + 1}`}</span>
                </div>
                <div className="text-[11px] font-mono text-gray-400 text-center">Slide {idx + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
