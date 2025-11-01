import { NextResponse } from "next/server";
import { rotateSession } from "@/lib/auth-service";
import { readAuthCookies, setAuthCookies } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

export async function POST() {
  const { refreshToken } = await readAuthCookies();
  if (!refreshToken) {
    return NextResponse.json(
      { ok: false, error: "NO_SESSION" },
      { status: 401 }
    );
  }

  try {
    const { user, session, accessToken } = await rotateSession({
      refreshToken,
    });
    await setAuthCookies({
      accessToken,
      refreshToken,
      refreshExpiresAt: session.expires_at,
    });
    return NextResponse.json({ ok: true, user: serializeUser(user) });
  } catch (err) {
    console.error("Refresh error", err);
    return NextResponse.json(
      { ok: false, error: err?.code || "INVALID_SESSION" },
      { status: 401 }
    );
  }
}

function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    isVerified: user.is_verified,
    subscriptionStatus: user.subscription_status,
    trialEndsAt: user.trial_ends_at,
    trialStartedAt: user.trial_started_at,
  };
}
