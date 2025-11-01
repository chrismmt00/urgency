import { NextResponse } from "next/server";
import { readAuthCookies, setAuthCookies } from "@/lib/auth-cookies";
import { verifyAccessToken } from "@/lib/jwt";
import { findUserById, rotateSession } from "@/lib/auth-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const { accessToken, refreshToken } = await readAuthCookies();
  if (accessToken) {
    const payload = verifyAccessToken(accessToken);
    if (payload?.sub) {
      const user = await findUserById(payload.sub);
      if (user) {
        return NextResponse.json({ ok: true, user: serializeUser(user) });
      }
    }
  }

  if (refreshToken) {
    try {
      const {
        user,
        session,
        accessToken: newAccessToken,
      } = await rotateSession({ refreshToken });
      await setAuthCookies({
        accessToken: newAccessToken,
        refreshToken,
        refreshExpiresAt: session.expires_at,
      });
      return NextResponse.json({ ok: true, user: serializeUser(user) });
    } catch (err) {
      console.warn("Refresh during /me failed", err);
    }
  }

  return NextResponse.json({ ok: false, error: "NO_SESSION" }, { status: 401 });
}

function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    avatarUrl: user.avatar_url || null,
    isVerified: user.is_verified,
    subscriptionStatus: user.subscription_status,
    trialEndsAt: user.trial_ends_at,
    trialStartedAt: user.trial_started_at,
  };
}
