import assert from "node:assert/strict";
import test from "node:test";
import { loadEnv } from "./helpers/env.mjs";

const env = loadEnv();
const appUrl = env.APP_URL || env.AUTH0_BASE_URL || "http://localhost:3000";

async function appFetch(path, options) {
  try {
    return await fetch(`${appUrl}${path}`, options);
  } catch (error) {
    throw new Error(`Could not reach ${appUrl}. Start the app with "pnpm dev" before running test:app. ${error.message}`);
  }
}

test("home page loads", async () => {
  const response = await appFetch("/");
  assert.equal(response.status, 200);
});

test("generate page is protected by Auth0 middleware", async () => {
  const response = await appFetch("/generate", { redirect: "manual" });
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "/api/auth/login?returnTo=%2Fgenerate");
});

test("Auth0 login route sends the expected callback URL", async () => {
  const response = await appFetch("/api/auth/login", { redirect: "manual" });
  const location = response.headers.get("location") ?? "";

  assert.equal(response.status, 302);
  assert.match(location, /^https:\/\/.+\.auth0\.com\/authorize/);
  assert.equal(new URL(location).searchParams.get("redirect_uri"), `${env.AUTH0_BASE_URL}/api/auth/callback`);
});

test("generation API produces an episode with audio", { timeout: 90_000 }, async () => {
  const start = await appFetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      repoUrl: "https://github.com/expressjs/express",
      template: "explainer-roaster"
    })
  });
  const payload = await start.json();

  assert.equal(start.status, 200, JSON.stringify(payload));
  assert.equal(typeof payload.jobId, "string");

  let job;
  for (let attempt = 0; attempt < 45; attempt += 1) {
    const response = await appFetch(`/api/jobs/${payload.jobId}`);
    job = await response.json();
    if (job.status === "complete" || job.status === "failed") break;
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }

  assert.equal(job.status, "complete", JSON.stringify(job));
  assert.equal(job.episodeId, payload.jobId);

  const episode = await appFetch(`/episode/${job.episodeId}`);
  assert.equal(episode.status, 200);
});
