'use client';

import { Podcast } from '@/lib/api';
import { Loader2, CheckCircle, AlertCircle, FileAudio, Sparkles, Upload } from 'lucide-react';

interface StatusDisplayProps {
    podcast: Podcast | null;
    darkMode?: boolean;
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
    pending: { icon: <Loader2 className="animate-spin" size={18} />, label: 'Starting...' },
    extracting: { icon: <FileAudio size={18} />, label: 'Reading content...' },
    processing: { icon: <Sparkles size={18} />, label: 'AI is writing...' },
    generating_audio: { icon: <Loader2 className="animate-spin" size={18} />, label: 'Creating audio...' },
    uploading: { icon: <Upload size={18} />, label: 'Almost done...' },
    completed: { icon: <CheckCircle size={18} />, label: 'Ready!' },
    failed: { icon: <AlertCircle size={18} />, label: 'Failed' },
};

export function StatusDisplay({ podcast, darkMode = false }: StatusDisplayProps) {
    if (!podcast) return null;

    const config = STATUS_CONFIG[podcast.status] || STATUS_CONFIG.pending;
    const colors = {
        bg: darkMode ? '#18181b' : '#fafafa',
        border: darkMode ? '#27272a' : '#e4e4e7',
        text: darkMode ? '#fafafa' : '#09090b',
        textSecondary: darkMode ? '#a1a1aa' : '#71717a',
        track: darkMode ? '#27272a' : '#e4e4e7',
        fill: darkMode ? '#fafafa' : '#09090b',
    };

    const steps = ['pending', 'extracting', 'processing', 'generating_audio', 'uploading', 'completed'];
    const currentStep = steps.indexOf(podcast.status);
    const progress = Math.max(0, ((currentStep + 1) / steps.length) * 100);

    return (
        <div style={{
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '24px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ color: colors.text }}>{config.icon}</div>
                <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: colors.text }}>{config.label}</div>
                    {podcast.title && (
                        <div style={{
                            fontSize: '13px',
                            color: colors.textSecondary,
                            maxWidth: '280px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginTop: '2px',
                        }}>
                            {podcast.title}
                        </div>
                    )}
                </div>
            </div>

            {podcast.status !== 'completed' && podcast.status !== 'failed' && (
                <div style={{ height: '3px', background: colors.track, borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: colors.fill,
                        transition: 'width 0.4s ease',
                    }} />
                </div>
            )}

            {podcast.status === 'failed' && podcast.error_message && (
                <div style={{
                    marginTop: '12px',
                    padding: '12px 14px',
                    background: darkMode ? 'rgba(239,68,68,0.1)' : '#fef2f2',
                    borderRadius: '10px',
                    color: '#ef4444',
                    fontSize: '13px',
                }}>
                    {podcast.error_message}
                </div>
            )}
        </div>
    );
}
