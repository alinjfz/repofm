import Link from "next/link";

export function Nav() {
  return (
    <header className="shell nav">
      <Link className="brand" href="/">
        <span className="brand-mark">FM</span>
        RepoFM
      </Link>
      <nav className="nav-links" aria-label="Primary navigation">
        <Link className="button ghost" href="/dashboard">My Episodes</Link>
        <Link className="button secondary" href="/api/auth/login">Log in</Link>
        <Link className="button" href="/generate">Generate</Link>
      </nav>
    </header>
  );
}
