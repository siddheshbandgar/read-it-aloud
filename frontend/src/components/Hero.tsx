'use client';

import { Play, Sparkles } from 'lucide-react';

interface HeroProps {
    darkMode?: boolean;
}

export function Hero({ darkMode = false }: HeroProps) {
    const colors = {
        text: darkMode ? '#fafafa' : '#09090b',
        textSecondary: darkMode ? '#a1a1aa' : '#71717a',
        buttonBg: darkMode ? '#ffffff' : '#000000',
        buttonText: darkMode ? '#000000' : '#ffffff',
        buttonHover: darkMode ? '#e5e5e5' : '#27272a',
    };

    return (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6 ${darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'
                }`}>
                <Sparkles size={12} />
                <span>AI-Powered Audio Support</span>
            </div>

            <h1 className={`text-5xl md:text-6xl font-bold tracking-tight mb-6 max-w-3xl ${darkMode ? 'text-zinc-50' : 'text-zinc-900'
                }`}>
                Turn Articles into <br />
                <span className={darkMode ? 'text-blue-400' : 'text-blue-600'}>Audio, Instantly.</span>
            </h1>

            <p className={`text-lg md:text-xl max-w-2xl mb-10 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'
                }`}>
                Listen to your favorite blog posts, news, and research papers on the go.
                Professional AI narration for your reading list.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                    href="#generate"
                    className="group flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold transition-all hover:scale-105 active:scale-95"
                    style={{
                        backgroundColor: colors.buttonBg,
                        color: colors.buttonText,
                    }}
                >
                    <Play size={20} className="fill-current" />
                    Create Your Own
                </a>
            </div>
        </div>
    );
}
