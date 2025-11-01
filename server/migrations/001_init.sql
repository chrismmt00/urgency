BEGIN;

-- ===== 0) Extensions =====
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ===== 1) Enums =====
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mail_provider') THEN
    CREATE TYPE mail_provider AS ENUM ('gmail','outlook');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'theme_mode') THEN
    CREATE TYPE theme_mode AS ENUM ('light','dark','system');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rule_scope') THEN
    CREATE TYPE rule_scope AS ENUM ('sender','domain','label','everyone');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'importance') THEN
    CREATE TYPE importance AS ENUM ('low','normal','high','critical');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notify_channel') THEN
    CREATE TYPE notify_channel AS ENUM ('inapp','email','push');
  END IF;
END$$;

-- ===== 2) Users & Auth (JWT) =====
CREATE TABLE IF NOT EXISTS app_user (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           CITEXT UNIQUE NOT NULL,
  display_name    TEXT,
  avatar_url      TEXT,
  is_verified     BOOLEAN NOT NULL DEFAULT TRUE,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Optional native credentials (bcrypt/argon2 hash)
CREATE TABLE IF NOT EXISTS user_credentials (
  user_id         UUID PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  password_hash   TEXT NOT NULL,
  password_algo   TEXT NOT NULL DEFAULT 'argon2id',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_token (
  user_id         UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  token_hash      TEXT PRIMARY KEY,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Refresh tokens for JWT (store only a HASH of the refresh token)
CREATE TABLE IF NOT EXISTS user_refresh_token (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL,                       -- sha256/argon2 of refresh JWT
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked         BOOLEAN NOT NULL DEFAULT FALSE,
  user_agent      TEXT,
  ip_address      INET,
  UNIQUE (user_id, token_hash)
);
CREATE INDEX IF NOT EXISTS idx_refresh_token_user ON user_refresh_token(user_id);

-- ===== 3) Connected Mail Accounts (Gmail / Outlook) =====
CREATE TABLE IF NOT EXISTS connected_account (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  provider          mail_provider NOT NULL,
  provider_user_id  TEXT NOT NULL,                 -- Google sub / MS oid
  email_address     CITEXT NOT NULL,
  access_token_enc  BYTEA NOT NULL,                -- store encrypted (app-level or pgcrypto)
  refresh_token_enc BYTEA,                         -- store encrypted if present
  token_expires_at  TIMESTAMPTZ,
  scope             TEXT,
  connected_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_user_id)
);
CREATE INDEX IF NOT EXISTS idx_connected_account_user ON connected_account(user_id);

-- Per-account sync state (delta tokens, webhooks)
CREATE TABLE IF NOT EXISTS account_sync_state (
  account_id             UUID PRIMARY KEY REFERENCES connected_account(id) ON DELETE CASCADE,
  gmail_history_id       BIGINT,                 -- Gmail history cursor
  outlook_delta_url      TEXT,                   -- MS Graph delta link
  webhook_subscription_id TEXT,
  webhook_expires_at     TIMESTAMPTZ,
  last_full_sync_at      TIMESTAMPTZ,
  last_delta_at          TIMESTAMPTZ
);

-- ===== 4) User Settings / Preferences =====
CREATE TABLE IF NOT EXISTS user_settings (
  user_id         UUID PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  theme_mode      theme_mode NOT NULL DEFAULT 'system',
  default_ttls    INT[] NOT NULL DEFAULT ARRAY[24,48,72],
  high_contrast   BOOLEAN NOT NULL DEFAULT FALSE,
  sound_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  haptics_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  timezone        TEXT DEFAULT 'America/New_York'
);

-- ===== 5) Contacts (for rules by sender/domain/company) =====
CREATE TABLE IF NOT EXISTS contact (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  email         CITEXT NOT NULL,
  display_name  TEXT,
  organization  TEXT,
  is_starred    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, email)
);
CREATE INDEX IF NOT EXISTS idx_contact_user_org ON contact(user_id, organization);

