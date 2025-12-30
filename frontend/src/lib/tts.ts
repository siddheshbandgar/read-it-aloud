/**
 * Text-to-Speech Service
 * Uses Google Cloud TTS (free tier: 1M chars/month)
 * Supports long text by chunking
 */

// Voice styles for Google Cloud TTS
const GOOGLE_VOICES: Record<string, { name: string; languageCode: string; description: string }> = {
    narrator: {
        name: 'en-US-Journey-D',
        languageCode: 'en-US',
        description: 'Natural Narrator - Warm, engaging male voice',
    },
    storyteller: {
        name: 'en-US-Journey-F',
        languageCode: 'en-US',
        description: 'Storyteller - Expressive female voice',
    },
    professional: {
        name: 'en-US-Studio-M',
        languageCode: 'en-US',
        description: 'Professional - Clear, authoritative male',
    },
    podcast_host: {
        name: 'en-US-Studio-O',
        languageCode: 'en-US',
        description: 'Podcast Host - Friendly, conversational',
    },
    calm: {
        name: 'en-US-Neural2-A',
        languageCode: 'en-US',
        description: 'Calm & Relaxed - Soothing female voice',
    },
    confident: {
        name: 'en-US-Neural2-D',
        languageCode: 'en-US',
        description: 'Confident - Strong male voice',
    },
    friendly: {
        name: 'en-US-Neural2-F',
        languageCode: 'en-US',
        description: 'Friendly - Warm female voice',
    },
    deep: {
        name: 'en-US-Neural2-J',
        languageCode: 'en-US',
        description: 'Deep Voice - Rich, deep male voice',
    },
};

// Map voice styles
const VOICE_STYLE_MAP: Record<string, string> = {
    news_anchor: 'professional',
    calm_female: 'calm',
    deep_narrator: 'deep',
    casual_podcast: 'podcast_host',
    energetic: 'storyteller',
    narrator: 'narrator',
    storyteller: 'storyteller',
    professional: 'professional',
    podcast_host: 'podcast_host',
    calm: 'calm',
    confident: 'confident',
    friendly: 'friendly',
    deep: 'deep',
};

export interface TTSResult {
    audio: Buffer;
    duration: number;
}

// Google TTS limit is 5000 bytes, we use 4500 to be safe
const GOOGLE_TTS_CHUNK_SIZE = 4500;

/**
 * Split text into chunks at sentence boundaries
 */
function splitTextIntoChunks(text: string, maxBytes: number): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/);

    let currentChunk = '';

    for (const sentence of sentences) {
        const potentialChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;

        // Check byte length (UTF-8)
        if (Buffer.byteLength(potentialChunk, 'utf8') > maxBytes) {
            if (currentChunk) {
                chunks.push(currentChunk);
                currentChunk = sentence;
            } else {
                // Single sentence is too long, split at word boundary
                const words = sentence.split(' ');
                let wordChunk = '';
                for (const word of words) {
                    const potentialWordChunk = wordChunk ? `${wordChunk} ${word}` : word;
                    if (Buffer.byteLength(potentialWordChunk, 'utf8') > maxBytes) {
                        if (wordChunk) chunks.push(wordChunk);
                        wordChunk = word;
                    } else {
                        wordChunk = potentialWordChunk;
                    }
                }
                if (wordChunk) currentChunk = wordChunk;
            }
        } else {
            currentChunk = potentialChunk;
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk);
    }

    return chunks;
}

/**
 * Generate audio for a single chunk using Google Cloud TTS
 */
