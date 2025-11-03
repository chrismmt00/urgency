import { NextResponse } from "next/server";
import { readAuthCookies } from "@/lib/auth-cookies";
import { verifyAccessToken } from "@/lib/jwt";
import { query } from "@/lib/db";
import { getConnectedAccountById } from "@/lib/connected-accounts";

export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  const { accessToken } = await readAuthCookies();
  const payload = accessToken && verifyAccessToken(accessToken);
  if (!payload?.sub) {
    return NextResponse.json(
      { ok: false, error: "NO_SESSION" },
      { status: 401 }
    );
  }
  const id = params?.id; // provider message id (Gmail id)
  const body = await req.json().catch(() => ({}));
  const accountId = body?.accountId;
  if (!accountId || !id) {
    return NextResponse.json(
      { ok: false, error: "MISSING_PARAMS" },
      { status: 400 }
    );
  }

  // Verify account ownership
  const acct = await getConnectedAccountById(payload.sub, accountId);
  if (!acct) {
    return NextResponse.json(
      { ok: false, error: "ACCOUNT_NOT_FOUND" },
      { status: 404 }
    );
  }

  await query(
    `INSERT INTO message_status (account_id, user_id, provider_msg_id, timer_status, updated_at)
     VALUES ($1, $2, $3, 'resolved', now())
     ON CONFLICT (account_id, provider_msg_id)
     DO UPDATE SET timer_status = EXCLUDED.timer_status, updated_at = now()`,
    [accountId, payload.sub, id]
  );

  return NextResponse.json({ ok: true });
}
