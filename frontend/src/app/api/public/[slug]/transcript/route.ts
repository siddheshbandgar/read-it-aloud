/**
 * GET /api/public/[slug]/transcript - Get transcript for public podcast
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPodcastByShareSlug, getTranscriptSegments } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        console.log(`[Public Transcript] Looking up slug: ${params.slug}`);

        const podcast = await getPodcastByShareSlug(params.slug);

        if (!podcast) {
            console.log(`[Public Transcript] Podcast not found for slug: ${params.slug}`);
            return NextResponse.json(
                { error: 'Podcast not found or not public' },
                { status: 404 }
            );
        }

        console.log(`[Public Transcript] Found podcast: ${podcast.id}`);

        const segments = await getTranscriptSegments(podcast.id);

        console.log(`[Public Transcript] Found ${segments.length} segments`);

        return NextResponse.json({
            podcast_id: podcast.id,
            segments: segments.map((s) => ({
                id: s.id,
                sentence_index: s.sentenceIndex,
                text: s.text,
                start_time: s.startTime,
                end_time: s.endTime,
            })),
            total_duration: segments.length > 0
                ? Math.max(...segments.map((s) => s.endTime))
                : 0,
        });

    } catch (error: any) {
        console.error('Error getting public transcript:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
