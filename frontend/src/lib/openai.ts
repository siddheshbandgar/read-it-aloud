/**
 * OpenAI Service - Optimized for Vercel 60s timeout
 * Uses gpt-4o-mini for fast summarization
 */

// Target word counts for each duration (at ~150 words per minute speaking rate)
const DURATION_WORD_TARGETS: Record<string, number> = {
    '2min': 300,
    '5min': 750,
    '10min': 1500,
    'full': 0, // 0 means no summarization
};

interface SummarizeOptions {
    content: string;
    title: string;
    durationType: string;
    author?: string;
}

interface SummarizeResult {
    summary: string;
    wordCount: number;
}

/**
 * Fast summarization using gpt-4o-mini (much faster than gpt-4.1)
 */
export async function summarizeForDuration({
    content,
    title,
    durationType,
    author,
}: SummarizeOptions): Promise<SummarizeResult> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.log('⚠️ OpenAI API key not configured, using truncation');
        const truncated = truncateToWordCount(content, 500);
        return { summary: truncated, wordCount: truncated.split(/\s+/).length };
    }

    const targetWords = DURATION_WORD_TARGETS[durationType];

    // For "full" duration, return original content without summarization
    if (targetWords === 0 || durationType === 'full') {
        console.log('📝 Full duration requested, skipping summarization');
        return { summary: content, wordCount: content.split(/\s+/).length };
    }

    const originalWordCount = content.split(/\s+/).length;

    // If content is already shorter than target, no need to summarize
    if (originalWordCount <= targetWords * 1.2) {
        console.log(`📝 Content already short (${originalWordCount} words)`);
        return { summary: content, wordCount: originalWordCount };
    }

    console.log(`🤖 Summarizing ${originalWordCount} → ~${targetWords} words (gpt-4o-mini)`);

    const systemPrompt = `You are a podcast script writer. Create a ${targetWords}-word summary that:
- Captures main thesis and key points
- Flows naturally when read aloud
- Uses conversational language
Write directly as if reading to a listener.`;

    // Truncate input to avoid token limits and speed up
    const inputContent = content.slice(0, 8000);

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',  // Fast model
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Title: ${title}\n${author ? `By: ${author}\n` : ''}Create a ${targetWords}-word podcast script:\n\n${inputContent}` },
                ],
                temperature: 0.7,
                max_tokens: Math.ceil(targetWords * 1.3),
            }),
        });

        if (!response.ok) {
            throw new Error('OpenAI API error');
        }

        const data = await response.json();
        const summary = data.choices[0]?.message?.content?.trim();

        if (!summary) {
            throw new Error('No summary generated');
        }

        const summaryWordCount = summary.split(/\s+/).length;
        console.log(`✅ Summary: ${summaryWordCount} words`);

        return { summary, wordCount: summaryWordCount };

    } catch (error: any) {
        console.error('❌ Summarization failed:', error.message);
        const truncated = truncateToWordCount(content, targetWords);
        return { summary: truncated, wordCount: truncated.split(/\s+/).length };
    }
}

/**
 * Simple truncation fallback
 */
function truncateToWordCount(content: string, targetWords: number): string {
    const words = content.split(/\s+/);

    if (words.length <= targetWords) {
        return content;
    }

    const targetContent = words.slice(0, targetWords).join(' ');
    const lastPeriod = targetContent.lastIndexOf('.');
    const lastQuestion = targetContent.lastIndexOf('?');
    const lastExclaim = targetContent.lastIndexOf('!');

    const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclaim);

    if (lastSentenceEnd > targetWords * 0.7) {
        return targetContent.slice(0, lastSentenceEnd + 1);
    }

    return targetContent + '...';
}
