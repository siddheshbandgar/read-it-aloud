import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Read-It-Aloud | Listen to any article',
    description: 'Transform articles, blog posts, and Twitter threads into professionally narrated audio. Paste a URL and listen.',
    keywords: ['podcast', 'text to speech', 'AI', 'article reader', 'audio', 'twitter threads'],
    authors: [{ name: 'Read-It-Aloud' }],
    openGraph: {
        title: 'Read-It-Aloud',
        description: 'Listen to any article or Twitter thread',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-background text-foreground antialiased">
                {children}
            </body>
        </html>
    );
}
