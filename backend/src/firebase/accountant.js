const { execute, executeList } = require('./client');
const accounts = require('./accounts');
function client(account) {
  return { id: account.id, name: `${account.first_name} ${account.last_name}`, email: account.email, business_name: account.business_name };
}
function entry(row) {
  return { ...row, client_id: row.ownerId, client_name: `${row.owner.first_name} ${row.owner.last_name}`,
    client_email: row.owner.email, business_name: row.owner.business_name };
}
async function getClients(id) { return (await executeList('AssignedAccounts', { accountantId: id }, 'accounts')).map(client); }
async function getClientById(clientId, id) { return (await getClients(id)).find(client => client.id === Number(clientId)) || null; }
async function list(id, status) {
  const rows = await executeList('AssignedEntries', { accountantId: id }, 'entries');
  return rows.filter(row => !status || row.status === status).map(entry);
}
async function getClientTransactions(clientId, id) { return (await list(id)).filter(row => row.client_id === Number(clientId)); }
async function getTransactionForReview(transactionId, id) { return (await list(id)).find(row => row.id === Number(transactionId)) || null; }
async function getPendingReviews(id) { return list(id, 'pending_review'); }
async function getApprovedTransactions(id) { return list(id, 'approved'); }
async function getReturnedTransactions(id) { return list(id, 'returned'); }
async function getDashboard(id) {
  const [clients, entries] = await Promise.all([getClients(id), list(id)]);
  return { clients: clients.length, pendingReviews: entries.filter(row => row.status === 'pending_review').length,
    approvedTransactions: entries.filter(row => row.status === 'approved').length, recentTransactions: entries.slice(0, 5) };
}
async function review(transactionId, id, status, reason = null) {
  const previous = await getTransactionForReview(transactionId, id);
  if (!previous) throw Object.assign(new Error('Transaction not found.'), { status: 404 });
  if (previous.status !== 'pending_review') throw Object.assign(new Error('Transaction has already been reviewed.'), { status: 409 });
  await execute('ReviewEntry', { id: Number(transactionId), accountantId: id, ownerId: previous.ownerId,
    status, reason, approvedAt: status === 'approved' ? new Date().toISOString() : null,
    action: status === 'approved' ? 'TRANSACTION_APPROVED' : 'TRANSACTION_RETURNED' });
  return getTransactionForReview(transactionId, id);
}
async function approveTransaction(transactionId, id) { return review(transactionId, id, 'approved'); }
async function rejectTransaction(transactionId, id, reason) { return review(transactionId, id, 'returned', reason); }
async function getAccountantProfile(id) {
  const account = await accounts.findRowById(id);
  return account ? { id, name: `${account.first_name} ${account.last_name}`, email: account.email, role: account.role } : null;
}
module.exports = { getDashboard, getClients, getClientById, getClientTransactions, getPendingReviews,
  getTransactionForReview, approveTransaction, rejectTransaction, getApprovedTransactions,
  getReturnedTransactions, getAccountantProfile };
