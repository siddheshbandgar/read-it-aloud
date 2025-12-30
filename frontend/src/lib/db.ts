/**
 * Simple JSON-based Database
 * Uses a local JSON file for storage (no external dependencies needed)
 */

import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

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

interface Database {
    podcasts: Podcast[];
    transcripts: TranscriptSegment[];
}

/**
 * Ensure data directory exists
 */
async function ensureDataDir(): Promise<void> {
    const dataDir = path.dirname(DB_PATH);
    try {
        await fs.mkdir(dataDir, { recursive: true });
    } catch (error) {
        // Directory might already exist
    }
}

/**
 * Read database from file
 */
async function readDb(): Promise<Database> {
    await ensureDataDir();
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return { podcasts: [], transcripts: [] };
    }
}

/**
 * Write database to file
 */
async function writeDb(db: Database): Promise<void> {
    await ensureDataDir();
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
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
    const db = await readDb();

    const podcast: Podcast = {
        id: uuidv4(),
        userId: data.userId,
        title: 'Processing...',
        sourceUrl: data.sourceUrl,
        sourceText: data.sourceText,
        voiceStyle: data.voiceStyle || 'news_anchor',
        durationType: data.durationType || 'full',
        status: 'pending',
        isPublic: false,
        shareSlug: generateShareSlug(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    db.podcasts.push(podcast);
    await writeDb(db);

    return podcast;
}

export async function getPodcast(id: string): Promise<Podcast | null> {
    const db = await readDb();
    return db.podcasts.find(p => p.id === id) || null;
}

export async function getPodcastsByUser(userId: string): Promise<Podcast[]> {
    const db = await readDb();
    return db.podcasts
        .filter(p => p.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updatePodcast(id: string, updates: Partial<Podcast>): Promise<Podcast | null> {
    const db = await readDb();
    const index = db.podcasts.findIndex(p => p.id === id);

    if (index === -1) return null;

    db.podcasts[index] = {
        ...db.podcasts[index],
        ...updates,
        updatedAt: new Date().toISOString(),
    };

    await writeDb(db);
    return db.podcasts[index];
}

export async function deletePodcast(id: string): Promise<boolean> {
    const db = await readDb();
    const index = db.podcasts.findIndex(p => p.id === id);

    if (index === -1) return false;

    db.podcasts.splice(index, 1);
    db.transcripts = db.transcripts.filter(t => t.podcastId !== id);

    await writeDb(db);
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
    const db = await readDb();

    const segment: TranscriptSegment = {
        id: uuidv4(),
        ...data,
    };

    db.transcripts.push(segment);
    await writeDb(db);

    return segment;
}

export async function getTranscriptSegments(podcastId: string): Promise<TranscriptSegment[]> {
    const db = await readDb();
    return db.transcripts
        .filter(t => t.podcastId === podcastId)
        .sort((a, b) => a.sentenceIndex - b.sentenceIndex);
}

export async function createTranscriptBatch(
    podcastId: string,
    segments: { text: string; startTime: number; endTime: number }[]
): Promise<void> {
    const db = await readDb();

    segments.forEach((seg, index) => {
        db.transcripts.push({
            id: uuidv4(),
            podcastId,
            sentenceIndex: index,
            text: seg.text,
            startTime: seg.startTime,
            endTime: seg.endTime,
        });
    });

    await writeDb(db);
}
