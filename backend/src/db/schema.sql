CREATE TABLE IF NOT EXISTS roles (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL UNIQUE,
  label           TEXT NOT NULL,
  description     TEXT,
  self_assignable INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS users (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  email                TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash        TEXT NOT NULL,
  first_name           TEXT NOT NULL,
  last_name            TEXT NOT NULL,
  phone                TEXT,
  role_id              INTEGER NOT NULL REFERENCES roles(id),
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS business_profiles (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id             INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name       TEXT NOT NULL,
  registration_number TEXT,
  vat_number          TEXT,
  industry            TEXT NOT NULL,
  business_size       TEXT NOT NULL,
  country             TEXT NOT NULL,
  currency            TEXT NOT NULL,
  sage_status         TEXT NOT NULL DEFAULT 'not_connected'
                      CHECK (sage_status IN ('not_connected','pending','connected','skipped')),
  sage_region         TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Only a SHA-256 hash of the emailed token is stored, never the token itself.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id);
-- ==================================================
-- ACCOUNTANT WORKSPACE
-- ==================================================

CREATE TABLE IF NOT EXISTS clients (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT,
  business_name TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transactions (
  id                       INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id                INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  description              TEXT NOT NULL,
  amount                   REAL NOT NULL,
  supplier                 TEXT,
  category                 TEXT,
  debit_account            TEXT,
  credit_account           TEXT,
  status                   TEXT NOT NULL DEFAULT 'pending_review'
                           CHECK (status IN ('pending_review', 'approved', 'returned')),
  original_transcription   TEXT,
  supporting_information   TEXT,
  approved_by              INTEGER REFERENCES users(id),
  approved_at              TEXT,
  rejection_reason         TEXT,
  created_at               TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_transactions_client
ON transactions(client_id);

CREATE INDEX IF NOT EXISTS idx_transactions_status
ON transactions(status);