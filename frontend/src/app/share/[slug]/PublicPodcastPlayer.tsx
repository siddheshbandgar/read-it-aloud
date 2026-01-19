'use client';

import { useState, useEffect } from 'react';
import { Podcast, Transcript, getPublicTranscript } from '@/lib/api';
import { AudioPlayer } from '@/components/AudioPlayer';
import { TranscriptView } from '@/components/TranscriptView';
import { useTranscriptSync } from '@/hooks/useTranscriptSync';
import { Clock, Mic, Sparkles } from 'lucide-react';

interface PublicPodcastPlayerProps {
    podcast: Podcast;
    shareSlug: string;
}

/**
 * Client-side player for public shared narrations.
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

    // Format duration
    const formatDuration = (seconds?: string) => {
        if (!seconds) return null;
        const secs = parseInt(seconds);
        const mins = Math.floor(secs / 60);
        return `${mins} min`;
    };

    if (!podcast.audio_url) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <div className="text-4xl mb-4">🔇</div>
                <p>Audio not available.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Title Section */}
            <div className="text-center space-y-3 px-4">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-tight">
                    {podcast.title}
                </h2>
                <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
                    {formatDuration(podcast.audio_duration_seconds) && (
                        <span className="flex items-center gap-1.5">
                            <Clock size={14} />
                            {formatDuration(podcast.audio_duration_seconds)}
                        </span>
                    )}
                    {podcast.voice_style && (
                        <>
                            <span className="text-border">•</span>
                            <span className="flex items-center gap-1.5 capitalize">
                                <Mic size={14} />
                                {podcast.voice_style.replace('_', ' ')}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Audio Player Card */}
            <div className="glass rounded-2xl shadow-lg border border-border/50 overflow-hidden mx-2 sm:mx-0">
                <AudioPlayer
                    audioUrl={podcast.audio_url}
                    onAudioRef={setAudioElement}
                />
            </div>

            {/* Transcript */}
            {transcript && transcript.segments.length > 0 && (
                <div className="glass-card rounded-2xl p-1 border border-border/50 mx-2 sm:mx-0">
                    <TranscriptView
                        segments={transcript.segments}
                        activeIndex={activeIndex}
                        onSegmentClick={handleSegmentClick}
                    />
                </div>
            )}

            {/* Footer */}
            <div className="text-center pt-4 pb-8">
                <a
                    href="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm"
                >
                    <Sparkles size={16} />
                    Create Your Own Narration
                </a>
                <p className="mt-4 text-xs text-muted-foreground">
                    Powered by Read-It-Aloud AI
                </p>
            </div>
        </div>
    );
}
