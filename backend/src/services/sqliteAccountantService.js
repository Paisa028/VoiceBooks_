
const { db } = require("../db");
const { audit } = require("./transactionStorageService");

// Restrict accountant queries to assigned clients.
const scope = `
  JOIN clients c ON c.id = t.client_id
  JOIN accountant_assignments a ON a.client_id = c.id
  JOIN users u ON u.id = a.accountant_id
  JOIN roles r ON r.id = u.role_id
`;

const fields = `
  t.*,
  c.name AS client_name,
  c.business_name,
  c.email AS client_email
`;

const allowed = `
  a.accountant_id = ?
  AND r.name = 'accountant'
`;

function createError(message, status) {
  return Object.assign(new Error(message), { status });
}

// Read journal entries from the saved transaction payload.
function parseTransactionPayload(row) {
  if (!row?.payload_json) {
    return {};
  }

  try {
    const payload = JSON.parse(row.payload_json);

    return payload &&
      typeof payload === "object" &&
      !Array.isArray(payload)
      ? payload
      : {};
  } catch {
    return {};
  }
}

// Format saved transactions for the accountant interface.
function formatTransactionForReview(row) {
  if (!row) {
    return null;
  }

  const payload = parseTransactionPayload(row);

  const journalEntries = Array.isArray(payload.journalEntries)
    ? payload.journalEntries
    : [];

  return {
    ...payload,
    ...row,

    id: row.id,
    amount: row.amount,
    description: row.description,
    status: row.status,

    client_name: row.client_name,
    client_email: row.client_email,
    business_name: row.business_name,

    party: row.supplier,
    accountCategory: row.category,

    originalTranscript:
      row.original_transcription ||
      payload.originalTranscript ||
      "",

    postingStatus:
      row.status === "approved"
        ? "posted"
        : "not_posted",

    createdAt: row.created_at,
    postedAt: row.approved_at,
    rejectionReason: row.rejection_reason,

    journalEntries,
  };
}

function formatTransactions(rows) {
  return rows.map(formatTransactionForReview);
}

async function getClients(accountantId) {
  return db.prepare(`
    SELECT c.*
    FROM clients c
    JOIN accountant_assignments a
      ON a.client_id = c.id
    JOIN users u
      ON u.id = a.accountant_id
    JOIN roles r
      ON r.id = u.role_id
    WHERE a.accountant_id = ?
      AND r.name = 'accountant'
    ORDER BY c.name
  `).all(accountantId);
}

async function getClientById(clientId, accountantId) {
  return db.prepare(`
    SELECT c.*
    FROM clients c
    JOIN accountant_assignments a
      ON a.client_id = c.id
    JOIN users u
      ON u.id = a.accountant_id
    JOIN roles r
      ON r.id = u.role_id
    WHERE c.id = ?
      AND a.accountant_id = ?
      AND r.name = 'accountant'
  `).get(clientId, accountantId);
}

async function getClientTransactions(clientId, accountantId) {
  const rows = db.prepare(`
    SELECT ${fields}
    FROM transactions t
    ${scope}
    WHERE ${allowed}
      AND c.id = ?
    ORDER BY t.id DESC
  `).all(accountantId, clientId);

  return formatTransactions(rows);
}

async function getTransactionForReview(
  transactionId,
  accountantId
) {
  const row = db.prepare(`
    SELECT ${fields}
    FROM transactions t
    ${scope}
    WHERE ${allowed}
      AND t.id = ?
  `).get(accountantId, transactionId);

  return formatTransactionForReview(row);
}

function listByStatus(status, accountantId) {
  const rows = db.prepare(`
    SELECT ${fields}
    FROM transactions t
    ${scope}
    WHERE ${allowed}
      AND t.status = ?
    ORDER BY t.id DESC
  `).all(accountantId, status);

  return formatTransactions(rows);
}

async function getPendingReviews(accountantId) {
  return listByStatus("pending_review", accountantId);
}

async function getApprovedTransactions(accountantId) {
  return listByStatus("approved", accountantId);
}

