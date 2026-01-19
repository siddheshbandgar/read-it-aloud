import { getPublicPodcast } from '@/lib/api';
import { PublicPodcastPlayer } from './PublicPodcastPlayer';
import { Headphones } from 'lucide-react';

interface SharePageProps {
    params: { slug: string };
}

/**
 * Public share page for viewing shared narrations.
 */
export default async function SharePage({ params }: SharePageProps) {
    const { slug } = params;

    try {
        const podcast = await getPublicPodcast(slug);

        return (
            <main className="min-h-screen bg-background">
                <header className="border-b border-border/40 bg-background/80 backdrop-blur-md">
                    <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-2.5">
                        <div className="bg-foreground text-background p-1.5 rounded-lg">
                            <Headphones size={18} strokeWidth={3} />
                        </div>
                        <span className="text-base font-bold tracking-tight">
                            Read-It-Aloud
                        </span>
                    </div>
                </header>

                <div className="max-w-3xl mx-auto px-6 py-12">
                    <PublicPodcastPlayer podcast={podcast} shareSlug={slug} />
                </div>
            </main>
        );
    } catch (error) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center px-6">
                    <div className="text-6xl mb-4">🔇</div>
                    <h1 className="text-2xl font-bold mb-2 text-foreground">Narration Not Found</h1>
                    <p className="text-muted-foreground">This narration may have been removed or is no longer available.</p>
                    <a
                        href="/"
                        className="inline-block mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-opacity"
                    >
                        Create Your Own
                    </a>
                </div>
            </main>
        );
    }
}
