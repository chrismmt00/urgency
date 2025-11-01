import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  console.log("/api/connections/outlook placeholder called");
  return NextResponse.json({ ok: false, message: "Not implemented yet" });
}
