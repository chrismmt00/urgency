BEGIN;

ALTER TABLE timer_rule
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES connected_account(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_timer_rule_user_account_pos
  ON timer_rule(user_id, account_id, position);

COMMIT;