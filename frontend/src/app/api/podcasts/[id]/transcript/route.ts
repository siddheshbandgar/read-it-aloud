/**
 * GET /api/podcasts/[id]/transcript - Get transcript segments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPodcast, getTranscriptSegments } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const podcast = await getPodcast(params.id);

        if (!podcast) {
            return NextResponse.json(
                { error: 'Podcast not found' },
                { status: 404 }
            );
        }

        if (podcast.status !== 'completed') {
            return NextResponse.json(
                { error: 'Transcript not available until podcast is completed' },
                { status: 400 }
            );
        }

        const segments = await getTranscriptSegments(params.id);

        // Map to expected response format
        const response = {
            podcast_id: podcast.id,
            segments: segments.map(s => ({
                id: s.id,
                sentence_index: s.sentenceIndex,
                text: s.text,
                start_time: s.startTime,
                end_time: s.endTime,
            })),
            total_duration: segments.length > 0
                ? Math.max(...segments.map(s => s.endTime))
                : 0,
        };

        return NextResponse.json(response);

    } catch (error: any) {
        console.error('Error getting transcript:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
