import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to convert 16-bit raw PCM to WAV format if needed
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitDepth = 16): Buffer {
  const byteRate = (sampleRate * numChannels * bitDepth) / 8;
  const blockAlign = (numChannels * bitDepth) / 8;
  const dataSize = pcmBuffer.length;
  const wavBuffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  wavBuffer.write('RIFF', 0);
  wavBuffer.writeUInt32LE(36 + dataSize, 4);
  wavBuffer.write('WAVE', 8);

  // fmt subchunk
  wavBuffer.write('fmt ', 12);
  wavBuffer.writeUInt32LE(16, 16); // 16 for PCM
  wavBuffer.writeUInt16LE(1, 20); // 1 for PCM
  wavBuffer.writeUInt16LE(numChannels, 22);
  wavBuffer.writeUInt32LE(sampleRate, 24);
  wavBuffer.writeUInt32LE(byteRate, 28);
  wavBuffer.writeUInt16LE(blockAlign, 32);
  wavBuffer.writeUInt16LE(bitDepth, 34);

  // data subchunk
  wavBuffer.write('data', 36);
  wavBuffer.writeUInt32LE(dataSize, 40);

  pcmBuffer.copy(wavBuffer, 44);
  return wavBuffer;
}

// API endpoint for Text-to-Speech using Gemini API
app.post('/api/tts', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'Missing GEMINI_API_KEY in environment variables.',
      });
    }

    const {
      text,
      voice = 'Fenrir',
      model = 'gemini-3.8-flash-lite-tts',
      style = 'Deep, tense, emotional and dramatic WWII espionage mystery narrative in Vietnamese, measured moderate pace, intense suspense and historical gravity',
    } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text prompt is required.' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const response = await ai.models.generateContent({
      model: model || 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text,
              speechMetadata: {
                style,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Fenrir' },
          },
        },
      },
    });

    const candidatePart = response.candidates?.[0]?.content?.parts?.[0];
    const rawAudioBase64 = candidatePart?.inlineData?.data;
    const returnedMimeType = candidatePart?.inlineData?.mimeType || 'audio/pcm;rate=24000';

    if (!rawAudioBase64) {
      return res.status(502).json({
        error: 'No audio stream returned from Gemini TTS. Please try a different voice or shorter text.',
      });
    }

    const rawBuffer = Buffer.from(rawAudioBase64, 'base64');

    // Check if the data is already a WAV file (starts with 'RIFF')
    let finalAudioBuffer: Buffer;
    let finalMimeType = 'audio/wav';

    if (rawBuffer.length >= 4 && rawBuffer.subarray(0, 4).toString('ascii') === 'RIFF') {
      finalAudioBuffer = rawBuffer;
    } else {
      // Parse sample rate if present in returnedMimeType, e.g. "rate=24000"
      let sampleRate = 24000;
      const rateMatch = returnedMimeType.match(/rate=(\d+)/);
      if (rateMatch && rateMatch[1]) {
        sampleRate = parseInt(rateMatch[1], 10);
      }
      finalAudioBuffer = pcmToWav(rawBuffer, sampleRate, 1, 16);
    }

    const audioBase64 = finalAudioBuffer.toString('base64');
    const audioDataUrl = `data:${finalMimeType};base64,${audioBase64}`;

    return res.json({
      success: true,
      audioBase64,
      audioDataUrl,
      mimeType: finalMimeType,
      byteLength: finalAudioBuffer.length,
      voice,
      model,
    });
  } catch (error: any) {
    console.error('Error generating TTS:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate voice audio.',
    });
  }
});

// Setup Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
