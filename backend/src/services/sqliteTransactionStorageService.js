const { db } = require('../db');

function ensureClient(ownerId) {
  const owner = db.prepare(`SELECT u.*, b.business_name FROM users u
    JOIN business_profiles b ON b.user_id = u.id WHERE u.id = ?`).get(ownerId);
  if (!owner) throw Object.assign(new Error('Set up your business before recording transactions.'), { status: 400 });
  db.prepare(`INSERT INTO clients (owner_user_id, name, email, business_name)
    VALUES (?, ?, ?, ?) ON CONFLICT(owner_user_id) DO UPDATE SET
    name = excluded.name, email = excluded.email, business_name = excluded.business_name`)
    .run(ownerId, `${owner.first_name} ${owner.last_name}`, owner.email, owner.business_name);
  return db.prepare('SELECT * FROM clients WHERE owner_user_id = ?').get(ownerId);
}

function toTransaction(row) {
  if (!row) return null;
  const payload = row.payload_json ? JSON.parse(row.payload_json) : {};
  return {
    ...payload, id: row.id, amount: row.amount, description: row.description,
    party: row.supplier, accountCategory: row.category, status: row.status,
    postingStatus: row.status === 'approved' ? 'posted' : 'not_posted',
    createdAt: row.created_at, postedAt: row.approved_at,
    rejectionReason: row.rejection_reason,
    journalEntries: payload.journalEntries || [],
  };
}

function audit(clientId, transactionId, actorId, action, source = 'manual') {
  const result = db.prepare(`INSERT INTO transaction_audit
    (client_id, transaction_id, actor_id, action, source) VALUES (?, ?, ?, ?, ?)`)
    .run(clientId, transactionId, actorId, action, source);
  return db.prepare(`SELECT id, transaction_id AS transactionId, actor_id AS actorId,
    action, source, timestamp, 'success' AS status FROM transaction_audit WHERE id = ?`).get(result.lastInsertRowid);
}

const saveTransaction = db.transaction((transaction, ownerId) => {
  const client = ensureClient(ownerId);
  const debit = transaction.journalEntries.find(entry => entry.debit > 0);
  const credit = transaction.journalEntries.find(entry => entry.credit > 0);
  const result = db.prepare(`INSERT INTO transactions
    (client_id, description, amount, supplier, category, debit_account, credit_account,
     original_transcription, supporting_information, payload_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(client.id, transaction.description, transaction.amount, transaction.party,
      transaction.accountCategory, debit.account, credit.account,
      transaction.originalTranscript || null, transaction.notes || null, JSON.stringify(transaction));
  const id = Number(result.lastInsertRowid);
  const auditRecord = audit(client.id, id, ownerId, 'TRANSACTION_SUBMITTED', transaction.originalTranscript ? 'voice' : 'manual');
  return { transaction: getTransactionById(id, ownerId), auditRecord };
});

function getTransactions(ownerId, approvedOnly = false) {
  return db.prepare(`SELECT t.* FROM transactions t JOIN clients c ON c.id = t.client_id
    WHERE c.owner_user_id = ? ${approvedOnly ? "AND t.status = 'approved'" : ''}
    ORDER BY t.id DESC`).all(ownerId).map(toTransaction);
}

const resubmitTransaction = db.transaction((id, transaction, ownerId) => {
  const existing = getTransactionById(id, ownerId);
  if (!existing) throw Object.assign(new Error('Transaction not found.'), { status: 404 });
  if (existing.status !== 'returned') throw Object.assign(new Error('Only returned transactions can be resubmitted.'), { status: 409 });
  const client = ensureClient(ownerId);
  db.prepare(`UPDATE transactions SET description = ?, amount = ?, supplier = ?, category = ?,
    debit_account = ?, credit_account = ?, original_transcription = ?, supporting_information = ?,
    payload_json = ?, status = 'pending_review', approved_by = NULL, approved_at = NULL,
    rejection_reason = NULL WHERE id = ?`).run(transaction.description, transaction.amount,
      transaction.party, transaction.accountCategory,
      transaction.journalEntries.find(entry => entry.debit > 0).account,
      transaction.journalEntries.find(entry => entry.credit > 0).account,
      transaction.originalTranscript || null, transaction.notes || null, JSON.stringify(transaction), id);
  const auditRecord = audit(client.id, id, ownerId, 'TRANSACTION_RESUBMITTED', transaction.originalTranscript ? 'voice' : 'manual');
  return { transaction: getTransactionById(id, ownerId), auditRecord };
});

function getTransactionById(id, ownerId) {
  return toTransaction(db.prepare(`SELECT t.* FROM transactions t JOIN clients c ON c.id = t.client_id
    WHERE t.id = ? AND c.owner_user_id = ?`).get(id, ownerId));
}

function getAuditLog(ownerId) {
  return db.prepare(`SELECT a.id, a.transaction_id AS transactionId, a.actor_id AS actorId,
    a.action, a.source, a.timestamp, 'success' AS status FROM transaction_audit a
    JOIN clients c ON c.id = a.client_id WHERE c.owner_user_id = ? ORDER BY a.id DESC`).all(ownerId);
}

function getAssignment(ownerId) {
  return db.prepare(`SELECT u.email, u.first_name || ' ' || u.last_name AS name
    FROM clients c JOIN accountant_assignments a ON a.client_id = c.id
    JOIN users u ON u.id = a.accountant_id WHERE c.owner_user_id = ?`).get(ownerId) || null;
}

const setAssignment = db.transaction((ownerId, email) => {
  const client = ensureClient(ownerId);
  if (!email) {
    db.prepare('DELETE FROM accountant_assignments WHERE client_id = ?').run(client.id);
  } else {
    const accountant = db.prepare(`SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id
      WHERE u.email = ? AND r.name = 'accountant'`).get(email);
    if (!accountant) throw Object.assign(new Error('No accountant account matches this email.'), { status: 400 });
    db.prepare(`INSERT INTO accountant_assignments (client_id, accountant_id) VALUES (?, ?)
      ON CONFLICT(client_id) DO UPDATE SET accountant_id = excluded.accountant_id`).run(client.id, accountant.id);
  }
  audit(client.id, null, ownerId, email ? 'ACCOUNTANT_ASSIGNED' : 'ACCOUNTANT_REMOVED', 'settings');
  return getAssignment(ownerId);
});

module.exports = { saveTransaction, resubmitTransaction, getTransactions, getTransactionById, getAuditLog, getAssignment, setAssignment, audit };
