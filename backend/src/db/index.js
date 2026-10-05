const Database = require('better-sqlite3');
const fs = require('node:fs');
const path = require('node:path');
const { config } = require('../config.js');

fs.mkdirSync(path.dirname(config.databaseFile), { recursive: true });

const db = new Database(config.databaseFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

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