async function generateChunkWithGoogle(
    text: string,
    voice: { name: string; languageCode: string },
    apiKey: string
): Promise<Buffer> {
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            input: { text },
            voice: {
                languageCode: voice.languageCode,
                name: voice.name,
            },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: 0.95,
                pitch: 0,
            },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Google TTS error: ${error}`);
    }

    const data = await response.json();
    return Buffer.from(data.audioContent, 'base64');
}

/**
 * Generate audio using Google Cloud TTS (handles long text)
 */
async function generateWithGoogle(
    text: string,
    voiceStyle: string
): Promise<TTSResult> {
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;

    if (!apiKey) {
        throw new Error('GOOGLE_CLOUD_API_KEY not configured');
    }

    const mappedStyle = VOICE_STYLE_MAP[voiceStyle] || 'narrator';
    const voice = GOOGLE_VOICES[mappedStyle] || GOOGLE_VOICES.narrator;

    console.log(`🔊 Google TTS: ${voice.description}`);

    // Split text into chunks if needed
    const chunks = splitTextIntoChunks(text, GOOGLE_TTS_CHUNK_SIZE);
    console.log(`📝 Text split into ${chunks.length} chunks`);

    // Generate audio for all chunks IN PARALLEL (much faster!)
    console.log(`  🎵 Generating ${chunks.length} chunks in parallel...`);
    const audioBuffers = await Promise.all(
        chunks.map(chunk => generateChunkWithGoogle(chunk, voice, apiKey))
    );
    console.log(`  ✅ All chunks generated`);

    // Combine audio buffers (simple concatenation for MP3)
    const combinedAudio = Buffer.concat(audioBuffers.map(buf => new Uint8Array(buf)));

    // Estimate duration (150 words per minute)
    const wordCount = text.split(/\s+/).length;
    const estimatedDuration = (wordCount / 150) * 60;

    console.log(`✅ Google TTS complete: ${combinedAudio.length} bytes, ~${Math.round(estimatedDuration / 60)} min`);

    return {
        audio: combinedAudio,
        duration: estimatedDuration,
    };
}

/**
 * Generate audio using ElevenLabs (fallback - NOT USED due to quota)
 */
async function generateWithElevenLabs(
    text: string,
    voiceStyle: string
): Promise<TTSResult> {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
        throw new Error('ELEVENLABS_API_KEY not configured');
    }

    const ELEVENLABS_VOICES: Record<string, string> = {
        narrator: '21m00Tcm4TlvDq8ikWAM',
        storyteller: 'EXAVITQu4vr4xnSDxMaL',
        professional: 'VR6AewLTigWG4xSOukaG',
        podcast_host: 'TxGEqnHWrfWFTfGW9XjX',
        calm: 'pNInz6obpgDQGcFmaJgB',
        confident: 'yoZ06aMxZJJ28mfd3POQ',
        friendly: 'jBpfuIE2acCO8z3wKNLl',
        deep: 'ErXwobaYiN019PkySvjV',
    };

    const mappedStyle = VOICE_STYLE_MAP[voiceStyle] || 'narrator';
    const voiceId = ELEVENLABS_VOICES[mappedStyle] || ELEVENLABS_VOICES.narrator;

    console.log(`🔊 ElevenLabs: ${mappedStyle}`);

    const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text.slice(0, 5000),
                model_id: 'eleven_turbo_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                },
            }),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`ElevenLabs error: ${error}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    const wordCount = text.split(/\s+/).length;
    const estimatedDuration = (wordCount / 150) * 60;

    console.log(`✅ ElevenLabs complete: ${audioBuffer.length} bytes`);

    return {
        audio: audioBuffer,
        duration: estimatedDuration,
    };
}

/**
 * Main audio generation function
 * Tries Google Cloud TTS first, falls back to ElevenLabs on error
 */
export async function generateAudio(
    text: string,
    voiceStyle: string = 'narrator'
): Promise<TTSResult> {
    console.log(`🎤 TTS: voice=${voiceStyle}, ${text.length} chars, ${text.split(/\s+/).length} words`);

    const googleKey = process.env.GOOGLE_CLOUD_API_KEY;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

    // Try Google Cloud TTS first
    if (googleKey) {
        try {
            return await generateWithGoogle(text, voiceStyle);
        } catch (error: any) {
            console.error('❌ Google TTS failed:', error.message);

            // Fall back to ElevenLabs if available
            if (elevenLabsKey) {
                console.log('⚠️ Falling back to ElevenLabs...');
                try {
                    return await generateWithElevenLabs(text, voiceStyle);
                } catch (elevenError: any) {
                    console.error('❌ ElevenLabs also failed:', elevenError.message);
                    throw new Error(`Both TTS services failed. Google: ${error.message}`);
                }
            }
            throw error;
        }
    }

    // No Google key - try ElevenLabs directly
    if (elevenLabsKey) {
        console.log('⚠️ Using ElevenLabs (Google key not configured)');
        return await generateWithElevenLabs(text, voiceStyle);
    }

    throw new Error('No TTS service configured. Please add GOOGLE_CLOUD_API_KEY to .env.local');
}

// Export voice options for UI
export const VOICE_OPTIONS = Object.entries(GOOGLE_VOICES).map(([key, voice]) => ({
    id: key,
    name: voice.description,
}));
