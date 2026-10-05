// Legacy JSON has no trustworthy owner. Import only a file whose business owner
// has been verified; never guess ownership or delete the source files.
require('dotenv').config();
const fs = require('node:fs');
const { db } = require('../src/db');
const { transactionSchema } = require('../src/validators/transaction.schemas');
const { createJournalEntries } = require('../src/services/journalService');
const storage = require('../src/services/transactionStorageService');

function importTransactions(records, ownerEmail, auditRecords = []) {
  if (require('../src/config').config.databaseProvider !== 'sqlite') {
    throw new Error('Legacy JSON import supports SQLite only. Use DATABASE_PROVIDER=sqlite.');
  }
  if (!Array.isArray(records) || !Array.isArray(auditRecords)) throw new Error('Source files must contain JSON arrays.');
  const owner = db.prepare(`SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id
    WHERE u.email = ? AND r.name IN ('business_owner', 'bookkeeper')`).get(ownerEmail);
  if (!owner) throw new Error('A verified business owner or bookkeeper account is required.');
  return db.transaction(() => {
    let imported = 0;
    for (const record of records) {
      if (typeof record.id !== 'string' || !record.id) throw new Error('Every legacy transaction must have a string ID.');
      const existing = db.prepare('SELECT * FROM legacy_transaction_imports WHERE legacy_id = ?').get(record.id);
      if (existing) {
        if (existing.owner_user_id !== owner.id) throw new Error('Legacy transaction is already owned by another business.');
        continue;
      }
      const transaction = transactionSchema.parse(record);
      const result = storage.saveTransaction({ ...transaction,
        party: transaction.party || null, accountCategory: transaction.accountCategory || null,
        journalEntries: createJournalEntries(transaction), confirmedAt: record.confirmedAt || new Date().toISOString()
      }, owner.id);
      const row = db.prepare('SELECT client_id FROM transactions WHERE id = ?').get(result.transaction.id);
      for (const event of auditRecords.filter(event => event.transactionId === record.id)) {
        if (typeof event.action !== 'string' || typeof event.timestamp !== 'string'
          || Number.isNaN(Date.parse(event.timestamp))) throw new Error('Invalid legacy audit record.');
        db.prepare(`INSERT INTO transaction_audit (transaction_id, client_id, actor_id, action, source, timestamp)
          VALUES (?, ?, ?, ?, 'legacy_import', ?)`)
          .run(result.transaction.id, row.client_id, owner.id, `LEGACY_${event.action}`, event.timestamp);
      }
      db.prepare(`INSERT INTO legacy_transaction_imports (legacy_id, owner_user_id, transaction_id)
        VALUES (?, ?, ?)`).run(record.id, owner.id, result.transaction.id);
      imported++;
    }
    return imported;
  })();
}

if (require.main === module) {
  const [ownerEmail, file, auditFile] = process.argv.slice(2);
  try {
    if (!ownerEmail || !file) throw new Error('Usage: node scripts/import-transactions.js OWNER_EMAIL TRANSACTIONS_JSON [AUDIT_JSON]');
    const count = importTransactions(JSON.parse(fs.readFileSync(file, 'utf8')), ownerEmail,
      auditFile ? JSON.parse(fs.readFileSync(auditFile, 'utf8')) : []);
    console.log(`Imported ${count} transactions for review. Original JSON files were preserved.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { db.close(); }
}
module.exports = { importTransactions };
