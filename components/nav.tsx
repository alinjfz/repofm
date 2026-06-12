import Link from "next/link";
import { getSession } from "@auth0/nextjs-auth0";
import { LogoutButton } from "@/components/logout-button";

export async function Nav() {
  const session = await getSession().catch(() => null);
  const isLoggedIn = Boolean(session?.user);

  return (
    <header className="shell nav">
      <Link className="brand" href="/">
        <span className="brand-mark">FM</span>
        RepoFM
      </Link>
      <nav className="nav-links" aria-label="Primary navigation">
        {isLoggedIn ? (
          <>
            <Link className="button ghost" href="/dashboard">My Episodes</Link>
            <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{session?.user?.name ?? session?.user?.email}</span>
            <LogoutButton />
          </>
        ) : (
          <Link className="button secondary" href="/api/auth/login">Log in</Link>
        )}
        <Link className="button" href="/generate">Generate</Link>
      </nav>
    </header>
  );
}
