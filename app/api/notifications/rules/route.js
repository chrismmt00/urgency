import { NextResponse } from "next/server";
import { z } from "zod";
import { readAuthCookies } from "@/lib/auth-cookies";
import { verifyAccessToken } from "@/lib/jwt";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const RuleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  accountId: z.string().uuid().optional(),
  scope: z.enum(["sender", "domain", "label", "everyone"]),
  scope_value: z.string().nullable().optional(),
  ttl_hours: z.number().int().positive().optional(),
  importance: z.enum(["low", "normal", "high", "critical"]).optional(),
  auto_star: z.boolean().optional(),
  auto_mark_urgent: z.boolean().optional(),
  active: z.boolean().optional(),
  priority: z.number().int().min(0).max(1000).optional(),
  // New fields
  allow_overdue: z.boolean().optional(),
  match_mode: z.enum(["any", "all", "custom"]).optional(),
  overdue_limit_hours: z.number().int().positive().optional(),
  push_enabled: z.boolean().optional(),
  email_enabled: z.boolean().optional(),
  mobile_enabled: z.boolean().optional(),
  do_not_disturb: z.array(z.string()).optional(),
  time_buckets: z.array(z.number().int().positive()).min(1).optional(),
  criteriaImportance: z.array(z.enum(["high", "normal", "low"])).optional(),
  position: z.number().int().min(0).optional(),
});

export async function GET() {
  const { accessToken } = await readAuthCookies();
  const payload = accessToken && verifyAccessToken(accessToken);
  if (!payload?.sub) {
    return NextResponse.json(
      { ok: false, error: "NO_SESSION" },
      { status: 401 }
    );
  }
  let { rows } = await query(
    `SELECT * FROM timer_rule WHERE user_id = $1 ORDER BY position ASC, priority ASC, created_at ASC`,
    [payload.sub]
  );
  // Seed a default rule if user has none
  if (!rows.length) {
    await query(
      `INSERT INTO timer_rule (
        user_id, name, scope, scope_value, ttl_hours, importance, auto_star, auto_mark_urgent, active, priority,
        allow_overdue, match_mode, overdue_limit_hours, push_enabled, email_enabled, mobile_enabled, do_not_disturb, time_buckets, position, criteria_importance
       ) VALUES (
        $1, $2, 'everyone', NULL, 24, 'high', TRUE, TRUE, TRUE, 100,
        TRUE, 'any', 72, TRUE, FALSE, FALSE, NULL, ARRAY[24,48,72], 0, ARRAY['high']
       )`,
      [payload.sub, "Important emails"]
    );
    const seeded = await query(
      `SELECT * FROM timer_rule WHERE user_id = $1 ORDER BY position ASC, priority ASC, created_at ASC`,
      [payload.sub]
    );
    rows = seeded.rows;
  }
  return NextResponse.json(rows);
}

export async function POST(req) {
  const { accessToken } = await readAuthCookies();
  const payload = accessToken && verifyAccessToken(accessToken);
  if (!payload?.sub) {
    return NextResponse.json(
      { ok: false, error: "NO_SESSION" },
      { status: 401 }
    );
  }
  const json = await req.json().catch(() => ({}));
  const parsed = RuleSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "INVALID_INPUT", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const r = parsed.data;
  const { rows } = await query(
    `INSERT INTO timer_rule (
      user_id, account_id, name, scope, scope_value, ttl_hours, importance, auto_star, auto_mark_urgent, active, priority,
      allow_overdue, match_mode, overdue_limit_hours, push_enabled, email_enabled, mobile_enabled, do_not_disturb, time_buckets, position, criteria_importance
     ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,COALESCE($10,TRUE),COALESCE($11,100),
      COALESCE($12,TRUE),COALESCE($13,'any'),COALESCE($14,72),COALESCE($15,TRUE),COALESCE($16,FALSE),COALESCE($17,FALSE),$18,$19,COALESCE($20,0),$21
     ) RETURNING *`,
    [
      payload.sub,
      r.accountId || null,
      r.name ?? null,
      r.scope,
      r.scope_value ?? null,
      r.ttl_hours ?? 24,
      r.importance ?? "high",
      r.auto_star ?? true,
      r.auto_mark_urgent ?? true,
      r.active,
      r.priority,
      r.allow_overdue,
      r.match_mode,
      r.overdue_limit_hours,
      r.push_enabled,
      r.email_enabled,
      r.mobile_enabled,
      r.do_not_disturb || null,
      r.time_buckets || [24, 48, 72],
      r.position,
      r.criteriaImportance || null,
    ]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
