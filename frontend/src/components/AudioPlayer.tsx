'use client';

import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, RotateCcw, RotateCw, Settings2, Check } from 'lucide-react';

interface AudioPlayerProps {
    audioUrl: string;
    onAudioRef?: (audio: HTMLAudioElement) => void;
    onTimeUpdate?: (currentTime: number) => void;
    darkMode?: boolean;
}

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 1.75, 2];

export function AudioPlayer({ audioUrl, onAudioRef, onTimeUpdate, darkMode = false }: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [visualizerBars, setVisualizerBars] = useState<number[]>(new Array(16).fill(10));

    useEffect(() => {
        if (audioRef.current && onAudioRef) onAudioRef(audioRef.current);
    }, [onAudioRef]);

    // Simple visualizer simulation
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            interval = setInterval(() => {
                setVisualizerBars(prev => prev.map(() => Math.max(10, Math.random() * 80)));
            }, 100);
        } else {
            setVisualizerBars(new Array(16).fill(10));
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

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

    const changeSpeed = (speed: number) => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.playbackRate = speed;
        setPlaybackSpeed(speed);
    };

    const toggleMute = () => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = isMuted ? volume : 0;
        setIsMuted(!isMuted);
    };

    const formatTime = (t: number) => {
        if (!t || isNaN(t)) return '0:00';
        const minutes = Math.floor(t / 60);
        const seconds = Math.floor(t % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            {/* Visualizer Area - Hidden on very small screens */}
            <div className="h-16 sm:h-20 md:h-24 flex items-center justify-center gap-0.5 sm:gap-1 mb-6 sm:mb-8 px-4 sm:px-8">
                {visualizerBars.map((height, i) => (
                    <div
                        key={i}
                        className="w-1.5 sm:w-2 rounded-full bg-primary/20 dark:bg-primary/40 transition-all duration-100"
                        style={{
                            height: `${height}%`,
                            opacity: isPlaying ? 0.8 : 0.3
                        }}
                    />
                ))}
            </div>

            {/* Progress Bar - Larger touch target on mobile */}
            <div className="mb-6 sm:mb-8 group">
                <div className="relative h-2 sm:h-1.5 w-full bg-secondary rounded-full overflow-hidden cursor-pointer">
                    <div
                        className="absolute top-0 left-0 h-full bg-primary transition-all duration-100"
                        style={{ width: `${progress}%` }}
                    />
                    <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        style={{ touchAction: 'none' }}
                    />
                </div>
                <div className="flex justify-between mt-2 text-xs font-medium text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Main Controls - Stack on mobile */}
            <div className="flex items-center justify-between gap-2">

                {/* Speed Control - overflow needed for dropdown */}
                <div className="relative" style={{ zIndex: showSpeedMenu ? 50 : 'auto' }}>
                    <button
                        onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                        className="flex items-center gap-1 p-2.5 sm:p-2 rounded-xl sm:rounded-lg text-xs font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors min-w-[52px] justify-center"
                        title="Playback Speed"
                    >
                        <span>{playbackSpeed}x</span>
                        <Settings2 size={14} className="hidden sm:block" />
                    </button>

                    {showSpeedMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowSpeedMenu(false)}
                            />
                            <div className="absolute bottom-full mb-3 left-0 z-50 bg-popover text-popover-foreground border border-border shadow-xl rounded-xl p-2 min-w-[140px] animate-in slide-in-from-bottom-2 duration-200">
                                <div className="text-xs font-semibold px-3 py-2 text-muted-foreground">
                                    Playback Speed
                                </div>
                                {SPEED_OPTIONS.map((speed) => (
                                    <button
                                        key={speed}
                                        onClick={() => {
                                            changeSpeed(speed);
                                            setShowSpeedMenu(false);
                                        }}
                                        className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center justify-between ${playbackSpeed === speed
                                            ? 'bg-primary/10 text-primary font-medium'
                                            : 'hover:bg-muted'
                                            }`}
                                    >
                                        <span>{speed}x</span>
                                        {playbackSpeed === speed && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Play/Pause/Skip - Center */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <button
                        onClick={() => skip(-15)}
                        className="p-2.5 sm:p-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-all active:scale-95"
                        title="Rewind 15s"
                    >
                        <RotateCcw size={18} className="sm:w-5 sm:h-5" />
                    </button>

                    <button
                        onClick={togglePlay}
                        className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                        {isPlaying ? <Pause size={24} className="fill-current sm:w-7 sm:h-7" /> : <Play size={24} className="fill-current ml-1 sm:w-7 sm:h-7" />}
                    </button>

                    <button
                        onClick={() => skip(15)}
                        className="p-2.5 sm:p-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-all active:scale-95"
                        title="Fast Forward 15s"
                    >
                        <RotateCw size={18} className="sm:w-5 sm:h-5" />
                    </button>
                </div>

                {/* Volume & Download */}
                <div className="flex items-center gap-1 sm:gap-2">
                    <button
                        onClick={toggleMute}
                        className="p-2.5 sm:p-2 rounded-xl sm:rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors hidden sm:block"
                    >
                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <a
                        href={audioUrl}
                        download="narration.mp3"
                        className="p-2.5 sm:p-2 rounded-xl sm:rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        title="Download Audio"
                    >
                        <Download size={18} />
                    </a>
                </div>
            </div>
        </div>
    );
}
