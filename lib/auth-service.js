import "server-only";

import { addDays, isAfter } from "date-fns";
import { nanoid } from "nanoid";
import { withClient, query } from "./db";
import { hashPassword, verifyPassword } from "./password";
import { signAccessToken, createRefreshToken, hashRefreshToken } from "./jwt";
import { sendVerificationEmail } from "./email";
import { createHash } from "crypto";

const VERIFICATION_TOKEN_TTL_HOURS = 24;

export async function findUserByEmail(email) {
  const { rows } = await query("SELECT * FROM app_user WHERE email = $1", [
    email,
  ]);
  return rows[0] || null;
}

export async function findUserById(id) {
  const { rows } = await query("SELECT * FROM app_user WHERE id = $1", [id]);
  return rows[0] || null;
}

export async function registerLocalUser({ email, password, displayName }) {
  const lowerEmail = email.trim().toLowerCase();

  return withClient(async (client) => {
    await client.query("BEGIN");
    const existing = await client.query(
      "SELECT id, is_verified, subscription_status FROM app_user WHERE email = $1",
      [lowerEmail]
    );
    if (existing.rows.length) {
      await client.query("ROLLBACK");
      const err = new Error("Email already in use.");
      err.code = "EMAIL_IN_USE";
      throw err;
    }

    const trialStart = new Date();
    const trialEnd = addDays(trialStart, 3);
    const passwordHash = await hashPassword(password);

    const insertUser = await client.query(
      `INSERT INTO app_user
        (email, display_name, is_verified, verified_at, trial_started_at, trial_ends_at, subscription_status, provider)
       VALUES ($1, $2, FALSE, NULL, $3, $4, 'trial', 'local')
       RETURNING *`,
      [lowerEmail, displayName || null, trialStart, trialEnd]
    );
    const user = insertUser.rows[0];

    await client.query(
      `INSERT INTO user_credentials (user_id, password_hash)
       VALUES ($1, $2)`,
      [user.id, passwordHash]
    );

    const verificationToken = nanoid(48);
    const tokenHash = createHash("sha256")
      .update(verificationToken)
      .digest("hex");
    const expiresAt = new Date(
      Date.now() + VERIFICATION_TOKEN_TTL_HOURS * 3600 * 1000
    );

    await client.query(
      `INSERT INTO email_verification_token (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET token_hash = EXCLUDED.token_hash, expires_at = EXCLUDED.expires_at, created_at = now()`,
      [user.id, tokenHash, expiresAt]
    );

    await client.query("COMMIT");

    try {
      await sendVerificationEmail({ to: lowerEmail, token: verificationToken });
    } catch (err) {
      console.error("Failed to send verification email", err);
      const emailErr = new Error(
        "Unable to send verification email. Please try again later."
      );
      emailErr.code = "EMAIL_SEND_FAILED";
      throw emailErr;
    }

    return user;
  });
}

export async function verifyEmailToken(token) {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return withClient(async (client) => {
    await client.query("BEGIN");
    const tokenRes = await client.query(
      `SELECT evt.user_id, evt.expires_at, au.is_verified
       FROM email_verification_token evt
       JOIN app_user au ON au.id = evt.user_id
       WHERE evt.token_hash = $1`,
      [tokenHash]
    );
    if (!tokenRes.rows.length) {
      await client.query("ROLLBACK");
      const err = new Error("Invalid or expired verification token.");
      err.code = "TOKEN_INVALID";
      throw err;
    }
    const record = tokenRes.rows[0];
    if (isAfter(new Date(), new Date(record.expires_at))) {
      await client.query("ROLLBACK");
      const err = new Error("Verification token expired.");
      err.code = "TOKEN_EXPIRED";
      throw err;
    }

    await client.query(
      `UPDATE app_user SET is_verified = TRUE, verified_at = now()
       WHERE id = $1`,
      [record.user_id]
    );
    await client.query(
      "DELETE FROM email_verification_token WHERE user_id = $1",
      [record.user_id]
    );
    await client.query("COMMIT");

    return await findUserById(record.user_id);
  });
}

export async function loginWithEmail({ email, password }) {
  const lower = email.trim().toLowerCase();
  const { rows } = await query(
    `SELECT au.*, uc.password_hash
     FROM app_user au
     JOIN user_credentials uc ON uc.user_id = au.id
     WHERE au.email = $1`,
    [lower]
  );
  const record = rows[0];
  if (!record) {
    const err = new Error("Invalid credentials.");
    err.code = "INVALID_LOGIN";
    throw err;
  }
  const passwordHash = record.password_hash;
  const valid = await verifyPassword(record.password_hash, password);
  if (!valid) {
    const err = new Error("Invalid credentials.");
    err.code = "INVALID_LOGIN";
    throw err;
  }
  delete record.password_hash;

  const trialExpired =
    record.subscription_status === "trial" &&
    record.trial_ends_at &&
    isAfter(new Date(), new Date(record.trial_ends_at));

  return { user: record, trialExpired };
}

export async function createSession({ userId, userAgent, ip }) {
  const { token, expiresAt } = createRefreshToken();
  const hash = hashRefreshToken(token);
  const { rows } = await query(
    `INSERT INTO login_session (user_id, refresh_token_hash, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, hash, expiresAt, userAgent || null, ip || null]
  );
  return { session: rows[0], refreshToken: token };
}

export async function rotateSession({ refreshToken }) {
  const hash = hashRefreshToken(refreshToken);
  const { rows } = await query(
    `SELECT * FROM login_session WHERE refresh_token_hash = $1 AND revoked = FALSE`,
    [hash]
  );
  const session = rows[0];
  if (!session) {
    const err = new Error("Invalid session.");
    err.code = "INVALID_SESSION";
    throw err;
  }
  if (session.expires_at && isAfter(new Date(), new Date(session.expires_at))) {
    await query("UPDATE login_session SET revoked = TRUE WHERE id = $1", [
      session.id,
    ]);
    const err = new Error("Session expired.");
    err.code = "SESSION_EXPIRED";
    throw err;
  }

  const user = await findUserById(session.user_id);
  if (!user) {
    const err = new Error("User not found.");
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  const accessToken = signAccessToken(user);
  return { user, session, accessToken };
}

export async function revokeSession(refreshToken) {
  const hash = hashRefreshToken(refreshToken);
  await query(
    "UPDATE login_session SET revoked = TRUE WHERE refresh_token_hash = $1",
    [hash]
  );
}
