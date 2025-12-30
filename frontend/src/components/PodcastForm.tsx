'use client';

import { useState } from 'react';
import { Link, FileText, Loader2, Globe, Twitter } from 'lucide-react';

interface PodcastFormProps {
    onSubmit: (data: {
        source_url?: string;
        source_text?: string;
        duration_type: string;
        voice_style?: string;
    }) => Promise<void>;
    isLoading: boolean;
    darkMode?: boolean;
}

const DURATION_OPTIONS = [
    { value: '2min', label: '2 min' },
    { value: '5min', label: '5 min' },
    { value: '10min', label: '10 min' },
    { value: 'full', label: 'Full' },
];

const VOICE_OPTIONS = [
    { value: 'narrator', label: 'Narrator' },
    { value: 'storyteller', label: 'Storyteller' },
    { value: 'professional', label: 'Professional' },
    { value: 'podcast_host', label: 'Host' },
    { value: 'calm', label: 'Calm' },
    { value: 'confident', label: 'Confident' },
];

export function PodcastForm({ onSubmit, isLoading, darkMode = false }: PodcastFormProps) {
    const [inputMode, setInputMode] = useState<'url' | 'text'>('url');
    const [sourceUrl, setSourceUrl] = useState('');
    const [sourceText, setSourceText] = useState('');
    const [durationType, setDurationType] = useState('5min');
    const [voiceStyle, setVoiceStyle] = useState<string | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);

    const colors = {
        bg: darkMode ? '#09090b' : '#ffffff',
        surface: darkMode ? '#18181b' : '#fafafa',
        border: darkMode ? '#27272a' : '#e4e4e7',
        text: darkMode ? '#fafafa' : '#09090b',
        textSecondary: darkMode ? '#a1a1aa' : '#71717a',
        accent: darkMode ? '#fafafa' : '#09090b',
        accentText: darkMode ? '#09090b' : '#fafafa',
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (inputMode === 'url' && !sourceUrl.trim()) {
            setError('Please enter a URL');
            return;
        }
        if (inputMode === 'text' && !sourceText.trim()) {
            setError('Please enter some text');
            return;
        }

        if (inputMode === 'url') {
            try { new URL(sourceUrl.trim()); }
            catch { setError('Please enter a valid URL'); return; }
        }

        try {
            await onSubmit({
                source_url: inputMode === 'url' ? sourceUrl.trim() : undefined,
                source_text: inputMode === 'text' ? sourceText.trim() : undefined,
                duration_type: durationType,
                voice_style: voiceStyle,
            });
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Tab Toggle */}
            <div style={{ display: 'flex', gap: '4px', background: colors.surface, padding: '4px', borderRadius: '10px', border: `1px solid ${colors.border}` }}>
                {[{ key: 'url', label: 'URL', icon: Link }, { key: 'text', label: 'Text', icon: FileText }].map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setInputMode(key as 'url' | 'text')}
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '10px 16px',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: inputMode === key ? colors.text : colors.textSecondary,
                            background: inputMode === key ? colors.bg : 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                        }}
                    >
                        <Icon size={14} /> {label}
                    </button>
                ))}
            </div>

            {/* URL Input */}
            {inputMode === 'url' && (
                <div>
                    <input
                        type="url"
                        value={sourceUrl}
                        onChange={(e) => setSourceUrl(e.target.value)}
                        placeholder="https://example.com/article"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '14px 16px',
                            fontSize: '15px',
                            border: `1px solid ${colors.border}`,
                            borderRadius: '10px',
                            background: colors.bg,
                            color: colors.text,
                            outline: 'none',
                            transition: 'border-color 0.15s',
                        }}
                    />
                    <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '10px' }}>
                        Supports:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            background: darkMode ? 'rgba(59,130,246,0.15)' : '#eff6ff',
                            borderRadius: '100px',
                            fontSize: '11px',
                            fontWeight: 500,
                            color: darkMode ? '#60a5fa' : '#2563eb',
                        }}>
                            <Globe size={11} /> Web Articles
                        </span>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            background: darkMode ? 'rgba(99,102,241,0.15)' : '#eef2ff',
                            borderRadius: '100px',
                            fontSize: '11px',
                            fontWeight: 500,
                            color: darkMode ? '#a5b4fc' : '#4f46e5',
                        }}>
                            <Twitter size={11} /> X Threads
                        </span>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            background: darkMode ? 'rgba(168,85,247,0.15)' : '#faf5ff',
                            borderRadius: '100px',
                            fontSize: '11px',
                            fontWeight: 500,
                            color: darkMode ? '#c4b5fd' : '#7c3aed',
                        }}>
                            <FileText size={11} /> X Articles
                        </span>
                    </div>
                </div>
            )}

            {/* Text Input */}
            {inputMode === 'text' && (
                <textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Paste your article or text here..."
                    rows={4}
                    disabled={isLoading}
                    style={{
                        width: '100%',
                        padding: '14px 16px',
                        fontSize: '15px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '10px',
                        background: colors.bg,
                        color: colors.text,
                        resize: 'vertical',
                        minHeight: '100px',
                        outline: 'none',
                        fontFamily: 'inherit',
                    }}
                />
            )}

            {/* Duration */}
            <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: colors.textSecondary, marginBottom: '8px' }}>
                    Length
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {DURATION_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setDurationType(opt.value)}
                            disabled={isLoading}
                            style={{
                                flex: 1,
                                padding: '10px 8px',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: durationType === opt.value ? colors.accentText : colors.text,
                                background: durationType === opt.value ? colors.accent : 'transparent',
                                border: `1px solid ${durationType === opt.value ? colors.accent : colors.border}`,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Voice */}
            <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: colors.textSecondary, marginBottom: '8px' }}>
                    Voice <span style={{ fontWeight: 400 }}>(optional)</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {VOICE_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setVoiceStyle(voiceStyle === opt.value ? undefined : opt.value)}
                            disabled={isLoading}
                            style={{
                                padding: '10px 8px',
                                fontSize: '12px',
                                fontWeight: 500,
                                color: voiceStyle === opt.value ? colors.accentText : colors.text,
                                background: voiceStyle === opt.value ? colors.accent : 'transparent',
                                border: `1px solid ${voiceStyle === opt.value ? colors.accent : colors.border}`,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div style={{
                    padding: '12px 14px',
                    background: darkMode ? 'rgba(239,68,68,0.1)' : '#fef2f2',
                    borderRadius: '8px',
                    color: '#ef4444',
                    fontSize: '13px',
                }}>
                    {error}
                </div>
            )}

            {/* Submit */}
            <button
                type="submit"
                disabled={isLoading}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px 20px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: colors.accentText,
                    background: isLoading ? colors.textSecondary : colors.accent,
                    border: 'none',
                    borderRadius: '10px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'opacity 0.15s',
                }}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="animate-spin" size={16} />
                        Generating...
                    </>
                ) : (
                    'Generate'
                )}
            </button>
        </form>
    );
}
