import "server-only";

import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, MAIL_FROM } =
  process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
  console.warn(
    "SMTP configuration is incomplete. Email verification will fail until SMTP_* env vars are set."
  );
}

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: SMTP_SECURE === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  return transporter;
}

export async function sendVerificationEmail({ to, token }) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify?token=${encodeURIComponent(token)}`;

  const mailOpts = {
    from: MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: "Verify your Urgency account",
    html: `
      <p>Welcome to Urgency!</p>
      <p>Click the button below to verify your email address and unlock your inbox trial.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${verifyUrl}" style="background:#4b9eff;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Verify email</a>
      </p>
      <p>This link expires in 24 hours. If you did not create an account, you can ignore this email.</p>
    `,
  };

  const transport = getTransporter();
  await transport.sendMail(mailOpts);
}
