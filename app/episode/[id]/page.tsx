import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { CopyLinkButton } from "@/components/copy-link-button";
import { getEpisode } from "@/lib/supabase";
import { getTemplate } from "@/lib/templates";

export default async function EpisodePage({ params }: { params: { id: string } }) {
  const episode = await getEpisode(params.id);

  if (!episode) {
    notFound();
  }

  const template = getTemplate(episode.template);

  return (
    <main>
      <Nav />
      <section className="shell section">
        <span className="kicker">{template.name}</span>
        <h1 className="page-title" style={{ maxWidth: 980 }}>{episode.repo_name}</h1>
        <p className="lede">{episode.repo_description ?? "A RepoFM episode generated from README, key files, and recent commits."}</p>

        <div className="grid two-col" style={{ alignItems: "start", marginTop: 28 }}>
          <aside className="card" style={{ padding: 24, position: "sticky", top: 18 }}>
            <div className="pill">Shareable episode</div>
            {episode.audio_url ? (
              <audio controls src={episode.audio_url} style={{ width: "100%", marginTop: 18 }} />
            ) : (
              <div style={{
                marginTop: 18,
                padding: "24px 20px",
                border: "1px dashed var(--line)",
                borderRadius: 18,
                background: "rgba(255,255,255,0.5)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                textAlign: "center"
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--ocean)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
                <strong style={{ fontSize: "1rem" }}>Transcript Mode</strong>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.85rem", lineHeight: 1.5 }}>
                  Audio generation requires ElevenLabs.<br />Full transcript below.
                </p>
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
              <CopyLinkButton />
              <Link className="button secondary" href="/generate">Generate your own</Link>
            </div>
            <p style={{ color: "var(--muted)", lineHeight: 1.5 }}>
              Original repo: <a href={episode.repo_url} target="_blank" rel="noreferrer">{episode.repo_url}</a>
            </p>
          </aside>

          <div className="card" style={{ padding: 24 }}>
            <div className="pill">Transcript</div>
            <div className="grid" style={{ marginTop: 18 }}>
              {episode.script.map((segment, index) => (
                <div className="transcript-line" key={`${segment.host}-${index}`}>
                  <div className="host-label" style={{ color: segment.host === "alex" ? "var(--ocean)" : "var(--ember)" }}>
                    {segment.host === "alex" ? template.hostA : template.hostB}
                  </div>
                  <div style={{ fontSize: "1.08rem", lineHeight: 1.55 }}>{segment.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
