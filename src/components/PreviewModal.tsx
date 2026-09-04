import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import { Presentation } from '../types/presentation';
import { renderCompleteSlide } from '../services/canvasRenderer';
import { getOrGenerateSlideAudio } from '../services/ttsService';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  presentation: Presentation;
  onOpenExportModal: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  presentation,
  onOpenExportModal,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<any>(null);

  const slides = presentation.slides;
  const currentSlide = slides[currentSlideIndex];

  if (!isOpen) return null;

  // Render current slide on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentSlide) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderCompleteSlide(
      ctx,
      currentSlide,
      currentSlideIndex,
      slides.length,
      presentation.masterSlide,
      1920,
      1080
    );
  }, [currentSlideIndex, currentSlide, slides.length, presentation.masterSlide]);

  // Audio Playback & Auto-Advance Logic
  useEffect(() => {
    if (!isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    let isMounted = true;

    const playCurrentSlide = async () => {
      const slide = slides[currentSlideIndex];
      const voiceSettings = slide.voiceSettings || presentation.globalVoiceSettings;

      let slideTime = Math.max(3, slide.duration || 5);

      if (slide.script && slide.script.trim()) {
        try {
          setIsLoadingAudio(true);
          const audioResult = await getOrGenerateSlideAudio(
            slide.script,
            voiceSettings,
            presentation.pronunciationDictionary
          );

          if (!isMounted) return;

          if (!audioRef.current) {
            audioRef.current = new Audio();
          }
          audioRef.current.src = audioResult.blobUrl;
          audioRef.current.muted = isMuted;
          await audioRef.current.play();

          slideTime = Math.max(slide.duration || 3, audioResult.duration + (slide.paddingDuration ?? 1.0));
        } catch (e) {
          console.warn('Audio play error in preview:', e);
        } finally {
          if (isMounted) setIsLoadingAudio(false);
        }
      }

      // Schedule next slide
      timerRef.current = setTimeout(() => {
        if (!isMounted) return;
        if (currentSlideIndex < slides.length - 1) {
          setCurrentSlideIndex((prev) => prev + 1);
        } else {
          setIsPlaying(false);
          setCurrentSlideIndex(0);
        }
      }, slideTime * 1000);
    };

    playCurrentSlide();

    return () => {
      isMounted = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, [isPlaying, currentSlideIndex, slides, presentation, isMuted]);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-3 border-b border-[#2A2A2A] bg-[#121212] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-gray-100">Live Presentation Preview</span>
            <span className="text-xs text-blue-400 font-mono">
              Slide {currentSlideIndex + 1} of {slides.length}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 16:9 Canvas Stage */}
        <div className="bg-[#0F0F0F] flex items-center justify-center p-4">
          <div className="w-full aspect-video rounded-lg overflow-hidden shadow-2xl border border-[#2A2A2A] relative">
            <canvas
              ref={canvasRef}
              width={1920}
              height={1080}
              className="w-full h-full object-contain"
            />
            {isLoadingAudio && (
              <div className="absolute top-3 right-3 bg-blue-950/80 border border-blue-800/60 text-blue-200 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow">
                <div className="w-2.5 h-2.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span>Loading Voiceover...</span>
              </div>
            )}
          </div>
        </div>

        {/* Subtitle / Script Box */}
        {currentSlide.script && (
          <div className="px-6 py-2 bg-[#121212] border-t border-[#2A2A2A] text-center">
            <p className="text-xs text-gray-300 italic font-sans max-w-2xl mx-auto line-clamp-2">
              "{currentSlide.script}"
            </p>
          </div>
        )}

        {/* Player Controls Footer */}
        <div className="px-6 py-3 border-t border-[#2A2A2A] bg-[#121212] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (audioRef.current) audioRef.current.muted = !isMuted;
                setIsMuted(!isMuted);
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white transition"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Center Playback */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentSlideIndex((i) => Math.max(0, i - 1))}
              disabled={currentSlideIndex === 0}
              className="p-2 rounded-full hover:bg-[#222] text-gray-300 disabled:opacity-30 transition"
              title="Previous Slide"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 transition-transform active:scale-95"
              title={isPlaying ? 'Pause' : 'Play Presentation'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white translate-x-0.5" />}
            </button>

            <button
              onClick={() => setCurrentSlideIndex((i) => Math.min(slides.length - 1, i + 1))}
              disabled={currentSlideIndex === slides.length - 1}
              className="p-2 rounded-full hover:bg-[#222] text-gray-300 disabled:opacity-30 transition"
              title="Next Slide"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Right Export Button */}
          <button
            onClick={() => {
              onClose();
              onOpenExportModal();
            }}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Export to Video</span>
          </button>
        </div>
      </div>
    </div>
  );
};
