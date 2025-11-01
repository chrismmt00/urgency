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

function base64UrlDecode(str = "") {
  try {
    const norm = str.replace(/-/g, "+").replace(/_/g, "/");
    const pad = "===".slice(str.length % 4 || 4);
    const buf = Buffer.from(norm + pad, "base64");
    return buf.toString("utf8");
  } catch {
    return "";
  }
}

function extractParts(payload) {
  const out = { plainText: "", html: "", attachments: [] };
  function walk(part) {
    if (!part) return;
    const mime = part.mimeType || "";
    // body data
    if (part.body && part.body.data) {
      if (mime.startsWith("text/plain") && !out.plainText) {
        out.plainText = base64UrlDecode(part.body.data);
      } else if (mime.startsWith("text/html") && !out.html) {
        out.html = base64UrlDecode(part.body.data);
      }
    }
    // attachment metadata
    const filename = part.filename || "";
    if (filename && part.body && part.body.attachmentId) {
      out.attachments.push({
        id: part.partId,
        filename,
        mimeType: mime,
        size: part.body.size || 0,
        attachmentId: part.body.attachmentId,
      });
    }
    // recurse into subparts
    if (Array.isArray(part.parts)) {
      for (const p of part.parts) walk(p);
    }
  }
  walk(payload);
  return out;
}

export async function GET(req) {
  const { accessToken } = await readAuthCookies();
  const payload = accessToken && verifyAccessToken(accessToken);
  if (!payload?.sub) {
    return NextResponse.json(
      { ok: false, error: "NO_SESSION" },
      { status: 401 }
    );
  }

  const acct = await getConnectedAccount(payload.sub, "gmail");
  if (!acct) {
    return NextResponse.json({ ok: true, messages: [] });
  }

  let access = acct.accessToken;
  let refresh = acct.refreshToken;
  let expiresAt = acct.expiresAt ? new Date(acct.expiresAt) : null;

  // Refresh if expiring within 60s
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
      console.warn("Failed to refresh Google token", e);
    }
  }

  // List inbox messages (support pageToken)
  const url = new URL(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages"
  );
  url.searchParams.set("maxResults", "20");
  url.searchParams.set("q", "in:inbox");
  const pageToken = new URL(req.url).searchParams.get("pageToken");
  if (pageToken) url.searchParams.set("pageToken", pageToken);

  const listRes = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${access}` },
    cache: "no-store",
  });
  const list = await listRes.json().catch(() => ({}));
  if (!listRes.ok) {
    return NextResponse.json(
      { ok: false, error: "GMAIL_LIST_FAILED", details: list },
      { status: listRes.status || 500 }
    );
  }

  const ids = (list.messages || []).map((m) => m.id);
  const details = await Promise.all(
    ids.map(async (id) => {
      const r = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
        {
          headers: { Authorization: `Bearer ${access}` },
          cache: "no-store",
        }
      );
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return null;
      const headers = Object.fromEntries(
        (d.payload?.headers || []).map((h) => [
          String(h.name || "").toLowerCase(),
          h.value,
        ])
      );
      const from = headers["from"] || "";
      let fromName = "";
      let fromEmail = "";
      const m = from.match(/^(.*)\s*<([^>]+)>$/);
      if (m) {
        fromName = m[1].replace(/"/g, "").trim();
        fromEmail = m[2].trim();
      } else {
        fromEmail = from.trim();
      }
      const parts = extractParts(d.payload || {});
      return {
        id: d.id,
        folder: "Inbox",
        fromName,
        fromEmail,
        subject: headers["subject"] || "(no subject)",
        snippet: d.snippet || "",
        receivedISO: d.internalDate
          ? new Date(Number(d.internalDate)).toISOString()
          : new Date().toISOString(),
        ttl: 24,
        unread: (d.labelIds || []).includes("UNREAD"),
        starred: (d.labelIds || []).includes("STARRED"),
        labels: [],
        plainText: parts.plainText,
        html: parts.html,
        attachments: parts.attachments,
        headers: {
          subject: headers["subject"],
          from: headers["from"],
          to: headers["to"],
          date: headers["date"],
        },
      };
    })
  );

  const messages = details.filter(Boolean);
  return NextResponse.json({
    ok: true,
    messages,
    nextPageToken: list.nextPageToken || null,
  });
}