-- ===== 6) Timer Rules & Importance =====
CREATE TABLE IF NOT EXISTS timer_rule (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  scope            rule_scope NOT NULL,                  -- sender | domain | label | everyone
  scope_value      TEXT,                                 -- e.g., 'boss@co.com', 'company.com', 'Work', or NULL
  ttl_hours        INT NOT NULL DEFAULT 24,
  importance       importance NOT NULL DEFAULT 'high',
  auto_star        BOOLEAN NOT NULL DEFAULT TRUE,
  auto_mark_urgent BOOLEAN NOT NULL DEFAULT TRUE,
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  priority         INT NOT NULL DEFAULT 100,             -- lower = higher priority
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_timer_rule_user_scope ON timer_rule(user_id, scope, scope_value);
CREATE INDEX IF NOT EXISTS idx_timer_rule_user_priority ON timer_rule(user_id, priority);

-- ===== 7) Threads & Messages Cache =====
CREATE TABLE IF NOT EXISTS mail_thread (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  account_id         UUID NOT NULL REFERENCES connected_account(id) ON DELETE CASCADE,
  provider           mail_provider NOT NULL,
  provider_thread_id TEXT,                                 -- Gmail threadId / Outlook conversationId
  subject            TEXT,
  last_received_at   TIMESTAMPTZ,
  last_synced_at     TIMESTAMPTZ,
  UNIQUE (account_id, provider_thread_id)
);
CREATE INDEX IF NOT EXISTS idx_mail_thread_user_time ON mail_thread(user_id, last_received_at DESC);

CREATE TABLE IF NOT EXISTS mail_message (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id          UUID NOT NULL REFERENCES mail_thread(id) ON DELETE CASCADE,
  account_id         UUID NOT NULL REFERENCES connected_account(id) ON DELETE CASCADE,
  provider           mail_provider NOT NULL,
  provider_msg_id    TEXT NOT NULL,                        -- Gmail id / Outlook message id
  internet_msg_id    TEXT,                                 -- RFC822 Message-Id (if available)
  from_name          TEXT,
  from_email         CITEXT,
  to_emails          TEXT[],
  cc_emails          TEXT[],
  subject            TEXT,
  snippet            TEXT,
  body_html          TEXT,
  body_text          TEXT,
  received_at        TIMESTAMPTZ,
  is_read            BOOLEAN NOT NULL DEFAULT FALSE,
  is_starred         BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timer application if a rule matched at ingest
  rule_id            UUID REFERENCES timer_rule(id),
  ttl_hours          INT,                                  -- resolved from rule
  timer_due_at       TIMESTAMPTZ,                          -- received_at + ttl_hours
  is_urgent          BOOLEAN NOT NULL DEFAULT FALSE,

  snoozed_until      TIMESTAMPTZ,
  labels             TEXT[],
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (account_id, provider_msg_id)
);
CREATE INDEX IF NOT EXISTS idx_mail_message_thread ON mail_message(thread_id);
CREATE INDEX IF NOT EXISTS idx_mail_message_due ON mail_message((received_at IS NOT NULL), timer_due_at);
CREATE INDEX IF NOT EXISTS idx_mail_message_sender ON mail_message(from_email);

-- ===== 8) Snooze / Reminders =====
CREATE TABLE IF NOT EXISTS snooze_action (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  message_id      UUID NOT NULL REFERENCES mail_message(id) ON DELETE CASCADE,
  snoozed_from    TIMESTAMPTZ NOT NULL DEFAULT now(),
  snoozed_until   TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS reminder (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  message_id      UUID NOT NULL REFERENCES mail_message(id) ON DELETE CASCADE,
  remind_at       TIMESTAMPTZ NOT NULL,
  channel         notify_channel NOT NULL DEFAULT 'inapp',
  sent_at         TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled','sent','canceled','failed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reminder_due ON reminder(remind_at) WHERE status = 'scheduled';

-- ===== 9) Analytics / Gamification =====
CREATE TABLE IF NOT EXISTS reply_event (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  message_id         UUID REFERENCES mail_message(id) ON DELETE SET NULL,
  replied_at         TIMESTAMPTZ NOT NULL,
  seconds_to_reply   INT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_badge (
  user_id    UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  badge_key  TEXT NOT NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_key)
);

-- ===== 10) Audit & Webhook Inbox =====
CREATE TABLE IF NOT EXISTS audit_log (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES app_user(id) ON DELETE SET NULL,
  event_key    TEXT NOT NULL,        -- e.g., 'RULE_APPLIED','SNOOZE','SYNC','LOGIN'
  payload      JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_event (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id   UUID NOT NULL REFERENCES connected_account(id) ON DELETE CASCADE,
  provider     mail_provider NOT NULL,
  event_type   TEXT NOT NULL,
  payload      JSONB NOT NULL,
  received_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

COMMIT;
