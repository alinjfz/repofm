import assert from "node:assert/strict";
import test from "node:test";
import { auth0AuthorizeUrl, loadEnv, requiredEnv } from "./helpers/env.mjs";

const env = loadEnv();

test("Auth0 env contains required web app values", () => {
  requiredEnv(env, [
    "AUTH0_BASE_URL",
    "AUTH0_ISSUER_BASE_URL",
    "AUTH0_CLIENT_ID",
    "AUTH0_CLIENT_SECRET",
    "AUTH0_SECRET"
  ]);

  assert.equal(env.AUTH0_BASE_URL, "http://localhost:3000");
  assert.match(env.AUTH0_ISSUER_BASE_URL, /^https:\/\/.+\.auth0\.com$/);
});

test("Auth0 accepts the local callback URL configured by the app", async () => {
  const redirectUri = `${env.AUTH0_BASE_URL}/api/auth/callback`;
  const response = await fetch(auth0AuthorizeUrl(env, redirectUri), { redirect: "manual" });
  const body = await response.text();

  assert.equal(
    /Callback URL mismatch/i.test(body),
    false,
    `Auth0 rejected redirect_uri=${redirectUri}. Add it to Allowed Callback URLs for client ${env.AUTH0_CLIENT_ID}.`
  );
  assert.notEqual(response.status, 403, `Auth0 returned 403 for redirect_uri=${redirectUri}.`);
});

test("Auth0 rejects the wrong callback URL, proving the mismatch test is meaningful", async () => {
  const wrongRedirectUri = "http://127.0.0.1:3000/api/auth/callback";
  const response = await fetch(auth0AuthorizeUrl(env, wrongRedirectUri), { redirect: "manual" });
  const body = await response.text();

  assert.equal(response.status, 403);
  assert.equal(/Callback URL mismatch/i.test(body), true);
});
