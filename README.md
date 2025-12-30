# Read-It-Aloud

🎧 Transform articles, blog posts, and Twitter/X threads into professionally narrated audio podcasts.

## Features

- **Smart Content Extraction** - Paste any URL (web articles, X threads, X articles)
- **AI Summarization** - Uses GPT-4.1 to intelligently condense content to your desired length
- **Natural Voice** - Google Cloud TTS with ElevenLabs fallback
- **Dark Mode** - Easy on the eyes
- **History** - Access your previously generated podcasts

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, React
- **AI**: OpenAI GPT-4.1 (summarization), Google Cloud TTS (voice)
- **Storage**: Firebase Storage (audio), SQLite (metadata)

## Getting Started

1. Clone the repo:
```bash
git clone https://github.com/YOUR_USERNAME/read-it-aloud.git
cd read-it-aloud/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` with your API keys:
```env
GOOGLE_CLOUD_API_KEY=your_google_tts_key
OPENAI_API_KEY=your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key
FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
```

4. Run locally:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/read-it-aloud)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

## License

MIT
