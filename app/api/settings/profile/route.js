import { NextResponse } from "next/server";
import { readAuthCookies } from "@/lib/auth-cookies";
import { verifyAccessToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const { accessToken } = await readAuthCookies();
  const payload = accessToken && verifyAccessToken(accessToken);
  if (!payload?.sub) {
    return NextResponse.json(
      { ok: false, error: "NO_SESSION" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  console.log("/api/settings/profile", { userId: payload.sub, body });
  return NextResponse.json({ ok: false, message: "Not implemented yet" });
}
