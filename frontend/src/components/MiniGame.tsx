'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Trophy, Sparkles } from 'lucide-react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
}

export function MiniGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);

    // Game refs for high-performance loop
    const requestRef = useRef<number>();
    const scoreRef = useRef(0);
    const speedRef = useRef(5);
    const frameCountRef = useRef(0);

    const playerRef = useRef({
        x: 50,
        y: 150,
        dy: 0,
        width: 40,
        height: 40,
        grounded: false,
        rotation: 0
    });

    const obstaclesRef = useRef<{
        x: number;
        y: number;
        width: number;
        height: number;
        type: string;
        passed: boolean;
    }[]>([]);

    const particlesRef = useRef<Particle[]>([]);
    const bgOffsetRef = useRef(0);

    // Constants
    const GRAVITY = 0.5;
    const JUMP_FORCE = -10;
    const BASE_SPEED = 5;
    const MAX_SPEED = 14;
    const ACCELERATION = 0.002;

    // Assets
    const PLAYER_SPRITE = '🤖';
    const OBSTACLE_SPRITES = ['🐛', '🐌', '🐞', '🧱'];

    useEffect(() => {
        const saved = localStorage.getItem('minigame_highscore');
        if (saved) setHighScore(parseInt(saved));
    }, []);

    const spawnParticles = (x: number, y: number, count: number, color: string) => {
        for (let i = 0; i < count; i++) {
            particlesRef.current.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1.0,
                color
            });
        }
    };

    const jump = useCallback(() => {
        if (gameState !== 'playing') {
            if (gameState !== 'start') startGame();
            return;
        }
        if (playerRef.current.grounded) {
            playerRef.current.dy = JUMP_FORCE;
            playerRef.current.grounded = false;
            // Jump dust
            spawnParticles(playerRef.current.x + 20, playerRef.current.y + 40, 5, '#cbd5e1');
        }
    }, [gameState]);

    const startGame = () => {
        setGameState('playing');
        setScore(0);
        scoreRef.current = 0;
        speedRef.current = BASE_SPEED;
        playerRef.current = {
            x: 50,
            y: 150,
            dy: 0,
            width: 40,
            height: 40,
            grounded: false,
            rotation: 0
        };
        obstaclesRef.current = [];
        particlesRef.current = [];
        frameCountRef.current = 0;
    };

    const gameOver = () => {
        setGameState('gameover');
        if (scoreRef.current > highScore) {
            setHighScore(scoreRef.current);
            localStorage.setItem('minigame_highscore', scoreRef.current.toString());
        }
        // Explosion effect
        spawnParticles(playerRef.current.x + 20, playerRef.current.y + 20, 20, '#ef4444');
    };

    const update = useCallback(() => {
        if (gameState !== 'playing') return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update Speed
        if (speedRef.current < MAX_SPEED) {
            speedRef.current += ACCELERATION;
        }

        // Background (Always Light Sky)
        bgOffsetRef.current += speedRef.current * 0.1;
        ctx.fillStyle = '#f0f9ff'; // Sky Blue 50
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Ground Line
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 20);
        ctx.lineTo(canvas.width, canvas.height - 20);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Update Player
        const player = playerRef.current;
        player.dy += GRAVITY;
        player.y += player.dy;

        // Rotate while jumping
        if (!player.grounded) {
            player.rotation += 0.1;
        } else {
            player.rotation = 0;
            // Round it to nearest n*pi if needed, but 0 is fine
        }

        // Ground/Ceiling collision
        if (player.y + player.height > canvas.height - 20) {
            player.y = canvas.height - 20 - player.height;
            player.dy = 0;
            if (!player.grounded) {
                // Land dust
                spawnParticles(player.x + 20, player.y + 40, 3, '#cbd5e1');
            }
            player.grounded = true;
        }

        // Spawn Obstacles (Randomized)
        frameCountRef.current++;
        // Spawn rate decreases as speed increases to keep distance manageable
        const currentSpawnRate = Math.max(40, Math.floor(100 - (speedRef.current * 3)));

        if (frameCountRef.current % currentSpawnRate === 0 && Math.random() > 0.3) {
            const type = OBSTACLE_SPRITES[Math.floor(Math.random() * OBSTACLE_SPRITES.length)];
            obstaclesRef.current.push({
                x: canvas.width,
                y: canvas.height - 55,
                width: 30,
                height: 30,
                type,
                passed: false
            });
        }

        // Update Obstacles
        obstaclesRef.current.forEach((obs) => {
            obs.x -= speedRef.current;

            // Simplified Hitbox (make it smaller than sprite for forgiveness)
            const padding = 12;
            if (
                player.x + padding < obs.x + obs.width - padding &&
                player.x + player.width - padding > obs.x + padding &&
                player.y + padding < obs.y + obs.height - padding &&
                player.y + player.height - padding > obs.y + padding
            ) {
                gameOver();
            }

            // Score update
            if (!obs.passed && player.x > obs.x + obs.width) {
                obs.passed = true;
                scoreRef.current += 1;
                setScore(scoreRef.current);
            }
        });

        // Cleanup Obstacles
        obstaclesRef.current = obstaclesRef.current.filter(obs => obs.x + obs.width > 0);

        // Update & Draw Particles
        particlesRef.current.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;

            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);

        // Draw Player (with Rotation)
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        ctx.rotate(player.rotation);
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#0f172a'; // Ensure dark text
        ctx.fillText(PLAYER_SPRITE, 0, 0); // Draw centered
        ctx.restore();

        // Draw Obstacles
        obstaclesRef.current.forEach(obs => {
            ctx.font = '28px Arial';
            ctx.fillStyle = '#0f172a'; // Ensure dark text
            ctx.fillText(obs.type, obs.x, obs.y + 25);
        });

        if (gameState === 'playing') {
            requestRef.current = requestAnimationFrame(update);
        }
    }, [gameState]);

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
        <div className="relative mt-8 w-full max-w-[600px] overflow-hidden rounded-2xl border border-border/50 bg-background/50 shadow-xl backdrop-blur-sm transition-all hover:shadow-2xl hover:border-primary/20 bg-white/10 dark:bg-slate-900/10">
            {/* Header / HUD */}
            <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center pointer-events-none">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-md rounded-full shadow-sm border border-border/50 text-xs font-bold text-muted-foreground animate-in slide-in-from-top-2">
                    <Trophy size={12} className="text-yellow-500" />
                    <span>BEST: {highScore}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-md rounded-full shadow-sm border border-border/50 text-xs font-bold text-primary animate-in slide-in-from-top-2 delay-100">
                    <Sparkles size={12} />
                    <span>SCORE: {score}</span>
                </div>
            </div>

            <div
                className="relative cursor-pointer w-full h-[220px] bg-gradient-to-b from-sky-50 to-white"
                onClick={jump}
            >
                <canvas
                    ref={canvasRef}
                    width={600}
                    height={220}
                    className="w-full h-full block"
                />

                {gameState !== 'playing' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px] transition-all z-20">
                        <div className="mb-6 text-center animate-in zoom-in-50 duration-300">
                            <h3 className="text-3xl font-black text-slate-800 tracking-tighter drop-shadow-sm">
                                {gameState === 'start' ? 'BUG RUNNER' : 'CRASHED!'}
                            </h3>
                            <p className="text-sm font-medium text-slate-600 mt-1">
                                {gameState === 'start' ? 'Kill time while we build your audio' : `You fixed ${score} bugs!`}
                            </p>
                        </div>

                        <button
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/25 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500"
                            onClick={(e) => { e.stopPropagation(); startGame(); }}
                        >
                            {gameState === 'start' ? 'PLAY NOW' : 'RESTART SYSTEM'}
                            {gameState === 'start' ? <Play size={16} fill="currentColor" /> : <RotateCcw size={16} />}
                        </button>

                        <div className="mt-8 text-[10px] font-mono text-slate-500 tracking-widest uppercase">
                            [ SPACE ] TO JUMP
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
