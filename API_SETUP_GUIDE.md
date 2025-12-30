# API Keys Setup Guide for Read-It-Out AI

## Required API Keys

| Service | Purpose | Free Tier | Estimated Cost |
|---------|---------|-----------|----------------|
| **OpenAI** | LLM for script generation | $5 credit (new users) | ~$0.01-0.05/article |
| **ElevenLabs** | Text-to-Speech | 10,000 chars/month | $5/month starter |
| **Clerk** | Authentication | 10,000 MAUs free | Free for MVP |
| **Cloudflare R2** | Audio storage | 10GB free | Free for MVP |

---

## 1. OpenAI API Key

**Purpose**: Generates podcast scripts, summarizes content, detects tone.

### Steps:
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to **API Keys** in the left sidebar
4. Click **Create new secret key**
5. Copy the key (starts with `sk-...`)

> ⚠️ Store this securely - you won't see it again!

---

## 2. ElevenLabs API Key

**Purpose**: Converts text to natural-sounding speech with timestamps.

### Steps:
1. Go to [elevenlabs.io](https://elevenlabs.io)
2. Sign up for a free account
3. Click your profile icon → **Profile + API key**
4. Copy your API key

### Voice IDs (Pre-configured in app):
| Voice Style | Voice Name | Voice ID |
|-------------|------------|----------|
| News Anchor | Adam | `pNInz6obpgDQGcFmaJgB` |
| Calm Female | Bella | `EXAVITQu4vr4xnSDxMaL` |
| Deep Narrator | Arnold | `VR6AewLTigWG4xSOukaG` |
| Casual Podcast | Antoni | `ErXwobaYiN019PkySvjV` |
| Energetic | Elli | `MF3mGyEYCl7XYWbV9V6O` |

---

## 3. Clerk Authentication

**Purpose**: User sign-up, sign-in, session management.

### Steps:
1. Go to [clerk.com](https://clerk.com)
2. Sign up and create a new application
3. Choose authentication methods (Email, Google, etc.)
4. Go to **API Keys** in the dashboard
5. Copy:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_...`)
   - `CLERK_SECRET_KEY` (starts with `sk_...`)

---

## 4. Cloudflare R2 Storage

**Purpose**: Stores generated MP3 audio files.

### Steps:
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Sign up or log in
3. Navigate to **R2 Object Storage** in sidebar
4. Click **Create bucket** → Name it `readitout-audio`
5. Go to **Manage R2 API Tokens** → **Create API token**
6. Set permissions: **Object Read & Write**
7. Copy:
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
8. Note your **Account ID** from the dashboard URL

### R2 Endpoint Format:
```
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

---

## 5. Redis (For Celery Background Jobs)

**Option A: Local Redis (Development)**
```bash
# Windows (using Docker)
docker run -d -p 6379:6379 redis

# Or install Redis for Windows
winget install Redis.Redis
```

**Option B: Upstash Redis (Production - Free Tier)**
1. Go to [upstash.com](https://upstash.com)
2. Create a Redis database
3. Copy the connection string

---

## 6. PostgreSQL Database

**Option A: Local (Development)**
```bash
# Using Docker
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=readitout postgres
```

**Option B: Neon (Production - Free Tier)**
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string

---

## Environment Files to Create

### Backend: `backend/.env`
```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/readitout

# Redis
REDIS_URL=redis://localhost:6379/0

# OpenAI
OPENAI_API_KEY=sk-your-key-here

# ElevenLabs
ELEVENLABS_API_KEY=your-key-here

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=readitout-audio
R2_PUBLIC_URL=https://pub-xxx.r2.dev

# Clerk
CLERK_SECRET_KEY=sk_test_xxx
```

### Frontend: `frontend/.env.local`
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Quick Start Checklist

- [ ] OpenAI API key obtained
- [ ] ElevenLabs API key obtained
- [ ] Clerk application created
- [ ] Cloudflare R2 bucket created
- [ ] Redis running (local or Upstash)
- [ ] PostgreSQL running (local or Neon)
- [ ] Backend `.env` file created
- [ ] Frontend `.env.local` file created

---

## Cost Estimates (per podcast)

| Service | Estimate |
|---------|----------|
| OpenAI GPT-4o-mini | ~$0.01-0.03 |
| ElevenLabs (2000 chars) | ~$0.60 |
| R2 Storage | Free tier |
| **Total** | ~$0.65/podcast |

> 💡 **Tip**: Use GPT-4o-mini for cost efficiency. ElevenLabs Creator plan ($22/mo) gives better per-character rates.
