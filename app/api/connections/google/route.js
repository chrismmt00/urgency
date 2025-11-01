import { NextResponse } from "next/server";
import { readAuthCookies } from "@/lib/auth-cookies";
import { verifyAccessToken } from "@/lib/jwt";
import { deleteConnectedAccount } from "@/lib/connected-accounts";

export const dynamic = "force-dynamic";

// Optional: keep POST as a no-op (or start OAuth) but we'll use GET /api/auth/oauth/google instead
export async function POST() {
  return NextResponse.json({ ok: false, message: "Use /api/auth/oauth/google to connect" });
}

export async function DELETE() {
  const { accessToken } = await readAuthCookies();
  const payload = accessToken && verifyAccessToken(accessToken);
  if (!payload?.sub) {
    return NextResponse.json({ ok: false, error: "NO_SESSION" }, { status: 401 });
  }
  await deleteConnectedAccount(payload.sub, "gmail");
  return NextResponse.json({ ok: true });
}
