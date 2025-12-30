/**
 * GET /api/public/[slug] - Get public podcast by share slug
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

        return NextResponse.json({
            id: podcast.id,
            title: podcast.title,
            tone: podcast.tone,
            voice_style: podcast.voiceStyle,
            audio_url: podcast.audioUrl,
            audio_duration_seconds: podcast.audioDurationSeconds?.toString(),
            status: podcast.status,
            share_slug: podcast.shareSlug,
            created_at: podcast.createdAt,
        });

    } catch (error: any) {
        console.error('Error getting public podcast:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
