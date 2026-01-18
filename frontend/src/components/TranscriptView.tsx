'use client';

import { useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface Segment {
    start_time: number;
    end_time: number;
    text: string;
}

interface TranscriptViewProps {
    segments: Segment[];
    activeIndex: number;
    onSegmentClick: (segment: Segment) => void;
    darkMode?: boolean;
}

export function TranscriptView({ segments, activeIndex, onSegmentClick, darkMode = false }: TranscriptViewProps) {
    const activeRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to active segment
    useEffect(() => {
        if (activeRef.current && containerRef.current) {
            const container = containerRef.current;
            const element = activeRef.current;

            const elementTop = element.offsetTop;
            const elementHeight = element.offsetHeight;
            const containerHeight = container.offsetHeight;
            const containerScrollTop = container.scrollTop;

            // Simple logic: keep active element somewhat centered if possible
            const targetScroll = elementTop - (containerHeight / 2) + (elementHeight / 2);

            container.scrollTo({
                top: targetScroll,
                behavior: 'smooth'
            });
        }
    }, [activeIndex]);

    const formatTime = (t: number) => {
        const minutes = Math.floor(t / 60);
        const seconds = Math.floor(t % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col h-[400px]">
            <div className="p-4 border-b border-border/50 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Clock size={16} />
                <span>Transcript</span>
            </div>

            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto p-4 space-y-2 scroll-smooth"
            >
                {segments.map((segment, index) => {
                    const isActive = index === activeIndex;
                    return (
                        <div
                            key={index}
                            ref={isActive ? activeRef : null}
                            onClick={() => onSegmentClick(segment)}
                            className={`p-3 rounded-lg transition-all cursor-pointer text-sm md:text-base leading-relaxed ${isActive
                                    ? 'bg-primary text-primary-foreground shadow-sm scale-[1.01]'
                                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                }`}
                        >
                            <span className={`text-xs font-mono mr-3 opacity-60 inline-block min-w-[32px] ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                                }`}>
                                {formatTime(segment.start_time)}
                            </span>
                            {segment.text}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