async function getReturnedTransactions(accountantId) {
  return listByStatus("returned", accountantId);
}

async function getDashboard(accountantId) {
  const counts = db.prepare(`
    SELECT t.status, COUNT(*) AS total
    FROM transactions t
    ${scope}
    WHERE ${allowed}
    GROUP BY t.status
  `).all(accountantId);

  const count = (status) =>
    counts.find((row) => row.status === status)?.total || 0;

  const clients = await getClients(accountantId);

  const recentRows = db.prepare(`
    SELECT ${fields}
    FROM transactions t
    ${scope}
    WHERE ${allowed}
    ORDER BY t.id DESC
    LIMIT 5
  `).all(accountantId);

  return {
    clients: clients.length,
    pendingReviews: count("pending_review"),
    approvedTransactions: count("approved"),
    recentTransactions: formatTransactions(recentRows),
  };
}

// Validate the saved accounting entries before approval.
function validateAccountingEntry(transaction) {
  if (
    transaction.amount === null ||
    transaction.amount === undefined ||
    String(transaction.amount).trim() === ""
  ) {
    throw createError(
      "Transaction amount is required.",
      422
    );
  }

  const amount = Number(transaction.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw createError(
      "Transaction must have a valid positive amount.",
      422
    );
  }

  const debitAccount = String(
    transaction.debit_account ?? ""
  ).trim();

  const creditAccount = String(
    transaction.credit_account ?? ""
  ).trim();

  const invalidAccounts = [
    "",
    "unclassified",
    "unknown",
    "not selected",
  ];

  if (
    invalidAccounts.includes(debitAccount.toLowerCase()) ||
    invalidAccounts.includes(creditAccount.toLowerCase())
  ) {
    throw createError(
      "Transaction requires valid debit and credit accounts.",
      422
    );
  }

  if (
    debitAccount.toLowerCase() ===
    creditAccount.toLowerCase()
  ) {
    throw createError(
      "Debit and credit accounts must be different.",
      422
    );
  }

  const payload = parseTransactionPayload(transaction);

  const entries = Array.isArray(payload.journalEntries)
    ? payload.journalEntries
    : [];

  if (entries.length < 2) {
    throw createError(
      "Transaction requires debit and credit journal entries.",
      422
    );
  }

  let totalDebits = 0;
  let totalCredits = 0;

  const debitAccounts = new Set();
  const creditAccounts = new Set();

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") {
      throw createError(
        "Invalid journal entry.",
        422
      );
    }

    const account = String(entry.account ?? "").trim();

    const debit = Number(entry.debit ?? 0);
    const credit = Number(entry.credit ?? 0);

    if (
      invalidAccounts.includes(account.toLowerCase()) ||
      !Number.isFinite(debit) ||
      !Number.isFinite(credit) ||
      debit < 0 ||
      credit < 0
    ) {
      throw createError(
        "Journal entries contain invalid accounts or amounts.",
        422
      );
    }

    // One journal line cannot debit and credit simultaneously.
    if (
      (debit > 0 && credit > 0) ||
      (debit === 0 && credit === 0)
    ) {
      throw createError(
        "Each journal entry must contain either a debit or a credit.",
        422
      );
    }

    if (debit > 0) {
      debitAccounts.add(account.toLowerCase());
    }

    if (credit > 0) {
      creditAccounts.add(account.toLowerCase());
    }

    totalDebits += Math.round(debit * 100);
    totalCredits += Math.round(credit * 100);
  }

  if (
    totalDebits <= 0 ||
    totalCredits <= 0 ||
    totalDebits !== totalCredits
  ) {
    throw createError(
      "Journal entries must have equal debit and credit totals.",
      422
    );
  }

  // This project currently uses a simple two-account transaction.
  if (
    entries.length !== 2 ||
    totalDebits !== Math.round(amount * 100) ||
    debitAccounts.size !== 1 ||
    creditAccounts.size !== 1 ||
    !debitAccounts.has(debitAccount.toLowerCase()) ||
    !creditAccounts.has(creditAccount.toLowerCase())
  ) {
    throw createError(
      "Journal entries do not match the transaction amount or accounts.",
      422
    );
  }

  return true;
}

