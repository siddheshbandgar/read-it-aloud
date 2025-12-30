'use client';

import { TranscriptSegment } from '@/lib/api';

interface TranscriptViewProps {
    segments: TranscriptSegment[];
    activeIndex: number;
    onSegmentClick?: (segment: TranscriptSegment) => void;
    darkMode?: boolean;
}

export function TranscriptView({ segments, activeIndex, onSegmentClick, darkMode = false }: TranscriptViewProps) {
    if (!segments.length) return null;

    const colors = {
        bg: darkMode ? '#18181b' : '#fafafa',
        border: darkMode ? '#27272a' : '#e4e4e7',
        text: darkMode ? '#a1a1aa' : '#71717a',
        textActive: darkMode ? '#09090b' : '#fafafa',
        bgActive: darkMode ? '#fafafa' : '#09090b',
        heading: darkMode ? '#fafafa' : '#09090b',
    };

    return (
        <div style={{
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '20px',
        }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: colors.heading, marginBottom: '12px' }}>
                Transcript
            </h4>
            <div style={{
                maxHeight: '240px',
                overflowY: 'auto',
                lineHeight: 1.7,
            }}>
                {segments.map((segment, index) => (
                    <span
                        key={index}
                        id={`segment-${index}`}
                        onClick={() => onSegmentClick?.(segment)}
                        style={{
                            display: 'inline',
                            padding: '2px 6px',
                            marginRight: '2px',
                            borderRadius: '4px',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.1s',
                            color: index === activeIndex ? colors.textActive : colors.text,
                            background: index === activeIndex ? colors.bgActive : 'transparent',
                        }}
                    >
                        {segment.text}
                    </span>
                ))}
            </div>
        </div>
    );
}
