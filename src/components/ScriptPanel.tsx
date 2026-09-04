import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Play,
  Square,
  Volume2,
  Settings2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Clock,
  BookOpen,
  VolumeX,
  Gauge,
  Music,
} from 'lucide-react';
import { Slide, VoiceSettings, Presentation } from '../types/presentation';
import { EDGE_VOICES } from '../constants/voices';
import { getOrGenerateSlideAudio } from '../services/ttsService';

interface ScriptPanelProps {
  slide: Slide;
  presentation: Presentation;
  onUpdateSlideScript: (script: string) => void;
  onUpdateSlideVoiceSettings: (settings: VoiceSettings) => void;
  onUpdateSlideDuration: (duration: number) => void;
  onOpenPronunciationModal: () => void;
}

export const ScriptPanel: React.FC<ScriptPanelProps> = ({
  slide,
  presentation,
  onUpdateSlideScript,
  onUpdateSlideVoiceSettings,
  onUpdateSlideDuration,
  onOpenPronunciationModal,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const voiceSettings: VoiceSettings = slide.voiceSettings || presentation.globalVoiceSettings || {
    voice: 'en-US-GuyNeural',
    rate: 1.0,
    pitch: 0,
    volume: 100,
  };

  const selectedVoice = EDGE_VOICES.find((v) => v.id === voiceSettings.voice) || EDGE_VOICES[0];

  const wordCount = slide.script.trim() ? slide.script.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.max(2, Math.round(wordCount / 2.5 / (voiceSettings.rate || 1.0)));

  // Handle Play/Stop TTS
  const handlePlayTTS = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    if (!slide.script || !slide.script.trim()) return;

    try {
      setIsLoadingAudio(true);
      const res = await getOrGenerateSlideAudio(
        slide.script,
        voiceSettings,
        presentation.pronunciationDictionary
      );
      setAudioDuration(res.duration);

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.src = res.blobUrl;
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };

      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Audio playback error:', err);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Waveform canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const renderWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = isPlaying ? '#38bdf8' : '#475569';

      const bars = 36;
      const barWidth = width / bars;

      for (let i = 0; i < bars; i++) {
        let amp = 0.2;
        if (isPlaying) {
          amp = 0.3 + 0.6 * Math.abs(Math.sin(phase + i * 0.4));
        }
        const barHeight = Math.max(3, height * 0.7 * amp);
        const x = i * barWidth + barWidth / 4;
        const y = centerY - barHeight / 2;

        ctx.fillStyle = isPlaying ? (i % 2 === 0 ? '#2563eb' : '#60a5fa') : '#2a2a2a';
        ctx.fillRect(x, y, barWidth / 2, barHeight);
      }

      if (isPlaying) {
        phase += 0.15;
      }
      animFrameRef.current = requestAnimationFrame(renderWave);
    };

    renderWave();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  // Insert SSML helper tag
  const insertSSMLTag = (tag: string) => {
    const newScript = slide.script ? `${slide.script} ${tag}` : tag;
    onUpdateSlideScript(newScript);
  };

  // Auto-sync slide duration with audio duration + padding
  const handleAutoSyncDuration = () => {
    const duration = audioDuration || estimatedSeconds;
    const padding = slide.paddingDuration ?? 1.0;
    onUpdateSlideDuration(Math.round(duration + padding));
  };

  return (
    <div className="border-t border-[#2A2A2A] bg-[#161616] flex flex-col select-none shrink-0 z-15 text-gray-300">
      {/* Header bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-9 px-4 flex items-center justify-between cursor-pointer hover:bg-[#1E1E1E] transition-colors border-b border-[#2A2A2A]"
      >
        <div className="flex items-center gap-2">
          <Mic className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">
            AI Voiceover & Script
          </span>
          <span className="text-[11px] text-gray-500 font-mono hidden sm:inline">
            ({wordCount} words • ~{estimatedSeconds}s)
          </span>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {/* Quick Voice Label */}
          <span className="text-[11px] text-gray-500 font-mono hidden md:inline truncate max-w-[150px]">
            {selectedVoice.name.split('(')[0].trim()} ({selectedVoice.gender})
          </span>

          <button
            onClick={() => setShowVoiceSettings(!showVoiceSettings)}
            className={`p-1 rounded text-xs flex items-center gap-1 transition ${
              showVoiceSettings ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40' : 'text-gray-400 hover:text-white'
            }`}
            title="Voice Parameters"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-gray-400 hover:text-white"
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {isExpanded && (
        <div className="p-3 flex flex-col md:flex-row gap-3">
          {/* Left: Script textarea + SSML helpers */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-400 font-medium">Slide Narration Script:</span>
              {/* SSML Tag shortcuts */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => insertSSMLTag('[pause:1s]')}
                  className="text-[10px] px-2 py-0.5 rounded bg-[#222] hover:bg-[#2A2A2A] text-gray-300 border border-[#333] font-mono transition"
                  title="Insert 1 second pause"
                >
                  +1s pause
                </button>
                <button
                  onClick={() => insertSSMLTag('[pause:2s]')}
                  className="text-[10px] px-2 py-0.5 rounded bg-[#222] hover:bg-[#2A2A2A] text-gray-300 border border-[#333] font-mono transition"
                  title="Insert 2 second pause"
                >
                  +2s pause
                </button>
                <button
                  onClick={() => insertSSMLTag('[emphasis]')}
                  className="text-[10px] px-2 py-0.5 rounded bg-[#222] hover:bg-[#2A2A2A] text-gray-300 border border-[#333] font-mono hidden sm:inline transition"
                >
                  +emphasis
                </button>
                <button
                  onClick={onOpenPronunciationModal}
                  className="text-[10px] px-2 py-0.5 rounded bg-[#222] hover:bg-[#2A2A2A] text-gray-300 border border-[#333] flex items-center gap-1 transition"
                  title="Custom Pronunciation Dictionary"
                >
                  <BookOpen className="w-2.5 h-2.5 text-blue-400" />
                  <span>Dictionary</span>
                </button>
              </div>
            </div>

            <textarea
              value={slide.script}
              onChange={(e) => onUpdateSlideScript(e.target.value)}
              placeholder="Enter what the AI voice will say during this slide..."
              className="w-full h-20 bg-[#121212] border border-[#2A2A2A] rounded p-2 text-xs text-gray-100 placeholder-gray-600 outline-none focus:border-blue-600 resize-none font-sans leading-relaxed"
            />
          </div>

          {/* Right: Audio Playback & Voice Selector */}
          <div className="w-full md:w-80 flex flex-col justify-between shrink-0 space-y-2">
            {/* Waveform Canvas & Play button */}
            <div className="flex items-center gap-2 bg-[#121212] border border-[#2A2A2A] rounded p-2">
              <button
                onClick={handlePlayTTS}
                disabled={isLoadingAudio || !slide.script.trim()}
                className={`p-2 rounded-full font-semibold transition-all shadow-md shrink-0 ${
                  isPlaying
                    ? 'bg-rose-600 text-white hover:bg-rose-500'
                    : 'bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 shadow-blue-900/30'
                }`}
                title={isPlaying ? 'Stop Audio' : 'Preview Audio'}
              >
                {isLoadingAudio ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Square className="w-4 h-4 fill-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white translate-x-0.5" />
                )}
              </button>

              <canvas
                ref={canvasRef}
                width={150}
                height={28}
                className="flex-1 h-7 rounded"
              />

              <div className="text-right shrink-0">
                <div className="text-xs font-mono font-bold text-gray-200">
                  {audioDuration ? `${audioDuration.toFixed(1)}s` : `~${estimatedSeconds}s`}
                </div>
                <button
                  onClick={handleAutoSyncDuration}
                  className="text-[9px] text-blue-400 hover:underline block"
                  title="Set slide duration to match audio length"
                >
                  Sync slide
                </button>
              </div>
            </div>

            {/* Voice Dropdown */}
            <div>
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[10px] text-gray-400 font-medium">Edge Neural Voice:</span>
                <span className="text-[10px] text-blue-400 font-mono">{selectedVoice.lang}</span>
              </div>
              <select
                value={voiceSettings.voice}
                onChange={(e) => {
                  onUpdateSlideVoiceSettings({ ...voiceSettings, voice: e.target.value });
                }}
                className="w-full bg-[#222] border border-[#333] rounded px-2 py-1 text-xs text-gray-100 outline-none focus:border-blue-600 truncate"
              >
                {EDGE_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.gender}) • {v.languageName}
                  </option>
                ))}
              </select>
            </div>

            {/* Expandable voice parameters (Rate, Pitch, Volume) */}
            {showVoiceSettings && (
              <div className="bg-[#121212] border border-[#2A2A2A] p-2.5 rounded space-y-2 text-[11px] animate-in fade-in slide-in-from-top-1">
                <div>
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Speed Rate</span>
                    <span className="font-mono text-gray-200">{voiceSettings.rate || 1.0}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={voiceSettings.rate || 1.0}
                    onChange={(e) => onUpdateSlideVoiceSettings({ ...voiceSettings, rate: Number(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Pitch Contour</span>
                    <span className="font-mono text-gray-200">{voiceSettings.pitch || 0}%</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    step="5"
                    value={voiceSettings.pitch || 0}
                    onChange={(e) => onUpdateSlideVoiceSettings({ ...voiceSettings, pitch: Number(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
