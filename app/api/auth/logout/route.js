import { NextResponse } from "next/server";
import { revokeSession } from "@/lib/auth-service";
import { clearAuthCookies, readAuthCookies } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { refreshToken } = await readAuthCookies();
    if (refreshToken) {
      await revokeSession(refreshToken);
    }
    await clearAuthCookies();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Logout error", err);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
