const processing = require('../services/transactionProcessingService');
const storage = require('../services/transactionStorageService');
const { createJournalEntries } = require('../services/journalService');

async function processTransaction(req, res, next) {
  try {
    const transaction = await processing.processTransaction(req.body.transcript);
    const questions = {
      type: 'Is this an income or an expense?', amount: 'What is the transaction amount?',
      description: 'What is this transaction for?', paymentMethod: 'How was the transaction paid?',
      transactionDate: 'What date did this transaction take place?'
    };
    const missingFields = Object.keys(questions).filter(key => !transaction[key]);
    res.json({ status: 'success', transaction, clarification: {
      needsClarification: missingFields.length > 0, missingFields,
      questions: missingFields.map(key => questions[key])
    } });
  } catch (error) { next(error); }
}
async function confirmTransaction(req, res, next) {
  try {
    // Validation strips client-supplied IDs, ownership and status.
    const transaction = {
      ...req.body, party: req.body.party || null, accountCategory: req.body.accountCategory || null,
      journalEntries: createJournalEntries(req.body), confirmedAt: new Date().toISOString()
    };
    const result = req.params.id
      ? await storage.resubmitTransaction(req.params.id, transaction, req.user.id)
      : await storage.saveTransaction(transaction, req.user.id);
    res.status(201).json({ status: 'success', message: 'Transaction submitted for accountant review.', ...result });
  } catch (error) { next(error); }
}
async function getTransactions(req, res) {
  const transactions = await storage.getTransactions(req.user.id, req.query.status === 'approved');
  res.json({ status: 'success', count: transactions.length, transactions });
}
async function getTransactionById(req, res) {
  const transaction = await storage.getTransactionById(req.params.id, req.user.id);
  if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
  const auditLog = (await storage.getAuditLog(req.user.id)).filter(event => event.transactionId === transaction.id);
  res.json({ status: 'success', transaction, auditLog });
}
async function getAuditLog(req, res) {
  const auditLog = await storage.getAuditLog(req.user.id);
  res.json({ status: 'success', count: auditLog.length, auditLog });
}
async function getAssignment(req, res) {
  res.json({ accountant: await storage.getAssignment(req.user.id) });
}
async function setAssignment(req, res, next) {
  try { res.json({ accountant: await storage.setAssignment(req.user.id, req.body.email) }); }
  catch (error) { next(error); }
}
module.exports = { processTransaction, confirmTransaction, getTransactions, getTransactionById, getAuditLog, getAssignment, setAssignment };
