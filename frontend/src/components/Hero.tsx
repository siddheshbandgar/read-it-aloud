'use client';

import { Play, Sparkles } from 'lucide-react';

interface HeroProps {
    darkMode?: boolean;
}

export function Hero({ darkMode = false }: HeroProps) {
    return (
        <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-center px-4">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4 sm:mb-6 ${darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'
                }`}>
                <Sparkles size={12} />
                <span>AI-Powered Audio</span>
            </div>

            <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 sm:mb-6 max-w-3xl leading-tight ${darkMode ? 'text-zinc-50' : 'text-zinc-900'
                }`}>
                Turn Articles into{' '}
                <span className={darkMode ? 'text-blue-400' : 'text-blue-600'}>
                    Audio, Instantly.
                </span>
            </h1>

            <p className={`text-base sm:text-lg md:text-xl max-w-xl sm:max-w-2xl mb-8 sm:mb-10 leading-relaxed ${darkMode ? 'text-zinc-400' : 'text-zinc-600'
                }`}>
                Listen to your favorite blog posts, news, and research papers on the go.
            </p>

            <a
                href="#generate"
                className={`group flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold transition-all hover:scale-105 active:scale-95 text-sm sm:text-base shadow-lg ${darkMode
                    ? 'bg-white text-black hover:bg-zinc-200'
                    : 'bg-black text-white hover:bg-zinc-800'
                    }`}
            >
                <Play size={18} className="fill-current sm:w-5 sm:h-5" />
                Create Your Own
            </a>
        </div>
    );
}
