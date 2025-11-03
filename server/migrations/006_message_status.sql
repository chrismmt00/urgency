BEGIN;

-- Minimal per-message status store without requiring full message/thread cache
CREATE TABLE IF NOT EXISTS message_status (
  account_id       UUID NOT NULL REFERENCES connected_account(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  provider_msg_id  TEXT NOT NULL,
  timer_status     TEXT NOT NULL DEFAULT 'active' CHECK (timer_status IN ('active','resolved','suppressed')),
  timer_rule_id    UUID REFERENCES timer_rule(id),
  timer_due_at     TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, provider_msg_id)
);
CREATE INDEX IF NOT EXISTS idx_message_status_user ON message_status(user_id);

COMMIT;