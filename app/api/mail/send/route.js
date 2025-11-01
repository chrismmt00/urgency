import { NextResponse } from "next/server";
import { isAfter, addSeconds } from "date-fns";
import { readAuthCookies } from "@/lib/auth-cookies";
import { verifyAccessToken } from "@/lib/jwt";
import {
  getConnectedAccount,
  saveConnectedAccount,
} from "@/lib/connected-accounts";
import { refreshGoogleToken } from "@/lib/google";

export const dynamic = "force-dynamic";

function base64UrlEncode(str) {
  const b = Buffer.from(str, "utf8");
  return b
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function buildMime({ to, cc, subject, text, html }) {
  const boundary = "====boundary" + Math.random().toString(36).slice(2);
  const headers = [
    `To: ${to}`,
    cc ? `Cc: ${cc}` : null,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    html
      ? `Content-Type: multipart/alternative; boundary=\"${boundary}\"`
      : `Content-Type: text/plain; charset=\"UTF-8\"`,
  ]
    .filter(Boolean)
    .join("\r\n");

  if (!html) {
    return `${headers}\r\n\r\n${text || ""}`;
  }
  const parts = [
    `--${boundary}\r\nContent-Type: text/plain; charset=\"UTF-8\"\r\n\r\n${
      text || ""
    }`,
    `--${boundary}\r\nContent-Type: text/html; charset=\"UTF-8\"\r\n\r\n${
      html || ""
    }`,
    `--${boundary}--`,
  ].join("\r\n");
  return `${headers}\r\n\r\n${parts}`;
}

export async function POST(req) {
  try {
    const { accessToken } = await readAuthCookies();
    const payload = accessToken && verifyAccessToken(accessToken);
    if (!payload?.sub) {
      return NextResponse.json(
        { ok: false, error: "NO_SESSION" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const to = (body.to || "").trim();
    const cc = (body.cc || "").trim();
    const subject = (body.subject || "").trim();
    const text = body.text || "";
    const html = body.html || null;

    if (!to || !subject) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_INPUT",
          message: "'to' and 'subject' are required",
        },
        { status: 400 }
      );
    }

    const acct = await getConnectedAccount(payload.sub, "gmail");
    if (!acct) {
      return NextResponse.json(
        { ok: false, error: "NO_CONNECTED_ACCOUNT" },
        { status: 400 }
      );
    }

    let gAccess = acct.accessToken;
    let gRefresh = acct.refreshToken;
    let expiresAt = acct.expiresAt ? new Date(acct.expiresAt) : null;

    if (expiresAt && isAfter(new Date(), addSeconds(expiresAt, -60))) {
      try {
        const refreshed = await refreshGoogleToken({ refreshToken: gRefresh });
        gAccess = refreshed.accessToken;
        gRefresh = refreshed.refreshToken;
        expiresAt = refreshed.expiresAt;
        await saveConnectedAccount({
          userId: payload.sub,
          provider: "gmail",
          providerUserId: acct.providerUserId,
          email: acct.email,
          accessToken: gAccess,
          refreshToken: gRefresh,
          expiresAt,
          scope: refreshed.scope || acct.scope,
        });
      } catch (e) {
        console.warn("Failed to refresh Google token for send", e);
      }
    }

    const raw = buildMime({ to, cc, subject, text, html });
    const raw64 = base64UrlEncode(raw);

    const sendRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${gAccess}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: raw64 }),
      }
    );
    const sendData = await sendRes.json().catch(() => ({}));
    if (!sendRes.ok) {
      return NextResponse.json(
        { ok: false, error: "GMAIL_SEND_FAILED", details: sendData },
        { status: sendRes.status || 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("/api/mail/send failed", e);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
