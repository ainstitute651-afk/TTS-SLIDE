// Audio Music Service: Curated Royalty-Free Background Music with Auto-Ducking
// Uses Web Audio API synthesis for zero-dependency, 100% reliable offline operation

export interface MusicTrack {
  id: string;
  name: string;
  genre: string;
  mood: string;
  tempo: string;
  description: string;
}

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'ambient-flow',
    name: 'Ambient Flow',
    genre: 'Cinematic Ambient',
    mood: 'Peaceful & Thoughtful',
    tempo: 'Slow (75 BPM)',
    description: 'Warm lush harmonic pads with gentle resonant resonance, ideal for corporate overviews and educational talks.',
  },
  {
    id: 'corporate-pulse',
    name: 'Corporate Pulse',
    genre: 'Modern Tech',
    mood: 'Upbeat & Professional',
    tempo: 'Medium (118 BPM)',
    description: 'Crisp rhythmic electronic pulse with subtle marimba bells and driving momentum for pitch decks.',
  },
  {
    id: 'lo-fi-chill',
    name: 'Lo-Fi Chill',
    genre: 'Lo-Fi Beats',
    mood: 'Relaxed & Modern',
    tempo: 'Mellow (85 BPM)',
    description: 'Warm jazzy keyboard chords with gentle vinyl warmth, perfect for product walkthroughs and case studies.',
  },
  {
    id: 'inspirational',
    name: 'Inspirational Rise',
    genre: 'Uplifting Acoustic',
    mood: 'Inspiring & Motivational',
    tempo: 'Moderate (98 BPM)',
    description: 'Ascending melodic harmonies that evoke progress, triumph, and visionary product announcements.',
  },
  {
    id: 'tech-minimal',
    name: 'Tech Minimalist',
    genre: 'Minimal Electronica',
    mood: 'Focused & Sleek',
    tempo: 'Steady (110 BPM)',
    description: 'Ultra-clean digital clicks and warm sub-bass designed to sit seamlessly behind voiceover without distracting.',
  },
];

// Generate an AudioBuffer for a music track of specified duration
export function generateTrackAudioBuffer(
  audioCtx: AudioContext,
  trackId: string,
  totalDurationSec: number = 30
): AudioBuffer {
  const sampleRate = audioCtx.sampleRate;
  const numSamples = Math.floor(sampleRate * Math.max(5, totalDurationSec));
  const buffer = audioCtx.createBuffer(2, numSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // Seeded procedural synthesis according to track personality
  switch (trackId) {
    case 'corporate-pulse':
      synthesizeCorporatePulse(left, right, sampleRate, numSamples);
      break;
    case 'lo-fi-chill':
      synthesizeLoFiChill(left, right, sampleRate, numSamples);
      break;
    case 'inspirational':
      synthesizeInspirational(left, right, sampleRate, numSamples);
      break;
    case 'tech-minimal':
      synthesizeTechMinimal(left, right, sampleRate, numSamples);
      break;
    case 'ambient-flow':
    default:
      synthesizeAmbientFlow(left, right, sampleRate, numSamples);
      break;
  }

  // Smooth fade-in (1.5s) and fade-out (2.0s)
  const fadeInSamples = Math.floor(sampleRate * 1.5);
  const fadeOutSamples = Math.floor(sampleRate * 2.0);
  for (let i = 0; i < numSamples; i++) {
    let env = 1.0;
    if (i < fadeInSamples) {
      env = i / fadeInSamples;
    } else if (i > numSamples - fadeOutSamples) {
      env = (numSamples - i) / fadeOutSamples;
    }
    left[i] *= env;
    right[i] *= env;
  }

  return buffer;
}

// 1. Ambient Flow: Cmaj9 -> Am9 -> Fmaj9 -> G6 chords with slow pad envelope
function synthesizeAmbientFlow(left: Float32Array, right: Float32Array, sampleRate: number, numSamples: number) {
  const chords = [
    [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9
    [110.00, 130.81, 164.81, 196.00, 246.94], // Am9
    [87.31, 130.81, 174.61, 220.00, 261.63],  // Fmaj9
    [98.00, 146.83, 196.00, 246.94, 293.66],  // G6
  ];

  const chordDuration = 5.0; // seconds per chord
  const baseVolume = 0.18;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const chordIdx = Math.floor(t / chordDuration) % chords.length;
    const chordT = (t % chordDuration) / chordDuration;
    const chord = chords[chordIdx];

    // Pad swell envelope
    const env = Math.sin(chordT * Math.PI) * baseVolume;

    let sampleL = 0;
    let sampleR = 0;

    for (let c = 0; c < chord.length; c++) {
      const freq = chord[c];
      // Subtle chorus detuning
      const osc1 = Math.sin(2 * Math.PI * freq * t);
      const osc2 = Math.sin(2 * Math.PI * (freq * 1.002) * t);
      const oscSub = Math.sin(2 * Math.PI * (freq * 0.5) * t) * 0.4;
      sampleL += (osc1 + oscSub) * (0.8 + 0.2 * Math.sin(0.3 * t + c));
      sampleR += (osc2 + oscSub) * (0.8 + 0.2 * Math.cos(0.3 * t + c));
    }

    sampleL /= chord.length;
    sampleR /= chord.length;

    left[i] = sampleL * env;
    right[i] = sampleR * env;
  }
}

// 2. Corporate Pulse: Driving kick, crisp hi-hat tick, and melodic arpeggiated bells
function synthesizeCorporatePulse(left: Float32Array, right: Float32Array, sampleRate: number, numSamples: number) {
  const bpm = 118;
  const beatSec = 60 / bpm;
  const arpNotes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const beatPos = (t % beatSec) / beatSec;
    const sixteenthPos = ((t * 4) % beatSec) / beatSec;

    // Soft electronic kick on beats 1 and 3
    let kick = 0;
    const beatIdx = Math.floor(t / beatSec);
    if (beatIdx % 2 === 0 && beatPos < 0.25) {
      const kickT = beatPos * beatSec;
      const kickFreq = 120 * Math.exp(-kickT * 35) + 45;
      kick = Math.sin(2 * Math.PI * kickFreq * kickT) * Math.exp(-kickT * 15) * 0.25;
    }

    // Hi-hat tick every 16th
    let hat = 0;
    if (sixteenthPos < 0.05) {
      hat = (Math.random() * 2 - 1) * Math.exp(-sixteenthPos * 80) * 0.04;
    }

    // Melodic bell arpeggio
    const arpIdx = Math.floor(t / (beatSec / 2)) % arpNotes.length;
    const arpT = (t % (beatSec / 2));
    const noteFreq = arpNotes[arpIdx];
    const bell = Math.sin(2 * Math.PI * noteFreq * t) * Math.exp(-arpT * 6) * 0.08;

    left[i] = (kick + hat + bell * 0.9);
    right[i] = (kick + hat * 0.8 + bell * 1.1);
  }
}

