'use client';

import { useState, useCallback, useEffect } from 'react';
import { Podcast, Transcript, createPodcast, pollPodcastStatus, getTranscript, listPodcasts } from '@/lib/api';
import { PodcastForm } from '@/components/PodcastForm';
import { AudioPlayer } from '@/components/AudioPlayer';
import { TranscriptView } from '@/components/TranscriptView';
import { StatusDisplay } from '@/components/StatusDisplay';
import { useTranscriptSync } from '@/hooks/useTranscriptSync';
import { Share2, Headphones, Check, Moon, Sun, History, X, Play, ArrowLeft } from 'lucide-react';

export default function HomePage() {
    const [isLoading, setIsLoading] = useState(false);
    const [podcast, setPodcast] = useState<Podcast | null>(null);
    const [transcript, setTranscript] = useState<Transcript | null>(null);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [historyPodcasts, setHistoryPodcasts] = useState<Podcast[]>([]);

    const { activeIndex, setActiveIndex } = useTranscriptSync({
        segments: transcript?.segments || [],
        audioElement,
    });

    useEffect(() => {
        const saved = localStorage.getItem('darkMode');
        if (saved === 'true') setDarkMode(true);
    }, []);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        localStorage.setItem('darkMode', (!darkMode).toString());
    };

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

        try {
            // Create podcast - returns immediately
            const newPodcast = await createPodcast(data);
            setPodcast(newPodcast);

            // Poll for status updates
            const completed = await pollPodcastStatus(newPodcast.id, (update) => setPodcast(update));

            // Get transcript when complete
            const transcriptData = await getTranscript(completed.id);
            setTranscript(transcriptData);
        } catch (err: any) {
            setError(err.message || 'Failed to generate podcast');
        } finally {
            setIsLoading(false);
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
        setPodcast(null);
        setTranscript(null);
        setError(null);
    };

    // Design system
    const colors = {
        bg: darkMode ? '#09090b' : '#ffffff',
        surface: darkMode ? '#18181b' : '#fafafa',
        border: darkMode ? '#27272a' : '#e4e4e7',
        text: darkMode ? '#fafafa' : '#09090b',
        textSecondary: darkMode ? '#a1a1aa' : '#71717a',
        accent: darkMode ? '#fafafa' : '#09090b',
        accentText: darkMode ? '#09090b' : '#fafafa',
        error: '#ef4444',
        success: '#22c55e',
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: colors.bg,
            color: colors.text,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            transition: 'background 0.2s, color 0.2s',
        }}>
            {/* Header */}
            <header style={{
                position: 'sticky',
                top: 0,
                background: colors.bg,
                borderBottom: `1px solid ${colors.border}`,
                zIndex: 100,
            }}>
                <div style={{
                    maxWidth: '640px',
                    margin: '0 auto',
                    padding: '16px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Headphones size={20} strokeWidth={2.5} />
                        <span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.3px' }}>
                            Read-It-Aloud
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                            onClick={loadHistory}
                            style={{
                                padding: '8px',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: colors.textSecondary,
                                transition: 'color 0.15s',
                            }}
                            title="History"
                        >
                            <History size={18} />
                        </button>
                        <button
                            onClick={toggleDarkMode}
                            style={{
                                padding: '8px',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: colors.textSecondary,
                                transition: 'color 0.15s',
                            }}
                        >
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* History Modal */}
            {showHistory && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px',
                    backdropFilter: 'blur(4px)',
                }}>
                    <div style={{
                        background: colors.surface,
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '440px',
                        maxHeight: '70vh',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '20px 24px',
                            borderBottom: `1px solid ${colors.border}`,
                        }}>
                            <span style={{ fontSize: '15px', fontWeight: 600 }}>History</span>
                            <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary, padding: '4px' }}>
                                <X size={18} />
                            </button>
                        </div>
                        <div style={{ overflowY: 'auto', maxHeight: 'calc(70vh - 65px)' }}>
                            {historyPodcasts.length === 0 ? (
                                <div style={{ padding: '48px 24px', textAlign: 'center', color: colors.textSecondary, fontSize: '14px' }}>
                                    No podcasts yet
                                </div>
                            ) : (
                                historyPodcasts.map((p) => (
                                    <div
                                        key={p.id}
                                        onClick={() => playFromHistory(p)}
                                        style={{
                                            padding: '16px 24px',
                                            borderBottom: `1px solid ${colors.border}`,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '14px',
                                            transition: 'background 0.15s',
                                        }}
                                    >
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            background: colors.accent,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <Play size={16} color={colors.accentText} style={{ marginLeft: '2px' }} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '14px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {p.title || 'Untitled'}
                                            </div>
                                            <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
                                                {p.audio_duration_seconds ? `${Math.round(parseFloat(p.audio_duration_seconds) / 60)} min` : ''} · {p.voice_style}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main */}
            <main style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px' }}>
                {/* Show form or results */}
                {!podcast?.audio_url ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{
                            background: colors.surface,
                            borderRadius: '16px',
                            padding: '24px',
                            border: `1px solid ${colors.border}`,
                        }}>
                            <PodcastForm onSubmit={handleSubmit} isLoading={isLoading} darkMode={darkMode} />
                        </div>

                        {error && (
                            <div style={{
                                padding: '14px 18px',
                                background: darkMode ? 'rgba(239,68,68,0.1)' : '#fef2f2',
                                borderRadius: '12px',
                                color: colors.error,
                                fontSize: '14px',
                                border: `1px solid ${darkMode ? 'rgba(239,68,68,0.2)' : '#fecaca'}`,
                            }}>
                                {error}
                            </div>
                        )}

                        {podcast && podcast.status !== 'completed' && (
                            <StatusDisplay podcast={podcast} darkMode={darkMode} />
                        )}
                    </div>
                ) : (
                    /* Player View */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <button
                            onClick={resetToForm}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'none',
                                border: 'none',
                                color: colors.textSecondary,
                                fontSize: '14px',
                                cursor: 'pointer',
                                padding: 0,
                            }}
                        >
                            <ArrowLeft size={16} /> New podcast
                        </button>

                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.3px', lineHeight: 1.4 }}>
                                {podcast.title}
                            </h2>
                            <div style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '8px' }}>
                                {podcast.audio_duration_seconds && `${Math.round(parseFloat(podcast.audio_duration_seconds) / 60)} min`}
                                {podcast.voice_style && ` · ${podcast.voice_style.replace('_', ' ')}`}
                            </div>
                        </div>

                        <AudioPlayer audioUrl={podcast.audio_url} onAudioRef={setAudioElement} onTimeUpdate={handleTimeUpdate} darkMode={darkMode} />

                        {shareUrl && (
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <button
                                    onClick={handleCopy}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '10px 16px',
                                        background: copied ? colors.success : 'transparent',
                                        color: copied ? '#fff' : colors.textSecondary,
                                        border: `1px solid ${copied ? colors.success : colors.border}`,
                                        borderRadius: '10px',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {copied ? <Check size={14} /> : <Share2 size={14} />}
                                    {copied ? 'Copied!' : 'Share'}
                                </button>
                            </div>
                        )}

                        {transcript && (
                            <TranscriptView segments={transcript.segments} activeIndex={activeIndex} onSegmentClick={handleSegmentClick} darkMode={darkMode} />
                        )}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer style={{
                borderTop: `1px solid ${colors.border}`,
                marginTop: '48px',
                padding: '20px 24px',
                textAlign: 'center',
                fontSize: '12px',
                color: colors.textSecondary,
            }}>
                © 2024 Read-It-Aloud
            </footer>
        </div>
    );
}
