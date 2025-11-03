import { NextResponse } from "next/server";
import { readAuthCookies } from "@/lib/auth-cookies";
import { verifyAccessToken } from "@/lib/jwt";
import {
  getConnectedAccount,
  getConnectedAccountById,
  saveConnectedAccount,
} from "@/lib/connected-accounts";
import { isAfter, addSeconds } from "date-fns";
import { refreshGoogleToken } from "@/lib/google";

export const dynamic = "force-dynamic";

async function getAccountAndAccess(payload, accountId) {
  const acct = accountId
    ? await getConnectedAccountById(payload.sub, accountId)
    : await getConnectedAccount(payload.sub, "gmail");
  if (!acct) return { acct: null, access: null };

  let access = acct.accessToken;
  let refresh = acct.refreshToken;
  let expiresAt = acct.expiresAt ? new Date(acct.expiresAt) : null;
  if (expiresAt && isAfter(new Date(), addSeconds(expiresAt, -60))) {
    try {
      const refreshed = await refreshGoogleToken({ refreshToken: refresh });
      access = refreshed.accessToken;
      refresh = refreshed.refreshToken;
      expiresAt = refreshed.expiresAt;
      await saveConnectedAccount({
        userId: payload.sub,
        provider: "gmail",
        providerUserId: acct.providerUserId,
        email: acct.email,
        accessToken: access,
        refreshToken: refresh,
        expiresAt,
        scope: refreshed.scope || acct.scope,
      });
    } catch (e) {
      console.warn("Failed to refresh Google token (labels)", e);
    }
  }
  return { acct, access };
}

export async function GET(req) {
  const inUrl = new URL(req.url);
  const { accessToken } = await readAuthCookies();
  const payload = accessToken && verifyAccessToken(accessToken);
  if (!payload?.sub) {
    return NextResponse.json(
      { ok: false, error: "NO_SESSION" },
      { status: 401 }
    );
  }
  const accountId = inUrl.searchParams.get("accountId") || "";
  const { access } = await getAccountAndAccess(payload, accountId);
  if (!access) return NextResponse.json({ ok: true, labels: [] });

  const r = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/labels",
    {
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    }
  );
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    return NextResponse.json(
      { ok: false, error: "GMAIL_LABELS_FAILED", details: d },
      { status: r.status || 500 }
    );
  }
  const labels = Array.isArray(d.labels)
    ? d.labels.map((l) => ({ id: l.id, name: l.name, type: l.type }))
    : [];
  return NextResponse.json({ ok: true, labels });
}

export async function POST(req) {
  const inUrl = new URL(req.url);
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name || "").trim();
  if (!name) {
    return NextResponse.json(
      { ok: false, error: "MISSING_NAME" },
      { status: 400 }
    );
  }
  const { accessToken } = await readAuthCookies();
  const payload = accessToken && verifyAccessToken(accessToken);
  if (!payload?.sub) {
    return NextResponse.json(
      { ok: false, error: "NO_SESSION" },
      { status: 401 }
    );
  }
  const accountId = inUrl.searchParams.get("accountId") || "";
  const { access } = await getAccountAndAccess(payload, accountId);
  if (!access)
    return NextResponse.json(
      { ok: false, error: "NO_ACCOUNT" },
      { status: 400 }
    );

  const r = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/labels",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        labelListVisibility: "labelShow",
        messageListVisibility: "show",
      }),
    }
  );
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    return NextResponse.json(
      { ok: false, error: "GMAIL_CREATE_LABEL_FAILED", details: d },
      { status: r.status || 500 }
    );
  }
  return NextResponse.json({
    ok: true,
    label: { id: d.id, name: d.name, type: d.type },
  });
}
