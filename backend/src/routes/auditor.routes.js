
const express = require("express");
const { db } = require("../db");

const {
  authenticate,
  requireRole,
} = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);
router.use(requireRole("auditor"));

// Only return businesses with an active auditor assignment.
const accessScope = `
  FROM auditor_assignments aa
  JOIN business_profiles b
    ON b.id = aa.business_profile_id
  JOIN clients c
    ON c.owner_user_id = b.user_id
  WHERE aa.auditor_user_id = ?
    AND aa.status = 'active'
`;

// List businesses assigned to the auditor.
router.get("/businesses", (req, res) => {
  try {
    const businesses = db.prepare(`
      SELECT
        b.id,
        b.business_name AS businessName,
        b.country,
        b.currency,
        b.sage_status AS sageStatus,
        c.id AS clientId
      ${accessScope}
      ORDER BY b.business_name
    `).all(req.user.id);

    return res.json({
      success: true,
      data: businesses,
    });
  } catch (error) {
    console.error("Auditor businesses error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load assigned businesses.",
    });
  }
});

// Read transactions from authorised businesses.
router.get("/transactions", (req, res) => {
  try {
    const transactions = db.prepare(`
      SELECT
        t.id,
        t.description,
        t.amount,
        t.supplier,
        t.category,
        t.status,
        t.debit_account AS debitAccount,
        t.credit_account AS creditAccount,
        t.created_at AS createdAt,
        t.approved_at AS approvedAt,
        t.rejection_reason AS rejectionReason,
        b.business_name AS businessName,
        b.id AS businessId
      FROM transactions t
      JOIN clients c
        ON c.id = t.client_id
      JOIN business_profiles b
        ON b.user_id = c.owner_user_id
      JOIN auditor_assignments aa
        ON aa.business_profile_id = b.id
      WHERE aa.auditor_user_id = ?
        AND aa.status = 'active'
      ORDER BY t.id DESC
      LIMIT 200
    `).all(req.user.id);

    return res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("Auditor transactions error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load transactions.",
    });
  }
});

// Read audit events from authorised businesses.
router.get("/audit-trail", (req, res) => {
  try {
    const events = db.prepare(`
      SELECT
        a.id,
        a.transaction_id AS transactionId,
        a.action,
        a.source,
        a.timestamp,
        actor.first_name || ' ' || actor.last_name
          AS actorName,
        b.business_name AS businessName
      FROM transaction_audit a
      JOIN clients c
        ON c.id = a.client_id
      JOIN business_profiles b
        ON b.user_id = c.owner_user_id
      JOIN auditor_assignments aa
        ON aa.business_profile_id = b.id
      JOIN users actor
        ON actor.id = a.actor_id
      WHERE aa.auditor_user_id = ?
        AND aa.status = 'active'
      ORDER BY a.id DESC
      LIMIT 200
    `).all(req.user.id);

    return res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Auditor audit trail error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load audit trail.",
    });
  }
});

// Dashboard statistics for authorised businesses.
router.get("/dashboard", (req, res) => {
  try {
    const counts = db.prepare(`
      SELECT
        COUNT(*) AS totalTransactions,
        SUM(
          CASE
            WHEN t.status = 'approved' THEN 1
            ELSE 0
          END
        ) AS approvedTransactions,
        SUM(
          CASE
            WHEN t.status = 'pending_review' THEN 1
            ELSE 0
          END
        ) AS pendingTransactions,
        SUM(
          CASE
            WHEN t.status = 'returned' THEN 1
            ELSE 0
          END
        ) AS returnedTransactions
      FROM transactions t
      JOIN clients c
        ON c.id = t.client_id
      JOIN business_profiles b
        ON b.user_id = c.owner_user_id
      JOIN auditor_assignments aa
        ON aa.business_profile_id = b.id
      WHERE aa.auditor_user_id = ?
        AND aa.status = 'active'
    `).get(req.user.id);

    const businessCount = db.prepare(`
      SELECT COUNT(*) AS total
      FROM auditor_assignments
      WHERE auditor_user_id = ?
        AND status = 'active'
    `).get(req.user.id);

    return res.json({
      success: true,
      data: {
        assignedBusinesses: businessCount.total,
        totalTransactions: counts.totalTransactions || 0,
        approvedTransactions: counts.approvedTransactions || 0,
        pendingTransactions: counts.pendingTransactions || 0,
        returnedTransactions: counts.returnedTransactions || 0,
      },
    });
  } catch (error) {
    console.error("Auditor dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load auditor dashboard.",
    });
  }
});

// Get the authenticated auditor's profile.
router.get("/profile", (req, res) => {
  try {
    const profile = db.prepare(`
      SELECT
        u.id,
        u.first_name AS firstName,
        u.last_name AS lastName,
        u.email,
        u.phone,
        u.profile_photo_url AS profilePhotoUrl,
        u.created_at AS createdAt,
        u.updated_at AS updatedAt
      FROM users u
      JOIN roles r
        ON r.id = u.role_id
      WHERE u.id = ?
        AND r.name = 'auditor'
    `).get(req.user.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Auditor profile not found.",
      });
    }

    return res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Auditor profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load auditor profile.",
    });
  }
});

// Update the auditor's personal information.
router.patch("/profile", (req, res) => {
  try {
    const firstName = req.body?.firstName;
    const lastName = req.body?.lastName;
    const phone = req.body?.phone ?? "";

    if (
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof phone !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile information.",
      });
    }

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanPhone = phone.trim();

    if (
      cleanFirstName.length < 1 ||
      cleanFirstName.length > 100 ||
      cleanLastName.length < 1 ||
      cleanLastName.length > 100 ||
      cleanPhone.length > 30
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid profile information.",
      });
    }

    const update = db.prepare(`
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
          WHERE name = 'auditor'
        )
    `).run(
      cleanFirstName,
      cleanLastName,
      cleanPhone || null,
      req.user.id
    );

    if (!update.changes) {
      return res.status(404).json({
        success: false,
        message: "Auditor profile not found.",
      });
    }

    const profile = db.prepare(`
      SELECT
        id,
        first_name AS firstName,
        last_name AS lastName,
        email,
        phone,
        profile_photo_url AS profilePhotoUrl,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM users
      WHERE id = ?
    `).get(req.user.id);

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      data: profile,
    });
  } catch (error) {
    console.error("Auditor profile update error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update auditor profile.",
    });
  }
});

module.exports = router;
