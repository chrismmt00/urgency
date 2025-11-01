import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const key = process.env.STRIPE_SECRET_KEY;
  const portalUrl = process.env.STRIPE_BILLING_PORTAL_URL;
  if (!key || !portalUrl) {
    return NextResponse.json(
      { ok: false, message: "Stripe not configured" },
      { status: 200 }
    );
  }
  // In a real implementation, create a portal session via Stripe API
  return NextResponse.json({ ok: false, message: "Not implemented yet" });
}
