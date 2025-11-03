import { NextResponse } from "next/server";
import { readAuthCookies } from "@/lib/auth-cookies";
import { verifyAccessToken } from "@/lib/jwt";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const { accessToken } = await readAuthCookies();
  const payload = accessToken && verifyAccessToken(accessToken);
  if (!payload?.sub) {
    return NextResponse.json(
      { ok: false, error: "NO_SESSION" },
      { status: 401 }
    );
  }

  const { rows } = await query(
    `SELECT ca.id,
            ca.provider,
            ca.email_address AS email,
            ca.is_default AS is_default,
            u.display_name AS display_name,
            ca.connected_at
       FROM connected_account ca
       JOIN app_user u ON u.id = ca.user_id
      WHERE ca.user_id = $1
      ORDER BY ca.connected_at DESC`,
    [payload.sub]
  );

  const accounts = rows.map((r) => ({
    id: r.id,
    provider: r.provider,
    email: r.email,
    displayName: r.display_name || null,
    is_default: !!r.is_default,
  }));

  return NextResponse.json(accounts);
}
