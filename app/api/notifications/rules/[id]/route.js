import { NextResponse } from "next/server";
import { z } from "zod";
import { readAuthCookies } from "@/lib/auth-cookies";
import { verifyAccessToken } from "@/lib/jwt";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  scope: z.enum(["sender", "domain", "label", "everyone"]).optional(),
  scope_value: z.string().nullable().optional(),
  ttl_hours: z.number().int().positive().optional(),
  importance: z.enum(["low", "normal", "high", "critical"]).optional(),
  auto_star: z.boolean().optional(),
  auto_mark_urgent: z.boolean().optional(),
  active: z.boolean().optional(),
  priority: z.number().int().min(0).max(1000).optional(),
  allow_overdue: z.boolean().optional(),
  match_mode: z.enum(["any", "all", "custom"]).optional(),
  overdue_limit_hours: z.number().int().positive().optional(),
  push_enabled: z.boolean().optional(),
  email_enabled: z.boolean().optional(),
  mobile_enabled: z.boolean().optional(),
  do_not_disturb: z.array(z.string()).nullable().optional(),
  time_buckets: z
    .array(z.number().int().positive())
    .min(1)
    .nullable()
    .optional(),
  criteriaImportance: z
    .array(z.enum(["high", "normal", "low"]))
    .nullable()
    .optional(),
  position: z.number().int().min(0).optional(),
});

export async function PATCH(_req, { params }) {
  const { accessToken } = await readAuthCookies();
  const payload = accessToken && verifyAccessToken(accessToken);
  if (!payload?.sub) {
    return NextResponse.json(
      { ok: false, error: "NO_SESSION" },
      { status: 401 }
    );
  }
  const id = params?.id;
  const json = await _req.json().catch(() => ({}));
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "INVALID_INPUT", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const updates = parsed.data;
  // Remap camelCase to snake_case columns
  if (Object.prototype.hasOwnProperty.call(updates, "criteriaImportance")) {
    updates.criteria_importance = updates.criteriaImportance;
    delete updates.criteriaImportance;
  }
  if (Object.prototype.hasOwnProperty.call(updates, "accountId")) {
    updates.account_id = updates.accountId;
    delete updates.accountId;
  }
  const fields = [];
  const values = [];
  let i = 1;
  for (const [k, v] of Object.entries(updates)) {
    if (v === undefined) continue;
    fields.push(`${k} = $${i++}`);
    values.push(v);
  }
  if (!fields.length) return NextResponse.json({ ok: true });
  values.push(payload.sub);
  values.push(id);
  const { rows } = await query(
    `UPDATE timer_rule SET ${fields.join(", ")}, updated_at = now()
      WHERE user_id = $${i++} AND id = $${i}
      RETURNING *`,
    values
  );
  if (!rows.length) {
    return NextResponse.json(
      { ok: false, error: "NOT_FOUND" },
      { status: 404 }
    );
  }
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req, { params }) {
  const { accessToken } = await readAuthCookies();
  const payload = accessToken && verifyAccessToken(accessToken);
  if (!payload?.sub) {
    return NextResponse.json(
      { ok: false, error: "NO_SESSION" },
      { status: 401 }
    );
  }
  const id = params?.id;
  const { rowCount } = await query(
    `DELETE FROM timer_rule WHERE user_id = $1 AND id = $2`,
    [payload.sub, id]
  );
  if (!rowCount) {
    return NextResponse.json(
      { ok: false, error: "NOT_FOUND" },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true });
}
