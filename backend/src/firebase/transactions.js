const { execute, executeList } = require('./client');
const accounts = require('./accounts');
function toTransaction(row) {
  if (!row) return null;
  return { ...JSON.parse(row.payload_json), id: row.id, description: row.description, amount: row.amount,
    party: row.supplier, accountCategory: row.category, status: row.status,
    postingStatus: row.status === 'approved' ? 'posted' : 'not_posted', createdAt: row.created_at,
    postedAt: row.approved_at, rejectionReason: row.rejection_reason };
}
function entryData(transaction, ownerId) {
  return { ownerId, description: transaction.description, amount: transaction.amount, supplier: transaction.party,
    category: transaction.accountCategory, debit_account: transaction.journalEntries.find(entry => entry.debit > 0).account,
    credit_account: transaction.journalEntries.find(entry => entry.credit > 0).account,
    original_transcription: transaction.originalTranscript || null, supporting_information: transaction.notes || null,
    payload_json: JSON.stringify(transaction) };
}
async function getTransactions(ownerId, approvedOnly = false) {
  const rows = await executeList('OwnerEntries', { ownerId }, 'entries');
  return rows.filter(row => !approvedOnly || row.status === 'approved').map(toTransaction);
}
async function getTransactionById(id, ownerId) {
  if (!/^\d+$/.test(String(id))) return null;
  return toTransaction((await execute('OwnerEntry', { id: Number(id), ownerId }, true)).entries[0]);
}
async function getAuditLog(ownerId) {
  return (await executeList('OwnerAudit', { ownerId }, 'audits')).map(event => ({
    id: event.id, transactionId: event.entryId, actorId: event.actorId, action: event.action,
    source: event.source, timestamp: event.timestamp, status: 'success'
  }));
}
async function saveTransaction(transaction, ownerId) {
  const result = await execute('SubmitEntry', { ownerId, data: entryData(transaction, ownerId), source: transaction.originalTranscript ? 'voice' : 'manual' });
  const id = result.entry_insert.id;
  return { transaction: await getTransactionById(id, ownerId), auditRecord: (await getAuditLog(ownerId)).find(event => event.id === result.audit_insert.id) };
}
async function resubmitTransaction(id, transaction, ownerId) {
  const previous = await getTransactionById(id, ownerId);
  if (!previous) throw Object.assign(new Error('Transaction not found.'), { status: 404 });
  if (previous.status !== 'returned') throw Object.assign(new Error('Only returned transactions can be resubmitted.'), { status: 409 });
  const result = await execute('ResubmitEntry', { id: Number(id), ownerId, data: entryData(transaction, ownerId), source: transaction.originalTranscript ? 'voice' : 'manual' });
  return { transaction: await getTransactionById(id, ownerId), auditRecord: (await getAuditLog(ownerId)).find(event => event.id === result.audit_insert.id) };
}
async function getAssignment(ownerId) {
  const accountant = (await execute('Assignment', { ownerId }, true)).account?.accountant;
  return accountant ? { email: accountant.email, name: `${accountant.first_name} ${accountant.last_name}` } : null;
}
async function setAssignment(ownerId, email) {
  if (email) {
    const accountant = await accounts.findRowByEmail(email);
    if (!accountant || accountant.role !== 'accountant') throw Object.assign(new Error('No accountant account matches this email.'), { status: 400 });
    await execute('SetAssignment', { ownerId, accountantId: accountant.id });
  } else await execute('ClearAssignment', { ownerId });
  return getAssignment(ownerId);
}
module.exports = { saveTransaction, resubmitTransaction, getTransactions, getTransactionById, getAuditLog, getAssignment, setAssignment };
