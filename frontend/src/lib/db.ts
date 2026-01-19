/**
 * Supabase Database Service
 * Persistent storage using Supabase Postgres
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// ============== Types ==============

export interface Podcast {
    id: string;
    userId: string;
    title: string;
    sourceUrl?: string;
    sourceText?: string;
    tone?: string;
    voiceStyle: string;
    durationType: string;
    script?: string;
    audioUrl?: string;
    audioDurationSeconds?: number;
    status: 'pending' | 'extracting' | 'processing' | 'generating_audio' | 'uploading' | 'completed' | 'failed';
    errorMessage?: string;
    isPublic: boolean;
    shareSlug: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
}

export interface TranscriptSegment {
    id: string;
    podcastId: string;
    sentenceIndex: number;
    text: string;
    startTime: number;
    endTime: number;
}

// ============== Supabase Client ==============

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
    if (supabaseClient) {
        return supabaseClient;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        throw new Error('Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }

    supabaseClient = createClient(url, serviceKey, {
        auth: {
            persistSession: false,
        },
    });

    return supabaseClient;
}

/**
 * Generate a random share slug
 */
function generateShareSlug(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/**
 * Convert database row to Podcast object (snake_case to camelCase)
 */
function rowToPodcast(row: any): Podcast {
    return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        sourceUrl: row.source_url,
        sourceText: row.source_text,
        tone: row.tone,
        voiceStyle: row.voice_style,
        durationType: row.duration_type,
        script: row.script,
        audioUrl: row.audio_url,
        audioDurationSeconds: row.audio_duration_seconds,
        status: row.status,
        errorMessage: row.error_message,
        isPublic: row.is_public,
        shareSlug: row.share_slug,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completedAt: row.completed_at,
    };
}

/**
 * Convert database row to TranscriptSegment object
 */
function rowToSegment(row: any): TranscriptSegment {
    return {
        id: row.id,
        podcastId: row.podcast_id,
        sentenceIndex: row.sentence_index,
        text: row.text,
        startTime: row.start_time,
        endTime: row.end_time,
    };
}

// ============== Podcast Operations ==============

export async function createPodcast(data: {
    userId: string;
    sourceUrl?: string;
    sourceText?: string;
    voiceStyle?: string;
    durationType?: string;
}): Promise<Podcast> {
    const client = getSupabaseClient();

    const { data: row, error } = await client
        .from('podcasts')
        .insert({
            user_id: data.userId,
            source_url: data.sourceUrl,
            source_text: data.sourceText,
            voice_style: data.voiceStyle || 'narrator',
            duration_type: data.durationType || 'full',
            share_slug: generateShareSlug(),
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating podcast:', error);
        throw new Error(`Failed to create podcast: ${error.message}`);
    }

    return rowToPodcast(row);
}

export async function getPodcast(id: string): Promise<Podcast | null> {
    const client = getSupabaseClient();

    const { data: row, error } = await client
        .from('podcasts')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        console.error('Error getting podcast:', error);
        throw new Error(`Failed to get podcast: ${error.message}`);
    }

    return row ? rowToPodcast(row) : null;
}

export async function getPodcastsByUser(userId: string): Promise<Podcast[]> {
    const client = getSupabaseClient();

    const { data: rows, error } = await client
        .from('podcasts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error getting podcasts by user:', error);
        throw new Error(`Failed to get podcasts: ${error.message}`);
    }

    return (rows || []).map(rowToPodcast);
}

export async function getPodcastByShareSlug(slug: string): Promise<Podcast | null> {
    const client = getSupabaseClient();

    console.log(`[DB] Looking for podcast with share_slug: ${slug}`);

    // First, check if any podcast exists with this slug (ignore is_public for debugging)
    const { data: anyRow, error: anyError } = await client
        .from('podcasts')
        .select('id, share_slug, is_public, title')
        .eq('share_slug', slug)
        .single();

    console.log(`[DB] Any podcast with slug?`, anyRow || 'none', anyError?.message || 'no error');

    // Now get the public one
    const { data: row, error } = await client
        .from('podcasts')
        .select('*')
        .eq('share_slug', slug)
        .eq('is_public', true)
        .single();

    if (error) {
        console.log(`[DB] Error finding public podcast:`, error.code, error.message);
        if (error.code === 'PGRST116') return null; // Not found
        console.error('Error getting podcast by share slug:', error);
        throw new Error(`Failed to get podcast: ${error.message}`);
    }

    console.log(`[DB] Found public podcast:`, row?.id);
    return row ? rowToPodcast(row) : null;
}

export async function updatePodcast(id: string, updates: Partial<Podcast>): Promise<Podcast | null> {
    const client = getSupabaseClient();

    // Convert camelCase to snake_case for database
    const dbUpdates: Record<string, any> = {
        updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.script !== undefined) dbUpdates.script = updates.script;
    if (updates.audioUrl !== undefined) dbUpdates.audio_url = updates.audioUrl;
    if (updates.audioDurationSeconds !== undefined) dbUpdates.audio_duration_seconds = updates.audioDurationSeconds;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.errorMessage !== undefined) dbUpdates.error_message = updates.errorMessage;
    if (updates.isPublic !== undefined) dbUpdates.is_public = updates.isPublic;
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;

    const { data: row, error } = await client
        .from('podcasts')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating podcast:', error);
        throw new Error(`Failed to update podcast: ${error.message}`);
    }

    return row ? rowToPodcast(row) : null;
}

export async function deletePodcast(id: string): Promise<boolean> {
    const client = getSupabaseClient();

    const { error } = await client
        .from('podcasts')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting podcast:', error);
        throw new Error(`Failed to delete podcast: ${error.message}`);
    }

    return true;
}

// ============== Transcript Operations ==============

export async function createTranscriptSegment(data: {
    podcastId: string;
    sentenceIndex: number;
    text: string;
    startTime: number;
    endTime: number;
}): Promise<TranscriptSegment> {
    const client = getSupabaseClient();

    const { data: row, error } = await client
        .from('transcript_segments')
        .insert({
            podcast_id: data.podcastId,
            sentence_index: data.sentenceIndex,
            text: data.text,
            start_time: data.startTime,
            end_time: data.endTime,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating transcript segment:', error);
        throw new Error(`Failed to create transcript segment: ${error.message}`);
    }

    return rowToSegment(row);
}

export async function getTranscriptSegments(podcastId: string): Promise<TranscriptSegment[]> {
    const client = getSupabaseClient();

    const { data: rows, error } = await client
        .from('transcript_segments')
        .select('*')
        .eq('podcast_id', podcastId)
        .order('sentence_index', { ascending: true });

    if (error) {
        console.error('Error getting transcript segments:', error);
        throw new Error(`Failed to get transcript segments: ${error.message}`);
    }

    return (rows || []).map(rowToSegment);
}

export async function createTranscriptBatch(
    podcastId: string,
    segments: { text: string; startTime: number; endTime: number }[]
): Promise<void> {
    const client = getSupabaseClient();

    const rows = segments.map((seg, index) => ({
        podcast_id: podcastId,
        sentence_index: index,
        text: seg.text,
        start_time: seg.startTime,
        end_time: seg.endTime,
    }));

    const { error } = await client
        .from('transcript_segments')
        .insert(rows);

    if (error) {
        console.error('Error creating transcript batch:', error);
        throw new Error(`Failed to create transcript batch: ${error.message}`);
    }
}
