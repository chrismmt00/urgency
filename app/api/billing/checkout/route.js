import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: "STRIPE_NOT_CONFIGURED",
      message:
        "Stripe integration is coming soon. Billing will be enabled once keys are configured.",
    },
    { status: 501 }
  );
}
