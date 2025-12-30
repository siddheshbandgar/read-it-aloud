'use client';

import { useState, useEffect } from 'react';
import { Podcast, Transcript, getPublicTranscript } from '@/lib/api';
import { AudioPlayer } from '@/components/AudioPlayer';
import { TranscriptView } from '@/components/TranscriptView';
import { useTranscriptSync } from '@/hooks/useTranscriptSync';

interface PublicPodcastPlayerProps {
    podcast: Podcast;
    shareSlug: string;
}

/**
 * Client-side player for public shared podcasts.
 */
export function PublicPodcastPlayer({ podcast, shareSlug }: PublicPodcastPlayerProps) {
    const [transcript, setTranscript] = useState<Transcript | null>(null);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

    // Fetch transcript on mount
    useEffect(() => {
        getPublicTranscript(shareSlug)
            .then(setTranscript)
            .catch(console.error);
    }, [shareSlug]);

    const { activeIndex } = useTranscriptSync({
        segments: transcript?.segments || [],
        audioElement,
    });

    const handleSegmentClick = (segment: { start_time: number }) => {
        if (audioElement) {
            audioElement.currentTime = segment.start_time;
            audioElement.play();
        }
    };

    if (!podcast.audio_url) {
        return <div className="text-muted">Podcast audio not available.</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Title */}
            <div className="text-center">
                <h2 className="text-2xl font-semibold">{podcast.title}</h2>
                <div className="flex items-center justify-center gap-4 mt-2 text-sm text-muted">
                    <span className="capitalize">{podcast.tone?.replace('_', ' ')}</span>
                    <span>•</span>
                    <span className="capitalize">{podcast.voice_style?.replace('_', ' ')}</span>
                </div>
            </div>

            {/* Audio Player */}
            <AudioPlayer
                audioUrl={podcast.audio_url}
                onAudioRef={setAudioElement}
            />

            {/* Transcript */}
            {transcript && (
                <TranscriptView
                    segments={transcript.segments}
                    activeIndex={activeIndex}
                    onSegmentClick={handleSegmentClick}
                />
            )}

            {/* Footer */}
            <div className="text-center text-sm text-muted">
                <p>Created with <a href="/" className="underline hover:text-white">Read-It-Out AI</a></p>
            </div>
        </div>
    );
}
