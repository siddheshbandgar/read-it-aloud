'use client';

import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, RotateCcw, RotateCw } from 'lucide-react';

interface AudioPlayerProps {
    audioUrl: string;
    onAudioRef?: (audio: HTMLAudioElement) => void;
    onTimeUpdate?: (currentTime: number) => void;
    darkMode?: boolean;
}

const SPEED_OPTIONS = [1, 1.25, 1.5, 1.75, 2];

export function AudioPlayer({ audioUrl, onAudioRef, onTimeUpdate, darkMode = false }: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    const colors = {
        bg: darkMode ? '#18181b' : '#fafafa',
        border: darkMode ? '#27272a' : '#e4e4e7',
        text: darkMode ? '#fafafa' : '#09090b',
        textSecondary: darkMode ? '#71717a' : '#a1a1aa',
        accent: darkMode ? '#fafafa' : '#09090b',
        accentText: darkMode ? '#09090b' : '#fafafa',
        track: darkMode ? '#27272a' : '#e4e4e7',
    };

    useEffect(() => {
        if (audioRef.current && onAudioRef) onAudioRef(audioRef.current);
    }, [onAudioRef]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => { setCurrentTime(audio.currentTime); onTimeUpdate?.(audio.currentTime); };
        const handleLoadedMetadata = () => setDuration(audio.duration);
        const handleEnded = () => setIsPlaying(false);
        const handleSeeked = () => onTimeUpdate?.(audio.currentTime);

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('seeked', handleSeeked);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('seeked', handleSeeked);
        };
    }, [onTimeUpdate]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) audio.pause();
        else audio.play();
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;
        const time = parseFloat(e.target.value);
        audio.currentTime = time;
        setCurrentTime(time);
        onTimeUpdate?.(time);
    };

    const skip = (seconds: number) => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
        setCurrentTime(audio.currentTime);
        onTimeUpdate?.(audio.currentTime);
    };

    const changeSpeed = () => {
        const audio = audioRef.current;
        if (!audio) return;
        const nextSpeed = SPEED_OPTIONS[(SPEED_OPTIONS.indexOf(playbackSpeed) + 1) % SPEED_OPTIONS.length];
        audio.playbackRate = nextSpeed;
        setPlaybackSpeed(nextSpeed);
    };

    const toggleMute = () => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = isMuted ? volume : 0;
        setIsMuted(!isMuted);
    };

    const formatTime = (t: number) => `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, '0')}`;
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '20px' }}>
            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            {/* Progress */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ position: 'relative', height: '4px', background: colors.track, borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: colors.accent, transition: 'width 0.1s' }} />
                    <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: colors.textSecondary, marginTop: '8px' }}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <button onClick={() => skip(-15)} style={{ padding: '10px', background: 'transparent', border: 'none', color: colors.textSecondary, cursor: 'pointer', borderRadius: '50%' }}>
                    <RotateCcw size={18} />
                </button>

                <button
                    onClick={togglePlay}
                    style={{
                        width: '56px',
                        height: '56px',
                        background: colors.accent,
                        color: colors.accentText,
                        borderRadius: '50%',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {isPlaying ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: '3px' }} />}
                </button>

                <button onClick={() => skip(15)} style={{ padding: '10px', background: 'transparent', border: 'none', color: colors.textSecondary, cursor: 'pointer', borderRadius: '50%' }}>
                    <RotateCw size={18} />
                </button>
            </div>

            {/* Bottom controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
                <button
                    onClick={changeSpeed}
                    style={{
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: playbackSpeed !== 1 ? colors.accent : 'transparent',
                        color: playbackSpeed !== 1 ? colors.accentText : colors.textSecondary,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                    }}
                >
                    {playbackSpeed}×
                </button>

                <button onClick={toggleMute} style={{ padding: '6px', background: 'transparent', border: 'none', color: colors.textSecondary, cursor: 'pointer' }}>
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>

                <a href={audioUrl} download="podcast.mp3" style={{ padding: '6px', color: colors.textSecondary }}>
                    <Download size={16} />
                </a>
            </div>
        </div>
    );
}
