import { NextResponse } from "next/server";

export async function GET(_, { params }) {
  return NextResponse.json(
    {
      ok: false,
      error: "NOT_IMPLEMENTED",
      message: `${params.provider} OAuth is coming soon.`,
    },
    { status: 501 }
  );
}
