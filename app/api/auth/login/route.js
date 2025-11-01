import { NextResponse } from "next/server";
import { z } from "zod";
import { loginWithEmail, createSession } from "@/lib/auth-service";
import { signAccessToken } from "@/lib/jwt";
import { setAuthCookies } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = LoginSchema.parse(body);

    const { user, trialExpired } = await loginWithEmail({ email, password });

    if (!user.is_verified) {
      return NextResponse.json(
        {
          ok: false,
          error: "EMAIL_UNVERIFIED",
          message: "Please verify your email before signing in.",
        },
        { status: 403 }
      );
    }

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
      user: serializeUser(user),
      trialExpired,
    });
  } catch (err) {
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", issues: err.issues },
        { status: 422 }
      );
    }
    if (err?.code === "INVALID_LOGIN") {
      return NextResponse.json(
        { ok: false, error: "INVALID_LOGIN", message: "Invalid credentials." },
        { status: 401 }
      );
    }
    console.error("Login error", err);
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
