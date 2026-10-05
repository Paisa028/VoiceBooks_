const Database = require('better-sqlite3');
const fs = require('node:fs');
const path = require('node:path');
const { config } = require('../config.js');

fs.mkdirSync(path.dirname(config.databaseFile), { recursive: true });

const db = new Database(config.databaseFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

// Additive migration: existing records remain intact and unowned legacy clients
// stay inaccessible until an administrator verifies their ownership.
const addColumn = (table, name, definition) => {
  if (!db.prepare(`PRAGMA table_info(${table})`).all().some(column => column.name === name)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
  }
};
addColumn('clients', 'owner_user_id', 'INTEGER REFERENCES users(id)');
addColumn('transactions', 'payload_json', 'TEXT');
db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_owner ON clients(owner_user_id);
  CREATE TABLE IF NOT EXISTS accountant_assignments (
    client_id INTEGER PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
    accountant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_assignments_accountant ON accountant_assignments(accountant_id);
  CREATE TABLE IF NOT EXISTS transaction_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER REFERENCES transactions(id),
    client_id INTEGER NOT NULL REFERENCES clients(id),
    actor_id INTEGER NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    source TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );
  CREATE INDEX IF NOT EXISTS idx_audit_client ON transaction_audit(client_id);
  CREATE TABLE IF NOT EXISTS legacy_transaction_imports (
    legacy_id TEXT PRIMARY KEY,
    owner_user_id INTEGER NOT NULL REFERENCES users(id),
    transaction_id INTEGER NOT NULL REFERENCES transactions(id)
  );
`);

// Roles are reference data. "admin" cannot be chosen at sign-up.
const seedRole = db.prepare(
  'INSERT OR IGNORE INTO roles (name, label, description, self_assignable) VALUES (?, ?, ?, ?)'
);
[
  ['business_owner', 'Business owner', 'Run your business finances and see the full picture.', 1],
  ['accountant', 'Accountant', 'Review books, reports and compliance for your practice.', 1],
  ['bookkeeper', 'Bookkeeper', 'Capture transactions and keep records tidy.', 1],
  ['admin', 'Administrator', 'Platform administration.', 0],
].forEach((r) => seedRole.run(...r));

module.exports = { db };
