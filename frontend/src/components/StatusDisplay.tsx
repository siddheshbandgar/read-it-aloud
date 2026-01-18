'use client';

import { Loader2, Music, CheckCircle2 } from 'lucide-react';
import { Podcast } from '@/lib/api';

interface StatusDisplayProps {
    podcast: Podcast;
    darkMode?: boolean;
}

export function StatusDisplay({ podcast, darkMode = false }: StatusDisplayProps) {
    // Map status to user-friendly messages and progress
    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'queued':
                return { label: 'Queued', message: 'Waiting for server...', progress: 10 };
            case 'processing':
                return { label: 'Processing', message: 'Analyzing content & generating script...', progress: 40 };
            case 'generating_audio':
                return { label: 'Synthesizing', message: 'Creating high-quality audio...', progress: 75 };
            case 'completed':
                return { label: 'Ready', message: 'Narration is ready!', progress: 100 };
            case 'failed':
                return { label: 'Failed', message: 'Something went wrong.', progress: 100 };
            default:
                return { label: 'Working', message: 'Processing...', progress: 20 };
        }
    };

    const { label, message, progress } = getStatusInfo(podcast.status);
    const isError = podcast.status === 'failed';

    return (
        <div className={`rounded-xl p-5 border ${isError ? 'bg-red-50 border-red-200' : 'bg-card border-border'}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    {podcast.status !== 'completed' && !isError ? (
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Loader2 size={18} className="animate-spin text-primary" />
                        </div>
                    ) : isError ? (
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                    ) : (
                        <CheckCircle2 size={24} className="text-green-500" />
                    )}
                    <div>
                        <h4 className="font-semibold text-sm text-foreground">{label}</h4>
                        <p className="text-xs text-muted-foreground">{message}</p>
                    </div>
                </div>
                <span className="text-xs font-mono font-medium text-muted-foreground">{progress}%</span>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-500 ease-out ${isError ? 'bg-red-500' : 'bg-primary'
                        }`}
                    style={{ width: `${progress}%` }}
                />
            </div>

            {!isError && podcast.status !== 'completed' && (
                <p className="text-center text-xs text-muted-foreground mt-3 animate-pulse">
                    This usually takes about a minute...
                </p>
            )}
        </div>
    );
}
