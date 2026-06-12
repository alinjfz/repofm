import Link from "next/link";
import { Nav } from "@/components/nav";
import { demoEpisodes, hostTemplates } from "@/lib/templates";

const demoScript = [
  { host: "Alex", color: "var(--ocean)", text: "Express is one of the most installed npm packages ever, but the repo itself is tiny — about 2,000 lines of actual logic. What makes it load-bearing is the middleware pipeline: every req/res pair flows through an array of functions, each deciding whether to respond or call next()." },
  { host: "Sam", color: "var(--ember)", text: "And that simplicity is exactly what's kept it alive for fifteen years. But let's be honest — that same design is why every Express app eventually develops a middleware ordering bug that only shows up in production at 2am." },
  { host: "Alex", color: "var(--ocean)", text: "The router internals are the interesting part. layer.js handles path matching with a RegExp cache, which is why parameterized routes are fast even at scale. The design predates a lot of modern Node.js patterns but it's aged remarkably well." },
  { host: "Sam", color: "var(--ember)", text: "The commit history tells a different story though — it's mostly been in maintenance mode since 2018. Which raises the real question: is \"stable\" the right word, or is this just a repo that nobody wants to break because too much depends on it?" },
];

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
            <span className="pill">Live demo · expressjs/express</span>
            <div className="grid" style={{ marginTop: 18, gap: 12 }}>
              {demoScript.map((line, i) => (
                <div key={i} className="transcript-line" style={{ padding: "12px 14px" }}>
                  <div className="host-label" style={{ color: line.color, marginBottom: 6 }}>{line.host}</div>
                  <div style={{ fontSize: "0.97rem", lineHeight: 1.55 }}>{line.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="shell section">
        <span className="kicker">Choose the chemistry</span>
        <p className="lede" style={{ marginTop: 12, marginBottom: 0 }}>
          Each pairing brings a different lens to the same code.
        </p>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", marginTop: 18 }}>
          {hostTemplates.map((template) => (
            <Link
              className="card"
              href={`/generate?template=${template.id}`}
              key={template.id}
              style={{ padding: 22, display: "block", cursor: "pointer" }}
            >
              <h3 style={{ margin: 0, fontSize: "1.4rem" }}>{template.name}</h3>
              <p style={{ color: "var(--muted)", lineHeight: 1.5 }}>{template.description}</p>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <div className="pill">{template.hostA}</div>
                <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>+</span>
                <div className="pill">{template.hostB}</div>
              </div>
              <div style={{ marginTop: 14 }}>
                <span className="button secondary" style={{ fontSize: "0.85rem", minHeight: 36, padding: "0 14px" }}>
                  Try this style →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="shell section">
        <span className="kicker">Example episodes</span>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginTop: 18 }}>
          {demoEpisodes.map((episode) => (
            <Link className="card" href={episode.href} key={episode.repo} style={{ padding: 22, display: "block" }}>
              <div className="pill">{episode.template}</div>
              <h3 style={{ margin: "16px 0 8px", fontSize: "1.45rem" }}>{episode.repo}</h3>
              <p style={{ color: "var(--muted)", lineHeight: 1.5 }}>{episode.summary}</p>
              <span style={{ color: "var(--ocean)", fontSize: "0.9rem", fontWeight: 700 }}>Listen →</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