// Keep the update and audit event within one database transaction.
const review = db.transaction(
  (transactionId, accountantId, status, reason) => {
    if (!["approved", "returned"].includes(status)) {
      throw createError(
        "Invalid review status.",
        400
      );
    }

    const row = db.prepare(`
      SELECT t.*
      FROM transactions t
      ${scope}
      WHERE ${allowed}
        AND t.id = ?
    `).get(accountantId, transactionId);

    if (!row) {
      throw createError(
        "Transaction not found.",
        404
      );
    }

    if (row.status !== "pending_review") {
      throw createError(
        "Transaction has already been reviewed.",
        409
      );
    }

    if (status === "approved") {
      validateAccountingEntry(row);
    }

    const reviewReason =
      status === "returned"
        ? String(reason ?? "").trim()
        : null;

    if (status === "returned" && !reviewReason) {
      throw createError(
        "A reason is required when returning a transaction.",
        422
      );
    }

    const result = db.prepare(`
      UPDATE transactions
      SET
        status = ?,
        approved_by = CASE
          WHEN ? = 'approved' THEN ?
          ELSE NULL
        END,
        approved_at = CASE
          WHEN ? = 'approved'
            THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          ELSE NULL
        END,
        rejection_reason = ?
      WHERE id = ?
        AND status = 'pending_review'
    `).run(
      status,
      status,
      accountantId,
      status,
      reviewReason,
      row.id
    );

    if (result.changes !== 1) {
      throw createError(
        "Transaction could not be reviewed.",
        409
      );
    }

    audit(
      row.client_id,
      row.id,
      accountantId,
      status === "approved"
        ? "TRANSACTION_APPROVED"
        : "TRANSACTION_RETURNED",
      "accountant"
    );

    const updatedRow = db.prepare(`
      SELECT ${fields}
      FROM transactions t
      ${scope}
      WHERE ${allowed}
        AND t.id = ?
    `).get(accountantId, row.id);

    return formatTransactionForReview(updatedRow);
  }
);

async function approveTransaction(id, accountantId) {
  return review(id, accountantId, "approved", null);
}

async function rejectTransaction(id, accountantId, reason) {
  return review(id, accountantId, "returned", reason);
}

async function getAccountantProfile(id) {
  return db.prepare(`
    SELECT
      u.id,
      u.first_name,
      u.last_name,
      u.first_name || ' ' || u.last_name AS name,
      u.email,
      u.phone,
      u.created_at,
      u.updated_at,
      r.name AS role
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.id = ?
      AND r.name = 'accountant'
  `).get(id) || null;
}

async function updateAccountantProfile(id, details) {
  const firstName = String(details?.firstName ?? "").trim();
  const lastName = String(details?.lastName ?? "").trim();
  const phone = String(details?.phone ?? "").trim();

  if (
    firstName.length < 1 ||
    firstName.length > 100 ||
    lastName.length < 1 ||
    lastName.length > 100
  ) {
    throw createError(
      "First name and last name must contain between 1 and 100 characters.",
      400
    );
  }

  if (phone.length > 30) {
    throw createError(
      "Phone number must not exceed 30 characters.",
      400
    );
  }

  const result = db.prepare(`
    UPDATE users
    SET
      first_name = ?,
      last_name = ?,
      phone = ?,
      updated_at = datetime('now')
    WHERE id = ?
      AND role_id IN (
        SELECT id
        FROM roles
        WHERE name = 'accountant'
      )
  `).run(
    firstName,
    lastName,
    phone || null,
    id
  );

  if (result.changes !== 1) {
    throw createError(
      "Accountant profile not found.",
      404
    );
  }

  return getAccountantProfile(id);
}

module.exports = {
  getDashboard,
  getClients,
  getClientById,
  getClientTransactions,
  getPendingReviews,
  getTransactionForReview,
  approveTransaction,
  rejectTransaction,
  getApprovedTransactions,
  getReturnedTransactions,
  getAccountantProfile,
  updateAccountantProfile,
};
