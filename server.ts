import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { Communicate } from 'edge-tts-universal';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper: Split long text into sentence chunks under maxChars
function splitTextIntoChunks(text: string, maxChars: number = 180): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    if ((currentChunk + ' ' + trimmed).length > maxChars) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = trimmed;
    } else {
      currentChunk = currentChunk ? `${currentChunk} ${trimmed}` : trimmed;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  return chunks.length > 0 ? chunks : [text];
}

// Google Translate TTS fallback
async function synthesizeGoogleTTS(text: string, lang = 'en'): Promise<Buffer> {
  const chunks = splitTextIntoChunks(text, 150);
  const buffers: Buffer[] = [];

  for (const chunk of chunks) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${encodeURIComponent(lang)}&client=tw-ob`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });
    if (!res.ok) {
      throw new Error(`Google TTS request failed: ${res.status}`);
    }
    const ab = await res.arrayBuffer();
    buffers.push(Buffer.from(ab));
  }

  return Buffer.concat(buffers);
}

// Edge TTS Synthesizer
async function synthesizeEdgeTTS(
  text: string,
  voice: string = 'en-US-GuyNeural',
  rate: number = 1.0,
  pitch: number = 0
): Promise<Buffer> {
  // Format rate and pitch for edge-tts
  const ratePercent = Math.round((rate - 1.0) * 100);
  const rateStr = ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`;
  const pitchStr = pitch >= 0 ? `+${Math.round(pitch)}Hz` : `${Math.round(pitch)}Hz`;

  const comm = new Communicate(text, {
    voice,
    rate: rateStr,
    pitch: pitchStr,
  });

  const chunks: Buffer[] = [];
  for await (const chunk of comm.stream()) {
    if (chunk.type === 'audio' && chunk.data) {
      chunks.push(chunk.data);
    }
  }

  if (chunks.length === 0) {
    throw new Error('No audio chunks received from Edge TTS');
  }

  return Buffer.concat(chunks);
}

// Combined Synthesizer with Fallback
async function synthesizeSpeech(
  text: string,
  voice: string = 'en-US-GuyNeural',
  rate: number = 1.0,
  pitch: number = 0
): Promise<Buffer> {
  try {
    return await synthesizeEdgeTTS(text, voice, rate, pitch);
  } catch (err: any) {
    console.warn(`[TTS] Edge TTS error for voice ${voice}, falling back to Google TTS:`, err?.message || err);
    // Derive language code from voice ID e.g. "en-US", "es-ES"
    const langCode = voice.split('-').slice(0, 2).join('-') || 'en';
    return await synthesizeGoogleTTS(text, langCode);
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Single or dialogue TTS synthesis endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'en-US-GuyNeural', rate = 1.0, pitch = 0, dialogueTurns } = req.body;

    if (!text && (!dialogueTurns || dialogueTurns.length === 0)) {
      return res.status(400).json({ error: 'Text or dialogueTurns is required' });
    }

    // Handle dialogue turns with distinct voices
    if (Array.isArray(dialogueTurns) && dialogueTurns.length > 0) {
      const turnBuffers: Buffer[] = [];

      for (const turn of dialogueTurns) {
        const turnText = turn.text?.trim();
        if (!turnText) continue;

        // Alternate voice for speaker 2 if needed
        let turnVoice = turn.voice || voice;
        if (turn.speakerIndex && turn.speakerIndex % 2 !== 0 && (!turn.voice || turn.voice === voice)) {
          // If primary is male, use female complementary voice
          if (voice.includes('Guy') || voice.includes('Male') || voice.includes('Christopher') || voice.includes('Eric')) {
            turnVoice = 'en-US-JennyNeural';
          } else {
            turnVoice = 'en-US-GuyNeural';
          }
        }

        const buf = await synthesizeSpeech(turnText, turnVoice, rate, pitch);
        turnBuffers.push(buf);
      }

      if (turnBuffers.length > 0) {
        const combined = Buffer.concat(turnBuffers);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(combined);
      }
    }

    // Standard single synthesis
    const audioBuffer = await synthesizeSpeech(text, voice, rate, pitch);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(audioBuffer);
  } catch (error: any) {
    console.error('[TTS API Error]:', error);
    res.status(500).json({ error: error?.message || 'Failed to synthesize speech' });
  }
});

// Quick GET endpoint for audio preview
app.get('/api/tts', async (req, res) => {
  try {
    const text = (req.query.text as string) || '';
    const voice = (req.query.voice as string) || 'en-US-GuyNeural';
    const rate = parseFloat((req.query.rate as string) || '1.0');
    const pitch = parseFloat((req.query.pitch as string) || '0');

    if (!text.trim()) {
      return res.status(400).json({ error: 'Text query parameter is required' });
    }

    const audioBuffer = await synthesizeSpeech(text, voice, rate, pitch);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(audioBuffer);
  } catch (error: any) {
    console.error('[TTS GET API Error]:', error);
    res.status(500).json({ error: error?.message || 'Failed to synthesize speech' });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SlideCast Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
