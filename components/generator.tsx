"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { hostTemplates } from "@/lib/templates";
import type { GenerationJob } from "@/lib/types";

const steps = [
  "Analyzing README",
  "Picking files",
  "Writing script",
  "Recording hosts",
  "Saving share link"
];

export function Generator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTemplate = searchParams.get("template") ?? hostTemplates[0].id;

  const [repoUrl, setRepoUrl] = useState("https://github.com/expressjs/express");
  const [template, setTemplate] = useState(initialTemplate);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const t = searchParams.get("template");
    if (t && hostTemplates.some((h) => h.id === t)) setTemplate(t);
  }, [searchParams]);

  async function submit() {
    setError(null);
    setJob(null);

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoUrl, template })
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Could not start generation.");
      return;
    }

    setJobId(payload.jobId);
  }

  useEffect(() => {
    if (!jobId) return;

    const interval = window.setInterval(async () => {
      const response = await fetch(`/api/jobs/${jobId}`);
      if (!response.ok) return;

      const nextJob = (await response.json()) as GenerationJob;
      setJob(nextJob);

      if (nextJob.status === "complete" && nextJob.episodeId) {
        window.clearInterval(interval);
        startTransition(() => router.push(`/episode/${nextJob.episodeId}`));
      }

      if (nextJob.status === "failed") {
        window.clearInterval(interval);
        setError(nextJob.error ?? nextJob.message);
      }
    }, 1600);

    return () => window.clearInterval(interval);
  }, [jobId, router]);

  return (
    <div className="card" style={{ marginTop: 28, padding: 24 }}>
      <div className="grid" style={{ gap: 22 }}>
        <label>
          <span className="host-label">GitHub repo URL</span>
          <input
            className="input"
            value={repoUrl}
            onChange={(event) => setRepoUrl(event.target.value)}
            placeholder="https://github.com/owner/repo"
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
                  style={{
                    padding: 18,
                    textAlign: "left",
                    cursor: "pointer",
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

        <button className="button" disabled={Boolean(jobId && job?.status !== "failed") || isPending} onClick={submit} type="button">
          {jobId && job?.status !== "failed" ? "Generating..." : "Generate episode"}
        </button>

        {error ? (
          <div className="transcript-line" style={{ borderColor: "var(--ember)", color: "var(--ember)" }}>
            {error}
          </div>
        ) : null}

        {job ? (
          <div className="grid" style={{ gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <strong>{job.message}</strong>
              <span className="pill">{job.progress}%</span>
            </div>
            <div style={{ height: 14, border: "2px solid var(--ink)", borderRadius: 999, overflow: "hidden", background: "white" }}>
              <div style={{ width: `${job.progress}%`, height: "100%", background: "var(--mint)", transition: "width 400ms ease" }} />
            </div>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
              {steps.map((step, index) => (
                <div className="transcript-line" key={step} style={{ opacity: job.progress >= (index + 1) * 18 ? 1 : 0.45 }}>
                  {step}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
