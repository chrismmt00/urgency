import { NextResponse } from "next/server";
import { isAfter, addSeconds } from "date-fns";
import { readAuthCookies } from "@/lib/auth-cookies";
import { verifyAccessToken } from "@/lib/jwt";
import {
  getConnectedAccount,
  saveConnectedAccount,
  getConnectedAccountById,
} from "@/lib/connected-accounts";
import { refreshGoogleToken } from "@/lib/google";
import { loadActiveRulesForUser, pickMatchingRule } from "@/lib/timer-rules";
import { query } from "@/lib/db";

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
  const inUrl = new URL(req.url);
  const accountId = inUrl.searchParams.get("accountId") || "";
  const folderParam = (
    inUrl.searchParams.get("folder") || "important"
  ).toLowerCase();
  const { accessToken } = await readAuthCookies();
  const payload = accessToken && verifyAccessToken(accessToken);
  if (!payload?.sub) {
    return NextResponse.json(
      { ok: false, error: "NO_SESSION" },
      { status: 401 }
    );
  }

  const acct = accountId
    ? await getConnectedAccountById(payload.sub, accountId)
    : await getConnectedAccount(payload.sub, "gmail");
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
  // Map selected folder to Gmail search query
  const legacyFolder =
    folderParam === "important"
      ? "Important"
      : folderParam === "starred"
      ? "Starred"
      : folderParam === "primary"
      ? "Inbox"
      : folderParam === "sent"
      ? "Sent"
      : folderParam === "spam"
      ? "Spam"
      : folderParam === "trash"
      ? "Trash"
      : folderParam === "all"
      ? "All Mail"
      : "Inbox";
  if (folderParam === "important") {
    url.searchParams.set("q", "is:important");
  } else if (folderParam === "starred") {
    url.searchParams.set("q", "is:starred");
  } else if (folderParam === "primary") {
    url.searchParams.set("q", "in:inbox");
  } else if (folderParam === "sent") {
    url.searchParams.set("q", "in:sent");
  } else if (folderParam === "spam") {
    url.searchParams.set("q", "in:spam");
  } else if (folderParam === "trash") {
    url.searchParams.set("q", "in:trash");
  } // else 'all' => no q param
  const pageToken = inUrl.searchParams.get("pageToken");
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
        account_id: acct.id,
        folder: legacyFolder,
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
        labels: Array.isArray(d.labelIds) ? d.labelIds : [],
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

  let messages = details.filter(Boolean);

  // Apply timer rules (on-the-fly) and overlay any persisted status overrides
  try {
    const rules = await loadActiveRulesForUser(payload.sub);
    messages = messages.map((msg) => {
      const { rule, dueAt, status } = pickMatchingRule(msg, rules);
      return {
        ...msg,
        timer_rule_id: rule ? rule.id : null,
        timer_due_at: dueAt ? dueAt.toISOString() : null,
        timer_status: status || "active",
        allow_overdue: rule ? !!rule.allow_overdue : true,
        overdue_limit_hours:
          rule && Number.isFinite(rule.overdue_limit_hours)
            ? rule.overdue_limit_hours
            : 72,
      };
    });

    // Overlay persisted resolution state if present
    if (acct?.id && messages.length) {
      const msgIds = messages.map((m) => m.id);
      const { rows: statusRows } = await query(
        `SELECT provider_msg_id, timer_status, timer_due_at
           FROM message_status
          WHERE user_id = $1 AND account_id = $2 AND provider_msg_id = ANY($3)`,
        [payload.sub, acct.id, msgIds]
      );
      if (statusRows.length) {
        const map = new Map(statusRows.map((r) => [r.provider_msg_id, r]));
        messages = messages.map((m) => {
          const s = map.get(m.id);
          return s
            ? {
                ...m,
                timer_status: s.timer_status || m.timer_status,
                timer_due_at: s.timer_due_at
                  ? new Date(s.timer_due_at).toISOString()
                  : m.timer_due_at,
              }
            : m;
        });
      }
    }
  } catch (e) {
    console.warn("Timer rules application failed:", e?.message || e);
  }

  return NextResponse.json({
    ok: true,
    messages,
    nextPageToken: list.nextPageToken || null,
  });
}