// 3. Lo-Fi Chill: Warm Rhodes electric piano chords + gentle vinyl flutter
function synthesizeLoFiChill(left: Float32Array, right: Float32Array, sampleRate: number, numSamples: number) {
  const chords = [
    [174.61, 220.00, 261.63, 329.63], // Fmaj7
    [164.81, 196.00, 246.94, 293.66], // Em7
    [146.83, 174.61, 220.00, 261.63], // Dm7
    [130.81, 164.81, 196.00, 246.94], // Cmaj7
  ];

  const chordDuration = 4.0;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const chordIdx = Math.floor(t / chordDuration) % chords.length;
    const chordT = (t % chordDuration);
    const chord = chords[chordIdx];

    // Vinyl crackle simulation
    const crackle = Math.random() < 0.001 ? (Math.random() * 2 - 1) * 0.04 : 0;
    const flutter = 1.0 + 0.003 * Math.sin(2 * Math.PI * 4.5 * t);

    let chordSample = 0;
    for (let c = 0; c < chord.length; c++) {
      const f = chord[c] * flutter;
      const decay = Math.exp(-chordT * 0.8);
      chordSample += (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) * decay;
    }
    chordSample = (chordSample / chord.length) * 0.15;

    left[i] = chordSample + crackle;
    right[i] = chordSample * 0.95 + crackle * 0.7;
  }
}

// 4. Inspirational Rise: Arpeggiated melody with rich harmonies
function synthesizeInspirational(left: Float32Array, right: Float32Array, sampleRate: number, numSamples: number) {
  const melodyNotes = [293.66, 369.99, 440.00, 587.33, 440.00, 369.99]; // D Major scale
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const noteIdx = Math.floor(t / 0.35) % melodyNotes.length;
    const noteT = t % 0.35;
    const freq = melodyNotes[noteIdx];

    const note = Math.sin(2 * Math.PI * freq * t) * Math.exp(-noteT * 5) * 0.12;
    const pad = Math.sin(2 * Math.PI * 146.83 * t) * 0.05 + Math.sin(2 * Math.PI * 220.00 * t) * 0.04;

    left[i] = note * 0.8 + pad;
    right[i] = note * 1.1 + pad;
  }
}

// 5. Tech Minimalist: Sleek digital pulse and clean rhythmic pattern
function synthesizeTechMinimal(left: Float32Array, right: Float32Array, sampleRate: number, numSamples: number) {
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const step = Math.floor(t * 8) % 16;
    const stepT = (t * 8) % 1;

    let click = 0;
    if (step % 2 === 0 && stepT < 0.03) {
      click = Math.sin(2 * Math.PI * 1200 * t) * Math.exp(-stepT * 120) * 0.06;
    }

    const bassFreq = (step < 8) ? 65.41 : 73.42;
    const bass = Math.sin(2 * Math.PI * bassFreq * t) * 0.08;

    left[i] = click + bass;
    right[i] = click * 0.7 + bass;
  }
}

// Live Preview Manager for UI
let previewAudioCtx: AudioContext | null = null;
let previewSourceNode: AudioBufferSourceNode | null = null;
let previewGainNode: GainNode | null = null;

export function playLiveTrackPreview(trackId: string, volume: number = 30): void {
  stopLiveTrackPreview();
  if (trackId === 'none') return;

  try {
    previewAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const buffer = generateTrackAudioBuffer(previewAudioCtx, trackId, 30);

    previewSourceNode = previewAudioCtx.createBufferSource();
    previewSourceNode.buffer = buffer;
    previewSourceNode.loop = true;

    previewGainNode = previewAudioCtx.createGain();
    previewGainNode.gain.setValueAtTime((volume / 100) * 0.4, previewAudioCtx.currentTime);

    previewSourceNode.connect(previewGainNode);
    previewGainNode.connect(previewAudioCtx.destination);
    previewSourceNode.start();
  } catch (err) {
    console.warn('Track preview failed:', err);
  }
}

export function stopLiveTrackPreview(): void {
  try {
    if (previewSourceNode) {
      previewSourceNode.stop();
      previewSourceNode.disconnect();
      previewSourceNode = null;
    }
    if (previewAudioCtx && previewAudioCtx.state !== 'closed') {
      previewAudioCtx.close();
      previewAudioCtx = null;
    }
  } catch (err) {
    // Graceful cleanup
  }
}
