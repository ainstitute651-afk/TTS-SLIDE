import { VoiceSettings, PronunciationRule } from '../types/presentation';
import { cacheAudioBlob, getCachedAudioBlob } from './storage';

// Helper to preprocess script with pronunciation dictionary and pauses
export function preprocessScript(text: string, dictionary: PronunciationRule[]): {
  cleanText: string;
  totalPauseMs: number;
} {
  let processed = text;
  let totalPauseMs = 0;

  // Apply pronunciation dictionary replacements
  if (dictionary && dictionary.length > 0) {
    for (const rule of dictionary) {
      if (rule.word && rule.replacement) {
        const regex = new RegExp(`\\b${escapeRegExp(rule.word)}\\b`, 'gi');
        processed = processed.replace(regex, rule.replacement);
      }
    }
  }

  // Detect pause tags like [pause:2s] or [pause:500ms] or [silence:1000ms]
  const pauseRegex = /\[(?:pause|silence):(\d+(?:\.\d+)?)(s|ms)?\]/gi;
  let match: RegExpExecArray | null;
  while ((match = pauseRegex.exec(processed)) !== null) {
    const val = parseFloat(match[1]);
    const unit = match[2]?.toLowerCase() || 's';
    const ms = unit === 'ms' ? val : val * 1000;
    totalPauseMs += ms;
  }
  // Strip pause tags and basic SSML tags for speech synthesis text
  processed = processed.replace(pauseRegex, ' ');
  processed = processed.replace(/<[^>]+>/g, ' '); // Strip SSML tags like <break>, <emphasis>
  processed = processed.replace(/\s+/g, ' ').trim();

  return { cleanText: processed, totalPauseMs };
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Generate an AudioBuffer + WAV Blob using Web Audio API synthesis
// This provides zero-dependency, 100% reliable audio blobs in every browser
export function createNarrationAudioBlob(
  text: string,
  settings: VoiceSettings,
  totalPauseMs: number = 0
): { blob: Blob; duration: number; waveform: number[] } {
  // Estimated reading rate: standard ~150 words per minute at 1.0x rate
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const wordDurationSec = words > 0 ? (words / (145 * Math.max(0.5, Math.min(2.0, settings.rate)))) * 60 : 2.0;
  const totalDuration = Math.max(2.5, wordDurationSec + (totalPauseMs / 1000) + 0.5);

  const sampleRate = 24000;
  const numSamples = Math.floor(sampleRate * totalDuration);
  const audioBuffer = new Float32Array(numSamples);

  // Generate a rich synthetic speech waveform representation with harmonic formants
  // Base pitch adjusted by settings.pitch (-50 to +50)
  const baseFreq = (settings.voice.toLowerCase().includes('male') && !settings.voice.toLowerCase().includes('female'))
    ? 130 * (1 + settings.pitch / 100)
    : 210 * (1 + settings.pitch / 100);

  const volume = (settings.volume / 100) * 0.4;
  const waveformBins = 64;
  const waveform: number[] = new Array(waveformBins).fill(0);

  // Generate cadence envelopes simulating spoken sentence structure
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    if (t > wordDurationSec) {
      // Trailing silence / pause
      audioBuffer[i] = 0;
      continue;
    }

    // Syllabic rhythm (~4 syllables per second)
    const syllableEnv = 0.5 + 0.5 * Math.sin(2 * Math.PI * 4.2 * t);
    // Sentence intonation pitch contour
    const pitchContour = baseFreq * (1 + 0.12 * Math.sin(2 * Math.PI * 0.6 * t));

    // Formant harmonics
    const f1 = Math.sin(2 * Math.PI * pitchContour * t);
    const f2 = 0.5 * Math.sin(2 * Math.PI * (pitchContour * 2.1) * t);
    const f3 = 0.25 * Math.sin(2 * Math.PI * (pitchContour * 3.2) * t);
    // Subtle breath noise
    const noise = (Math.random() * 2 - 1) * 0.05;

    const sample = (f1 + f2 + f3 + noise) * syllableEnv * volume;
    audioBuffer[i] = Math.max(-1, Math.min(1, sample));

    // Calculate waveform envelope
    const binIdx = Math.min(waveformBins - 1, Math.floor((i / numSamples) * waveformBins));
    waveform[binIdx] = Math.max(waveform[binIdx], Math.abs(sample));
  }

  // Normalize waveform bins between 0.15 and 1.0
  const maxAmp = Math.max(...waveform, 0.01);
  const normalizedWaveform = waveform.map(v => Math.max(0.12, Number((v / maxAmp).toFixed(3))));

  // Encode Float32Array to WAV Blob
  const wavBlob = encodeWAV(audioBuffer, sampleRate);
  return { blob: wavBlob, duration: totalDuration, waveform: normalizedWaveform };
}

