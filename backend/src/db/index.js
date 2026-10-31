
const Database = require("better-sqlite3");
const fs = require("node:fs");
const path = require("node:path");
const { config } = require("../config.js");

fs.mkdirSync(path.dirname(config.databaseFile), {
  recursive: true,
});

const db = new Database(config.databaseFile);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create missing tables without deleting existing data.
const schemaPath = path.join(__dirname, "schema.sql");

db.exec(fs.readFileSync(schemaPath, "utf8"));

// Add columns only when they do not already exist.
const addColumn = (table, name, definition) => {
  const columns = db
    .prepare(`PRAGMA table_info(${table})`)
    .all();

  const exists = columns.some(
    (column) => column.name === name
  );

  if (!exists) {
    db.exec(
      `ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`
    );
  }
};

// Existing accountant and transaction migrations.
addColumn(
  "clients",
  "owner_user_id",
  "INTEGER REFERENCES users(id)"
);

addColumn(
  "transactions",
  "payload_json",
  "TEXT"
);

// Profile photo migration.
addColumn(
  "users",
  "profile_photo_url",
  "TEXT"
);

// Preserve the current accountant workspace schema.
db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_owner
  ON clients(owner_user_id);

  CREATE TABLE IF NOT EXISTS accountant_assignments (
    client_id INTEGER PRIMARY KEY
      REFERENCES clients(id) ON DELETE CASCADE,

    accountant_id INTEGER NOT NULL
      REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_assignments_accountant
  ON accountant_assignments(accountant_id);

  CREATE TABLE IF NOT EXISTS transaction_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    transaction_id INTEGER
      REFERENCES transactions(id),

    client_id INTEGER NOT NULL
      REFERENCES clients(id),

    actor_id INTEGER NOT NULL
      REFERENCES users(id),

    action TEXT NOT NULL,
    source TEXT NOT NULL,

    timestamp TEXT NOT NULL DEFAULT (
      strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    )
  );

  CREATE INDEX IF NOT EXISTS idx_audit_client
  ON transaction_audit(client_id);

  CREATE TABLE IF NOT EXISTS legacy_transaction_imports (
    legacy_id TEXT PRIMARY KEY,

    owner_user_id INTEGER NOT NULL
      REFERENCES users(id),

    transaction_id INTEGER NOT NULL
      REFERENCES transactions(id)
  );
`);

// Create the Google identity table if missing.
// Its structure is defined in schema.sql.
db.exec(`
  CREATE TABLE IF NOT EXISTS user_google_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL UNIQUE
      REFERENCES users(id) ON DELETE CASCADE,

    google_sub TEXT NOT NULL UNIQUE,

    linked_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_google_accounts_user
  ON user_google_accounts(user_id);
`);

// Seed the supported user roles.
const seedRole = db.prepare(`
  INSERT OR IGNORE INTO roles (
    name,
    label,
    description,
    self_assignable
  )
  VALUES (?, ?, ?, ?)
`);

const roles = [
  [
    "business_owner",
    "Business owner",
    "Run your business finances and see the full picture.",
    1,
  ],
  [
    "accountant",
    "Accountant",
    "Review books, reports and compliance for your practice.",
    1,
  ],
  [
    "bookkeeper",
    "Bookkeeper",
    "Capture transactions and keep records tidy.",
    1,
  ],
  [
    "auditor",
    "Auditor",
    "Review accounting records and audit activity.",
    0,
  ],
  [
    "admin",
    "Administrator",
    "Platform administration.",
    0,
  ],
];

roles.forEach((role) => seedRole.run(...role));

module.exports = { db };
