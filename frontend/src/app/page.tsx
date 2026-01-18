'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Podcast, Transcript, createPodcast, pollPodcastStatus, getTranscript, listPodcasts } from '@/lib/api';
import { PodcastForm } from '@/components/PodcastForm';
import { AudioPlayer } from '@/components/AudioPlayer';
import { TranscriptView } from '@/components/TranscriptView';
import { StatusDisplay } from '@/components/StatusDisplay';
import { Hero } from '@/components/Hero';
import { LoadingState } from '@/components/LoadingState';
import { useTranscriptSync } from '@/hooks/useTranscriptSync';
import { Share2, Headphones, Check, Moon, Sun, History, X, Play, ArrowLeft, Loader2 } from 'lucide-react';

export default function HomePage() {
    const router = useRouter();
    const isCancelledRef = useRef(false);
    const [isLoading, setIsLoading] = useState(false);
    const [podcast, setPodcast] = useState<Podcast | null>(null);
    const [transcript, setTranscript] = useState<Transcript | null>(null);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [historyPodcasts, setHistoryPodcasts] = useState<Podcast[]>([]);

    // Check local storage for theme
    useEffect(() => {
        const saved = localStorage.getItem('darkMode');
        if (saved === 'true') {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('darkMode', newMode.toString());
        if (newMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    };

    const { activeIndex, setActiveIndex } = useTranscriptSync({
        segments: transcript?.segments || [],
        audioElement,
    });

    const loadHistory = async () => {
        try {
            const data = await listPodcasts();
            setHistoryPodcasts(data.podcasts.filter((p: Podcast) => p.status === 'completed'));
            setShowHistory(true);
        } catch (err) {
            console.error('Failed to load history:', err);
        }
    };

    const playFromHistory = async (historyPodcast: Podcast) => {
        setPodcast(historyPodcast);
        setShowHistory(false);
        if (historyPodcast.audio_url) {
            try {
                const transcriptData = await getTranscript(historyPodcast.id);
                setTranscript(transcriptData);
            } catch (err) {
                console.error('Failed to load transcript:', err);
            }
        }
    };

    const handleSubmit = useCallback(async (data: {
        source_url?: string;
        source_text?: string;
        duration_type: string;
        voice_style?: string;
    }) => {
        setIsLoading(true);
        setPodcast(null);
        setTranscript(null);
        setError(null);
        isCancelledRef.current = false;

        try {
            const newPodcast = await createPodcast(data);

            // If cancelled during creation, stop here
            if (isCancelledRef.current) return;

            setPodcast(newPodcast);

            await pollPodcastStatus(newPodcast.id, (update) => {
                // If cancelled during polling, stop updating
                if (isCancelledRef.current) return;

                setPodcast((current) => {
                    // Also check current state as backup
                    if (!current || current.id !== update.id) return current;
                    return update;
                });
            });

            if (isCancelledRef.current) return;

            // Final update after polling
            const transcriptData = await getTranscript(newPodcast.id);
            setPodcast((current) => {
                if (current && current.id === newPodcast.id) {
                    setTranscript(transcriptData);
                    return current;
                }
                return current;
            });
        } catch (err: any) {
            if (!isCancelledRef.current) {
                setError(err.message || 'Failed to generate podcast');
            }
        } finally {
            if (!isCancelledRef.current) {
                setIsLoading(false);
            }
        }
    }, []);

    const handleSegmentClick = useCallback((segment: { start_time: number }) => {
        if (audioElement) {
            audioElement.currentTime = segment.start_time;
            audioElement.play();
        }
    }, [audioElement]);

    const handleTimeUpdate = useCallback((time: number) => {
        if (transcript?.segments) {
            const newIndex = transcript.segments.findIndex(
                (seg, i) => time >= seg.start_time &&
                    (i === transcript.segments.length - 1 || time < transcript.segments[i + 1].start_time)
            );
            if (newIndex !== -1 && newIndex !== activeIndex) setActiveIndex(newIndex);
        }
    }, [transcript?.segments, activeIndex, setActiveIndex]);

    const shareUrl = podcast?.share_slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${podcast.share_slug}` : null;

    const handleCopy = () => {
        if (shareUrl) {
            navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const resetToForm = () => {
        isCancelledRef.current = true;
        setPodcast(null);
        setTranscript(null);
        setError(null);
        setIsLoading(false);
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 cursor-pointer" onClick={resetToForm}>
                        <div className="bg-foreground text-background p-1.5 rounded-lg">
                            <Headphones size={20} strokeWidth={3} />
                        </div>
                        <span className="text-base font-bold tracking-tight">
                            Read-It-Aloud
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={loadHistory}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                            title="History"
                        >
                            <History size={18} />
                        </button>
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                        >
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* History Modal */}
            {showHistory && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-card w-full max-w-md max-h-[70vh] rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-border">
                            <span className="font-semibold text-lg">Listening History</span>
                            <button onClick={() => setShowHistory(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-2">
                            {historyPodcasts.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground text-sm">
                                    No narrations yet. Start creating!
                                </div>
                            ) : (
                                historyPodcasts.map((p) => (
                                    <div
                                        key={p.id}
                                        onClick={() => playFromHistory(p)}
                                        className="p-4 rounded-xl hover:bg-muted/50 cursor-pointer flex items-center gap-4 transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <Play size={16} className="ml-1" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate text-sm">
                                                {p.title || 'Untitled Narration'}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {p.audio_duration_seconds ? `${Math.round(parseFloat(p.audio_duration_seconds) / 60)} min` : 'Unknown'} · {p.voice_style || 'Narrator'}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-6 py-12">

                {/* Hero / Form / Loading States */}
                {!podcast?.audio_url && !isLoading && (
                    <div className="animate-fade-in space-y-12">
                        {/* Show Hero only when no podcast is present and not loading */}
                        <Hero darkMode={darkMode} />

                        <div id="generate" className="glass-card rounded-2xl p-8 shadow-sm">
                            <h2 className="text-2xl font-semibold mb-6 text-center">Create New Narration</h2>
                            <PodcastForm onSubmit={handleSubmit} isLoading={isLoading} darkMode={darkMode} />
                        </div>
                    </div>
                )}

                {/* Loading State (Creation or Processing) */}
                {(isLoading || (podcast && !podcast.audio_url && podcast.status !== 'failed')) && (
                    <LoadingState podcast={podcast} onCancel={resetToForm} />
                )}

                {/* Error State */}
                {podcast && podcast.status === 'failed' && (
                    <div className="mt-8 p-4 bg-destructive/10 text-destructive rounded-lg text-center animate-in fade-in max-w-lg mx-auto">
                        <p className="font-semibold">Generation Failed</p>
                        <p className="text-sm mt-1">{podcast.error_message || 'Something went wrong. Please try again.'}</p>
                        <button
                            onClick={resetToForm}
                            className="mt-4 text-xs underline hover:no-underline"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Player View */}
                {podcast?.audio_url && !isLoading && (
                    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
                        <button
                            onClick={resetToForm}
                            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft size={16} /> Back to Home
                        </button>

                        <div className="text-center space-y-2">
                            <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                                {podcast.title}
                            </h2>
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <span>{podcast.audio_duration_seconds && `${Math.round(parseFloat(podcast.audio_duration_seconds) / 60)} min`}</span>
                                <span>·</span>
                                <span className="capitalize">{podcast.voice_style?.replace('_', ' ') || 'Narrator'}</span>
                            </div>
                        </div>

                        <div className="glass rounded-2xl shadow-lg border border-border/50 overflow-hidden">
                            <AudioPlayer
                                audioUrl={podcast.audio_url}
                                onAudioRef={setAudioElement}
                                onTimeUpdate={handleTimeUpdate}
                                darkMode={darkMode}
                            />
                        </div>

                        {shareUrl && (
                            <div className="flex justify-center">
                                <button
                                    onClick={handleCopy}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all transform active:scale-95 ${copied
                                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                                        : 'bg-card border border-border hover:border-foreground/20 text-foreground shadow-sm'
                                        }`}
                                >
                                    {copied ? <Check size={16} /> : <Share2 size={16} />}
                                    {copied ? 'Copied Link!' : 'Share Narration'}
                                </button>
                            </div>
                        )}

                        {transcript && (
                            <div className="glass-card rounded-2xl p-1 border border-border/50">
                                <TranscriptView
                                    segments={transcript.segments}
                                    activeIndex={activeIndex}
                                    onSegmentClick={handleSegmentClick}
                                    darkMode={darkMode}
                                />
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-border/40 mt-20 py-8 text-center text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} Read-It-Aloud. Built with AI.</p>
            </footer>
        </div>
    );
}
