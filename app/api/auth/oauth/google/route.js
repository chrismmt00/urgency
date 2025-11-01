import { NextResponse } from "next/server";
import { randomBytes, createHmac } from "crypto";
import { readAuthCookies } from "@/lib/auth-cookies";
import { verifyAccessToken } from "@/lib/jwt";
import { buildGoogleAuthUrl } from "@/lib/google";

function getStateKey() {
  const key = process.env.OAUTH_STATE_SECRET || process.env.JWT_ACCESS_SECRET;
  if (!key) {
    const err = new Error(
      "OAUTH_STATE_SECRET or JWT_ACCESS_SECRET must be set for signing state"
    );
    err.code = "OAUTH_STATE_SECRET_MISSING";
    throw err;
  }
  return key;
}

export async function GET(req) {
  const reqUrl = new URL(req.url);
  const intent =
    reqUrl.searchParams.get("intent") === "login" ? "login" : "connect";

  const { accessToken } = await readAuthCookies();
  const payload = accessToken && verifyAccessToken(accessToken);
  if (intent === "connect" && !payload?.sub) {
    return NextResponse.redirect(
      new URL(
        "/?auth=required",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      )
    );
  }
  const nonce = randomBytes(16).toString("hex");
  const state = `${nonce}:${intent}`;
  const key = getStateKey();
  const sig = createHmac("sha256", key).update(state).digest("hex");

  const authUrl = buildGoogleAuthUrl({ state });
  const res = NextResponse.redirect(authUrl);
  const isProd = process.env.NODE_ENV === "production";
  res.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  res.cookies.set("google_oauth_state_sig", sig, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
