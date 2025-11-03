BEGIN;

ALTER TABLE connected_account
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE;

-- Optional: ensure only one default per user via a partial unique index using expression
-- This is not strictly enforced here because it would require a complex constraint.
-- We'll enforce single-default in the API when setting default.

-- Soft-enforce a single default per user via partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS ux_connected_account_default_one_per_user
  ON connected_account(user_id)
  WHERE is_default;

COMMIT;
