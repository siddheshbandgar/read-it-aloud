/**
 * GET /api/podcasts/[id] - Get podcast by ID
 * DELETE /api/podcasts/[id] - Delete podcast
 * PATCH /api/podcasts/[id] - Toggle public status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPodcast, deletePodcast, updatePodcast } from '@/lib/db';
import { deleteAudio } from '@/lib/firebase';

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

        // Map to expected response format
        const response = {
            id: podcast.id,
            user_id: podcast.userId,
            title: podcast.title,
            source_url: podcast.sourceUrl,
            source_text: podcast.sourceText,
            tone: podcast.tone,
            voice_style: podcast.voiceStyle,
            duration_type: podcast.durationType,
            script: podcast.script,
            audio_url: podcast.audioUrl,
            audio_duration_seconds: podcast.audioDurationSeconds?.toString(),
            status: podcast.status,
            error_message: podcast.errorMessage,
            is_public: podcast.isPublic ? 'true' : 'false',
            share_slug: podcast.shareSlug,
            created_at: podcast.createdAt,
            updated_at: podcast.updatedAt,
            completed_at: podcast.completedAt,
        };

        return NextResponse.json(response);

    } catch (error: any) {
        console.error('Error getting podcast:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/podcasts/[id] - Delete podcast
 */
export async function DELETE(
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

        // Delete audio from Firebase
        try {
            await deleteAudio(params.id);
        } catch (e) {
            console.error('Failed to delete audio from Firebase:', e);
        }

        // Delete from database
        await deletePodcast(params.id);

        return new NextResponse(null, { status: 204 });

    } catch (error: any) {
        console.error('Error deleting podcast:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/podcasts/[id] - Toggle public status
 */
export async function PATCH(
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

        // Toggle public status
        const updated = await updatePodcast(params.id, {
            isPublic: !podcast.isPublic,
        });

        return NextResponse.json({
            is_public: updated?.isPublic ? 'true' : 'false',
            share_slug: updated?.shareSlug,
        });

    } catch (error: any) {
        console.error('Error updating podcast:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
