/**
 * ElevenLabs Text-to-Speech Service
 * Generates audio from text using ElevenLabs API
 */

// Voice IDs for different styles
const VOICE_IDS: Record<string, string> = {
    news_anchor: '21m00Tcm4TlvDq8ikWAM',      // Rachel - news anchor
    calm_female: 'EXAVITQu4vr4xnSDxMaL',      // Bella - calm female
    deep_narrator: 'VR6AewLTigWG4xSOukaG',    // Arnold - deep narrator
    casual_podcast: 'TxGEqnHWrfWFTfGW9XjX',   // Josh - casual
    energetic: 'jBpfuIE2acCO8z3wKNLl',        // Elli - energetic
};

export interface TTSResult {
    audio: Buffer;
    duration: number;
}

/**
 * Generate audio from text using ElevenLabs API
 */
export async function generateAudio(
    text: string,
    voiceStyle: string = 'news_anchor'
): Promise<TTSResult> {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
        throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const voiceId = VOICE_IDS[voiceStyle] || VOICE_IDS.news_anchor;

    console.log(`🔊 Generating audio with voice: ${voiceStyle} (${voiceId})`);

    const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text.slice(0, 5000), // Limit text length
                model_id: 'eleven_turbo_v2', // Free tier model
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                },
            }),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`ElevenLabs API error: ${error}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    // Estimate duration (rough: 150 words per minute)
    const wordCount = text.split(/\s+/).length;
    const estimatedDuration = (wordCount / 150) * 60;

    console.log(`✅ Audio generated: ${audioBuffer.length} bytes`);

    return {
        audio: audioBuffer,
        duration: estimatedDuration,
    };
}

export { VOICE_IDS };
