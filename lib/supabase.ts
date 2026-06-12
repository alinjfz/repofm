import { createClient } from "@supabase/supabase-js";
import type { Episode, ScriptSegment } from "@/lib/types";

const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "episodes";

export function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseAdmin() {
  if (!hasSupabaseConfig()) {
    return null;
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      persistSession: false
    }
  });
}

export async function saveEpisode(input: {
  id: string;
  userId: string | null;
  repoUrl: string;
  repoName: string;
  repoDescription: string | null;
  template: string;
  script: ScriptSegment[];
  audio: Buffer | null;
}) {
  const now = new Date().toISOString();
  const supabase = getSupabaseAdmin();
  let audioUrl: string | null = null;

  if (supabase && input.audio) {
    const safeUserId = (input.userId ?? "public").replace(/[^a-zA-Z0-9_\-]/g, "_");
    const path = `${safeUserId}/${input.id}.mp3`;
    const upload = await supabase.storage.from(bucket).upload(path, input.audio, {
      contentType: "audio/mpeg",
      upsert: true
    });

    if (upload.error) {
      throw upload.error;
    }

    const publicUrl = supabase.storage.from(bucket).getPublicUrl(path);
    audioUrl = publicUrl.data.publicUrl;
  }

  const episode: Episode = {
    id: input.id,
    user_id: input.userId,
    repo_url: input.repoUrl,
    repo_name: input.repoName,
    repo_description: input.repoDescription,
    template: input.template as Episode["template"],
    script: input.script,
    audio_url: audioUrl,
    created_at: now
  };

  if (supabase) {
    const insert = await supabase.from("episodes").insert({
      id: episode.id,
      user_id: episode.user_id,
      repo_url: episode.repo_url,
      repo_name: episode.repo_name,
      repo_description: episode.repo_description,
      template: episode.template,
      script: episode.script,
      audio_url: episode.audio_url,
      created_at: episode.created_at
    });

    if (insert.error) {
      throw insert.error;
    }
  }

  memoryEpisodes.set(episode.id, episode);
  return episode;
}

export async function getEpisode(id: string) {
  const supabase = getSupabaseAdmin();

  if (supabase && !id.startsWith("demo-")) {
    const { data, error } = await supabase.from("episodes").select("*").eq("id", id).single();
    if (!error && data) {
      return data as Episode;
    }
  }

  return memoryEpisodes.get(id) ?? demoEpisode(id);
}

export async function listEpisodes(userId: string | null) {
  const supabase = getSupabaseAdmin();

  if (supabase && userId) {
    const { data, error } = await supabase
      .from("episodes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      return data as Episode[];
    }
  }

  return Array.from(memoryEpisodes.values()).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

const memoryEpisodes = new Map<string, Episode>();

function demoEpisode(id: string): Episode | null {
  const demos: Record<string, Episode> = {
    "demo-express": {
      id: "demo-express",
      user_id: null,
      repo_url: "https://github.com/expressjs/express",
      repo_name: "expressjs/express",
      repo_description: "Fast, unopinionated, minimalist web framework for Node.js.",
      template: "explainer-roaster",
      audio_url: null,
      created_at: new Date().toISOString(),
      script: [
        { host: "alex", text: "Welcome to RepoFM. Today we are looking at Express, the tiny Node framework that somehow became load-bearing internet furniture." },
        { host: "sam", text: "Express is minimalist in the same way a folding chair is minimalist: useful, everywhere, and occasionally asked to support a wedding." },
        { host: "alex", text: "The magic is the routing and middleware model. Requests flow through small functions, each one deciding whether to respond or pass control along." },
        { host: "sam", text: "A beautiful idea, and also the source of every next function you forgot to call while wondering why production is quiet in a scary way." },
        { host: "alex", text: "The repo history shows a project that values stability, compatibility, and keeping the API familiar for millions of developers." },
        { host: "sam", text: "Which is noble. Also, every framework since has looked at Express and said: what if this, but with more opinions and a font choice?" }
      ]
    },
    "demo-next": {
      id: "demo-next",
      user_id: null,
      repo_url: "https://github.com/vercel/next.js",
      repo_name: "vercel/next.js",
      repo_description: "The React framework for production.",
      template: "hype-skeptic",
      audio_url: null,
      created_at: new Date().toISOString(),
      script: [
        { host: "alex", text: "Next.js is a React framework that turns routing, rendering, bundling, and deployment into one integrated developer path." },
        { host: "sam", text: "And by integrated, we mean it has opinions. Many opinions. Some of them arrive wearing a compiler badge." },
        { host: "alex", text: "The interesting part is how the repo connects framework primitives with the platform: App Router, server components, caching, and deployment ergonomics." },
        { host: "sam", text: "My hard question is whether teams understand the rendering model deeply enough before they ship the spicy parts." }
      ]
    },
    "demo-supabase": {
      id: "demo-supabase",
      user_id: null,
      repo_url: "https://github.com/supabase/supabase",
      repo_name: "supabase/supabase",
      repo_description: "The open source Firebase alternative.",
      template: "investor-engineer",
      audio_url: null,
      created_at: new Date().toISOString(),
      script: [
        { host: "alex", text: "Supabase is compelling because it makes Postgres feel like a product surface, not just infrastructure." },
        { host: "sam", text: "The engineering reality is that auth, storage, realtime, edge functions, and database ergonomics are each their own dragon." },
        { host: "alex", text: "That breadth is the market story: developers want a backend that starts simple but does not trap them later." },
        { host: "sam", text: "And the repo tells that story with a lot of packages, services, and sharp edges that need excellent coordination." }
      ]
    }
  };

  return demos[id] ?? null;
}
