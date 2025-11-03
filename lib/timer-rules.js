import "server-only";

import { addHours } from "date-fns";
import { query } from "@/lib/db";

// Minimal contract
// message: { fromEmail: string, labels?: string[], subject?: string, plainText?: string, receivedISO: string }
// rule: row from timer_rule

export async function loadActiveRulesForUser(userId) {
  const { rows } = await query(
    `SELECT *
       FROM timer_rule
      WHERE user_id = $1 AND active = TRUE
      ORDER BY position ASC, priority ASC, created_at ASC`,
    [userId]
  );
  return rows;
}

function getDomain(email = "") {
  const at = String(email).toLowerCase().split("@");
  return at.length > 1 ? at[1] : "";
}

function includesAny(hay = [], needles = []) {
  if (!Array.isArray(hay) || !Array.isArray(needles)) return false;
  const set = new Set(hay.map((v) => String(v).toLowerCase()));
  return needles.some((n) => set.has(String(n).toLowerCase()));
}

function textContainsAny(text = "", needles = []) {
  if (!text) return false;
  const lower = String(text).toLowerCase();
  return needles.some((k) => lower.includes(String(k).toLowerCase()));
}

export function matchRule(message, rule) {
  if (!rule?.active) return false;
  if (
    rule.account_id &&
    message.account_id &&
    rule.account_id !== message.account_id
  ) {
    return false;
  }
  const fromEmail = (message.fromEmail || "").toLowerCase();
  const domain = getDomain(fromEmail);
  const labels = message.labels || [];
  const keywords = rule.keywords || []; // optional, not in schema by default
  const mode = rule.match_mode || "any";
  const criteriaImportance = rule.criteria_importance || [];
  const importantFlag =
    labels.map((x) => String(x).toUpperCase()).includes("IMPORTANT") ||
    String(message.importance || "").toLowerCase() === "high";

  // Base scope match
  let scopeMatched = false;
  switch (rule.scope) {
    case "sender":
      scopeMatched =
        !!rule.scope_value && fromEmail === rule.scope_value.toLowerCase();
      break;
    case "domain":
      scopeMatched =
        !!rule.scope_value && domain === rule.scope_value.toLowerCase();
      break;
    case "label":
      scopeMatched =
        !!rule.scope_value && includesAny(labels, [rule.scope_value]);
      break;
    case "everyone":
      scopeMatched = true;
      break;
    default:
      scopeMatched = false;
  }

  // Additional criteria (optional): keywords in subject/body
  const subject = message.subject || "";
  const body = message.plainText || "";
  const hasKeywords = keywords && keywords.length > 0;
  const hasImportance = criteriaImportance && criteriaImportance.length > 0;
  const keywordHit = hasKeywords
    ? textContainsAny(subject, keywords) || textContainsAny(body, keywords)
    : false;
  const importanceMatch = hasImportance
    ? (criteriaImportance || []).some((lvl) =>
        String(lvl).toLowerCase() === "high" ? importantFlag : false
      )
    : false;

  if (mode === "all") {
    // Every non-empty criterion must match
    const checks = [];
    // scope is always a criterion (except everyone)
    if (rule.scope && rule.scope !== "everyone") checks.push(scopeMatched);
    if (hasKeywords) checks.push(keywordHit);
    if (hasImportance) checks.push(importanceMatch);
    // If no checks, default to scopeMatched (everyone => true)
    return checks.length ? checks.every(Boolean) : scopeMatched;
  }
  // any (default): if any non-empty criterion matches, or scopeMatched (including everyone)
  const anyChecks = [];
  anyChecks.push(scopeMatched);
  if (hasKeywords) anyChecks.push(keywordHit);
  if (hasImportance) anyChecks.push(importanceMatch);
  return anyChecks.some(Boolean);
}

export function pickMatchingRule(message, rules) {
  if (!Array.isArray(rules) || !rules.length)
    return { rule: null, dueAt: null, status: "active" };
  for (const r of rules) {
    if (matchRule(message, r)) {
      const buckets =
        Array.isArray(r.time_buckets) && r.time_buckets.length
          ? r.time_buckets
          : r.ttl_hours
          ? [r.ttl_hours]
          : [24];
      const hours = Math.min(
        ...buckets.filter((n) => Number.isFinite(n) && n > 0)
      );
      const receivedAt = new Date(message.receivedISO);
      const dueAt = isNaN(receivedAt.getTime())
        ? null
        : addHours(receivedAt, hours || 24);
      let status = "active";
      const limit = Number.isFinite(r.overdue_limit_hours)
        ? r.overdue_limit_hours
        : 72;
      if (dueAt && Date.now() - dueAt.getTime() > limit * 3600 * 1000) {
        status = "suppressed";
      }
      return { rule: r, dueAt, status };
    }
  }
  return { rule: null, dueAt: null, status: "active" };
}
