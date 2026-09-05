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

// Dialogue Turn structure for Multi-Voice Dialogue
export interface DialogueTurn {
  speaker: string;
  text: string;
  speakerIndex: number;
}

export function parseDialogueTurns(rawText: string): DialogueTurn[] {
  const lines = rawText.split('\n');
  const turns: DialogueTurn[] = [];
  const speakerMap = new Map<string, number>();

  const lineRegex = /^(?:\[([\w\s-]+)\]:?|([\w\s-]+):\s+)(.*)$/;
  let hasExplicitSpeaker = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(lineRegex);
    if (match) {
      hasExplicitSpeaker = true;
      const speakerName = (match[1] || match[2]).trim();
      const content = match[3]?.trim() || '';
      if (!speakerMap.has(speakerName.toLowerCase())) {
        speakerMap.set(speakerName.toLowerCase(), speakerMap.size);
      }
      turns.push({
        speaker: speakerName,
        text: content,
        speakerIndex: speakerMap.get(speakerName.toLowerCase()) || 0,
      });
    } else {
      if (turns.length > 0) {
        turns[turns.length - 1].text += ' ' + trimmed;
      } else {
        turns.push({
          speaker: 'Speaker 1',
          text: trimmed,
          speakerIndex: 0,
        });
      }
    }
  }

  if (hasExplicitSpeaker && speakerMap.size > 1) {
    return turns;
  }

  return [{
    speaker: 'Speaker 1',
    text: rawText,
    speakerIndex: 0,
  }];
}

// Generate an AudioBuffer + WAV Blob using Web Audio API synthesis
// Supports single voice or multi-voice dialogue sequences
export function createNarrationAudioBlob(
  text: string,
  settings: VoiceSettings,
  totalPauseMs: number = 0
): { blob: Blob; duration: number; waveform: number[] } {
  const turns = parseDialogueTurns(text);

  // Calculate total reading duration
  let totalWords = 0;
  turns.forEach(t => {
    totalWords += t.text.trim().split(/\s+/).filter(Boolean).length;
  });

  const wordDurationSec = totalWords > 0 ? (totalWords / (145 * Math.max(0.5, Math.min(2.0, settings.rate)))) * 60 : 2.0;
  const conversationGaps = Math.max(0, turns.length - 1) * 0.4;
  const totalDuration = Math.max(2.5, wordDurationSec + (totalPauseMs / 1000) + conversationGaps + 0.5);

  const sampleRate = 24000;
  const numSamples = Math.floor(sampleRate * totalDuration);
  const audioBuffer = new Float32Array(numSamples);

  const isBaseMale = settings.voice.toLowerCase().includes('male') && !settings.voice.toLowerCase().includes('female');
  const baseFreq = isBaseMale ? 130 * (1 + settings.pitch / 100) : 210 * (1 + settings.pitch / 100);
  const altFreq = isBaseMale ? 220 * (1 + settings.pitch / 100) : 135 * (1 + settings.pitch / 100);

  const volume = (settings.volume / 100) * 0.4;
  const waveformBins = 64;
  const waveform: number[] = new Array(waveformBins).fill(0);

  // Synthesize each dialogue turn with appropriate voice pitch
  let currentSampleIdx = 0;

  turns.forEach((turn) => {
    const turnWords = turn.text.trim().split(/\s+/).filter(Boolean).length;
    const turnDuration = Math.max(0.8, (turnWords / (145 * Math.max(0.5, Math.min(2.0, settings.rate)))) * 60);
    const turnSamples = Math.floor(turnDuration * sampleRate);

    // Alternate voice character for co-hosts / second speaker
    const turnBaseFreq = turn.speakerIndex % 2 === 0 ? baseFreq : altFreq;

    for (let i = 0; i < turnSamples && currentSampleIdx < numSamples; i++, currentSampleIdx++) {
      const t = i / sampleRate;
      const syllableEnv = 0.5 + 0.5 * Math.sin(2 * Math.PI * 4.2 * t);
      const pitchContour = turnBaseFreq * (1 + 0.12 * Math.sin(2 * Math.PI * 0.6 * t));

      const f1 = Math.sin(2 * Math.PI * pitchContour * t);
      const f2 = 0.5 * Math.sin(2 * Math.PI * (pitchContour * 2.1) * t);
      const f3 = 0.25 * Math.sin(2 * Math.PI * (pitchContour * 3.2) * t);
      const noise = (Math.random() * 2 - 1) * 0.05;

      const sample = (f1 + f2 + f3 + noise) * syllableEnv * volume;
      audioBuffer[currentSampleIdx] = Math.max(-1, Math.min(1, sample));

      const binIdx = Math.min(waveformBins - 1, Math.floor((currentSampleIdx / numSamples) * waveformBins));
      waveform[binIdx] = Math.max(waveform[binIdx], Math.abs(sample));
    }

    // Add conversational breath pause between speakers
    const pauseSamples = Math.floor(sampleRate * 0.35);
    for (let p = 0; p < pauseSamples && currentSampleIdx < numSamples; p++, currentSampleIdx++) {
      audioBuffer[currentSampleIdx] = 0;
    }
  });

  // Normalize waveform bins between 0.12 and 1.0
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

// Safe voice loader that waits for onvoiceschanged if list is empty
export function getBrowserVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return resolve([]);
    }
    const current = window.speechSynthesis.getVoices();
    if (current && current.length > 0) {
      return resolve(current);
    }
    const handleVoices = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoices);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', handleVoices);
    // Timeout fallback after 500ms
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoices);
      resolve(window.speechSynthesis.getVoices());
    }, 500);
  });
}

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

  const turns = parseDialogueTurns(cleanText);
  let cancelled = false;
  let currentTurnIndex = 0;

  getBrowserVoices().then((voices) => {
    if (cancelled) return;

    const voiceIdLower = settings.voice.toLowerCase();
    const isMale = voiceIdLower.includes('male') || voiceIdLower.includes('guy') || voiceIdLower.includes('ryan') || voiceIdLower.includes('eric');

    const matchedVoice =
      voices.find(
        (v) =>
          v.name.toLowerCase().includes(voiceIdLower) ||
          (voiceIdLower.includes('guy') && v.name.toLowerCase().includes('guy')) ||
          (voiceIdLower.includes('jenny') && v.name.toLowerCase().includes('jenny')) ||
          (voiceIdLower.includes('aria') && v.name.toLowerCase().includes('aria'))
      ) ||
      voices.find((v) => v.lang.toLowerCase() === settings.voice.slice(0, 5).toLowerCase()) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0] ||
      null;

    const alternateVoice =
      voices.find(
        (v) =>
          v !== matchedVoice &&
          (isMale ? v.name.toLowerCase().includes('female') : v.name.toLowerCase().includes('male'))
      ) ||
      voices.find((v) => v !== matchedVoice && v.lang.startsWith('en')) ||
      null;

    function speakNextTurn() {
      if (cancelled || currentTurnIndex >= turns.length) {
        activeUtterance = null;
        onEnd?.();
        return;
      }

      const turn = turns[currentTurnIndex];
      const isAltSpeaker = turn.speakerIndex % 2 !== 0;

      const utterance = new SpeechSynthesisUtterance(turn.text);
      utterance.rate = Math.max(0.5, Math.min(2.0, settings.rate));
      const pitchOffset = isAltSpeaker ? 20 : 0;
      utterance.pitch = Math.max(0.5, Math.min(1.6, 1 + (settings.pitch + pitchOffset) / 100));
      utterance.volume = Math.max(0, Math.min(1.0, settings.volume / 100));

      if (isAltSpeaker && alternateVoice) {
        utterance.voice = alternateVoice;
      } else if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => {
        currentTurnIndex++;
        setTimeout(speakNextTurn, 250);
      };

      utterance.onerror = () => {
        currentTurnIndex++;
        speakNextTurn();
      };

      activeUtterance = utterance;
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    }

    speakNextTurn();
  });

  return () => {
    cancelled = true;
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

// Extract authentic visual waveform bins from an Audio Blob
export async function extractWaveformFromBlob(blob: Blob, bins = 64): Promise<number[]> {
  try {
    const arrayBuffer = await blob.slice().arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const rawData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(rawData.length / bins);
    const waveform: number[] = [];

    for (let i = 0; i < bins; i++) {
      let sum = 0;
      const start = i * blockSize;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[start + j] || 0);
      }
      waveform.push(sum / (blockSize || 1));
    }
    audioCtx.close();
    const max = Math.max(...waveform, 0.01);
    return waveform.map((v) => Math.max(0.12, Math.min(1.0, Number((v / max).toFixed(3)))));
  } catch {
    return Array.from({ length: bins }, (_, i) => 0.2 + 0.6 * Math.sin((i / bins) * Math.PI * 4));
  }
}

