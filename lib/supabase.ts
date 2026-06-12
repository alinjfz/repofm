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
        { host: "alex", text: "Express is roughly 2,000 lines of actual logic — but it is probably the most consequential 2,000 lines in the Node.js ecosystem. The core abstraction is deceptively simple: an application is a function from a request to a response, mediated by a stack of middleware." },
        { host: "sam", text: "Which sounds clean until you realize that 'mediated by a stack of middleware' means 'we are trusting every developer who touches this app to call next() in the right order.' That is a lot of faith." },
        { host: "alex", text: "And that's actually by design. Look at lib/router/layer.js — the route matching is built on a RegExp cache. When you define app.get('/user/:id', handler), Express compiles that into a regex at startup and matches against it per request. The cache is what makes parameterized routes fast even at scale." },
        { host: "sam", text: "Fast, sure. But the router also has this quirk where error-handling middleware must take four arguments — err, req, res, next — and if you accidentally define it with three, Express treats it as a normal middleware and your errors silently vanish. That is a footgun that still bites people today." },
        { host: "alex", text: "It is. The response prototype in lib/response.js is where most of the ergonomics live — res.json(), res.send(), content-type negotiation. The interesting design choice is that these are prototype extensions on Node's native ServerResponse, not a wrapper class. Which is why Express objects leak through abstractions in a way newer frameworks avoid." },
        { host: "sam", text: "Roast incoming: that decision is very 2010. Monkey-patching native objects to add convenience methods is exactly the kind of thing that gives JavaScript its reputation. But I do understand why — zero wrapper overhead, and every Node developer already knows the shape of the object." },
        { host: "alex", text: "The commit history tells the other half of the story. It has been in maintenance mode since roughly 2018 — security patches, dependency bumps, the occasional regression fix. The core API has not changed in years." },
        { host: "sam", text: "Which raises the real question: is this 'stable,' or is this 'everyone is too scared to touch it because half the internet depends on it?' Because those are very different things." },
        { host: "alex", text: "Probably both. Express 5 has been in alpha for years, and the main changes are: promises in middleware, better error propagation, and removing the deprecated stuff. The fact that it took this long to ship suggests the maintainers understand the weight of the blast radius." },
        { host: "sam", text: "Express 5 being in alpha since 2014 is my favorite fact in open source. It is like watching someone very carefully move a piano." }
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
        { host: "alex", text: "The App Router is the most ambitious bet Next.js has made. The entire rendering model shifted — pages are React Server Components by default, which means data fetching happens in the server component tree, not in getServerSideProps or useEffect. The implications for how you structure data access are genuinely profound." },
        { host: "sam", text: "Profound, or potentially the source of the next generation of subtle hydration bugs? Because the boundary between server and client components has sharp edges. Passing non-serializable props across that boundary, accidentally importing a client-only library in a server component — these are new failure modes that didn't exist before." },
        { host: "alex", text: "That's fair. The caching model is where the real complexity lives. There's four different cache layers — the Request Memoization, Data Cache, Full Route Cache, and Router Cache — each with different invalidation semantics. The fetch() extension Next.js adds for cache control is powerful but it means you need to understand what revalidate and no-store actually do at the framework level." },
        { host: "sam", text: "The fetch() extension is what I keep coming back to. Patching a web standard to add framework-specific semantics is a tradeoff. You get ergonomic colocation of data and components, but you also get behavior that looks like standard fetch and then surprises you in production when caching doesn't work the way you expected." },
        { host: "alex", text: "The turbopack integration is the other big bet. The webpack config surface in Next.js is massive and the team has been slowly migrating the build pipeline. The incremental compiler architecture in turbopack is genuinely interesting — it tracks fine-grained dependencies at the module level to minimize rebuilds." },
        { host: "sam", text: "Genuinely interesting and also still not the default in production builds. When a project of this scale ships something as 'experimental' for two years, my question is always: what are they still seeing in the edge cases that makes them hesitate?" }
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
        { host: "alex", text: "Supabase is a monorepo with about a dozen distinct services — the Postgres database, the auth server GoTrue, the realtime websocket service, the storage API, edge functions via Deno, and the dashboard. Each is a separately deployable service, which is how they support both cloud and self-hosted." },
        { host: "sam", text: "And from an investor perspective, that architecture is the moat. You can replicate Postgres. You can replicate an auth service. But the integration layer — the client libraries that make all of these feel like a single coherent SDK — that is what keeps developers on the platform." },
        { host: "alex", text: "The realtime service is the most technically interesting piece. It uses Postgres logical replication — a feature that was designed for database clustering — to broadcast row-level changes as WebSocket events. The implementation in apps/realtime/ is essentially a replication slot consumer that fans out changes to connected clients." },
        { host: "sam", text: "Which is clever, but it also means your realtime throughput is bounded by your Postgres write throughput. For most apps that's fine. For a product trying to serve high-frequency event streams, that ceiling matters." },
        { host: "alex", text: "The Row Level Security integration is where Supabase earns its reputation. Rather than building a separate permissions layer, they lean entirely on Postgres RLS policies and the auth.uid() function. Your auth token flows from the client into the database session context, and Postgres enforces access at the query level. It's architecturally honest." },
        { host: "sam", text: "Architecturally honest and operationally tricky to debug when RLS is silently filtering rows you expected to see. But the market insight here is correct: developers want backend features without the ops complexity of building a permissions service from scratch. Supabase's bet is that Postgres is powerful enough to be the backend, not just the database." },
        { host: "alex", text: "The GoTrue auth service is a fork of Netlify's original project, and looking at the commit history, the Supabase team has extended it substantially — added PKCE flows, MFA, anonymous sign-ins, and phone auth. The dependency on an external fork creates some interesting coordination challenges as auth standards evolve." },
        { host: "sam", text: "That's the classic open-source infrastructure bet: you get a head start by forking something proven, but you take on the maintenance burden of diverging from upstream. The question for Supabase is whether the auth layer eventually becomes a competitive differentiator or a maintenance tax." }
      ]
    }
  };

  return demos[id] ?? null;
}
