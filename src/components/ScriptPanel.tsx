import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
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
  Users,
  Activity,
} from 'lucide-react';
import { Slide, VoiceSettings, Presentation } from '../types/presentation';
import { EDGE_VOICES } from '../constants/voices';
import { getOrGenerateSlideAudio, parseDialogueTurns, previewVoiceSample } from '../services/ttsService';
import { WaveformAnalyzer } from './WaveformAnalyzer';

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
  const [audioDuration, setAudioDuration] = useState<number | null>(slide.audioDuration || null);
  const [analyzedWaveform, setAnalyzedWaveform] = useState<number[] | undefined>(slide.audioWaveformData);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const voiceSettings: VoiceSettings = slide.voiceSettings || presentation.globalVoiceSettings || {
    voice: 'en-US-GuyNeural',
    rate: 1.0,
    pitch: 0,
    volume: 100,
  };

  const selectedVoice = EDGE_VOICES.find((v) => v.id === voiceSettings.voice) || EDGE_VOICES[0];

  const wordCount = slide.script.trim() ? slide.script.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.max(2, Math.round(wordCount / 2.5 / (voiceSettings.rate || 1.0)));

  // Multi-voice dialogue turn detection
  const dialogueTurns = parseDialogueTurns(slide.script || '');
  const uniqueSpeakers = Array.from(new Set(dialogueTurns.map((t) => t.speaker))).filter(Boolean);
  const isDialogue = uniqueSpeakers.length > 1;

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
      if (res.waveform) {
        setAnalyzedWaveform(res.waveform);
      }

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

          {/* Dialogue active indicator chip */}
          {isDialogue && (
            <span className="flex items-center gap-1 text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-medium shadow-sm">
              <Users className="w-3 h-3 text-purple-400" />
              <span>Multi-Voice ({uniqueSpeakers.length} Speakers)</span>
            </span>
          )}
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
        <div className="p-3 flex flex-col gap-2.5">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Left: Script textarea + SSML helpers */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 font-medium">Slide Narration Script:</span>
                {isDialogue && (
                  <span className="text-[10px] text-purple-400 font-mono">
                    {uniqueSpeakers.join(' ↔ ')}
                  </span>
                )}
              </div>
              {/* SSML & Dialogue Tag shortcuts */}
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => insertSSMLTag('\n[Host 1]: ')}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-[#222] hover:bg-purple-900/30 text-purple-300 border border-purple-500/30 font-mono transition flex items-center gap-1"
                  title="Insert Host 1 Dialogue Tag"
                >
                  <Users className="w-2.5 h-2.5 text-purple-400" />
                  <span>+Host 1</span>
                </button>
                <button
                  onClick={() => insertSSMLTag('\n[Host 2]: ')}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-[#222] hover:bg-purple-900/30 text-purple-300 border border-purple-500/30 font-mono transition flex items-center gap-1"
                  title="Insert Host 2 Dialogue Tag"
                >
                  <Users className="w-2.5 h-2.5 text-purple-400" />
                  <span>+Host 2</span>
                </button>
                <button
                  onClick={() => insertSSMLTag('[pause:1s]')}
                  className="text-[10px] px-2 py-0.5 rounded bg-[#222] hover:bg-[#2A2A2A] text-gray-300 border border-[#333] font-mono transition"
                  title="Insert 1 second pause"
                >
                  +1s pause
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
              placeholder="Enter narration or multi-voice dialogue using [Host 1]: and [Host 2]: syntax..."
              className="w-full h-20 bg-[#121212] border border-[#2A2A2A] rounded p-2 text-xs text-gray-100 placeholder-gray-600 outline-none focus:border-blue-600 resize-none font-sans leading-relaxed"
            />
          </div>

          {/* Right: Audio Playback & Voice Selector */}
          <div className="w-full md:w-80 flex flex-col justify-between shrink-0 space-y-2">
            {/* Voice Dropdown */}
            <div>
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[10px] text-gray-400 font-medium">Edge Neural Voice:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => previewVoiceSample(voiceSettings.voice)}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-medium underline flex items-center gap-0.5"
                    title="Audition voice with a short phrase"
                  >
                    <Volume2 className="w-2.5 h-2.5" />
                    <span>Sample</span>
                  </button>
                  <span className="text-[10px] text-gray-500 font-mono">{selectedVoice.lang}</span>
                </div>
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

        {/* Visual Waveform Analyzer: maps voice duration to total slide duration & highlights overtime sections */}
        <div className="mt-1">
          <WaveformAnalyzer
            script={slide.script}
            slideDuration={slide.duration || 8}
            voiceSettings={voiceSettings}
            pronunciationDictionary={presentation.pronunciationDictionary}
            audioDuration={audioDuration}
            audioRef={audioRef}
            isPlaying={isPlaying}
            isLoadingAudio={isLoadingAudio}
            onTogglePlay={handlePlayTTS}
            onUpdateSlideDuration={onUpdateSlideDuration}
            onUpdateSlideVoiceSettings={onUpdateSlideVoiceSettings}
            cachedWaveform={analyzedWaveform}
          />
        </div>
      </div>
    )}
  </div>
);
};
