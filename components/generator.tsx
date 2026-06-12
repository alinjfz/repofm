"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { hostTemplates } from "@/lib/templates";

const STEPS = [
  { label: "Analyzing README", durationMs: 8_000 },
  { label: "Picking key files", durationMs: 12_000 },
  { label: "Writing script", durationMs: 25_000 },
  { label: "Recording hosts", durationMs: 30_000 },
  { label: "Saving episode", durationMs: 5_000 },
];

const TOTAL_MS = STEPS.reduce((s, step) => s + step.durationMs, 0);

export function Generator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTemplate = searchParams.get("template") ?? hostTemplates[0].id;

  const [repoUrl, setRepoUrl] = useState("https://github.com/expressjs/express");
  const [template, setTemplate] = useState(initialTemplate);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isPending, startTransition] = useTransition();

  const startRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const t = searchParams.get("template");
    if (t && hostTemplates.some((h) => h.id === t)) setTemplate(t);
  }, [searchParams]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function startTimer() {
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - (startRef.current ?? Date.now()));
    }, 200);
  }

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  async function submit() {
    setError(null);
    setElapsed(0);
    setRunning(true);
    startTimer();

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl, template })
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Generation failed.");
        return;
      }

      stopTimer();
      startTransition(() => router.push(`/episode/${payload.episodeId}`));
    } catch {
      setError("Network error — please try again.");
    } finally {
      stopTimer();
      setRunning(false);
    }
  }

  // Compute fake progress from elapsed time
  const progress = Math.min(97, Math.round((elapsed / TOTAL_MS) * 100));

  let stepIndex = 0;
  let acc = 0;
  for (let i = 0; i < STEPS.length; i++) {
    acc += STEPS[i].durationMs;
    if (elapsed < acc) { stepIndex = i; break; }
    stepIndex = i;
  }

  return (
    <div className="card" style={{ marginTop: 28, padding: 24 }}>
      <div className="grid" style={{ gap: 22 }}>
        <label>
          <span className="host-label">GitHub repo URL</span>
          <input
            className="input"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            disabled={running}
          />
        </label>

        <div>
          <span className="host-label">Host template</span>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: 8 }}>
            {hostTemplates.map((item) => {
              const selected = item.id === template;
              return (
                <button
                  className="card"
                  key={item.id}
                  onClick={() => setTemplate(item.id)}
                  disabled={running}
                  style={{
                    padding: 18,
                    textAlign: "left",
                    cursor: running ? "not-allowed" : "pointer",
                    background: selected ? "var(--sun)" : "var(--card)",
                    boxShadow: selected ? "7px 7px 0 var(--ink)" : "var(--shadow)"
                  }}
                  type="button"
                >
                  <strong style={{ display: "block", fontSize: "1.15rem" }}>{item.name}</strong>
                  <span style={{ display: "block", color: selected ? "var(--ink)" : "var(--muted)", marginTop: 6 }}>
                    {item.hostA} + {item.hostB}
                  </span>
                  <span style={{ display: "block", color: selected ? "var(--ink)" : "var(--muted)", marginTop: 4, fontSize: "0.9rem" }}>
                    {item.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          className="button"
          disabled={running || isPending}
          onClick={submit}
          type="button"
        >
          {running ? "Generating…" : "Generate episode"}
        </button>

        {error ? (
          <div className="transcript-line" style={{ borderColor: "var(--ember)", color: "var(--ember)" }}>
            {error}
          </div>
        ) : null}

        {running ? (
          <div className="grid" style={{ gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <strong style={{ fontSize: "1rem" }}>{STEPS[stepIndex].label}</strong>
              <span className="pill">{progress}%</span>
            </div>
            <div style={{ height: 14, border: "2px solid var(--ink)", borderRadius: 999, overflow: "hidden", background: "white" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: "var(--mint)", transition: "width 600ms ease" }} />
            </div>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
              {STEPS.map((step, i) => (
                <div
                  className="transcript-line"
                  key={step.label}
                  style={{ opacity: i <= stepIndex ? 1 : 0.38, transition: "opacity 400ms ease", padding: "10px 12px" }}
                >
                  {i < stepIndex ? "✓ " : i === stepIndex ? "→ " : ""}{step.label}
                </div>
              ))}
            </div>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.85rem", textAlign: "center" }}>
              This takes 1–3 minutes depending on the repo size.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
