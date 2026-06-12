import Link from "next/link";
import { getSession } from "@auth0/nextjs-auth0";
import { Nav } from "@/components/nav";
import { listEpisodes } from "@/lib/supabase";
import { getTemplate } from "@/lib/templates";

export default async function DashboardPage() {
  const session = await getSession();
  const episodes = await listEpisodes(session?.user?.sub ?? null);

  return (
    <main>
      <Nav />
      <section className="shell section">
        <span className="kicker">My Episodes</span>
        <h1 className="page-title">Your audio shelf.</h1>
        <p className="lede">
          Episodes generated while logged in are saved to Supabase. In local demo mode, this page shows in-memory episodes from the running dev server.
        </p>

        <div className="grid" style={{ marginTop: 28 }}>
          {episodes.length === 0 ? (
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ marginTop: 0 }}>No episodes yet</h2>
              <p style={{ color: "var(--muted)" }}>Send a repo through the studio and it will land here.</p>
              <Link className="button" href="/generate">Generate your first episode</Link>
            </div>
          ) : (
            episodes.map((episode) => {
              const template = getTemplate(episode.template);
              return (
                <Link className="card" href={`/episode/${episode.id}`} key={episode.id} style={{ padding: 22 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div>
                      <span className="pill">{template.name}</span>
                      <h2 style={{ margin: "14px 0 6px", letterSpacing: "-0.04em" }}>{episode.repo_name}</h2>
                      <p style={{ margin: 0, color: "var(--muted)" }}>
                        {new Date(episode.created_at).toLocaleString()} · {episode.script.length} transcript segments
                      </p>
                    </div>
                    <span className="button secondary">Open</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
