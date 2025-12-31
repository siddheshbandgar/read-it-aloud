/**
 * POST /api/podcasts - Create a new podcast (SYNCHRONOUS for Vercel)
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

// Vercel function timeout is 60s on Hobby, 300s on Pro
export const maxDuration = 60;

/**
 * POST /api/podcasts - Create new podcast (processes synchronously)
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

        console.log(`🎙️ Starting podcast generation: ${podcast.id}`);
        console.log(`📊 Duration type: ${podcast.durationType}`);

        try {
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
            const completedPodcast = await updatePodcast(podcast.id, {
                status: 'completed',
                audioUrl,
                audioDurationSeconds: Math.round(duration),
                script: content,
                completedAt: new Date().toISOString(),
            });

            console.log(`✅ Podcast completed: ${podcast.id} (${Math.round(duration / 60)} min)`);

            // Return the completed podcast with transcript included
            return NextResponse.json({
                id: completedPodcast!.id,
                user_id: completedPodcast!.userId,
                title: completedPodcast!.title,
                source_url: completedPodcast!.sourceUrl,
                voice_style: completedPodcast!.voiceStyle,
                duration_type: completedPodcast!.durationType,
                audio_url: completedPodcast!.audioUrl,
                audio_duration_seconds: completedPodcast!.audioDurationSeconds?.toString(),
                status: completedPodcast!.status,
                is_public: completedPodcast!.isPublic ? 'true' : 'false',
                share_slug: completedPodcast!.shareSlug,
                created_at: completedPodcast!.createdAt,
                completed_at: completedPodcast!.completedAt,
                // Include transcript directly to avoid separate API call issues
                transcript: {
                    segments: segments.map((seg, i) => ({
                        id: `seg-${i}`,
                        sentence_index: i,
                        text: seg.text,
                        start_time: seg.startTime,
                        end_time: seg.endTime,
                    })),
                    total_duration: duration,
                },
            }, { status: 201 });

        } catch (error: any) {
            console.error(`❌ Podcast failed: ${podcast.id}`, error);
            await updatePodcast(podcast.id, {
                status: 'failed',
                errorMessage: error.message || 'Unknown error',
            });

            return NextResponse.json({
                id: podcast.id,
                status: 'failed',
                error_message: error.message || 'Unknown error',
            }, { status: 500 });
        }

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
            podcasts: podcasts.map(p => ({
                id: p.id,
                title: p.title,
                audio_url: p.audioUrl,
                audio_duration_seconds: p.audioDurationSeconds?.toString(),
                status: p.status,
                voice_style: p.voiceStyle,
                created_at: p.createdAt,
            })),
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
