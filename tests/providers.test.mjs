import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { loadEnv, requiredEnv } from "./helpers/env.mjs";

const env = loadEnv();

test("GitHub public repo API is reachable", async () => {
  const response = await fetch("https://api.github.com/repos/expressjs/express", {
    headers: env.GITHUB_TOKEN ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}
  });
  const data = await response.json();

  assert.equal(response.ok, true, JSON.stringify(data));
  assert.equal(data.full_name, "expressjs/express");
});

test("OpenAI key can create a minimal chat completion", async () => {
  requiredEnv(env, ["OPENAI_API_KEY", "OPENAI_MODEL"]);

  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    baseURL: env.OPENAI_BASE_URL || undefined
  });
  const response = await openai.chat.completions.create({
    model: env.OPENAI_MODEL,
    messages: [{ role: "user", content: "Reply with exactly: ok" }],
    max_tokens: 5
  });

  assert.match(response.choices[0]?.message?.content ?? "", /ok/i);
});

test("ElevenLabs key can create a tiny MP3", async () => {
  requiredEnv(env, ["ELEVENLABS_API_KEY", "ELEVENLABS_MODEL"]);

  const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM", {
    method: "POST",
    headers: {
      "xi-api-key": env.ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
      Accept: "audio/mpeg"
    },
    body: JSON.stringify({
      text: "RepoFM test.",
      model_id: env.ELEVENLABS_MODEL
    })
  });

  const detail = response.ok ? "" : await response.text();
  assert.equal(response.ok, true, detail);
  assert.match(response.headers.get("content-type") ?? "", /audio\/mpeg/);
});

test("Supabase episodes table and storage bucket are reachable", async () => {
  requiredEnv(env, ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_STORAGE_BUCKET"]);

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  const table = await supabase.from("episodes").select("id", { count: "exact", head: true });
  assert.equal(table.error, null, table.error?.message);

  const bucket = await supabase.storage.getBucket(env.SUPABASE_STORAGE_BUCKET);
  assert.equal(bucket.error, null, bucket.error?.message);
  assert.equal(bucket.data.public, true, "Supabase Storage bucket must be public for browser playback.");
});
