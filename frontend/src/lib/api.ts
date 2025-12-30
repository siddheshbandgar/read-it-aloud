/**
 * Read-It-Out AI - API Client
 * Uses Next.js API routes (local)
 */

// Types
export interface Podcast {
    id: string;
    user_id: string;
    title: string;
    source_url?: string;
    source_text?: string;
    tone?: string;
    voice_style?: string;
    duration_type?: string;
    script?: string;
    audio_url?: string;
    audio_duration_seconds?: string;
    status: 'pending' | 'extracting' | 'processing' | 'generating_audio' | 'uploading' | 'completed' | 'failed';
    error_message?: string;
    is_public?: string;
    share_slug?: string;
    created_at: string;
    updated_at: string;
    completed_at?: string;
}

export interface TranscriptSegment {
    id: string;
    sentence_index: number;
    text: string;
    start_time: number;
    end_time: number;
}

export interface Transcript {
    podcast_id: string;
    segments: TranscriptSegment[];
    total_duration: number;
}

/**
 * Create a new podcast
 */
export async function createPodcast(data: {
    source_url?: string;
    source_text?: string;
    voice_style?: string;
    duration_type?: string;
}): Promise<Podcast> {
    const response = await fetch('/api/podcasts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create podcast');
    }

    return response.json();
}

/**
 * Get podcast by ID
 */
export async function getPodcast(id: string): Promise<Podcast> {
    const response = await fetch(`/api/podcasts/${id}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get podcast');
    }

    return response.json();
}

/**
 * Poll podcast status until completed or failed
 */
export async function pollPodcastStatus(
    id: string,
    onUpdate?: (podcast: Podcast) => void,
    maxAttempts: number = 120
): Promise<Podcast> {
    for (let i = 0; i < maxAttempts; i++) {
        const podcast = await getPodcast(id);

        if (onUpdate) {
            onUpdate(podcast);
        }

        if (podcast.status === 'completed') {
            return podcast;
        }

        if (podcast.status === 'failed') {
            throw new Error(podcast.error_message || 'Podcast generation failed');
        }

        // Wait 2 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Timeout waiting for podcast completion');
}

/**
 * Get transcript for a podcast
 */
export async function getTranscript(podcastId: string): Promise<Transcript> {
    const response = await fetch(`/api/podcasts/${podcastId}/transcript`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get transcript');
    }

    return response.json();
}

/**
 * Get transcript for a public shared podcast
 */
export async function getPublicTranscript(shareSlug: string): Promise<Transcript> {
    const response = await fetch(`/api/public/${shareSlug}/transcript`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get public transcript');
    }

    return response.json();
}

/**
 * List user's podcasts
 */
export async function listPodcasts(): Promise<{ podcasts: Podcast[]; total: number }> {
    const response = await fetch('/api/podcasts');

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to list podcasts');
    }

    return response.json();
}

/**
 * Get public podcast by share slug (for public share pages)
 */
export async function getPublicPodcast(slug: string): Promise<Podcast> {
    // Use absolute URL for server-side rendering
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/public/${slug}`, {
        cache: 'no-store',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get public podcast');
    }

    return response.json();
}
