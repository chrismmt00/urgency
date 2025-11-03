import { NextResponse } from "next/server";
import { readAuthCookies } from "@/lib/auth-cookies";
import { verifyAccessToken } from "@/lib/jwt";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(_req, { params }) {
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

  // Ensure account belongs to user; then set it default and clear others
  const { rowCount } = await query(
    `UPDATE connected_account SET is_default = TRUE WHERE id = $1 AND user_id = $2`,
    [accountId, payload.sub]
  );
  if (rowCount === 0) {
    return NextResponse.json(
      { ok: false, error: "NOT_FOUND" },
      { status: 404 }
    );
  }
  await query(
    `UPDATE connected_account SET is_default = FALSE WHERE user_id = $1 AND id <> $2`,
    [payload.sub, accountId]
  );
  return NextResponse.json({ ok: true });
}
