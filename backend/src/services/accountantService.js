const { db } = require("../db");

// ==================================================
// DASHBOARD
// ==================================================

async function getDashboard() {
    const clientsResult = db.prepare(`
        SELECT COUNT(*) AS total
        FROM clients
    `).get();

    const pendingResult = db.prepare(`
        SELECT COUNT(*) AS total
        FROM transactions
        WHERE status = 'pending_review'
    `).get();

    const approvedResult = db.prepare(`
        SELECT COUNT(*) AS total
        FROM transactions
        WHERE status = 'approved'
    `).get();

    const recentTransactions = db.prepare(`
        SELECT
            id,
            description,
            amount,
            supplier,
            status,
            created_at
        FROM transactions
        ORDER BY created_at DESC
        LIMIT 5
    `).all();

    return {
        clients: Number(clientsResult.total),
        pendingReviews: Number(pendingResult.total),
        approvedTransactions: Number(approvedResult.total),
        recentTransactions
    };
}


// ==================================================
// CLIENTS
// ==================================================

async function getClients() {
    return db.prepare(`
        SELECT
            id,
            name,
            email,
            business_name
        FROM clients
        ORDER BY name ASC
    `).all();
}


async function getClientById(clientId) {
    return db.prepare(`
        SELECT
            id,
            name,
            email,
            business_name
        FROM clients
        WHERE id = ?
    `).get(clientId);
}


async function getClientTransactions(clientId) {
    return db.prepare(`
        SELECT
            id,
            description,
            supplier,
            amount,
            category,
            debit_account,
            credit_account,
            status,
            created_at
        FROM transactions
        WHERE client_id = ?
        ORDER BY created_at DESC
    `).all(clientId);
}


// ==================================================
// PENDING REVIEWS
// ==================================================

async function getPendingReviews() {
    return db.prepare(`
        SELECT
            t.id,
            t.description,
            t.amount,
            t.supplier,
            t.category,
            t.debit_account,
            t.credit_account,
            t.status,
            t.original_transcription,
            t.supporting_information,
            t.created_at,
            c.name AS client_name,
            c.business_name
        FROM transactions t
        JOIN clients c ON c.id = t.client_id
        WHERE t.status = 'pending_review'
        ORDER BY t.created_at ASC
    `).all();
}


async function getTransactionForReview(transactionId) {
    return db.prepare(`
        SELECT
            t.id,
            t.client_id,
            t.description,
            t.amount,
            t.supplier,
            t.category,
            t.debit_account,
            t.credit_account,
            t.status,
            t.original_transcription,
            t.supporting_information,
            t.created_at,
            c.name AS client_name,
            c.business_name,
            c.email AS client_email
        FROM transactions t
        JOIN clients c ON c.id = t.client_id
        WHERE t.id = ?
    `).get(transactionId);
}


// ==================================================
// APPROVE TRANSACTION
// ==================================================

async function approveTransaction(transactionId, accountantId) {
    const approve = db.transaction(() => {

        const result = db.prepare(`
            UPDATE transactions
            SET
                status = 'approved',
                approved_by = ?,
                approved_at = datetime('now')
            WHERE id = ?
              AND status = 'pending_review'
        `).run(accountantId, transactionId);

        if (result.changes === 0) {
            throw new Error(
                "Transaction does not exist or has already been processed"
            );
        }

        return db.prepare(`
            SELECT *
            FROM transactions
            WHERE id = ?
        `).get(transactionId);
    });

    return approve();
}


// ==================================================
// RETURN TRANSACTION
// ==================================================

async function rejectTransaction(
    transactionId,
    accountantId,
    reason
) {
    const reject = db.transaction(() => {

        const result = db.prepare(`
            UPDATE transactions
            SET
                status = 'returned',
                approved_by = ?,
                rejection_reason = ?
            WHERE id = ?
              AND status = 'pending_review'
        `).run(
            accountantId,
            reason,
            transactionId
        );

        if (result.changes === 0) {
            throw new Error(
                "Transaction does not exist or has already been processed"
            );
        }

        return db.prepare(`
            SELECT *
            FROM transactions
            WHERE id = ?
        `).get(transactionId);
    });

    return reject();
}

// ==================================================
// APPROVED TRANSACTIONS
// ==================================================

async function getApprovedTransactions() {
    return db.prepare(`
        SELECT
            t.id,
            t.description,
            t.amount,
            t.supplier,
            t.category,
            t.status,
            t.approved_at,
            c.name AS client_name
        FROM transactions t
        JOIN clients c ON c.id = t.client_id
        WHERE t.status = 'approved'
        ORDER BY t.approved_at DESC
    `).all();
}


// ==================================================
// RETURNED TRANSACTIONS
// ==================================================

async function getReturnedTransactions() {
    return db.prepare(`
        SELECT
            t.id,
            t.description,
            t.amount,
            t.supplier,
            t.category,
            t.status,
            t.rejection_reason,
            t.created_at,
            c.name AS client_name
        FROM transactions t
        JOIN clients c ON c.id = t.client_id
        WHERE t.status = 'returned'
        ORDER BY t.created_at DESC
    `).all();
}


// ==================================================
// ACCOUNTANT PROFILE
// ==================================================

async function getAccountantProfile(accountantId) {
    return db.prepare(`
        SELECT
            u.id,
            u.first_name || ' ' || u.last_name AS name,
            u.email,
            r.name AS role
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE u.id = ?
    `).get(accountantId);
}


// ==================================================
// EXPORTS
// ==================================================

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
    getAccountantProfile
};