/**
 * Serverless-compatible Database
 * Uses in-memory storage for Vercel (data persists during function lifecycle)
 * Note: Data does NOT persist across cold starts on Vercel
 * For production, consider using Vercel KV, PlanetScale, or Supabase
 */

import { v4 as uuidv4 } from 'uuid';

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

// In-memory database (persists during function lifecycle)
// Using globalThis to ensure singleton across hot reloads
const globalDb = globalThis as typeof globalThis & {
    __db_podcasts: Podcast[];
    __db_transcripts: TranscriptSegment[];
};

if (!globalDb.__db_podcasts) {
    globalDb.__db_podcasts = [];
}
if (!globalDb.__db_transcripts) {
    globalDb.__db_transcripts = [];
}

/**
 * Generate a random share slug
 */
function generateShareSlug(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ============== Podcast Operations ==============

export async function createPodcast(data: {
    userId: string;
    sourceUrl?: string;
    sourceText?: string;
    voiceStyle?: string;
    durationType?: string;
}): Promise<Podcast> {
    const podcast: Podcast = {
        id: uuidv4(),
        userId: data.userId,
        title: 'Processing...',
        sourceUrl: data.sourceUrl,
        sourceText: data.sourceText,
        voiceStyle: data.voiceStyle || 'narrator',
        durationType: data.durationType || 'full',
        status: 'pending',
        isPublic: false,
        shareSlug: generateShareSlug(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    globalDb.__db_podcasts.push(podcast);
    return podcast;
}

export async function getPodcast(id: string): Promise<Podcast | null> {
    return globalDb.__db_podcasts.find(p => p.id === id) || null;
}

export async function getPodcastsByUser(userId: string): Promise<Podcast[]> {
    return globalDb.__db_podcasts
        .filter(p => p.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updatePodcast(id: string, updates: Partial<Podcast>): Promise<Podcast | null> {
    const index = globalDb.__db_podcasts.findIndex(p => p.id === id);
    if (index === -1) return null;

    globalDb.__db_podcasts[index] = {
        ...globalDb.__db_podcasts[index],
        ...updates,
        updatedAt: new Date().toISOString(),
    };

    return globalDb.__db_podcasts[index];
}

export async function deletePodcast(id: string): Promise<boolean> {
    const index = globalDb.__db_podcasts.findIndex(p => p.id === id);
    if (index === -1) return false;

    globalDb.__db_podcasts.splice(index, 1);
    globalDb.__db_transcripts = globalDb.__db_transcripts.filter(t => t.podcastId !== id);

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
    const segment: TranscriptSegment = {
        id: uuidv4(),
        ...data,
    };

    globalDb.__db_transcripts.push(segment);
    return segment;
}

export async function getTranscriptSegments(podcastId: string): Promise<TranscriptSegment[]> {
    return globalDb.__db_transcripts
        .filter(t => t.podcastId === podcastId)
        .sort((a, b) => a.sentenceIndex - b.sentenceIndex);
}

export async function createTranscriptBatch(
    podcastId: string,
    segments: { text: string; startTime: number; endTime: number }[]
): Promise<void> {
    segments.forEach((seg, index) => {
        globalDb.__db_transcripts.push({
            id: uuidv4(),
            podcastId,
            sentenceIndex: index,
            text: seg.text,
            startTime: seg.startTime,
            endTime: seg.endTime,
        });
    });
}