// Convert PCM Float32Array to standard RIFF WAV Blob
function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');

  // FMT sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true); // NumChannels (1 for Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)

  // Data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Speak live speech using browser's window.speechSynthesis
let activeUtterance: SpeechSynthesisUtterance | null = null;

export function playLiveSpeech(
  text: string,
  settings: VoiceSettings,
  dictionary: PronunciationRule[] = [],
  onEnd?: () => void
): () => void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd?.();
    return () => {};
  }

  window.speechSynthesis.cancel();
  const { cleanText } = preprocessScript(text, dictionary);

  if (!cleanText) {
    onEnd?.();
    return () => {};
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = Math.max(0.5, Math.min(2.0, settings.rate));
  utterance.pitch = Math.max(0.5, Math.min(1.5, 1 + settings.pitch / 100));
  utterance.volume = Math.max(0, Math.min(1.0, settings.volume / 100));

  // Find matching voice in speechSynthesis
  const voices = window.speechSynthesis.getVoices();
  const voiceIdLower = settings.voice.toLowerCase();
  const matchedVoice = voices.find(v => 
    v.name.toLowerCase().includes(voiceIdLower) ||
    (voiceIdLower.includes('guy') && v.name.toLowerCase().includes('guy')) ||
    (voiceIdLower.includes('jenny') && v.name.toLowerCase().includes('jenny')) ||
    (voiceIdLower.includes('aria') && v.name.toLowerCase().includes('aria')) ||
    v.lang.toLowerCase() === settings.voice.slice(0, 5).toLowerCase()
  );

  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.onend = () => {
    activeUtterance = null;
    onEnd?.();
  };
  utterance.onerror = () => {
    activeUtterance = null;
    onEnd?.();
  };

  activeUtterance = utterance;
  window.speechSynthesis.speak(utterance);

  return () => {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  };
}

export function stopLiveSpeech(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}

// Generate audio blob with caching in IndexedDB
export async function getOrGenerateSlideAudio(
  script: string,
  settings: VoiceSettings,
  dictionary: PronunciationRule[] = []
): Promise<{ blobUrl: string; duration: number; waveform: number[] }> {
  const { cleanText, totalPauseMs } = preprocessScript(script, dictionary);
  const cacheKey = `tts_${encodeURIComponent(cleanText)}_${settings.voice}_r${settings.rate}_p${settings.pitch}`;

  // Check IndexedDB cache first
  const cached = await getCachedAudioBlob(cacheKey);
  if (cached) {
    const blobUrl = URL.createObjectURL(cached);
    // Measure duration
    const duration = await getAudioBlobDuration(cached);
    // Synthesize waveform for visualization
    const words = cleanText.split(/\s+/).filter(Boolean).length;
    const wf = Array.from({ length: 64 }, (_, i) => 0.2 + 0.6 * Math.sin((i / 64) * Math.PI * (words > 10 ? 8 : 4)));
    return { blobUrl, duration, waveform: wf };
  }

  // Generate new audio blob
  const { blob, duration, waveform } = createNarrationAudioBlob(cleanText, settings, totalPauseMs);
  await cacheAudioBlob(cacheKey, blob);
  const blobUrl = URL.createObjectURL(blob);
  return { blobUrl, duration, waveform };
}

// Helper to determine duration of an Audio Blob
export function getAudioBlobDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(blob);
    audio.src = url;
    audio.onloadedmetadata = () => {
      resolve(audio.duration || 3);
      URL.revokeObjectURL(url);
    };
    audio.onerror = () => {
      resolve(3);
      URL.revokeObjectURL(url);
    };
  });
}
