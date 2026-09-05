import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Play,
  Square,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Gauge,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { VoiceSettings, PronunciationRule } from '../types/presentation';
import { parseDialogueTurns, preprocessScript } from '../services/ttsService';

interface WaveformAnalyzerProps {
  script: string;
  slideDuration: number; // in seconds
  voiceSettings: VoiceSettings;
  pronunciationDictionary?: PronunciationRule[];
  audioDuration: number | null; // real measured audio duration
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  isLoadingAudio: boolean;
  onTogglePlay: () => void;
  onUpdateSlideDuration: (duration: number) => void;
  onUpdateSlideVoiceSettings: (settings: VoiceSettings) => void;
  cachedWaveform?: number[];
}

export const WaveformAnalyzer: React.FC<WaveformAnalyzerProps> = ({
  script,
  slideDuration,
  voiceSettings,
  pronunciationDictionary = [],
  audioDuration,
  audioRef,
  isPlaying,
  isLoadingAudio,
  onTogglePlay,
  onUpdateSlideDuration,
  onUpdateSlideVoiceSettings,
  cachedWaveform,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [currentPlayTime, setCurrentPlayTime] = useState<number>(0);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [isExpandedView, setIsExpandedView] = useState<boolean>(false);

  // 1. Calculate voice duration
  const estimatedSeconds = useMemo(() => {
    if (!script.trim()) return 0;
    const { cleanText, totalPauseMs } = preprocessScript(script, pronunciationDictionary);
    const turns = parseDialogueTurns(cleanText);
    let totalWords = 0;
    turns.forEach((t) => {
      totalWords += t.text.trim().split(/\s+/).filter(Boolean).length;
    });

    const rate = Math.max(0.5, Math.min(2.0, voiceSettings.rate || 1.0));
    // Standard conversational reading rate: ~145 words/min
    const wordDurationSec = totalWords > 0 ? (totalWords / (145 * rate)) * 60 : 2.0;
    const conversationGaps = Math.max(0, turns.length - 1) * 0.4;
    return Number((wordDurationSec + totalPauseMs / 1000 + conversationGaps).toFixed(1));
  }, [script, voiceSettings.rate, pronunciationDictionary]);

  // Actual or estimated audio length
  const effectiveAudioDuration = audioDuration && audioDuration > 0 ? audioDuration : estimatedSeconds;

  // Comparison metrics
  const difference = Number((effectiveAudioDuration - slideDuration).toFixed(1));
  const isExceeded = difference > 0.2; // 0.2s tolerance
  const overtimeSeconds = Math.max(0, difference);
  const bufferSeconds = Math.max(0, Number((slideDuration - effectiveAudioDuration).toFixed(1)));

  // Maximum timeline duration to show on canvas
  const maxTimelineTime = Math.max(slideDuration, effectiveAudioDuration, 2) * 1.08;

  // Recommended speech rate to fit slide duration if exceeded
  const recommendedRate = useMemo(() => {
    if (!isExceeded || slideDuration <= 0) return null;
    const currentRate = voiceSettings.rate || 1.0;
    const neededRatio = effectiveAudioDuration / slideDuration;
    const newRate = Number((currentRate * neededRatio).toFixed(1));
    return Math.min(2.0, Math.max(0.5, newRate));
  }, [isExceeded, effectiveAudioDuration, slideDuration, voiceSettings.rate]);

  // Track playback time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentPlayTime(audio.currentTime);
    };

    const handleEnded = () => {
      setCurrentPlayTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioRef.current]);

  // Fallback animation if playing with live speech synthesis
  useEffect(() => {
    if (!isPlaying) {
      if (!audioRef.current || audioRef.current.paused) {
        setCurrentPlayTime(0);
      }
      return;
    }

    let startTime = performance.now();
    const tick = (now: number) => {
      if (audioRef.current && !audioRef.current.paused) {
        setCurrentPlayTime(audioRef.current.currentTime);
      } else {
        const elapsed = (now - startTime) / 1000;
        setCurrentPlayTime(Math.min(effectiveAudioDuration, elapsed));
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, effectiveAudioDuration, audioRef]);

  // Generate synthetic waveform bars if no authentic audio blob analyzed yet
  const waveformBins = useMemo(() => {
    if (cachedWaveform && cachedWaveform.length >= 32) {
      return cachedWaveform;
    }
    const bins = 64;
    const arr: number[] = [];
    const seed = script.length || 10;
    for (let i = 0; i < bins; i++) {
      const p = i / bins;
      const base = 0.25 + 0.45 * Math.sin(p * Math.PI * 5 + seed);
      const mod = 0.2 * Math.cos(p * Math.PI * 12);
      arr.push(Math.max(0.12, Math.min(1.0, Math.abs(base + mod))));
    }
    return arr;
  }, [cachedWaveform, script]);

  // Draw Waveform on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    ctx.clearRect(0, 0, width, height);

    if (maxTimelineTime <= 0 || width <= 0 || height <= 0) return;

    // Coordinates mapping
    const timeToX = (t: number) => (t / maxTimelineTime) * width;
    const slideLimitX = timeToX(slideDuration);
    const audioEndX = timeToX(effectiveAudioDuration);

    // 1. Draw Background Zones
    // Safe Slide Zone (0 to slideLimitX)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.fillRect(0, 0, slideLimitX, height);

    // Overtime Danger Zone (slideLimitX to audioEndX if exceeded)
    if (isExceeded && audioEndX > slideLimitX) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
      ctx.fillRect(slideLimitX, 0, audioEndX - slideLimitX, height);

      // Warning Diagonal Stripes
      ctx.save();
      ctx.beginPath();
      ctx.rect(slideLimitX, 0, audioEndX - slideLimitX, height);
      ctx.clip();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.lineWidth = 1;
      const stripeSpacing = 10;
      for (let x = slideLimitX - height; x < audioEndX + height; x += stripeSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + height, height);
        ctx.stroke();
      }
      ctx.restore();
    } else if (!isExceeded && slideLimitX > audioEndX) {
      // Buffer zone (audioEndX to slideLimitX)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.04)';
      ctx.fillRect(audioEndX, 0, slideLimitX - audioEndX, height);
    }

    // 2. Draw Subtle Time Ticks & Grid
    const stepSeconds = maxTimelineTime > 30 ? 5 : maxTimelineTime > 15 ? 2 : 1;
    ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';

    for (let sec = 0; sec <= maxTimelineTime; sec += stepSeconds) {
      const x = timeToX(sec);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, height - 12);
      ctx.lineTo(x, height);
      ctx.stroke();

      if (sec > 0 && Math.abs(x - slideLimitX) > 20) {
        ctx.fillText(`${sec}s`, x, height - 3);
      }
    }

    // 3. Draw Waveform Bars mapped along time
    const totalBars = waveformBins.length;
    const centerY = (height - 14) / 2;
    const maxBarHeight = height - 20;

    for (let i = 0; i < totalBars; i++) {
      // Each bar's time position
      const barTime = (i / totalBars) * effectiveAudioDuration;
      const nextBarTime = ((i + 1) / totalBars) * effectiveAudioDuration;
      const barX = timeToX(barTime);
      const nextBarX = timeToX(nextBarTime);
      const barWidth = Math.max(1.5, (nextBarX - barX) * 0.75);

      const amp = waveformBins[i] || 0.2;
      const barHeight = Math.max(3, amp * maxBarHeight);
      const barY = centerY - barHeight / 2;

      // Color logic based on slide duration limit
      const isPastSlideDuration = barTime > slideDuration;
      const isAlreadyPlayed = currentPlayTime > barTime;

      if (isPastSlideDuration) {
        // EXCEEDED TIME: Hot Red/Crimson
        ctx.fillStyle = isAlreadyPlayed ? '#ff4d6d' : '#ef4444';
      } else {
        // SAFE TIME: Glowing Cyan/Blue
        if (isAlreadyPlayed) {
          ctx.fillStyle = '#60a5fa'; // vibrant played color
        } else {
          ctx.fillStyle = '#2563eb'; // unplayed audio within slide duration
        }
      }

      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(barX, barY, barWidth, barHeight, 1.5) : ctx.rect(barX, barY, barWidth, barHeight);
      ctx.fill();
    }

    // 4. Draw Slide Duration Cutoff Line (Vertical Boundary)
    ctx.save();
    ctx.strokeStyle = isExceeded ? '#ef4444' : '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(slideLimitX, 0);
    ctx.lineTo(slideLimitX, height - 12);
    ctx.stroke();
    ctx.setLineDash([]);

    // Cutoff Pin Header
    ctx.fillStyle = isExceeded ? '#ef4444' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(slideLimitX, 4, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Slide Limit Label
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = slideLimitX > width - 50 ? 'right' : 'center';
    ctx.fillStyle = isExceeded ? '#f87171' : '#7dd3fc';
    ctx.fillText(`${slideDuration}s Slide Limit`, Math.min(width - 5, Math.max(30, slideLimitX)), height - 3);
    ctx.restore();

    // 5. Draw Playhead / Current Play Time
    if (currentPlayTime > 0) {
      const playheadX = timeToX(currentPlayTime);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Playhead head marker
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(playheadX, 3, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Draw Hover Cursor
    if (isHovering && hoverTime !== null) {
      const hoverX = timeToX(hoverTime);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(hoverX, 0);
      ctx.lineTo(hoverX, height - 14);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [
    maxTimelineTime,
    slideDuration,
    effectiveAudioDuration,
    isExceeded,
    waveformBins,
    currentPlayTime,
    isHovering,
    hoverTime,
  ]);

  // Click on waveform to seek audio
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const targetTime = (clickX / rect.width) * maxTimelineTime;

    if (targetTime <= effectiveAudioDuration && audioRef.current) {
      audioRef.current.currentTime = targetTime;
      setCurrentPlayTime(targetTime);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const time = (hoverX / rect.width) * maxTimelineTime;
    setHoverTime(Number(time.toFixed(1)));
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setHoverTime(null);
  };

  // Quick Action: Extend slide to accommodate audio duration + 1s padding
  const handleAutoFitSlide = (extraPadding = 1) => {
    const newDuration = Math.max(3, Math.ceil(effectiveAudioDuration + extraPadding));
    onUpdateSlideDuration(newDuration);
  };

  // Quick Action: Speed up voice rate so narration finishes within slide duration
  const handleApplyRecommendedRate = () => {
    if (recommendedRate) {
      onUpdateSlideVoiceSettings({
        ...voiceSettings,
        rate: recommendedRate,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`border border-[#262626] bg-[#101010] rounded-lg p-2.5 flex flex-col gap-2 transition-all select-none ${
        isExceeded ? 'border-rose-900/50 shadow-rose-950/20 shadow-lg' : 'hover:border-[#333]'
      }`}
    >
      {/* Top Header: Comparison Metrics & Status Badge */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-blue-400" />
            <span>Voice Duration vs Slide Timeline</span>
          </span>

          {/* Status Badge */}
          {isExceeded ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>EXCEEDS BY +{overtimeSeconds.toFixed(1)}s</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              <span>Fits Slide ({bufferSeconds.toFixed(1)}s buffer)</span>
            </span>
          )}
        </div>

        {/* Slide Duration Controls (Inline Stepper) */}
        <div className="flex items-center gap-1.5 bg-[#181818] border border-[#2A2A2A] rounded px-2 py-0.5">
          <span className="text-[10px] text-gray-400 font-medium">Slide Time:</span>
          <button
            onClick={() => onUpdateSlideDuration(Math.max(2, slideDuration - 1))}
            className="p-0.5 hover:bg-[#282828] text-gray-400 hover:text-white rounded transition"
            title="Decrease slide duration by 1s"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-xs font-mono font-bold text-white px-1">{slideDuration}s</span>
          <button
            onClick={() => onUpdateSlideDuration(slideDuration + 1)}
            className="p-0.5 hover:bg-[#282828] text-gray-400 hover:text-white rounded transition"
            title="Increase slide duration by 1s"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Waveform Canvas & Time Mapping Display */}
      <div className="relative group">
        <div className="flex items-center gap-2.5">
          {/* Play / Stop Button */}
          <button
            onClick={onTogglePlay}
            disabled={isLoadingAudio || !script.trim()}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-md transition-all ${
              isPlaying
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-30 shadow-blue-900/30'
            }`}
            title={isPlaying ? 'Stop voice playback' : 'Play & analyze narration'}
          >
            {isLoadingAudio ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Square className="w-3.5 h-3.5 fill-white" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white translate-x-0.5" />
            )}
          </button>

          {/* Interactive Waveform Canvas */}
          <div className="flex-1 relative bg-[#0B0B0B] border border-[#222] rounded overflow-hidden">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="w-full h-14 cursor-pointer block"
              title="Click anywhere to jump playhead"
            />

            {/* Hover timestamp tooltip */}
            {isHovering && hoverTime !== null && (
              <div
                className="absolute top-1 px-1.5 py-0.5 bg-black/85 text-[9px] font-mono text-gray-200 rounded border border-gray-700 pointer-events-none transform -translate-x-1/2"
                style={{ left: `${(hoverTime / maxTimelineTime) * 100}%` }}
              >
                {hoverTime.toFixed(1)}s
              </div>
            )}
          </div>
        </div>

        {/* Time summary bar underneath */}
        <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono px-1 mt-1">
          <div className="flex items-center gap-2">
            <span>
              Voice: <strong className={isExceeded ? 'text-rose-400' : 'text-blue-400'}>{effectiveAudioDuration.toFixed(1)}s</strong>
            </span>
            <span className="text-gray-600">•</span>
            <span>
              Slide: <strong className="text-gray-200">{slideDuration}.0s</strong>
            </span>
            {currentPlayTime > 0 && (
              <>
                <span className="text-gray-600">•</span>
                <span className="text-white">Playing: {currentPlayTime.toFixed(1)}s</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Scale: 0s – {maxTimelineTime.toFixed(0)}s</span>
          </div>
        </div>
      </div>

      {/* Warning Notice & Intelligent One-Click Fixes if Exceeded */}
      {isExceeded && (
        <div className="bg-rose-950/40 border border-rose-800/60 rounded p-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              Narration is <strong>{overtimeSeconds.toFixed(1)}s</strong> longer than slide! Audio will cut off before transition.
            </span>
          </div>

          {/* Quick-Fix Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            <button
              onClick={() => handleAutoFitSlide(1)}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded text-[11px] shadow-sm flex items-center gap-1 transition"
              title="Extend slide duration to fit full audio plus 1 second transition buffer"
            >
              <Zap className="w-3 h-3 text-amber-300" />
              <span>Auto-Fit Slide ({Math.ceil(effectiveAudioDuration + 1)}s)</span>
            </button>

            {recommendedRate && (
              <button
                onClick={handleApplyRecommendedRate}
                className="px-2 py-1 bg-[#222] hover:bg-[#2C2C2C] text-gray-200 border border-rose-700/50 rounded text-[11px] flex items-center gap-1 transition"
                title={`Accelerate voice speed to ${recommendedRate}x to fit in ${slideDuration}s`}
              >
                <Gauge className="w-3 h-3 text-rose-400" />
                <span>Speed to {recommendedRate}x</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Gentle Buffer Notice when Audio easily fits */}
      {!isExceeded && bufferSeconds > 3 && (
        <div className="flex items-center justify-between text-[11px] text-gray-400 bg-[#141414] px-2.5 py-1 rounded border border-[#222]">
          <span className="flex items-center gap-1.5 text-gray-400">
            <Clock className="w-3 h-3 text-blue-400" />
            <span>Extra silence buffer: {bufferSeconds.toFixed(1)}s after narration finishes.</span>
          </span>
          <button
            onClick={() => handleAutoFitSlide(1)}
            className="text-blue-400 hover:text-blue-300 text-[10px] font-medium underline"
            title="Snug slide duration to audio + 1s"
          >
            Snug slide to {Math.ceil(effectiveAudioDuration + 1)}s
          </button>
        </div>
      )}
    </div>
  );
};
