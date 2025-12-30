/**
 * GET /api/public/[slug]/transcript - Get transcript for public podcast
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

async function getDb() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch {
        return { podcasts: [], transcripts: [] };
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const db = await getDb();
        const podcast = db.podcasts.find(
            (p: any) => p.shareSlug === params.slug && p.isPublic
        );

        if (!podcast) {
            return NextResponse.json(
                { error: 'Podcast not found or not public' },
                { status: 404 }
            );
        }

        const segments = db.transcripts
            .filter((t: any) => t.podcastId === podcast.id)
            .sort((a: any, b: any) => a.sentenceIndex - b.sentenceIndex);

        return NextResponse.json({
            podcast_id: podcast.id,
            segments: segments.map((s: any) => ({
                id: s.id,
                sentence_index: s.sentenceIndex,
                text: s.text,
                start_time: s.startTime,
                end_time: s.endTime,
            })),
            total_duration: segments.length > 0
                ? Math.max(...segments.map((s: any) => s.endTime))
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
