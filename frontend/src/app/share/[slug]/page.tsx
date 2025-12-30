import { getPublicPodcast } from '@/lib/api';
import { PublicPodcastPlayer } from './PublicPodcastPlayer';

interface SharePageProps {
    params: { slug: string };
}

/**
 * Public share page for viewing shared podcasts.
 */
export default async function SharePage({ params }: SharePageProps) {
    const { slug } = params;

    try {
        const podcast = await getPublicPodcast(slug);

        return (
            <main className="min-h-screen">
                <header className="border-b border-border">
                    <div className="max-w-4xl mx-auto px-4 py-4">
                        <h1 className="text-xl font-bold">Read-It-Out AI</h1>
                    </div>
                </header>

                <div className="max-w-4xl mx-auto px-4 py-8">
                    <PublicPodcastPlayer podcast={podcast} shareSlug={slug} />
                </div>
            </main>
        );
    } catch (error) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Podcast Not Found</h1>
                    <p className="text-muted">This podcast may have been removed or made private.</p>
                </div>
            </main>
        );
    }
}
