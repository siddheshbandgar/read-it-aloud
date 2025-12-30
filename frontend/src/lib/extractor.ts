/**
 * Content Extractor Service
 * Extracts text content from URLs (including Twitter/X) or processes raw text
 * Includes intelligent author detection and content cleaning
 */

import { isTwitterUrl, fetchTwitterThread } from './twitter';

export interface ExtractedContent {
    title: string;
    content: string;
    author?: string;
    authorBio?: string;
    source?: 'twitter' | 'web' | 'text';
}

/**
 * Extract author information from HTML
 */
function extractAuthorInfo(html: string): { author?: string; authorBio?: string } {
    let author: string | undefined;
    let authorBio: string | undefined;

    // Common author patterns
    const authorPatterns = [
        // <meta name="author" content="...">
        /<meta\s+name=["']author["']\s+content=["']([^"']+)["']/i,
        // <span class="author">...</span> or similar
        /<(?:span|div|a)[^>]*class=["'][^"']*author[^"']*["'][^>]*>([^<]+)</i,
        // "By Author Name" pattern
        /\bBy\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/,
        // rel="author"
        /<a[^>]*rel=["']author["'][^>]*>([^<]+)</i,
    ];

    for (const pattern of authorPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
            author = match[1].trim();
            break;
        }
    }

    // Try to find author bio (usually near author name)
    if (author) {
        // Look for bio patterns
        const bioPatterns = [
            new RegExp(`${author}[^.]*is\\s+(?:a|an)\\s+([^.]+\\.)`, 'i'),
            /<(?:p|div|span)[^>]*class=["'][^"']*(?:bio|about|description)[^"']*["'][^>]*>([^<]{30,200})/i,
        ];

        for (const pattern of bioPatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
                authorBio = match[1].trim();
                break;
            }
        }
    }

    return { author, authorBio };
}

/**
 * Find where the main article content starts
 * Returns the index of the first "real" paragraph
 */
function findMainContentStart(paragraphs: string[]): number {
    // Patterns that indicate metadata/sidebar content
    const metadataPatterns = [
        /^is\s+a\s+/i,  // "is a researcher..."
        /^edited\s+by/i,
        /^\d+,?\d*\s+words?$/i,
        /^save$/i,
        /^share$/i,
        /^history\s+of/i,
        /^syndicate/i,
        /^listen\s+to/i,
        /^subscribe/i,
        /^follow\s+us/i,
        /^posted\s+on/i,
        /^published/i,
        /^tags?:/i,
        /^categories?:/i,
        /^related/i,
        /^more\s+from/i,
        /^sign\s+up/i,
    ];

    // Find the first paragraph that looks like article content
    for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];

        // Skip very short paragraphs
        if (p.length < 80) continue;

        // Check if it matches metadata patterns
        let isMetadata = false;
        for (const pattern of metadataPatterns) {
            if (pattern.test(p)) {
                isMetadata = true;
                break;
            }
        }
        if (isMetadata) continue;

        // Check if it starts with a capital letter (typical article start)
        // and has proper sentence structure
        if (/^[A-Z]/.test(p) && p.includes(' ') && p.length > 100) {
            return i;
        }
    }

    return 0;
}

/**
 * Generate intro text for the article
 */
function generateIntro(title: string, author?: string, authorBio?: string): string {
    if (!author) {
        return '';
    }

    let intro = `This article`;

    if (title && !title.includes('|') && title.length < 80) {
        intro = `"${title}"`;
    }

    intro += ` is written by ${author}`;

    if (authorBio) {
        // Clean up bio
        const cleanBio = authorBio
            .replace(/^is\s+/i, '')
            .replace(/\.$/, '')
            .trim();
        intro += `, who is ${cleanBio}`;
    }

    intro += '.\n\n';

    return intro;
}

/**
 * Extract content from a URL
 * Automatically detects Twitter/X URLs and routes accordingly
 */
export async function extractFromUrl(url: string): Promise<ExtractedContent> {
    // Check if it's a Twitter/X URL
    if (isTwitterUrl(url)) {
        console.log('🐦 Detected Twitter/X URL');
        const twitterContent = await fetchTwitterThread(url);
        return {
            title: twitterContent.title,
            content: twitterContent.content,
            author: twitterContent.author,
            source: 'twitter',
        };
    }

    // Regular web extraction
    console.log(`📥 Fetching URL: ${url}`);

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    let title = titleMatch ? titleMatch[1].trim() : 'Untitled Article';
    // Clean title (remove site name after | or -)
    title = title.split(/\s*[|\-–—]\s*/)[0].trim().slice(0, 100);

    // Extract author info
    const { author, authorBio } = extractAuthorInfo(html);
    console.log(`👤 Author detected: ${author || 'Unknown'}`);

    // Remove non-content elements
    let cleanHtml = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
        .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '');

    // Extract paragraph content
    const paragraphs: string[] = [];
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let match;

    while ((match = pRegex.exec(cleanHtml)) !== null) {
        const text = match[1]
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();

        if (text.length > 30) {
            paragraphs.push(text);
        }
    }

    // Find where the main content starts
    const mainContentStart = findMainContentStart(paragraphs);
    console.log(`📍 Main content starts at paragraph ${mainContentStart}`);

    // Get only the main content paragraphs
    const mainParagraphs = paragraphs.slice(mainContentStart, mainContentStart + 50);

    // Generate intro
    const intro = generateIntro(title, author, authorBio);

    // Combine intro and content
    const content = intro + mainParagraphs.join('\n\n');

    if (!content || content.length < 100) {
        // Fallback: just strip all HTML tags
        const plainText = cleanHtml
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 5000);

        return { title, content: plainText, author, source: 'web' };
    }

    console.log(`📝 Extracted: ${title} (${content.length} chars, author: ${author || 'unknown'})`);

    return { title, content, author, authorBio, source: 'web' };
}

/**
 * Process raw text input
 */
export function extractFromText(text: string): ExtractedContent {
    const lines = text.trim().split('\n');
    const firstLine = lines[0].trim();

    let title: string;
    let content: string;

    if (firstLine.length <= 100 && lines.length > 1) {
        title = firstLine;
        content = lines.slice(1).join('\n').trim();
    } else {
        const firstSentence = text.split(/[.!?]/)[0];
        title = firstSentence.slice(0, 80) + (firstSentence.length > 80 ? '...' : '');
        content = text;
    }

    return { title, content, source: 'text' };
}

/**
 * Extract content from URL or text
 */
export async function extractContent(
    url?: string,
    text?: string
): Promise<ExtractedContent> {
    if (url) {
        return extractFromUrl(url);
    }
    if (text) {
        return extractFromText(text);
    }
    throw new Error('Either url or text must be provided');
}
