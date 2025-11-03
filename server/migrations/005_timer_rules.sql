BEGIN;

ALTER TABLE timer_rule
  ADD COLUMN IF NOT EXISTS allow_overdue BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS criteria_importance TEXT[],
  ADD COLUMN IF NOT EXISTS match_mode TEXT NOT NULL DEFAULT 'any'
    CHECK (match_mode IN ('any','all','custom')),
  ADD COLUMN IF NOT EXISTS overdue_limit_hours INT NOT NULL DEFAULT 72,
  ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS mobile_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS do_not_disturb TEXT[],
  ADD COLUMN IF NOT EXISTS time_buckets INT[] NOT NULL DEFAULT ARRAY[24,48,72],
  ADD COLUMN IF NOT EXISTS name TEXT;

-- Mail message metadata: remember which rule fired, when it’s due, and its state
ALTER TABLE mail_message
  ADD COLUMN IF NOT EXISTS timer_rule_id UUID REFERENCES timer_rule(id),
  ADD COLUMN IF NOT EXISTS timer_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS timer_status TEXT NOT NULL DEFAULT 'active'
    CHECK (timer_status IN ('active','resolved','suppressed'));

CREATE INDEX IF NOT EXISTS idx_mail_message_timer_rule
  ON mail_message(timer_rule_id);

CREATE INDEX IF NOT EXISTS idx_mail_message_due_at
  ON mail_message(timer_due_at)
  WHERE timer_status = 'active';

-- Optional: keep rule ordering if you want first-match wins
ALTER TABLE timer_rule
  ADD COLUMN IF NOT EXISTS position INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_timer_rule_position
  ON timer_rule(user_id, position);

COMMIT;