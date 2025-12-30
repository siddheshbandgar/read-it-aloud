/**
 * OpenAI Service
 * Uses GPT-4.1-mini for tone detection, GPT-4.1 for summarization
 */

// Target word counts for each duration (at ~150 words per minute speaking rate)
const DURATION_WORD_TARGETS: Record<string, number> = {
    '2min': 300,
    '5min': 750,
    '10min': 1500,
    'full': 0, // 0 means no summarization
};

interface ContentAnalysis {
    tone: string;
    style: string;
    keyTopics: string[];
}

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
 * Analyze content tone and style using GPT-4.1-mini
 */
async function analyzeContent(content: string, title: string): Promise<ContentAnalysis> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return { tone: 'neutral', style: 'informative', keyTopics: [] };
    }

    console.log('🔍 Analyzing content tone with GPT-4.1-mini...');

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4.1-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a content analyst. Analyze the given text and respond with JSON only: {"tone": "academic|casual|professional|storytelling", "style": "informative|persuasive|narrative|analytical", "keyTopics": ["topic1", "topic2", "topic3"]}'
                    },
                    {
                        role: 'user',
                        content: `Title: ${title}\n\nContent (first 1500 chars): ${content.slice(0, 1500)}`
                    }
                ],
                temperature: 0.3,
                max_tokens: 200,
            }),
        });

        if (!response.ok) {
            throw new Error('Analysis API failed');
        }

        const data = await response.json();
        const result = JSON.parse(data.choices[0]?.message?.content || '{}');

        console.log(`✅ Tone: ${result.tone}, Style: ${result.style}`);
        return result;
    } catch (error) {
        console.log('⚠️ Tone analysis failed, using defaults');
        return { tone: 'neutral', style: 'informative', keyTopics: [] };
    }
}

/**
 * Summarize content using GPT-4.1 for high-quality output
 */
export async function summarizeForDuration({
    content,
    title,
    durationType,
    author,
}: SummarizeOptions): Promise<SummarizeResult> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.log('⚠️ OpenAI API key not configured, returning original content');
        return { summary: content, wordCount: content.split(/\s+/).length };
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
        console.log(`📝 Content already short enough (${originalWordCount} words), skipping summarization`);
        return { summary: content, wordCount: originalWordCount };
    }

    // Step 1: Analyze tone using GPT-4.1-mini
    const analysis = await analyzeContent(content, title);

    console.log(`🤖 Summarizing ${originalWordCount} words → ~${targetWords} words using GPT-4.1`);

    // Step 2: Generate summary using GPT-4.1
    const systemPrompt = `You are an expert podcast script writer. Create a compelling, well-structured summary that:

1. Captures the main thesis and key arguments
2. Maintains a ${analysis.tone} tone and ${analysis.style} style
3. Flows naturally when read aloud as a podcast
4. Is approximately ${targetWords} words (crucial for target duration)

Key topics to emphasize: ${analysis.keyTopics.join(', ') || 'main points'}

Write directly as if reading to a listener. No meta-commentary.`;

    const userPrompt = `Summarize this article for a ${durationType.replace('min', ' minute')} podcast.

Title: ${title}
${author ? `Author: ${author}` : ''}
Target: ~${targetWords} words

Article:
${content}

Create a flowing, ${targetWords}-word podcast script.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4.1',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.7,
                max_tokens: Math.ceil(targetWords * 1.5),
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error: ${error}`);
        }

        const data = await response.json();
        const summary = data.choices[0]?.message?.content?.trim();

        if (!summary) {
            throw new Error('No summary generated');
        }

        const summaryWordCount = summary.split(/\s+/).length;
        console.log(`✅ Summary generated: ${summaryWordCount} words (target: ${targetWords})`);

        return { summary, wordCount: summaryWordCount };

    } catch (error: any) {
        console.error('❌ GPT-4.1 summarization failed:', error.message);
        // Fall back to truncation
        console.log('⚠️ Falling back to simple truncation');
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
