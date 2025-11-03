import "server-only";

import { query } from "./db";
import { encrypt, decrypt } from "./encryption";

export async function saveConnectedAccount({
  userId,
  provider,
  providerUserId,
  email,
  accessToken,
  refreshToken,
  expiresAt,
  scope,
}) {
  const accessBuf = encrypt(accessToken);
  const refreshBuf = refreshToken ? encrypt(refreshToken) : null;
  const { rows } = await query(
    `INSERT INTO connected_account
      (user_id, provider, provider_user_id, email_address, access_token_enc, refresh_token_enc, token_expires_at, scope)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (provider, provider_user_id)
     DO UPDATE SET
       user_id = EXCLUDED.user_id,
       email_address = EXCLUDED.email_address,
       access_token_enc = EXCLUDED.access_token_enc,
       refresh_token_enc = COALESCE(EXCLUDED.refresh_token_enc, connected_account.refresh_token_enc),
       token_expires_at = EXCLUDED.token_expires_at,
       scope = EXCLUDED.scope
     RETURNING *`,
    [
      userId,
      provider,
      providerUserId,
      email,
      accessBuf,
      refreshBuf,
      expiresAt ? new Date(expiresAt) : null,
      scope || null,
    ]
  );
  return rows[0];
}

export async function listConnectedAccounts(userId) {
  const { rows } = await query(
    `SELECT provider, email_address, token_expires_at FROM connected_account WHERE user_id = $1 ORDER BY connected_at DESC`,
    [userId]
  );
  return rows.map((r) => ({
    provider: r.provider,
    email: r.email_address,
    expiresAt: r.token_expires_at,
  }));
}

export async function getConnectedAccount(userId, provider) {
  const { rows } = await query(
    `SELECT * FROM connected_account WHERE user_id = $1 AND provider = $2 LIMIT 1`,
    [userId, provider]
  );
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    provider: r.provider,
    email: r.email_address,
    providerUserId: r.provider_user_id,
    accessToken: decrypt(r.access_token_enc),
    refreshToken: r.refresh_token_enc ? decrypt(r.refresh_token_enc) : null,
    expiresAt: r.token_expires_at,
    scope: r.scope,
  };
}

export async function deleteConnectedAccount(userId, provider) {
  await query(
    `DELETE FROM connected_account WHERE user_id = $1 AND provider = $2`,
    [userId, provider]
  );
}

export async function getConnectedAccountById(userId, accountId) {
  const { rows } = await query(
    `SELECT * FROM connected_account WHERE user_id = $1 AND id = $2 LIMIT 1`,
    [userId, accountId]
  );
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    provider: r.provider,
    email: r.email_address,
    providerUserId: r.provider_user_id,
    accessToken: decrypt(r.access_token_enc),
    refreshToken: r.refresh_token_enc ? decrypt(r.refresh_token_enc) : null,
    expiresAt: r.token_expires_at,
    scope: r.scope,
  };
}
