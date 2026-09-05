import React, { useState } from 'react';
import {
  X,
  Video,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Download,
  Clock,
  Sparkles,
  AlertCircle,
  Music,
  FileText,
  Smartphone,
  Tv,
  Square as SquareIcon,
  Film,
  Subtitles,
} from 'lucide-react';
import {
  Presentation,
  VideoExportOptions,
  ExportProgress,
  AspectRatio,
  BackgroundMusicSettings,
  CaptionSettings,
} from '../types/presentation';
import { VideoExporter } from '../services/videoExporter';
import { generateSRT, generateVTT, downloadSubtitleFile } from '../services/subtitleService';
import { MUSIC_TRACKS } from '../services/audioMusicService';

interface VideoExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  presentation: Presentation;
  onUpdatePresentationSettings?: (settings: Partial<Presentation>) => void;
}

export const VideoExportModal: React.FC<VideoExportModalProps> = ({
  isOpen,
  onClose,
  presentation,
  onUpdatePresentationSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'audio-motion' | 'subtitles'>('video');
  const [resolution, setResolution] = useState<'720p' | '1080p' | '1440p' | '4K'>('1080p');
  const [frameRate, setFrameRate] = useState<24 | 30 | 60>(30);
  const [bitrate, setBitrate] = useState<number>(5000000);
  const [format, setFormat] = useState<'webm' | 'mp4'>('mp4');

  // Video Production & Motion Settings
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(presentation.aspectRatio || '16:9');
  const [enableKenBurns, setEnableKenBurns] = useState<boolean>(true);
  const [musicTrack, setMusicTrack] = useState<string>(presentation.backgroundMusic?.trackId || 'ambient-flow');
  const [musicVolume, setMusicVolume] = useState<number>(presentation.backgroundMusic?.volume ?? 30);
  const [musicDucking, setMusicDucking] = useState<boolean>(presentation.backgroundMusic?.ducking ?? true);

  const [enableCaptions, setEnableCaptions] = useState<boolean>(presentation.captionSettings?.enabled ?? true);
  const [captionStyle, setCaptionStyle] = useState<CaptionSettings['style']>(
    presentation.captionSettings?.style || 'karaoke-highlight'
  );
  const [captionColor, setCaptionColor] = useState<string>(
    presentation.captionSettings?.highlightColor || '#FBBF24'
  );

  const [isExporting, setIsExporting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [exporterInstance, setExporterInstance] = useState<VideoExporter | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setErrorMessage(null);
    setDownloadUrl(null);
    setIsExporting(true);
    setIsPaused(false);

    const exporter = new VideoExporter();
    setExporterInstance(exporter);

    // Apply active production settings to presentation clone
    const configuredPresentation: Presentation = {
      ...presentation,
      aspectRatio,
      backgroundMusic: {
        trackId: musicTrack,
        volume: musicVolume,
        ducking: musicDucking,
        duckingAmount: 80,
        loop: true,
      },
      captionSettings: {
        enabled: enableCaptions,
        style: captionStyle,
        position: 'bottom',
        highlightColor: captionColor,
      },
      slides: presentation.slides.map((s) => ({
        ...s,
        kenBurns: enableKenBurns ? (s.kenBurns || { enabled: true, effect: 'subtle-drift', intensity: 'subtle' }) : undefined,
      })),
    };

    // Save updated settings back if callback provided
    onUpdatePresentationSettings?.({
      aspectRatio,
      backgroundMusic: configuredPresentation.backgroundMusic,
      captionSettings: configuredPresentation.captionSettings,
    });

    const options: VideoExportOptions = {
      format,
      resolution,
      frameRate,
      bitrate,
      includeAudio: true,
      includeCaptions: enableCaptions,
    };

    try {
      const videoBlob = await exporter.exportVideo(configuredPresentation, options, (p) => {
        setProgress(p);
      });

      const url = URL.createObjectURL(videoBlob);
      setDownloadUrl(url);

      // Auto trigger download
      const a = document.createElement('a');
      a.href = url;
      const cleanTitle = presentation.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'presentation';
      a.download = `${cleanTitle}_${aspectRatio.replace(':', 'x')}_${resolution}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      if (err.message !== 'Export cancelled by user') {
        console.error('Export error:', err);
        setErrorMessage(err.message || 'Failed to export video');
      }
    } finally {
      setIsExporting(false);
      setExporterInstance(null);
    }
  };

  const handleCancelExport = () => {
    if (exporterInstance) {
      exporterInstance.cancel();
    }
    setIsExporting(false);
    setProgress(null);
  };

  const handleTogglePause = () => {
    if (!exporterInstance) return;
    if (isPaused) {
      exporterInstance.resume();
      setIsPaused(false);
    } else {
      exporterInstance.pause();
      setIsPaused(true);
    }
  };

  const handleDownloadSRT = () => {
    const srtContent = generateSRT(presentation);
    downloadSubtitleFile(srtContent, presentation.title, 'srt');
  };

  const handleDownloadVTT = () => {
    const vttContent = generateVTT(presentation);
    downloadSubtitleFile(vttContent, presentation.title, 'vtt');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#2A2A2A] bg-[#121212] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-100">SlideCast Production Studio</h3>
              <p className="text-[11px] text-gray-400">Cinematic Motion, Music Auto-Ducking & Captions</p>
            </div>
          </div>
          {!isExporting && (
            <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-white transition">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Navigation Tabs (when not exporting) */}
        {!isExporting && !downloadUrl && (
          <div className="flex items-center border-b border-[#2A2A2A] bg-[#141414] px-4 gap-2 text-xs">
            <button
              onClick={() => setActiveTab('video')}
              className={`py-2 px-3 border-b-2 font-medium flex items-center gap-1.5 transition ${
                activeTab === 'video'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Format & Quality</span>
            </button>
            <button
              onClick={() => setActiveTab('audio-motion')}
              className={`py-2 px-3 border-b-2 font-medium flex items-center gap-1.5 transition ${
                activeTab === 'audio-motion'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Music & Captions</span>
            </button>
            <button
              onClick={() => setActiveTab('subtitles')}
              className={`py-2 px-3 border-b-2 font-medium flex items-center gap-1.5 transition ${
                activeTab === 'subtitles'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Subtitles className="w-3.5 h-3.5" />
              <span>Subtitles (.SRT/.VTT)</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs text-gray-200 overflow-y-auto flex-1">
          {/* Settings Section (when not exporting) */}
          {!isExporting && !downloadUrl && (
            <>
              {/* TAB 1: Format & Quality */}
              {activeTab === 'video' && (
                <div className="space-y-4">
                  {/* Multi-Aspect Ratio Selection */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Aspect Ratio & Delivery Channel
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setAspectRatio('16:9')}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          aspectRatio === '16:9'
                            ? 'border-blue-500 bg-blue-600/20 text-blue-400 shadow'
                            : 'border-[#2A2A2A] bg-[#121212] hover:bg-[#1E1E1E] text-gray-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs text-white mb-0.5">
                          <Tv className="w-3.5 h-3.5 text-blue-400" />
                          <span>16:9 Landscape</span>
                        </div>
                        <div className="text-[10px] text-gray-400">YouTube, Keynotes & Desktop (1920×1080)</div>
                      </button>

                      <button
                        onClick={() => setAspectRatio('9:16')}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          aspectRatio === '9:16'
                            ? 'border-blue-500 bg-blue-600/20 text-blue-400 shadow'
                            : 'border-[#2A2A2A] bg-[#121212] hover:bg-[#1E1E1E] text-gray-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs text-white mb-0.5">
                          <Smartphone className="w-3.5 h-3.5 text-pink-400" />
                          <span>9:16 Vertical</span>
                        </div>
                        <div className="text-[10px] text-gray-400">Instagram Reels, TikTok & Shorts (1080×1920)</div>
                      </button>

                      <button
                        onClick={() => setAspectRatio('1:1')}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          aspectRatio === '1:1'
                            ? 'border-blue-500 bg-blue-600/20 text-blue-400 shadow'
                            : 'border-[#2A2A2A] bg-[#121212] hover:bg-[#1E1E1E] text-gray-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs text-white mb-0.5">
                          <SquareIcon className="w-3.5 h-3.5 text-amber-400" />
                          <span>1:1 Square</span>
                        </div>
                        <div className="text-[10px] text-gray-400">LinkedIn & Instagram Feeds (1080×1080)</div>
                      </button>
                    </div>
                  </div>

                  {/* Resolution */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Target Resolution
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['720p', '1080p', '1440p', '4K'] as const).map((res) => (
                        <button
                          key={res}
                          onClick={() => setResolution(res)}
                          className={`py-2 px-2 rounded-lg border text-center font-semibold transition-all ${
                            resolution === res
                              ? 'border-blue-500 bg-blue-600/20 text-blue-400 shadow'
                              : 'border-[#2A2A2A] bg-[#121212] hover:bg-[#1E1E1E] text-gray-400'
                          }`}
                        >
                          <div className="text-xs">{res}</div>
                          <div className="text-[9px] opacity-70 font-normal">
                            {res === '720p' && (aspectRatio === '9:16' ? '720×1280' : aspectRatio === '1:1' ? '720×720' : '1280×720')}
                            {res === '1080p' && (aspectRatio === '9:16' ? '1080×1920' : aspectRatio === '1:1' ? '1080×1080' : '1920×1080')}
                            {res === '1440p' && (aspectRatio === '9:16' ? '1440×2560' : aspectRatio === '1:1' ? '1440×1440' : '2560×1440')}
                            {res === '4K' && (aspectRatio === '9:16' ? '2160×3840' : aspectRatio === '1:1' ? '2160×2160' : '3840×2160')}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frame Rate & Bitrate */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                        Frame Rate
                      </label>
                      <select
                        value={frameRate}
                        onChange={(e) => setFrameRate(Number(e.target.value) as any)}
                        className="w-full bg-[#121212] border border-[#2A2A2A] rounded-lg px-2.5 py-2 text-gray-200 outline-none focus:border-blue-600"
                      >
                        <option value={24}>24 FPS (Cinematic Motion)</option>
                        <option value={30}>30 FPS (Standard)</option>
                        <option value={60}>60 FPS (Ultra Smooth)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                        Bitrate Quality
                      </label>
                      <select
                        value={bitrate}
                        onChange={(e) => setBitrate(Number(e.target.value))}
                        className="w-full bg-[#121212] border border-[#2A2A2A] rounded-lg px-2.5 py-2 text-gray-200 outline-none focus:border-blue-600"
                      >
                        <option value={2500000}>2.5 Mbps (Fast / Compact)</option>
                        <option value={5000000}>5.0 Mbps (Recommended)</option>
                        <option value={8000000}>8.0 Mbps (High Quality)</option>
                        <option value={12000000}>12.0 Mbps (Maximum Fidelity)</option>
                      </select>
                    </div>
                  </div>

                  {/* Format Selection */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Container Format
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setFormat('mp4')}
                        className={`py-2 px-3 rounded-lg border text-left font-medium transition-all ${
                          format === 'mp4'
                            ? 'border-blue-500 bg-blue-600/20 text-blue-400'
                            : 'border-[#2A2A2A] bg-[#121212] hover:bg-[#1E1E1E] text-gray-400'
                        }`}
                      >
                        <div className="font-semibold text-xs text-white">MP4 (H.264 / AAC)</div>
                        <div className="text-[10px] text-gray-400">Universal compatibility across all players</div>
                      </button>
                      <button
                        onClick={() => setFormat('webm')}
                        className={`py-2 px-3 rounded-lg border text-left font-medium transition-all ${
                          format === 'webm'
                            ? 'border-blue-500 bg-blue-600/20 text-blue-400'
                            : 'border-[#2A2A2A] bg-[#121212] hover:bg-[#1E1E1E] text-gray-400'
                        }`}
                      >
                        <div className="font-semibold text-xs text-white">WebM (VP9 / Opus)</div>
                        <div className="text-[10px] text-gray-400">Modern browser streaming</div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Audio & Motion Production */}
              {activeTab === 'audio-motion' && (
                <div className="space-y-4">
                  {/* Ken Burns Subtle Pan & Zoom */}
                  <div className="bg-[#121212] border border-[#2A2A2A] rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <div>
                          <div className="font-bold text-xs text-white">Ken Burns / Subtle Pan & Zoom</div>
                          <div className="text-[10px] text-gray-400">Gentle cinematic camera motion to keep video viewers engaged</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={enableKenBurns}
                        onChange={(e) => setEnableKenBurns(e.target.checked)}
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Background Music with Auto-Ducking */}
                  <div className="bg-[#121212] border border-[#2A2A2A] rounded-lg p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-blue-400" />
                        <div>
                          <div className="font-bold text-xs text-white">Royalty-Free Background Music</div>
                          <div className="text-[10px] text-gray-400">Curated procedural tracks with intelligent auto-ducking</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-gray-400 uppercase mb-1">Track Selection</label>
                        <select
                          value={musicTrack}
                          onChange={(e) => setMusicTrack(e.target.value)}
                          className="w-full bg-[#181818] border border-[#2A2A2A] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-600"
                        >
                          <option value="none">No Background Music</option>
                          {MUSIC_TRACKS.map((t) => (
                            <option key={t.id} value={t.id}>{t.name} ({t.genre})</option>
                          ))}
                        </select>
                      </div>

                      {musicTrack !== 'none' && (
                        <div>
                          <div className="flex justify-between text-[10px] text-gray-400 uppercase mb-1">
                            <span>Track Volume</span>
                            <span className="font-mono text-blue-400">{musicVolume}%</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="80"
                            value={musicVolume}
                            onChange={(e) => setMusicVolume(Number(e.target.value))}
                            className="w-full accent-blue-600 mt-1"
                          />
                        </div>
                      )}
                    </div>

                    {musicTrack !== 'none' && (
                      <div className="flex items-center justify-between pt-2 border-t border-[#222] text-xs">
                        <div>
                          <span className="text-gray-300 font-medium">Auto-Ducking Feature</span>
                          <p className="text-[10px] text-gray-400">Automatically lowers music volume while AI voice is speaking</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={musicDucking}
                          onChange={(e) => setMusicDucking(e.target.checked)}
                          className="w-4 h-4 accent-blue-600 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  {/* Animated Karaoke Captions */}
                  <div className="bg-[#121212] border border-[#2A2A2A] rounded-lg p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Subtitles className="w-4 h-4 text-emerald-400" />
                        <div>
                          <div className="font-bold text-xs text-white">Animated Karaoke / Social Captions</div>
                          <div className="text-[10px] text-gray-400">Dynamic word-by-word highlighted captions burned into the video</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={enableCaptions}
                        onChange={(e) => setEnableCaptions(e.target.checked)}
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                      />
                    </div>

                    {enableCaptions && (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#222]">
                        <div>
                          <label className="block text-[10px] text-gray-400 uppercase mb-1">Caption Animation Style</label>
                          <select
                            value={captionStyle}
                            onChange={(e) => setCaptionStyle(e.target.value as any)}
                            className="w-full bg-[#181818] border border-[#2A2A2A] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-600"
                          >
                            <option value="karaoke-highlight">Karaoke Word Highlight</option>
                            <option value="bounce-pop">Bounce Pop (Shorts/TikTok)</option>
                            <option value="minimal-pill">Minimal Dark Pill</option>
                            <option value="classic-sub">Classic Clean Subtitle</option>
                          </select>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase mb-1">
                            <span>Highlight Accent</span>
                            <span className="font-mono">{captionColor}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={captionColor}
                              onChange={(e) => setCaptionColor(e.target.value)}
                              className="w-8 h-8 rounded border border-[#333] bg-transparent cursor-pointer"
                            />
                            <div className="flex gap-1">
                              {['#FBBF24', '#38BDF8', '#34D399', '#F43F5E', '#A855F7'].map((c) => (
                                <button
                                  key={c}
                                  onClick={() => setCaptionColor(c)}
                                  className="w-5 h-5 rounded-full border border-black/40 shadow-sm"
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: Direct Subtitles Export (.SRT / .VTT) */}
              {activeTab === 'subtitles' && (
                <div className="space-y-4">
                  <div className="bg-[#121212] border border-[#2A2A2A] rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white">Closed Caption Subtitle Files</h4>
                        <p className="text-[11px] text-gray-400">Download time-synchronized subtitle files ready for YouTube, Vimeo, or LMS upload</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={handleDownloadSRT}
                        className="p-3 rounded-lg bg-[#181818] hover:bg-[#222] border border-[#333] text-left transition flex items-center justify-between group"
                      >
                        <div>
                          <div className="font-bold text-xs text-white group-hover:text-blue-400 transition">Download .SRT</div>
                          <div className="text-[10px] text-gray-400">SubRip standard subtitle format</div>
                        </div>
                        <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition" />
                      </button>

                      <button
                        onClick={handleDownloadVTT}
                        className="p-3 rounded-lg bg-[#181818] hover:bg-[#222] border border-[#333] text-left transition flex items-center justify-between group"
                      >
                        <div>
                          <div className="font-bold text-xs text-white group-hover:text-emerald-400 transition">Download .VTT</div>
                          <div className="text-[10px] text-gray-400">HTML5 WebVTT standard format</div>
                        </div>
                        <Download className="w-4 h-4 text-gray-400 group-hover:text-emerald-400 transition" />
                      </button>
                    </div>

                    {/* Preview first few captions */}
                    <div className="mt-3 pt-3 border-t border-[#222]">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">Live Script Caption Preview:</span>
                      <div className="mt-1.5 max-h-36 overflow-y-auto bg-[#0A0A0A] p-2 rounded border border-[#222] font-mono text-[11px] text-gray-300 space-y-1">
                        {presentation.slides.map((s, idx) => (
                          <div key={idx} className="truncate">
                            <span className="text-blue-400 font-bold">Slide {idx + 1}: </span>
                            <span>{s.script || '(No script narration entered)'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary info */}
              <div className="p-3 bg-[#121212] border border-[#2A2A2A] rounded-lg flex items-center justify-between text-gray-400">
                <span>Aspect Ratio: <strong className="text-white">{aspectRatio}</strong></span>
                <span>Music: <strong className="text-blue-400 capitalize">{musicTrack.replace('-', ' ')}</strong></span>
                <span>Captions: <strong className={enableCaptions ? 'text-emerald-400' : 'text-gray-500'}>{enableCaptions ? 'Active' : 'Off'}</strong></span>
              </div>
            </>
          )}

          {/* Export in progress display */}
          {isExporting && progress && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-200 capitalize">
                  {progress.status === 'preparing' && 'Preloading assets & synthesizing voiceover...'}
                  {progress.status === 'rendering' && `Rendering slide ${progress.currentSlide} of ${progress.totalSlides}...`}
                  {progress.status === 'encoding' && 'Finalizing video container...'}
                </span>
                <span className="font-mono font-bold text-blue-400 text-sm">{progress.percent}%</span>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full bg-[#121212] border border-[#2A2A2A] rounded-full h-3 overflow-hidden p-0.5">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                <span>Frame {progress.currentFrame} / {progress.totalFrames}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>ETA: ~{progress.estimatedSecondsLeft}s</span>
                </span>
              </div>

              {/* Pause / Resume & Cancel Controls */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={handleTogglePause}
                  className="px-3 py-1.5 rounded-lg bg-[#222] hover:bg-[#2A2A2A] border border-[#333] text-gray-200 text-xs flex items-center gap-1.5 transition"
                >
                  {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>
                <button
                  onClick={handleCancelExport}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs transition"
                >
                  Cancel Export
                </button>
              </div>
            </div>
          )}

          {/* Success Download Screen */}
          {downloadUrl && (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-white">Video Rendered Successfully!</h4>
              <p className="text-gray-400 text-xs">
                Your video has been recorded with synced narration, {aspectRatio} aspect ratio, and audio production.
              </p>

              <div className="flex justify-center gap-2 pt-3">
                <a
                  href={downloadUrl}
                  download={`${presentation.title || 'presentation'}_${aspectRatio.replace(':', 'x')}.${format}`}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Video</span>
                </a>
                <button
                  onClick={() => setDownloadUrl(null)}
                  className="px-3 py-2 rounded-lg bg-[#222] hover:bg-[#2A2A2A] border border-[#333] text-gray-200 text-xs font-medium transition"
                >
                  Export Again
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!isExporting && !downloadUrl && (
          <div className="px-5 py-3 border-t border-[#2A2A2A] bg-[#121212] flex items-center justify-between shrink-0">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={handleStartExport}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Render & Export {aspectRatio} Video</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

