
const { db } = require("../db");

// Find or create the client record belonging to the Business Owner.
function ensureClient(ownerId) {
  const owner = db.prepare(`
    SELECT
      u.*,
      b.business_name
    FROM users u
    JOIN business_profiles b
      ON b.user_id = u.id
    WHERE u.id = ?
  `).get(ownerId);

  if (!owner) {
    throw Object.assign(
      new Error("Set up your business before recording transactions."),
      { status: 400 }
    );
  }

  db.prepare(`
    INSERT INTO clients (
      owner_user_id,
      name,
      email,
      business_name
    )
    VALUES (?, ?, ?, ?)
    ON CONFLICT(owner_user_id)
    DO UPDATE SET
      name = excluded.name,
      email = excluded.email,
      business_name = excluded.business_name
  `).run(
    ownerId,
    `${owner.first_name} ${owner.last_name}`,
    owner.email,
    owner.business_name
  );

  return db.prepare(`
    SELECT *
    FROM clients
    WHERE owner_user_id = ?
  `).get(ownerId);
}

// Convert a stored transaction into the API response format.
function toTransaction(row) {
  if (!row) return null;

  const payload = row.payload_json
    ? JSON.parse(row.payload_json)
    : {};

  return {
    ...payload,
    id: row.id,
    amount: row.amount,
    description: row.description,
    party: row.supplier,
    accountCategory: row.category,
    status: row.status,
    postingStatus:
      row.status === "approved"
        ? "posted"
        : "not_posted",
    createdAt: row.created_at,
    postedAt: row.approved_at,
    rejectionReason: row.rejection_reason,
    journalEntries: payload.journalEntries || [],
  };
}

// Record an activity in the accounting audit trail.
function audit(
  clientId,
  transactionId,
  actorId,
  action,
  source = "manual"
) {
  const result = db.prepare(`
    INSERT INTO transaction_audit (
      client_id,
      transaction_id,
      actor_id,
      action,
      source
    )
    VALUES (?, ?, ?, ?, ?)
  `).run(
    clientId,
    transactionId,
    actorId,
    action,
    source
  );

  return db.prepare(`
    SELECT
      id,
      transaction_id AS transactionId,
      actor_id AS actorId,
      action,
      source,
      timestamp,
      'success' AS status
    FROM transaction_audit
    WHERE id = ?
  `).get(result.lastInsertRowid);
}

// Validate journal entries before saving a transaction.
function getJournalAccounts(transaction) {
  const entries = transaction?.journalEntries;

  if (!Array.isArray(entries) || entries.length !== 2) {
    throw Object.assign(
      new Error("A transaction must contain two journal entries."),
      { status: 400 }
    );
  }

  const debit = entries.find(
    (entry) => Number(entry.debit) > 0
  );

  const credit = entries.find(
    (entry) => Number(entry.credit) > 0
  );

  if (
    !debit ||
    !credit ||
    typeof debit.account !== "string" ||
    !debit.account.trim() ||
    typeof credit.account !== "string" ||
    !credit.account.trim()
  ) {
    throw Object.assign(
      new Error("Valid debit and credit accounts are required."),
      { status: 400 }
    );
  }

  const debitAmount = Number(debit.debit);
  const creditAmount = Number(credit.credit);

  if (
    !Number.isFinite(debitAmount) ||
    !Number.isFinite(creditAmount) ||
    Math.abs(debitAmount - creditAmount) > 0.001
  ) {
    throw Object.assign(
      new Error("Debit and credit amounts must balance."),
      { status: 400 }
    );
  }

  return { debit, credit };
}

