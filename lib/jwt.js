import "server-only";

import jwt from "jsonwebtoken";
import { add } from "date-fns";
import { randomBytes, createHash } from "crypto";

const accessTtl = process.env.TOKEN_EXPIRY_ACCESS || "15m";
const refreshTtl = process.env.TOKEN_EXPIRY_REFRESH || "30d";

function requireAccessSecret() {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    const err = new Error(
      "JWT_ACCESS_SECRET is not set. Add it to .env.local at the repo root."
    );
    err.code = "JWT_ACCESS_SECRET_MISSING";
    throw err;
  }
  return secret;
}

function requireRefreshSecret() {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    const err = new Error(
      "JWT_REFRESH_SECRET is not set. Add it to .env.local at the repo root."
    );
    err.code = "JWT_REFRESH_SECRET_MISSING";
    throw err;
  }
  return secret;
}

export function signAccessToken(user) {
  const accessSecret = requireAccessSecret();
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      verified: user.is_verified,
      subscriptionStatus: user.subscription_status,
    },
    accessSecret,
    { expiresIn: accessTtl }
  );
}

export function verifyAccessToken(token) {
  try {
    const accessSecret = requireAccessSecret();
    return jwt.verify(token, accessSecret);
  } catch {
    return null;
  }
}

export function createRefreshToken() {
  requireRefreshSecret(); // validate configured even though we return opaque token
  const token = randomBytes(48).toString("base64url");
  const expiresAt = add(new Date(), parseDuration(refreshTtl));
  return { token, expiresAt };
}

export function hashRefreshToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function parseDuration(duration) {
  // jwt style durations like "15m", "30d"
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return { minutes: 15 };
  const value = Number(match[1]);
  const unit = match[2];
  switch (unit) {
    case "s":
      return { seconds: value };
    case "m":
      return { minutes: value };
    case "h":
      return { hours: value };
    case "d":
      return { days: value };
    default:
      return { minutes: 15 };
  }
}
