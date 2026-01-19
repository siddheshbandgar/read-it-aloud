'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Trophy, Sparkles, Zap } from 'lucide-react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
}

export function MiniGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [speedLevel, setSpeedLevel] = useState(1);

    // Game refs for high-performance loop
    const requestRef = useRef<number>();
    const scoreRef = useRef(0);
    const speedRef = useRef(5);
    const frameCountRef = useRef(0);
    const lastObstacleRef = useRef(0);

    const playerRef = useRef({
        x: 60,
        y: 150,
        dy: 0,
        width: 36,
        height: 36,
        grounded: false,
        rotation: 0,
        squash: 1,
    });

    const obstaclesRef = useRef<{
        x: number;
        y: number;
        width: number;
        height: number;
        type: string;
        passed: boolean;
        color: string;
    }[]>([]);

    const particlesRef = useRef<Particle[]>([]);
    const trailRef = useRef<{ x: number; y: number; alpha: number }[]>([]);

    // Physics Constants - Tuned for engagement
    const GRAVITY = 0.55;
    const JUMP_FORCE = -11;
    const BASE_SPEED = 5;
    const MAX_SPEED = 16;
    const ACCELERATION = 0.003;
    const GROUND_Y = 180;

    // Obstacle types with colors
    const OBSTACLES = [
        { emoji: '🐛', color: '#22c55e' },
        { emoji: '🐌', color: '#eab308' },
        { emoji: '🐞', color: '#ef4444' },
        { emoji: '🦗', color: '#14b8a6' },
    ];

    // Load high score immediately
    useEffect(() => {
        const saved = localStorage.getItem('minigame_highscore');
        if (saved) setHighScore(parseInt(saved));
    }, []);

    const spawnParticles = (x: number, y: number, count: number, color: string, size = 4) => {
        for (let i = 0; i < count; i++) {
            particlesRef.current.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6 - 2,
                life: 1.0,
                color,
                size,
            });
        }
    };

    const jump = useCallback(() => {
        if (gameState !== 'playing') {
            startGame();
            return;
        }
        const player = playerRef.current;
        if (player.grounded) {
            player.dy = JUMP_FORCE;
            player.grounded = false;
            player.squash = 0.7;
            spawnParticles(player.x + 18, player.y + 36, 6, '#94a3b8');
        }
    }, [gameState]);

    const startGame = () => {
        setGameState('playing');
        setScore(0);
        setSpeedLevel(1);
        scoreRef.current = 0;
        speedRef.current = BASE_SPEED;
        playerRef.current = {
            x: 60,
            y: 150,
            dy: 0,
            width: 36,
            height: 36,
            grounded: false,
            rotation: 0,
            squash: 1,
        };
        obstaclesRef.current = [];
        particlesRef.current = [];
        trailRef.current = [];
        frameCountRef.current = 0;
        lastObstacleRef.current = 0;
    };

    const gameOver = () => {
        setGameState('gameover');
        if (scoreRef.current > highScore) {
            setHighScore(scoreRef.current);
            localStorage.setItem('minigame_highscore', scoreRef.current.toString());
        }
        spawnParticles(playerRef.current.x + 18, playerRef.current.y + 18, 25, '#ef4444', 6);
    };

    const update = useCallback(() => {
        if (gameState !== 'playing') return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const isDark = document.documentElement.classList.contains('dark');

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Dynamic background based on speed
        const speedProgress = (speedRef.current - BASE_SPEED) / (MAX_SPEED - BASE_SPEED);
        if (isDark) {
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, `hsl(220, 20%, ${12 + speedProgress * 5}%)`);
            gradient.addColorStop(1, `hsl(220, 25%, ${8 + speedProgress * 3}%)`);
            ctx.fillStyle = gradient;
        } else {
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, `hsl(200, ${70 + speedProgress * 20}%, ${95 - speedProgress * 10}%)`);
            gradient.addColorStop(1, `hsl(200, ${60 + speedProgress * 20}%, ${98 - speedProgress * 5}%)`);
            ctx.fillStyle = gradient;
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Speed lines (intensity based on speed)
        if (speedRef.current > 8) {
            const lineCount = Math.floor((speedRef.current - 8) * 2);
            ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
            ctx.lineWidth = 1;
            for (let i = 0; i < lineCount; i++) {
                const y = Math.random() * canvas.height;
                ctx.beginPath();
                ctx.moveTo(canvas.width, y);
                ctx.lineTo(canvas.width - 20 - Math.random() * 30, y);
                ctx.stroke();
            }
        }

        // Update Speed
        if (speedRef.current < MAX_SPEED) {
            speedRef.current += ACCELERATION;

            // Speed milestones
            const newLevel = Math.floor((speedRef.current - BASE_SPEED) / 2) + 1;
            if (newLevel > speedLevel && newLevel <= 6) {
                setSpeedLevel(newLevel);
                spawnParticles(canvas.width / 2, canvas.height / 2, 15, '#fbbf24', 5);
            }
        }

        // Ground with gradient
        const groundGradient = ctx.createLinearGradient(0, GROUND_Y, 0, canvas.height);
        groundGradient.addColorStop(0, isDark ? '#334155' : '#cbd5e1');
        groundGradient.addColorStop(1, isDark ? '#1e293b' : '#94a3b8');
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

        // Ground line
        ctx.strokeStyle = isDark ? '#475569' : '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, GROUND_Y);
        ctx.lineTo(canvas.width, GROUND_Y);
        ctx.stroke();

        // Update Player
        const player = playerRef.current;
        player.dy += GRAVITY;
        player.y += player.dy;

        // Squash/stretch animation recovery
        player.squash += (1 - player.squash) * 0.15;

        // Rotate while jumping
        if (!player.grounded) {
            player.rotation += 0.12;
        } else {
            player.rotation *= 0.8;
        }

        // Ground collision
        if (player.y + player.height > GROUND_Y) {
            player.y = GROUND_Y - player.height;
            player.dy = 0;
            if (!player.grounded) {
                player.squash = 1.3;
                spawnParticles(player.x + 18, GROUND_Y, 4, isDark ? '#64748b' : '#94a3b8');
            }
            player.grounded = true;
        }

        // Player trail
        if (frameCountRef.current % 3 === 0) {
            trailRef.current.push({ x: player.x + 18, y: player.y + 18, alpha: 0.6 });
            if (trailRef.current.length > 8) trailRef.current.shift();
        }

        // Draw trail
        trailRef.current.forEach((t, i) => {
            t.alpha -= 0.08;
            if (t.alpha > 0) {
                ctx.globalAlpha = t.alpha * 0.5;
                ctx.fillStyle = isDark ? '#60a5fa' : '#3b82f6';
                ctx.beginPath();
                ctx.arc(t.x, t.y, 8 - i * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.globalAlpha = 1;
        trailRef.current = trailRef.current.filter(t => t.alpha > 0);

        // Spawn Obstacles with variable gap
        frameCountRef.current++;
        const minGap = Math.max(50, 90 - speedRef.current * 3);
        const framesSinceLastObstacle = frameCountRef.current - lastObstacleRef.current;

        if (framesSinceLastObstacle > minGap && Math.random() > 0.4) {
            const obs = OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)];
            obstaclesRef.current.push({
                x: canvas.width + 20,
                y: GROUND_Y - 32,
                width: 28,
                height: 28,
                type: obs.emoji,
                color: obs.color,
                passed: false,
            });
            lastObstacleRef.current = frameCountRef.current;
        }

        // Update & Draw Obstacles
        obstaclesRef.current.forEach((obs) => {
            obs.x -= speedRef.current;

            // Glow effect
            ctx.shadowColor = obs.color;
            ctx.shadowBlur = 10;

            // Draw obstacle with bounce animation
            const bounce = Math.sin(frameCountRef.current * 0.1 + obs.x * 0.01) * 2;
            ctx.font = '26px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(obs.type, obs.x + 14, obs.y + 14 + bounce);

            ctx.shadowBlur = 0;

            // Collision detection
            const padding = 10;
            if (
                player.x + padding < obs.x + obs.width - padding &&
                player.x + player.width - padding > obs.x + padding &&
                player.y + padding < obs.y + obs.height - padding &&
                player.y + player.height - padding > obs.y + padding
            ) {
                gameOver();
            }

            // Score
            if (!obs.passed && player.x > obs.x + obs.width) {
                obs.passed = true;
                scoreRef.current += 1;
                setScore(scoreRef.current);
                spawnParticles(obs.x + 14, obs.y + 14, 8, obs.color);
            }
        });

        // Cleanup obstacles
        obstaclesRef.current = obstaclesRef.current.filter(obs => obs.x > -50);

        // Update & Draw Particles
        particlesRef.current.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= 0.04;

            if (p.life > 0) {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.globalAlpha = 1;
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);

        // Draw Player with squash/stretch
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        ctx.rotate(player.rotation);
        ctx.scale(2 - player.squash, player.squash);

        // Player glow
        ctx.shadowColor = isDark ? '#60a5fa' : '#3b82f6';
        ctx.shadowBlur = 15;

        ctx.font = '28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🤖', 0, 0);

        ctx.shadowBlur = 0;
        ctx.restore();

        // In-canvas score display
        ctx.font = 'bold 16px Inter, system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillStyle = isDark ? '#f1f5f9' : '#1e293b';
        ctx.fillText(`${score}`, canvas.width - 16, 28);

        if (gameState === 'playing') {
            requestRef.current = requestAnimationFrame(update);
        }
    }, [gameState, speedLevel]);

    useEffect(() => {
        if (gameState === 'playing') {
            requestRef.current = requestAnimationFrame(update);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [gameState, update]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                jump();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [jump]);

    return (
        <div className="relative w-full max-w-[620px] mx-auto px-2 sm:px-0">
            {/* Premium Glass Container */}
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/20 dark:border-white/10 bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-xl shadow-2xl shadow-black/10 dark:shadow-black/30">

                {/* Top HUD Bar */}
                <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-4 py-3 bg-gradient-to-b from-black/20 to-transparent dark:from-black/40">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full shadow-lg text-xs font-bold">
                        <Trophy size={14} className="text-amber-500" />
                        <span className="text-slate-700 dark:text-slate-200">{highScore}</span>
                    </div>

                    {gameState === 'playing' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full shadow-lg text-xs font-bold">
                            <Zap size={14} className="text-blue-500" />
                            <span className="text-slate-700 dark:text-slate-200">LVL {speedLevel}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg text-xs font-bold text-white">
                        <Sparkles size={14} />
                        <span>{score}</span>
                    </div>
                </div>

                {/* Game Canvas */}
                <div
                    className="relative cursor-pointer w-full h-[180px] sm:h-[220px]"
                    onClick={jump}
                >
                    <canvas
                        ref={canvasRef}
                        width={620}
                        height={220}
                        className="w-full h-full block"
                    />

                    {/* Start/Game Over Overlay */}
                    {gameState !== 'playing' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-white/60 to-white/80 dark:from-slate-900/70 dark:to-slate-900/90 backdrop-blur-sm z-10 px-4">
                            <div className="text-center mb-4 sm:mb-6">
                                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 dark:text-white drop-shadow-sm">
                                    {gameState === 'start' ? '🤖 BUG RUNNER' : '💥 CRASHED!'}
                                </h3>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-2">
                                    {gameState === 'start'
                                        ? 'Dodge bugs while your audio generates'
                                        : `You squashed ${score} bugs!`}
                                </p>
                            </div>

                            <button
                                className="group relative px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-full shadow-xl shadow-purple-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                onClick={(e) => { e.stopPropagation(); startGame(); }}
                            >
                                {gameState === 'start' ? (
                                    <>
                                        <Play size={18} fill="currentColor" />
                                        START GAME
                                    </>
                                ) : (
                                    <>
                                        <RotateCcw size={18} />
                                        TRY AGAIN
                                    </>
                                )}
                            </button>

                            <p className="mt-6 text-xs text-slate-500 dark:text-slate-400 font-mono tracking-wider">
                                PRESS SPACE OR TAP TO JUMP
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
