BEGIN;

ALTER TABLE app_user
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial','active','cancelled','past_due','expired','none')),
  ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ALTER COLUMN is_verified SET DEFAULT FALSE;

UPDATE app_user
SET
  trial_started_at = COALESCE(trial_started_at, created_at),
  trial_ends_at = COALESCE(trial_ends_at, created_at + interval '3 days'),
  subscription_status = COALESCE(subscription_status, 'trial'),
  verified_at = CASE WHEN is_verified AND verified_at IS NULL THEN now() ELSE verified_at END;

CREATE TABLE IF NOT EXISTS email_verification_token (
  user_id UUID PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS login_session (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  user_agent TEXT,
  ip_address INET,
  UNIQUE (user_id, refresh_token_hash)
);

COMMIT;
