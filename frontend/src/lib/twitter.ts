/**
 * Twitter/X Content Extractor
 * Extracts tweet threads and X Articles from Twitter/X URLs
 * Uses FXTwitter API for reliable extraction
 */

export interface TwitterContent {
    title: string;
    content: string;
    author: string;
    type: 'tweet' | 'thread' | 'article';
}

/**
 * Check if URL is a Twitter/X URL
 */
export function isTwitterUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);
        return (
            urlObj.hostname === 'twitter.com' ||
            urlObj.hostname === 'www.twitter.com' ||
            urlObj.hostname === 'x.com' ||
            urlObj.hostname === 'www.x.com'
        );
    } catch {
        return false;
    }
}

/**
 * Extract tweet ID from Twitter/X URL
 */
export function extractTweetId(url: string): string | null {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');

        const statusIndex = pathParts.indexOf('status');
        if (statusIndex !== -1 && pathParts[statusIndex + 1]) {
            return pathParts[statusIndex + 1].split('?')[0];
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Extract username from Twitter/X URL
 */
export function extractUsername(url: string): string | null {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);

        if (pathParts.length > 0 && pathParts[0] !== 'status') {
            return pathParts[0];
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Fetch Twitter content - handles both tweets and articles
 */
export async function fetchTwitterThread(url: string): Promise<TwitterContent> {
    const tweetId = extractTweetId(url);
    const username = extractUsername(url);

    if (!tweetId) {
        throw new Error('Invalid Twitter URL: Could not extract tweet ID');
    }

    console.log(`🐦 Fetching Twitter content: ${tweetId} by @${username}`);

    // Method 1: Try FXTwitter API (most reliable, no API key needed)
    try {
        const result = await fetchViaFxTwitter(tweetId, username || 'Unknown');
        if (result.content && result.content.length > 50) {
            console.log(`✅ FXTwitter extraction successful: ${result.content.length} chars`);
            return result;
        }
    } catch (e: any) {
        console.log('FXTwitter failed:', e.message);
    }

    // Method 2: Try RapidAPI if available
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (rapidApiKey) {
        try {
            const result = await fetchViaRapidApi(tweetId, username || 'Unknown', rapidApiKey);
            if (result.content && result.content.length > 50) {
                console.log(`✅ RapidAPI extraction successful`);
                return result;
            }
        } catch (e: any) {
            console.log('RapidAPI failed:', e.message);
        }
    }

    // Method 3: Try Twitter oembed (works for simple tweets)
    try {
        const result = await fetchViaOembed(url, username || 'Unknown');
        if (result.content && result.content.length > 30) {
            console.log(`✅ Oembed extraction successful`);
            return result;
        }
    } catch (e: any) {
        console.log('Oembed failed:', e.message);
    }

    // All methods failed
    return {
        title: `Content from @${username}`,
        content: `Unable to automatically extract content from this Twitter/X URL. Twitter's anti-scraping measures are blocking access.\n\nPlease copy and paste the tweet/article text directly into the text input instead.\n\nURL: ${url}`,
        author: username || 'Unknown',
        type: 'tweet',
    };
}

/**
 * Fetch via FXTwitter API (fxtwitter.com)
 * This is a free API specifically made to fix Twitter embeds
 */
async function fetchViaFxTwitter(
    tweetId: string,
    username: string
): Promise<TwitterContent> {
    const apiUrl = `https://api.fxtwitter.com/${username}/status/${tweetId}`;

    console.log(`Trying FXTwitter API: ${apiUrl}`);

    const response = await fetch(apiUrl, {
        headers: {
            'User-Agent': 'ReadItOutAI/1.0',
        },
    });

    if (!response.ok) {
        throw new Error(`FXTwitter API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.tweet) {
        throw new Error('No tweet data in response');
    }

    const tweet = data.tweet;
    let content = '';
    let title = '';
    let isArticle = false;

    // Check for article content (long-form X Articles)
    if (tweet.article && tweet.article.content && tweet.article.content.blocks) {
        isArticle = true;
        title = tweet.article.title || `Article by @${username}`;

        // Extract text from article blocks
        const blocks = tweet.article.content.blocks;
        const paragraphs: string[] = [];

        for (const block of blocks) {
            if (block.text && block.text.trim()) {
                // Skip image placeholders (single space)
                if (block.text.trim() !== '') {
                    paragraphs.push(block.text);
                }
            }
        }

        content = paragraphs.join('\n\n');
        console.log(`📰 Found X Article: "${title}" with ${paragraphs.length} paragraphs`);
    } else {
        // Regular tweet
        content = tweet.text || '';
        title = `Tweet by @${username}`;

        // Check for quoted tweets
        if (tweet.quote) {
            content += `\n\n[Quoted from @${tweet.quote.author?.screen_name || 'unknown'}]: ${tweet.quote.text || ''}`;
        }
    }

    // Clean up the content
    content = content
        .replace(/https?:\/\/t\.co\/\w+/g, '') // Remove t.co links
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize multiple newlines
        .trim();

    const author = tweet.author?.screen_name || username;

    return {
        title,
        content,
        author,
        type: isArticle ? 'article' : 'tweet',
    };
}

/**
 * Fetch via RapidAPI Twitter API
 */
async function fetchViaRapidApi(
    tweetId: string,
    username: string,
    apiKey: string
): Promise<TwitterContent> {
    const response = await fetch(
        `https://twitter-api45.p.rapidapi.com/thread.php?id=${tweetId}`,
        {
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'twitter-api45.p.rapidapi.com',
            },
        }
    );

    if (!response.ok) {
        throw new Error(`RapidAPI error: ${response.status}`);
    }

    const data = await response.json();

    const tweets = data.thread || data.tweets || [data];
    const threadTexts: string[] = [];

    for (const tweet of tweets) {
        if (tweet.text) {
            let text = tweet.text
                .replace(/https?:\/\/t\.co\/\w+/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            if (text) {
                threadTexts.push(text);
            }
        }

        if (tweet.note_tweet?.text) {
            threadTexts.push(tweet.note_tweet.text);
        }
    }

    const content = threadTexts.join('\n\n');
    const isArticle = content.length > 1000;

    return {
        title: isArticle ? `Article by @${username}` : `Thread by @${username}`,
        content: content || 'Could not extract content',
        author: username,
        type: isArticle ? 'article' : threadTexts.length > 1 ? 'thread' : 'tweet',
    };
}

/**
 * Fetch via Twitter oembed
 */
async function fetchViaOembed(url: string, username: string): Promise<TwitterContent> {
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`;

    const response = await fetch(oembedUrl);

    if (!response.ok) {
        throw new Error('Oembed failed');
    }

    const data = await response.json();

    const html = data.html || '';
    const textMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);

    let content = '';
    if (textMatch) {
        content = textMatch
            .map((p: string) => p.replace(/<[^>]+>/g, '').trim())
            .filter((t: string) => t.length > 0)
            .join('\n\n');
    }

    content = content
        .replace(/&mdash;/g, '—')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/pic\.twitter\.com\/\w+/g, '')
        .trim();

    const author = data.author_name || username;

    return {
        title: `Tweet by @${author}`,
        content: content || `Tweet by @${author}`,
        author,
        type: 'tweet',
    };
}
