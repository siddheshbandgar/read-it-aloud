'use client';

import { useState, useEffect } from 'react';
import { Podcast } from '@/lib/api';
import { Sparkles, Wand2, Mic2, Music2, Coffee, Zap, Brain, AudioLines, XCircle } from 'lucide-react';
import { MiniGame } from './MiniGame';

interface LoadingStateProps {
    podcast: Podcast | null;
    onCancel?: () => void;
}

// Messages for each stage with fun rotating tips
const STAGE_MESSAGES = {
    pending: {
        title: 'Queuing your request...',
        messages: [
            'Getting everything ready for you ☕',
            'Your narration is next in line!',
            'Warming up the AI engines...',
        ]
    },
    extracting: {
        title: 'Reading your content...',
        messages: [
            'Extracting the good stuff 📚',
            'Speed-reading like a champ!',
            'Parsing paragraphs...',
            'Finding key points...',
        ]
    },
    processing: {
        title: 'Crafting your script...',
        messages: [
            'Writing a narration script ✍️',
            'Making it sound natural...',
            'Adding perfect pacing...',
            'Polishing every sentence...',
        ]
    },
    generating_audio: {
        title: 'Recording your narration...',
        messages: [
            'AI voice actor in the studio 🎙️',
            'Adding that radio quality...',
            'Almost there!',
            'Bringing words to life!',
        ]
    },
    uploading: {
        title: 'Almost done!',
        messages: [
            'Uploading to the cloud ☁️',
            'Just a few more seconds...',
            'Preparing your audio!',
        ]
    },
    default: {
        title: 'Creating magic...',
        messages: [
            'Working on something special ✨',
            'AI is doing its thing...',
            'Great things take a moment!',
        ]
    }
};

const ICONS = [Sparkles, Wand2, Mic2, Music2, Coffee, Zap, Brain, AudioLines];

export function LoadingState({ podcast, onCancel }: LoadingStateProps) {
    const [messageIndex, setMessageIndex] = useState(0);
    const [iconIndex, setIconIndex] = useState(0);

    const status = podcast?.status || 'default';
    const stageInfo = STAGE_MESSAGES[status as keyof typeof STAGE_MESSAGES] || STAGE_MESSAGES.default;

    // Rotate messages every 3 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex(prev => (prev + 1) % stageInfo.messages.length);
            setIconIndex(prev => (prev + 1) % ICONS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [stageInfo.messages.length]);

    const Icon = ICONS[iconIndex];

    return (
        <div className="flex flex-col items-center justify-center py-12 sm:py-20 animate-fade-in text-center px-4">
            {/* Animated loader */}
            <div className="relative mb-6 sm:mb-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-muted rounded-full"></div>
                <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-primary border-t-transparent rounded-full animate-spin absolute inset-0"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Icon size={24} className="text-primary animate-pulse sm:w-7 sm:h-7" />
                </div>
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3">
                {stageInfo.title}
            </h3>

            {/* Rotating message */}
            <p
                key={messageIndex}
                className="text-muted-foreground text-sm sm:text-lg max-w-xs sm:max-w-md animate-fade-in"
            >
                {stageInfo.messages[messageIndex]}
            </p>

            {/* Progress dots */}
            <div className="flex gap-1.5 sm:gap-2 mt-6 sm:mt-8">
                {['pending', 'extracting', 'processing', 'generating_audio', 'uploading'].map((stage, i) => {
                    const currentIndex = ['pending', 'extracting', 'processing', 'generating_audio', 'uploading'].indexOf(status);
                    const isActive = i === currentIndex;
                    const isComplete = i < currentIndex;

                    return (
                        <div
                            key={stage}
                            className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${isActive
                                ? 'w-4 sm:w-6 bg-primary'
                                : isComplete
                                    ? 'w-1.5 sm:w-2 bg-primary'
                                    : 'w-1.5 sm:w-2 bg-muted'
                                }`}
                        />
                    );
                })}
            </div>

            {/* Fun tip - smaller on mobile */}
            <p className="text-xs text-muted-foreground/60 mt-4 sm:mt-6 max-w-xs sm:max-w-sm px-4">
                💡 Tip: You can paste Twitter/X threads too!
            </p>

            {/* Time-killer Game - Hidden on very small screens */}
            {(status === 'processing' || status === 'generating_audio' || status === 'extracting') && (
                <div className="animate-fade-in mt-6 sm:mt-8 w-full max-w-2xl px-2 sm:px-0">
                    <MiniGame />
                </div>
            )}

            {/* Cancel Button */}
            {onCancel && (
                <button
                    onClick={onCancel}
                    className="mt-8 sm:mt-12 flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-white hover:bg-red-500 rounded-full transition-all duration-200 group border border-transparent hover:border-red-600"
                >
                    <XCircle size={14} className="group-hover:scale-110 transition-transform sm:w-4 sm:h-4" />
                    <span>Cancel</span>
                </button>
            )}
        </div>
    );
}
