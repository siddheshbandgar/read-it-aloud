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
            'Extracting the good stuff from your article 📚',
            'Our AI is speed-reading like a champ!',
            'Parsing paragraphs and pulling insights...',
            'Finding the key points you\'ll love to hear',
        ]
    },
    processing: {
        title: 'Crafting your script...',
        messages: [
            'Writing a narration script just for you ✍️',
            'Making the content sound natural and engaging',
            'Adding the perfect flow and pacing...',
            'Polishing every sentence to perfection',
        ]
    },
    generating_audio: {
        title: 'Recording your narration...',
        messages: [
            'Our AI voice actor is in the studio now 🎙️',
            'Adding that professional radio quality...',
            'Almost there! Fine-tuning the audio...',
            'Making it sound like a real narrator!',
            'This is the fun part - bringing words to life!',
        ]
    },
    uploading: {
        title: 'Almost done!',
        messages: [
            'Uploading your fresh narration to the cloud ☁️',
            'Just a few more seconds...',
            'Preparing your listening experience!',
        ]
    },
    default: {
        title: 'Creating magic...',
        messages: [
            'Working on something special for you ✨',
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
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in text-center">
            {/* Animated loader */}
            <div className="relative mb-8">
                <div className="w-20 h-20 border-4 border-muted rounded-full"></div>
                <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin absolute inset-0"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Icon size={28} className="text-primary animate-pulse" />
                </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-semibold mb-3">
                {stageInfo.title}
            </h3>

            {/* Rotating message */}
            <p
                key={messageIndex}
                className="text-muted-foreground text-lg max-w-md animate-fade-in"
            >
                {stageInfo.messages[messageIndex]}
            </p>

            {/* Progress dots */}
            <div className="flex gap-2 mt-8">
                {['pending', 'extracting', 'processing', 'generating_audio', 'uploading'].map((stage, i) => {
                    const currentIndex = ['pending', 'extracting', 'processing', 'generating_audio', 'uploading'].indexOf(status);
                    const isActive = i === currentIndex;
                    const isComplete = i < currentIndex;

                    return (
                        <div
                            key={stage}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${isActive
                                ? 'w-6 bg-primary'
                                : isComplete
                                    ? 'bg-primary'
                                    : 'bg-muted'
                                }`}
                        />
                    );
                })}
            </div>

            {/* Fun tip */}
            <p className="text-xs text-muted-foreground/60 mt-6 max-w-sm">
                💡 Tip: You can paste Twitter/X threads too - we'll convert those into audio!
            </p>

            {/* Time-killer Game */}
            {(status === 'processing' || status === 'generating_audio' || status === 'extracting') && (
                <div className="animate-fade-in mt-8 w-full max-w-2xl">
                    <MiniGame />
                </div>
            )}

            {/* Cancel Button */}
            {onCancel && (
                <button
                    onClick={onCancel}
                    className="mt-12 flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-muted-foreground hover:text-white hover:bg-red-500 rounded-full transition-all duration-200 group border border-transparent hover:border-red-600 hover:shadow-lg hover:shadow-red-500/20"
                >
                    <XCircle size={16} className="group-hover:scale-110 transition-transform" />
                    <span>Cancel Generation</span>
                </button>
            )}
        </div>
    );
}
