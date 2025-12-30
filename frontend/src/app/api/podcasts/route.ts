/**
 * POST /api/podcasts - Create a new podcast
 * GET /api/podcasts - List user's podcasts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPodcast, getPodcastsByUser, updatePodcast, Podcast } from '@/lib/db';
import { extractContent } from '@/lib/extractor';
import { summarizeForDuration } from '@/lib/openai';
import { generateAudio } from '@/lib/tts';
import { uploadAudio } from '@/lib/firebase';
import { createTranscriptBatch } from '@/lib/db';

// For testing without auth
const TEST_USER_ID = 'test-user-123';

/**
 * Process podcast generation (runs after initial response)
 */
async function processPodcast(podcast: Podcast): Promise<void> {
    try {
        console.log(`🎙️ Starting podcast generation: ${podcast.id}`);
        console.log(`📊 Duration type: ${podcast.durationType}`);

        // 1. Extract content
        await updatePodcast(podcast.id, { status: 'extracting' });

        const { title, content: rawContent, author } = await extractContent(
            podcast.sourceUrl,
            podcast.sourceText
        );

        await updatePodcast(podcast.id, { title, status: 'processing' });
        console.log(`📝 Extracted: "${title}" (${rawContent.split(/\s+/).length} words)`);

        // 2. Summarize content using OpenAI (for shorter durations)
        const { summary: content, wordCount } = await summarizeForDuration({
            content: rawContent,
            title,
            durationType: podcast.durationType,
            author,
        });

        console.log(`📏 Final content: ${wordCount} words (~${Math.round(wordCount / 150)} min)`);

        // 3. Generate audio
        await updatePodcast(podcast.id, { status: 'generating_audio' });

        const { audio, duration } = await generateAudio(content, podcast.voiceStyle);

        // 4. Upload to Firebase
        await updatePodcast(podcast.id, { status: 'uploading' });

        const audioUrl = await uploadAudio(audio, podcast.id);

        // 5. Create transcript segments
        const sentences = content.split(/(?<=[.!?])\s+/).filter(s => s.trim());
        const timePerSentence = duration / Math.max(sentences.length, 1);

        const segments = sentences.slice(0, 100).map((text, i) => ({
            text: text.trim(),
            startTime: i * timePerSentence,
            endTime: (i + 1) * timePerSentence,
        }));

        await createTranscriptBatch(podcast.id, segments);

        // 6. Mark completed
        await updatePodcast(podcast.id, {
            status: 'completed',
            audioUrl,
            audioDurationSeconds: Math.round(duration),
            script: content,
            completedAt: new Date().toISOString(),
        });

        console.log(`✅ Podcast completed: ${podcast.id} (${Math.round(duration / 60)} min)`);

    } catch (error: any) {
        console.error(`❌ Podcast failed: ${podcast.id}`, error);
        await updatePodcast(podcast.id, {
            status: 'failed',
            errorMessage: error.message || 'Unknown error',
        });
    }
}

/**
 * POST /api/podcasts - Create new podcast
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { source_url, source_text, voice_style, duration_type } = body;

        if (!source_url && !source_text) {
            return NextResponse.json(
                { error: 'Either source_url or source_text is required' },
                { status: 400 }
            );
        }

        // Create podcast record
        const podcast = await createPodcast({
            userId: TEST_USER_ID,
            sourceUrl: source_url,
            sourceText: source_text,
            voiceStyle: voice_style || 'narrator',
            durationType: duration_type || '5min',
        });

        // Process in background (don't await)
        processPodcast(podcast).catch(console.error);

        return NextResponse.json(podcast, { status: 201 });

    } catch (error: any) {
        console.error('Error creating podcast:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/podcasts - List user's podcasts
 */
export async function GET(request: NextRequest) {
    try {
        const podcasts = await getPodcastsByUser(TEST_USER_ID);

        return NextResponse.json({
            podcasts,
            total: podcasts.length,
            page: 1,
            per_page: 50,
        });

    } catch (error: any) {
        console.error('Error listing podcasts:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
