import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac } from "crypto";
import { exchangeCodeForTokens } from "@/lib/google";
import { withClient, query } from "@/lib/db";
import { readAuthCookies, setAuthCookies } from "@/lib/auth-cookies";
import { verifyAccessToken, signAccessToken } from "@/lib/jwt";
import { saveConnectedAccount } from "@/lib/connected-accounts";
import { createSession } from "@/lib/auth-service";

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

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/settings?tab=accounts&error=google_oauth_failed", url.origin)
      );
    }

    const store = cookies();
    const stateCookie = store.get("google_oauth_state")?.value;
    const sigCookie = store.get("google_oauth_state_sig")?.value;
    const key = getStateKey();
    const expected = createHmac("sha256", key).update(state).digest("hex");
    if (
      !stateCookie ||
      !sigCookie ||
      stateCookie !== state ||
      sigCookie !== expected
    ) {
      return NextResponse.redirect(
        new URL("/settings?tab=accounts&error=google_oauth_failed", url.origin)
      );
    }

    // clear cookies
    store.delete("google_oauth_state");
    store.delete("google_oauth_state_sig");

    const intent = (state.split(":")[1] || "connect").toLowerCase();

    const tokenData = await exchangeCodeForTokens({ code, origin: url.origin });

    // get profile
    const profRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.accessToken}` },
        cache: "no-store",
      }
    );
    const profile = await profRes.json();
    if (!profRes.ok) {
      return NextResponse.redirect(
        new URL("/settings?tab=accounts&error=google_oauth_failed", url.origin)
      );
    }

    if (intent === "login") {
      // find or create user by email, mark verified and start trial if new
      let user;
      await withClient(async (client) => {
        await client.query("BEGIN");
        const existing = await client.query(
          "SELECT * FROM app_user WHERE email = $1",
          [profile.email.toLowerCase()]
        );
        if (existing.rows.length) {
          user = existing.rows[0];
          if (!user.is_verified) {
            await client.query(
              `UPDATE app_user SET is_verified = TRUE, verified_at = now() WHERE id = $1`,
              [user.id]
            );
            user.is_verified = true;
          }
        } else {
          const { rows } = await client.query(
            `INSERT INTO app_user
              (email, display_name, is_verified, verified_at, trial_started_at, trial_ends_at, subscription_status, provider)
             VALUES ($1, $2, TRUE, now(), now(), now() + interval '3 days', 'trial', 'google')
             RETURNING *`,
            [profile.email.toLowerCase(), profile.name || null]
          );
          user = rows[0];
        }
        await client.query("COMMIT");
      });

      // Save connected gmail on login as well (optional but useful)
      await saveConnectedAccount({
        userId: user.id,
        provider: "gmail",
        providerUserId: profile.id,
        email: profile.email,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken || null,
        expiresAt: tokenData.expiresAt,
        scope: tokenData.scope,
      });

      // Create session and set cookies
      const ua = (req.headers.get("user-agent") || "").slice(0, 200);
      const ip = req.headers.get("x-forwarded-for") || undefined;
      const { refreshToken, session } = await createSession({
        userId: user.id,
        userAgent: ua,
        ip,
      });
      const access = signAccessToken(user);
      await setAuthCookies({
        accessToken: access,
        refreshToken,
        refreshExpiresAt: session.expires_at,
      });

      return NextResponse.redirect(new URL("/inbox", url.origin));
    } else {
      // must be logged in for connect flow
      const { accessToken } = await readAuthCookies();
      const payload = accessToken && verifyAccessToken(accessToken);
      if (!payload?.sub) {
        return NextResponse.redirect(new URL("/?auth=required", url.origin));
      }

      // Save connected account
      await saveConnectedAccount({
        userId: payload.sub,
        provider: "gmail",
        providerUserId: profile.id,
        email: profile.email,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken || null,
        expiresAt: tokenData.expiresAt,
        scope: tokenData.scope,
      });

      // Mark user verified if needed
      await query(
        `UPDATE app_user SET is_verified = TRUE, verified_at = now() WHERE id = $1 AND is_verified = FALSE`,
        [payload.sub]
      );

      return NextResponse.redirect(
        new URL("/settings?tab=accounts&connected=google", url.origin)
      );
    }
  } catch (e) {
    console.error("Google OAuth callback failed", e);
    try {
      const u = new URL(req.url);
      return NextResponse.redirect(
        new URL("/settings?tab=accounts&error=google_oauth_failed", u.origin)
      );
    } catch {
      return NextResponse.redirect("https://example.com");
    }
  }
}
