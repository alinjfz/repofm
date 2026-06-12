import Link from "next/link";
import { Nav } from "@/components/nav";
import { demoEpisodes, hostTemplates } from "@/lib/templates";

export default function LandingPage() {
  return (
    <main>
      <Nav />
      <section className="shell section">
        <div className="grid two-col" style={{ alignItems: "center" }}>
          <div>
            <span className="kicker">Built for devs who read with their ears</span>
            <h1 className="page-title">Your repo, voiced.</h1>
            <p className="lede">
              Paste a public GitHub URL and RepoFM turns the README, key files, and recent commits into a punchy two-host podcast episode.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
              <Link className="button" href="/generate">Try it free</Link>
              <Link className="button secondary" href="/episode/demo-express">Hear a demo</Link>
            </div>
          </div>

          <div className="card" style={{ padding: 24, transform: "rotate(1deg)" }}>
            <span className="pill">Now playing</span>
            <h2 style={{ margin: "18px 0 8px", fontSize: "2rem", letterSpacing: "-0.05em" }}>
              expressjs/express, lovingly roasted
            </h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.55 }}>
              “It is tiny, iconic, and somehow every Node app has passed through it like a rite of passage.”
            </p>
            <audio controls style={{ width: "100%", marginTop: 18 }} src="" />
            <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
              {["Analyzed README", "Picked framework-defining files", "Wrote banter", "Recorded two hosts"].map((step) => (
                <div key={step} className="transcript-line" style={{ padding: "10px 12px" }}>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="shell section">
        <span className="kicker">Choose the chemistry</span>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", marginTop: 18 }}>
          {hostTemplates.map((template) => (
            <article className="card" key={template.id} style={{ padding: 22 }}>
              <h3 style={{ margin: 0, fontSize: "1.4rem" }}>{template.name}</h3>
              <p style={{ color: "var(--muted)", lineHeight: 1.5 }}>{template.description}</p>
              <div className="pill">{template.hostA} + {template.hostB}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="shell section">
        <span className="kicker">Example episodes</span>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginTop: 18 }}>
          {demoEpisodes.map((episode) => (
            <Link className="card" href={episode.href} key={episode.repo} style={{ padding: 22 }}>
              <div className="pill">{episode.template}</div>
              <h3 style={{ margin: "16px 0 8px", fontSize: "1.45rem" }}>{episode.repo}</h3>
              <p style={{ color: "var(--muted)", lineHeight: 1.5 }}>{episode.summary}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
