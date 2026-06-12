import { readFileSync } from "node:fs";

export function loadEnv(path = ".env.local") {
  const envText = readFileSync(path, "utf8");
  const env = {};

  for (const line of envText.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator === -1) continue;

    env[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }

  return env;
}

export function requiredEnv(env, keys) {
  const missing = keys.filter((key) => !env[key] || env[key].includes("YOUR_"));
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}

export function auth0AuthorizeUrl(env, redirectUri = `${env.AUTH0_BASE_URL}/api/auth/callback`) {
  const issuer = env.AUTH0_ISSUER_BASE_URL.replace(/\/$/, "");
  const params = new URLSearchParams({
    client_id: env.AUTH0_CLIENT_ID,
    scope: "openid profile email",
    response_type: "code",
    redirect_uri: redirectUri,
    nonce: "repofm-test-nonce",
    state: "repofm-test-state",
    code_challenge_method: "S256",
    code_challenge: "repofmtestchallenge123456789012345678901234567890"
  });

  return `${issuer}/authorize?${params.toString()}`;
}
