"use client";

import { useState } from "react";

export function LogoutButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="button secondary" onClick={() => setOpen(true)} type="button">
        Log out
      </button>

      {open ? (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(16,19,21,0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: 24
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: 32, maxWidth: 380, width: "100%", textAlign: "center" }}
          >
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>👋</div>
            <h2 style={{ margin: "0 0 10px", fontSize: "1.5rem", letterSpacing: "-0.04em" }}>
              Log out?
            </h2>
            <p style={{ margin: "0 0 24px", color: "var(--muted)", lineHeight: 1.55 }}>
              Your episodes are saved. You can always come back.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                className="button secondary"
                onClick={() => setOpen(false)}
                type="button"
              >
                Stay
              </button>
              <a className="button" href="/api/auth/logout">
                Log out
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
