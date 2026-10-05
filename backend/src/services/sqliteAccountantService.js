const { db } = require('../db');
const { audit } = require('./transactionStorageService');

// Every workspace query checks the current assignment and role in the database.
const scope = `JOIN clients c ON c.id = t.client_id
  JOIN accountant_assignments a ON a.client_id = c.id
  JOIN users u ON u.id = a.accountant_id JOIN roles r ON r.id = u.role_id`;
const fields = `t.*, c.name AS client_name, c.business_name, c.email AS client_email`;
const allowed = `a.accountant_id = ? AND r.name = 'accountant'`;

async function getClients(accountantId) {
  return db.prepare(`SELECT c.* FROM clients c JOIN accountant_assignments a ON a.client_id = c.id
    WHERE a.accountant_id = ? ORDER BY c.name`).all(accountantId);
}
async function getClientById(clientId, accountantId) {
  return db.prepare(`SELECT c.* FROM clients c JOIN accountant_assignments a ON a.client_id = c.id
    WHERE c.id = ? AND a.accountant_id = ?`).get(clientId, accountantId);
}
async function getClientTransactions(clientId, accountantId) {
  return db.prepare(`SELECT ${fields} FROM transactions t ${scope}
    WHERE ${allowed} AND c.id = ? ORDER BY t.id DESC`).all(accountantId, clientId);
}
async function getTransactionForReview(transactionId, accountantId) {
  return db.prepare(`SELECT ${fields} FROM transactions t ${scope}
    WHERE ${allowed} AND t.id = ?`).get(accountantId, transactionId);
}
function listByStatus(status, accountantId) {
  return db.prepare(`SELECT ${fields} FROM transactions t ${scope}
    WHERE ${allowed} AND t.status = ? ORDER BY t.id DESC`).all(accountantId, status);
}
async function getPendingReviews(id) { return listByStatus('pending_review', id); }
async function getApprovedTransactions(id) { return listByStatus('approved', id); }
async function getReturnedTransactions(id) { return listByStatus('returned', id); }
async function getDashboard(accountantId) {
  const counts = db.prepare(`SELECT t.status, COUNT(*) AS total FROM transactions t ${scope}
    WHERE ${allowed} GROUP BY t.status`).all(accountantId);
  const count = status => counts.find(row => row.status === status)?.total || 0;
  return {
    clients: (await getClients(accountantId)).length,
    pendingReviews: count('pending_review'), approvedTransactions: count('approved'),
    recentTransactions: db.prepare(`SELECT ${fields} FROM transactions t ${scope}
      WHERE ${allowed} ORDER BY t.id DESC LIMIT 5`).all(accountantId)
  };
}

const review = db.transaction((transactionId, accountantId, status, reason) => {
  const row = db.prepare(`SELECT t.* FROM transactions t ${scope}
    WHERE ${allowed} AND t.id = ?`).get(accountantId, transactionId);
  if (!row) throw Object.assign(new Error('Transaction not found.'), { status: 404 });
  if (row.status !== 'pending_review') {
    throw Object.assign(new Error('Transaction has already been reviewed.'), { status: 409 });
  }
  db.prepare(`UPDATE transactions SET status = ?, approved_by = ?,
    approved_at = CASE WHEN ? = 'approved' THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now') ELSE NULL END,
    rejection_reason = ? WHERE id = ?`).run(status, accountantId, status, reason, row.id);
  audit(row.client_id, row.id, accountantId, status === 'approved' ? 'TRANSACTION_APPROVED' : 'TRANSACTION_RETURNED', 'accountant');
  return db.prepare('SELECT * FROM transactions WHERE id = ?').get(row.id);
});
async function approveTransaction(id, accountantId) { return review(id, accountantId, 'approved', null); }
async function rejectTransaction(id, accountantId, reason) { return review(id, accountantId, 'returned', reason); }
async function getAccountantProfile(id) {
  return db.prepare(`SELECT u.id, u.first_name || ' ' || u.last_name AS name, u.email, r.name AS role
    FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?`).get(id);
}
module.exports = { getDashboard, getClients, getClientById, getClientTransactions, getPendingReviews,
  getTransactionForReview, approveTransaction, rejectTransaction, getApprovedTransactions,
  getReturnedTransactions, getAccountantProfile };
