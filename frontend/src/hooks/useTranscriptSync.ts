'use client';

import { useState, useEffect, useCallback } from 'react';
import { TranscriptSegment } from '@/lib/api';

interface UseTranscriptSyncOptions {
    segments: TranscriptSegment[];
    audioElement: HTMLAudioElement | null;
}

interface TranscriptSyncResult {
    activeIndex: number;
    setActiveIndex: (index: number) => void;
    activeSegment: TranscriptSegment | null;
    scrollToActive: () => void;
}

/**
 * Custom hook for syncing transcript highlighting with audio playback.
 * Tracks the current audio time and finds the active sentence.
 */
export function useTranscriptSync({
    segments,
    audioElement,
}: UseTranscriptSyncOptions): TranscriptSyncResult {
    const [activeIndex, setActiveIndex] = useState<number>(-1);

    // Find active segment based on current time
    const findActiveSegment = useCallback(
        (currentTime: number): number => {
            if (!segments.length) return -1;

            // Binary search for efficiency with large transcripts
            let left = 0;
            let right = segments.length - 1;

            while (left <= right) {
                const mid = Math.floor((left + right) / 2);
                const segment = segments[mid];

                if (currentTime >= segment.start_time && currentTime < segment.end_time) {
                    return mid;
                } else if (currentTime < segment.start_time) {
                    right = mid - 1;
                } else {
                    left = mid + 1;
                }
            }

            // If between segments, return the previous one
            if (left > 0 && left < segments.length) {
                const prev = segments[left - 1];
                if (currentTime >= prev.start_time && currentTime <= prev.end_time + 0.5) {
                    return left - 1;
                }
            }

            return -1;
        },
        [segments]
    );

    // Update active index on time update
    useEffect(() => {
        if (!audioElement) return;

        const handleTimeUpdate = () => {
            const currentTime = audioElement.currentTime;
            const newIndex = findActiveSegment(currentTime);

            if (newIndex !== activeIndex) {
                setActiveIndex(newIndex);
            }
        };

        // Update more frequently for smoother highlighting
        const interval = setInterval(() => {
            if (!audioElement.paused) {
                handleTimeUpdate();
            }
        }, 100);

        audioElement.addEventListener('timeupdate', handleTimeUpdate);
        audioElement.addEventListener('seeked', handleTimeUpdate);

        return () => {
            clearInterval(interval);
            audioElement.removeEventListener('timeupdate', handleTimeUpdate);
            audioElement.removeEventListener('seeked', handleTimeUpdate);
        };
    }, [audioElement, activeIndex, findActiveSegment]);

    // Reset on segments change
    useEffect(() => {
        setActiveIndex(-1);
    }, [segments]);

    // Scroll to active segment
    const scrollToActive = useCallback(() => {
        if (activeIndex >= 0) {
            const element = document.getElementById(`segment-${activeIndex}`);
            if (element) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }
        }
    }, [activeIndex]);

    return {
        activeIndex,
        setActiveIndex,
        activeSegment: activeIndex >= 0 ? segments[activeIndex] : null,
        scrollToActive,
    };
}
