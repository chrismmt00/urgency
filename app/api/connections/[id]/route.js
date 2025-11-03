import { NextResponse } from "next/server";
import { readAuthCookies } from "@/lib/auth-cookies";
import { verifyAccessToken } from "@/lib/jwt";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(_req, { params }) {
  const { accessToken } = await readAuthCookies();
  const payload = accessToken && verifyAccessToken(accessToken);
  if (!payload?.sub) {
    return NextResponse.json(
      { ok: false, error: "NO_SESSION" },
      { status: 401 }
    );
  }
  const accountId = params?.id;
  if (!accountId) {
    return NextResponse.json(
      { ok: false, error: "MISSING_ID" },
      { status: 400 }
    );
  }

  // Delete only if the account belongs to the current user
  await query(`DELETE FROM connected_account WHERE id = $1 AND user_id = $2`, [
    accountId,
    payload.sub,
  ]);
  return NextResponse.json({ ok: true });
}
