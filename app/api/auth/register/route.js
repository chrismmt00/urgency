import { NextResponse } from "next/server";
import { z } from "zod";
import { registerLocalUser } from "@/lib/auth-service";

export const dynamic = "force-dynamic";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .max(72, "Password must be fewer than 72 characters."),
  displayName: z.string().min(2).max(80),
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password, displayName } = RegisterSchema.parse(body);

    await registerLocalUser({ email, password, displayName });

    return NextResponse.json({
      ok: true,
      message: "Account created. Check your email to verify your address.",
    });
  } catch (err) {
    if (err?.code === "EMAIL_IN_USE") {
      return NextResponse.json(
        { ok: false, error: "EMAIL_IN_USE", message: "Email already in use." },
        { status: 409 }
      );
    }
    if (err?.code === "EMAIL_SEND_FAILED") {
      return NextResponse.json(
        {
          ok: false,
          error: "EMAIL_SEND_FAILED",
          message: err.message,
        },
        { status: 502 }
      );
    }
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", issues: err.issues },
        { status: 422 }
      );
    }
    console.error("Register error", err);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