// Save a new transaction and its audit record.
const saveTransaction = db.transaction((transaction, ownerId) => {
  const client = ensureClient(ownerId);
  const { debit, credit } = getJournalAccounts(transaction);

  const result = db.prepare(`
    INSERT INTO transactions (
      client_id,
      description,
      amount,
      supplier,
      category,
      debit_account,
      credit_account,
      original_transcription,
      supporting_information,
      payload_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    client.id,
    transaction.description,
    transaction.amount,
    transaction.party,
    transaction.accountCategory,
    debit.account,
    credit.account,
    transaction.originalTranscript || null,
    transaction.notes || null,
    JSON.stringify(transaction)
  );

  const id = Number(result.lastInsertRowid);

  const auditRecord = audit(
    client.id,
    id,
    ownerId,
    "TRANSACTION_SUBMITTED",
    transaction.originalTranscript ? "voice" : "manual"
  );

  return {
    transaction: getTransactionById(id, ownerId),
    auditRecord,
  };
});

// Read only the Business Owner's transactions.
function getTransactions(ownerId, approvedOnly = false) {
  return db.prepare(`
    SELECT t.*
    FROM transactions t
    JOIN clients c
      ON c.id = t.client_id
    WHERE c.owner_user_id = ?
      ${approvedOnly ? "AND t.status = 'approved'" : ""}
    ORDER BY t.id DESC
  `).all(ownerId).map(toTransaction);
}

// Resubmit a previously returned transaction.
const resubmitTransaction = db.transaction(
  (id, transaction, ownerId) => {
    const existing = getTransactionById(id, ownerId);

    if (!existing) {
      throw Object.assign(
        new Error("Transaction not found."),
        { status: 404 }
      );
    }

    if (existing.status !== "returned") {
      throw Object.assign(
        new Error("Only returned transactions can be resubmitted."),
        { status: 409 }
      );
    }

    const { debit, credit } = getJournalAccounts(transaction);
    const client = ensureClient(ownerId);

    db.prepare(`
      UPDATE transactions
      SET
        description = ?,
        amount = ?,
        supplier = ?,
        category = ?,
        debit_account = ?,
        credit_account = ?,
        original_transcription = ?,
        supporting_information = ?,
        payload_json = ?,
        status = 'pending_review',
        approved_by = NULL,
        approved_at = NULL,
        rejection_reason = NULL
      WHERE id = ?
    `).run(
      transaction.description,
      transaction.amount,
      transaction.party,
      transaction.accountCategory,
      debit.account,
      credit.account,
      transaction.originalTranscript || null,
      transaction.notes || null,
      JSON.stringify(transaction),
      id
    );

    const auditRecord = audit(
      client.id,
      id,
      ownerId,
      "TRANSACTION_RESUBMITTED",
      transaction.originalTranscript ? "voice" : "manual"
    );

    return {
      transaction: getTransactionById(id, ownerId),
      auditRecord,
    };
  }
);

// Find one transaction owned by the authenticated Business Owner.
function getTransactionById(id, ownerId) {
  return toTransaction(
    db.prepare(`
      SELECT t.*
      FROM transactions t
      JOIN clients c
        ON c.id = t.client_id
      WHERE t.id = ?
        AND c.owner_user_id = ?
    `).get(id, ownerId)
  );
}

// Read the Business Owner's audit trail.
function getAuditLog(ownerId) {
  return db.prepare(`
    SELECT
      a.id,
      a.transaction_id AS transactionId,
      a.actor_id AS actorId,
      a.action,
      a.source,
      a.timestamp,
      'success' AS status
    FROM transaction_audit a
    JOIN clients c
      ON c.id = a.client_id
    WHERE c.owner_user_id = ?
    ORDER BY a.id DESC
  `).all(ownerId);
}

// Return the assigned Accountant, including the ID needed for revocation.
function getAssignment(ownerId) {
  return db.prepare(`
    SELECT
      u.id,
      u.email,
      u.first_name || ' ' || u.last_name AS name
    FROM clients c
    JOIN accountant_assignments a
      ON a.client_id = c.id
    JOIN users u
      ON u.id = a.accountant_id
    JOIN roles r
      ON r.id = u.role_id
    WHERE c.owner_user_id = ?
      AND r.name = 'accountant'
  `).get(ownerId) || null;
}

// Assign, replace, or remove an Accountant.
const setAssignment = db.transaction((ownerId, email) => {
  const client = ensureClient(ownerId);

  if (!email) {
    db.prepare(`
      DELETE FROM accountant_assignments
      WHERE client_id = ?
    `).run(client.id);
  } else {
    const cleanEmail = String(email).trim();

    const accountant = db.prepare(`
      SELECT u.id
      FROM users u
      JOIN roles r
        ON r.id = u.role_id
      WHERE u.email = ?
        AND r.name = 'accountant'
    `).get(cleanEmail);

    if (!accountant) {
      throw Object.assign(
        new Error("No accountant account matches this email."),
        { status: 400 }
      );
    }

    db.prepare(`
      INSERT INTO accountant_assignments (
        client_id,
        accountant_id
      )
      VALUES (?, ?)
      ON CONFLICT(client_id)
      DO UPDATE SET
        accountant_id = excluded.accountant_id
    `).run(client.id, accountant.id);
  }

  audit(
    client.id,
    null,
    ownerId,
    email ? "ACCOUNTANT_ASSIGNED" : "ACCOUNTANT_REMOVED",
    "settings"
  );

  return getAssignment(ownerId);
});

module.exports = {
  saveTransaction,
  resubmitTransaction,
  getTransactions,
  getTransactionById,
  getAuditLog,
  getAssignment,
  setAssignment,
  audit,
};
