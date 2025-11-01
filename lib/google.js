import "server-only";

import { addSeconds } from "date-fns";

function requireEnv(name) {
  const val = process.env[name];
  if (!val) {
    const err = new Error(`${name} is not set in environment`);
    err.code = `${name}_MISSING`;
    throw err;
  }
  return val;
}

export function getGoogleOAuthConfig() {
  const clientId = requireEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/api/auth/oauth/google/callback`;
  const scopes = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/gmail.readonly",
  ];
  return { clientId, clientSecret, redirectUri, scopes };
}

export function buildGoogleAuthUrl({ state }) {
  const { clientId, redirectUri, scopes } = getGoogleOAuthConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    include_granted_scopes: "true",
    scope: scopes.join(" "),
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens({ code }) {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();
  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(
      `Google token exchange failed: ${data.error || res.status}`
    );
    err.code = "GOOGLE_TOKEN_EXCHANGE_FAILED";
    throw err;
  }
  const expiresAt = addSeconds(new Date(), Number(data.expires_in || 0));
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    idToken: data.id_token,
    expiresAt,
    scope: data.scope,
    tokenType: data.token_type,
  };
}

export async function refreshGoogleToken({ refreshToken }) {
  const { clientId, clientSecret } = getGoogleOAuthConfig();
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(
      `Google token refresh failed: ${data.error || res.status}`
    );
    err.code = "GOOGLE_TOKEN_REFRESH_FAILED";
    throw err;
  }
  const expiresAt = addSeconds(new Date(), Number(data.expires_in || 0));
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt,
    scope: data.scope,
    tokenType: data.token_type,
  };
}
