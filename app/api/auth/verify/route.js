import { NextResponse } from "next/server";
import { verifyEmailToken, createSession } from "@/lib/auth-service";
import { signAccessToken } from "@/lib/jwt";
import { setAuthCookies } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "MISSING_TOKEN" },
      { status: 400 }
    );
  }
  try {
    const user = await verifyEmailToken(token);
    const userAgent = req.headers.get("user-agent");
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip");

    const { session, refreshToken } = await createSession({
      userId: user.id,
      userAgent,
      ip,
    });
    const accessToken = signAccessToken(user);
    await setAuthCookies({
      accessToken,
      refreshToken,
      refreshExpiresAt: session.expires_at,
    });

    return NextResponse.json({
      ok: true,
      message: "Email verified.",
      user: serializeUser(user),
    });
  } catch (err) {
    if (err?.code === "TOKEN_INVALID" || err?.code === "TOKEN_EXPIRED") {
      return NextResponse.json(
        { ok: false, error: err.code, message: err.message },
        { status: 400 }
      );
    }
    console.error("Verify error", err);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR" },
      { status: 500 }
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
