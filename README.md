# RepoFM

RepoFM turns a public GitHub repository into a shareable two-host podcast episode.

Paste a repo URL, pick a host template, and the app:

1. Fetches the repo README, file tree, key files, and recent commits from GitHub.
2. Uses OpenAI to pick useful files and write an 8-12 exchange podcast script.
3. Uses ElevenLabs to generate two distinct host voices.
4. Uploads the MP3 to Supabase Storage and saves episode metadata in Postgres.
5. Gives you a public `/episode/[id]` link plus a logged-in dashboard.

## Tech Stack

- Next.js 14 App Router
- Auth0 for login and protected pages
- OpenAI `gpt-4o` by default for file selection and script generation
- ElevenLabs text-to-speech for host audio
- Supabase Postgres and Storage for episode persistence
- GitHub REST API for public repo ingestion

## Checkpoint Commits

This repo was implemented in small debug checkpoints:

- `a7d6bce` - scaffold RepoFM app
- `e822713` - add generation backend
- `c941e38` - build RepoFM interface
- `6a2a64e` - install app dependencies
- `aa7d0c7` - fix verification issues
- `4ea3d69` - harden Next build config

Run `git log --oneline` to inspect each step.

## Local Quick Start

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`.

The app has a partial local demo mode:

- Landing and demo episode pages work without provider keys.
- Script generation falls back to a local demo script when `OPENAI_API_KEY` is missing.
- Audio is skipped when `ELEVENLABS_API_KEY` is missing.
- Episodes are kept in memory when Supabase env vars are missing.

For the full hackathon flow, configure Auth0, OpenAI, ElevenLabs, and Supabase below.

## Environment Variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Required for full generation:

```bash
AUTH0_SECRET=
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://YOUR_AUTH0_DOMAIN
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o

ELEVENLABS_API_KEY=
ELEVENLABS_MODEL=eleven_multilingual_v2

NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=episodes
```

Optional:

```bash
GITHUB_TOKEN=
```

Use `GITHUB_TOKEN` if you hit unauthenticated GitHub API rate limits.

## Auth0 Setup

1. Create an Auth0 application.
2. Use a Regular Web Application.
3. Enable GitHub social login in Auth0 if you want the sponsor-aligned flow.
4. Add these application URLs for local development:

```text
Allowed Callback URLs:
http://localhost:3000/api/auth/callback

Allowed Logout URLs:
http://localhost:3000

Allowed Web Origins:
http://localhost:3000
```

For Vercel, add the same URLs with your deployed domain:

```text
https://YOUR-APP.vercel.app/api/auth/callback
https://YOUR-APP.vercel.app
```

Generate `AUTH0_SECRET` locally:

```bash
openssl rand -hex 32
```

Protected routes:

- `/generate`
- `/dashboard`

Public routes:

- `/`
- `/episode/[id]`

## Supabase Setup

1. Create a Supabase project.
2. Open SQL Editor.
3. Run [`supabase/schema.sql`](./supabase/schema.sql).
4. Create a public Storage bucket named `episodes`.
5. Copy env vars into `.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=episodes
```

Important: `SUPABASE_SERVICE_ROLE_KEY` must stay server-only. Do not expose it with a `NEXT_PUBLIC_` prefix.

## OpenAI Setup

Add:

```text
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o
```

OpenAI is used in two places:

- File picker: given the GitHub file tree, choose up to 5 files that best explain the repo.
- Script writer: produce JSON shaped like:

```json
{
  "script": [
    { "host": "alex", "text": "Welcome to RepoFM..." },
    { "host": "sam", "text": "So I looked at this codebase..." }
  ]
}
```

If the key is missing, RepoFM uses heuristic file picking plus a fallback script so you can still test the interface.

## ElevenLabs Setup

Add:

```text
ELEVENLABS_API_KEY=...
ELEVENLABS_MODEL=eleven_multilingual_v2
```

Voice IDs are currently hard-coded in [`lib/templates.ts`](./lib/templates.ts). Each host template has two voices:

- Explainer + Roaster
- Hype vs Skeptic
- Investor vs Engineer

Audio segments are generated in parallel and concatenated server-side with `Buffer.concat`.

## Run Commands

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
pnpm start
```

Recommended verification before demo:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Product Flow

1. Visit `/`.
2. Log in through Auth0.
3. Open `/generate`.
4. Paste a public GitHub repo URL, for example:

```text
https://github.com/expressjs/express
```

5. Pick a host template.
6. Click `Generate episode`.
7. Watch progress polling:

```text
Analyzing README -> Picking files -> Writing script -> Recording hosts -> Saving share link
```

8. Open the generated public episode page.
9. Copy the share link.
10. Visit `/dashboard` to see your generated episodes.

## API Routes

- `POST /api/generate`

Request:

```json
{
  "repoUrl": "https://github.com/expressjs/express",
  "template": "explainer-roaster"
}
```

Response:

```json
{
  "jobId": "uuid"
}
```

- `GET /api/jobs/[id]`

Response:

```json
{
  "id": "uuid",
  "status": "writing-script",
  "message": "Writing the two-host podcast script.",
  "progress": 58,
  "createdAt": "2026-06-12T12:00:00.000Z"
}
```

## Notes And Limitations

- Background generation uses an in-memory job map. This is great for local demos and a short hackathon build, but for production you would move jobs to Supabase, Inngest, Trigger.dev, or a queue.
- Public GitHub API calls work without auth but are rate-limited to 60 requests/hour per IP.
- MP3 concatenation uses raw `Buffer.concat`, which works for a hackathon demo. For production-quality audio joins, use ffmpeg or an audio processing service.
- Supabase Storage bucket must be public for direct playback from the episode page.
- The app stores generated episodes in memory if Supabase is not configured, so those episodes disappear when the dev server restarts.

## Deploy To Vercel

1. Push the repo to GitHub.
2. Import it into Vercel.
3. Add the same env vars from `.env.example`.
4. Update Auth0 URLs to use your Vercel domain.
5. Deploy.

Build command:

```bash
pnpm build
```

Install command:

```bash
pnpm install
```

## Demo Script

Use `expressjs/express`:

```text
https://github.com/expressjs/express
```

Suggested flow:

1. Start on the landing page and play up the pre-generated demo cards.
2. Log in and open `/generate`.
3. Paste the Express repo URL.
4. Pick `Explainer + Roaster`.
5. Generate the episode.
6. While it runs, explain that OpenAI picks files and writes the script, ElevenLabs voices both hosts, and Supabase saves the shareable artifact.
7. Open the episode page, play audio, copy the link, then show `/dashboard`.