// Preview a short voice sample for the user
export async function previewVoiceSample(voiceId: string): Promise<void> {
  const sampleText = "Hello! I am your AI presentation narrator.";
  try {
    const res = await fetch(`/api/tts?voice=${encodeURIComponent(voiceId)}&text=${encodeURIComponent(sampleText)}`);
    if (res.ok) {
      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      await audio.play();
      return;
    }
  } catch {
    // Fallback to Web Speech API
  }
  playLiveSpeech(sampleText, { voice: voiceId, rate: 1.0, pitch: 0, volume: 100 });
}

// Generate real audio blob with caching in IndexedDB
export async function getOrGenerateSlideAudio(
  script: string,
  settings: VoiceSettings,
  dictionary: PronunciationRule[] = []
): Promise<{ blobUrl: string; duration: number; waveform: number[] }> {
  const { cleanText, totalPauseMs } = preprocessScript(script, dictionary);
  const cacheKey = `tts_v2_${encodeURIComponent(cleanText)}_${settings.voice}_r${settings.rate}_p${settings.pitch}`;

  // 1. Check IndexedDB cache first
  const cached = await getCachedAudioBlob(cacheKey);
  if (cached) {
    const blobUrl = URL.createObjectURL(cached);
    const duration = await getAudioBlobDuration(cached);
    const waveform = await extractWaveformFromBlob(cached);
    return { blobUrl, duration, waveform };
  }

  // 2. Fetch genuine Microsoft Edge Neural TTS / Google TTS from /api/tts
  const turns = parseDialogueTurns(cleanText);
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: cleanText,
        voice: settings.voice,
        rate: settings.rate,
        pitch: settings.pitch,
        dialogueTurns: turns.length > 1 ? turns : undefined,
      }),
    });

    if (res.ok) {
      const blob = await res.blob();
      if (blob.size > 100) {
        await cacheAudioBlob(cacheKey, blob);
        const blobUrl = URL.createObjectURL(blob);
        const duration = await getAudioBlobDuration(blob);
        const waveform = await extractWaveformFromBlob(blob);
        return { blobUrl, duration, waveform };
      }
    }
  } catch (err) {
    console.warn('[TTS] Server API fetch failed, using fallback synthesizer:', err);
  }

  // 3. Fallback: Generate local synthesized blob
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
