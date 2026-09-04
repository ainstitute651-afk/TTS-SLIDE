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
} from 'lucide-react';
import { Presentation, VideoExportOptions, ExportProgress } from '../types/presentation';
import { VideoExporter } from '../services/videoExporter';

interface VideoExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  presentation: Presentation;
}

export const VideoExportModal: React.FC<VideoExportModalProps> = ({
  isOpen,
  onClose,
  presentation,
}) => {
  const [resolution, setResolution] = useState<'720p' | '1080p' | '1440p' | '4K'>('1080p');
  const [frameRate, setFrameRate] = useState<24 | 30 | 60>(30);
  const [bitrate, setBitrate] = useState<number>(5000000);
  const [format, setFormat] = useState<'webm' | 'mp4'>('mp4');

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

    const options: VideoExportOptions = {
      format,
      resolution,
      frameRate,
      bitrate,
      includeAudio: true,
    };

    try {
      const videoBlob = await exporter.exportVideo(presentation, options, (p) => {
        setProgress(p);
      });

      const url = URL.createObjectURL(videoBlob);
      setDownloadUrl(url);

      // Auto trigger download
      const a = document.createElement('a');
      a.href = url;
      const cleanTitle = presentation.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'presentation';
      a.download = `${cleanTitle}_${resolution}_${frameRate}fps.${format}`;
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

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2A2A2A] bg-[#121212] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-100">Export Video Presentation</h3>
              <p className="text-[11px] text-gray-400">1080p Canvas + Edge TTS Narration Sync</p>
            </div>
          </div>
          {!isExporting && (
            <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-white transition">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs text-gray-200">
          {/* Settings Section (when not exporting) */}
          {!isExporting && !downloadUrl && (
            <>
              {/* Resolution */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Resolution
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
                        {res === '720p' && '1280×720'}
                        {res === '1080p' && '1920×1080'}
                        {res === '1440p' && '2560×1440'}
                        {res === '4K' && '3840×2160'}
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
                    <option value={24}>24 FPS (Cinematic)</option>
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
                    <option value={2500000}>2.5 Mbps (Compact)</option>
                    <option value={5000000}>5.0 Mbps (Recommended)</option>
                    <option value={8000000}>8.0 Mbps (High Quality)</option>
                    <option value={12000000}>12.0 Mbps (Maximum)</option>
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
                    <div className="text-[10px] text-gray-400">Best compatibility across devices</div>
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
                    <div className="text-[10px] text-gray-400">Fast modern web compression</div>
                  </button>
                </div>
              </div>

              {/* Summary info */}
              <div className="p-3 bg-[#121212] border border-[#2A2A2A] rounded-lg flex items-center justify-between text-gray-400">
                <span>Total Slides: <strong className="text-white">{presentation.slides.length}</strong></span>
                <span>Transitions: <strong className="text-white">Active</strong></span>
                <span>Audio Engine: <strong className="text-blue-400">Edge TTS</strong></span>
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
              <h4 className="font-bold text-base text-white">Video Generated Successfully!</h4>
              <p className="text-gray-400 text-xs">
                Your video has been recorded with synchronized AI narration.
              </p>

              <div className="flex justify-center gap-2 pt-3">
                <a
                  href={downloadUrl}
                  download={`${presentation.title || 'presentation'}.${format}`}
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
          <div className="px-5 py-3 border-t border-[#2A2A2A] bg-[#121212] flex items-center justify-between">
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
              <span>Render & Export Video</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
