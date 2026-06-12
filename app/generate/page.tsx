import { Nav } from "@/components/nav";
import { Generator } from "@/components/generator";

export default function GeneratePage() {
  return (
    <main>
      <Nav />
      <section className="shell section">
        <span className="kicker">Studio</span>
        <h1 className="page-title">Make the repo talk.</h1>
        <p className="lede">
          Paste a public GitHub repository, choose the host dynamic, and RepoFM will build a shareable episode while you watch the production board light up.
        </p>
        <Generator />
      </section>
    </main>
  );
}
