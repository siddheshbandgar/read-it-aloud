'use client';

import { useState } from 'react';
import { Link, FileText, Loader2, Globe, Twitter, Mic } from 'lucide-react';

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
    { value: '2min', label: 'Short (2m)' },
    { value: '5min', label: 'Medium (5m)' },
    { value: '10min', label: 'Long (10m)' },
    { value: 'full', label: 'Full Read' },
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
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input Type Toggle */}
            <div className="grid grid-cols-2 p-1 bg-secondary rounded-lg">
                {[
                    { key: 'url', label: 'Article URL', icon: Link },
                    { key: 'text', label: 'Paste Text', icon: FileText }
                ].map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setInputMode(key as 'url' | 'text')}
                        className={`flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all ${inputMode === key
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Icon size={16} /> {label}
                    </button>
                ))}
            </div>

            {/* Inputs */}
            <div className="space-y-4">
                {inputMode === 'url' ? (
                    <div className="space-y-2">
                        <input
                            type="url"
                            value={sourceUrl}
                            onChange={(e) => setSourceUrl(e.target.value)}
                            placeholder="https://example.com/article"
                            disabled={isLoading}
                            className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        />
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground pl-1">
                            <span className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                                <Globe size={10} /> Web Articles
                            </span>
                            <span className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full">
                                <Twitter size={10} /> X/Twitter Threads
                            </span>
                        </div>
                    </div>
                ) : (
                    <textarea
                        value={sourceText}
                        onChange={(e) => setSourceText(e.target.value)}
                        placeholder="Paste your content here..."
                        rows={6}
                        disabled={isLoading}
                        className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"
                    />
                )}
            </div>

            {/* Settings Components */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Duration */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-foreground/80">Length</label>
                    <div className="grid grid-cols-2 gap-2">
                        {DURATION_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setDurationType(opt.value)}
                                disabled={isLoading}
                                className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${durationType === opt.value
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background text-muted-foreground border-input hover:border-foreground/30'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Voice */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                        Voice Style <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {VOICE_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setVoiceStyle(voiceStyle === opt.value ? undefined : opt.value)}
                                disabled={isLoading}
                                className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${voiceStyle === opt.value
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background text-muted-foreground border-input hover:border-foreground/30'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm rounded-lg">
                    {error}
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/25 transition-all transform active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Creating Narration...</span>
                    </>
                ) : (
                    <>
                        <Mic size={20} />
                        <span>Generate Audio</span>
                    </>
                )}
            </button>
        </form>
    );
}
