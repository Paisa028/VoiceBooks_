
const express = require("express");
const { db } = require("../db");
const {
  authenticate,
  requireRole,
} = require("../middleware/auth");

const {
  getAssignment,
  setAssignment,
} = require("../services/transactionStorageService");

const router = express.Router();

router.use(authenticate);
router.use(requireRole("business_owner"));

function getBusiness(ownerId) {
  return db.prepare(`
    SELECT id, business_name
    FROM business_profiles
    WHERE user_id = ?
  `).get(ownerId);
}

function getAuditors(businessId) {
  return db.prepare(`
    SELECT
      u.id,
      u.email,
      u.first_name || ' ' || u.last_name AS name,
      a.assigned_at
    FROM auditor_assignments a
    JOIN users u ON u.id = a.auditor_user_id
    JOIN roles r ON r.id = u.role_id
    WHERE a.business_profile_id = ?
      AND a.status = 'active'
      AND r.name = 'auditor'
    ORDER BY a.assigned_at DESC
  `).all(businessId);
}

// List professionals assigned to the owner's business.
router.get("/", (req, res) => {
  try {
    const business = getBusiness(req.user.id);

    if (!business) {
      return res.status(404).json({
        message: "Business profile not found.",
      });
    }

    return res.json({
      accountant: getAssignment(req.user.id),
      auditors: getAuditors(business.id),
    });
  } catch (error) {
    console.error("Manage access error:", error);
    return res.status(500).json({
      message: "Unable to load professional access.",
    });
  }
});

// Assign an existing accountant or auditor by email.
router.post("/", (req, res) => {
  try {
    const { role } = req.body || {};
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();

    if (!["accountant", "auditor"].includes(role)) {
      return res.status(400).json({
        message: "Invalid professional role.",
      });
    }

    if (!email || email.length > 254 || !email.includes("@")) {
      return res.status(400).json({
        message: "A valid professional email is required.",
      });
    }

    const business = getBusiness(req.user.id);

    if (!business) {
      return res.status(404).json({
        message: "Business profile not found.",
      });
    }

    if (role === "accountant") {
      const accountant = setAssignment(req.user.id, email);

      return res.json({
        message: "Accountant assigned successfully.",
        accountant,
      });
    }

    const auditor = db.prepare(`
      SELECT u.id
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.email = ?
        AND r.name = 'auditor'
    `).get(email);

    if (!auditor) {
      return res.status(404).json({
        message: "No auditor account matches this email.",
      });
    }

    const saveAuditor = db.transaction(() => {
      db.prepare(`
        INSERT INTO auditor_assignments (
          auditor_user_id,
          business_profile_id,
          assigned_by,
          status,
          revoked_at
        )
        VALUES (?, ?, ?, 'active', NULL)
        ON CONFLICT(auditor_user_id, business_profile_id)
        DO UPDATE SET
          status = 'active',
          assigned_by = excluded.assigned_by,
          assigned_at = datetime('now'),
          revoked_at = NULL
      `).run(auditor.id, business.id, req.user.id);

      return getAuditors(business.id);
    });

    return res.json({
      message: "Auditor assigned successfully.",
      auditors: saveAuditor(),
    });
  } catch (error) {
    console.error("Assign professional error:", error);

    return res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : "Unable to assign professional.",
    });
  }
});

// Revoke access to the owner's business.
router.delete("/:role/:userId", (req, res) => {
  try {
    const { role, userId } = req.params;
    const professionalId = Number(userId);
    const business = getBusiness(req.user.id);

    if (!business) {
      return res.status(404).json({
        message: "Business profile not found.",
      });
    }

    if (!Number.isSafeInteger(professionalId) || professionalId <= 0) {
      return res.status(400).json({
        message: "Invalid professional ID.",
      });
    }

    if (role === "auditor") {
      const result = db.prepare(`
        UPDATE auditor_assignments
        SET status = 'revoked',
            revoked_at = datetime('now')
        WHERE auditor_user_id = ?
          AND business_profile_id = ?
          AND status = 'active'
      `).run(professionalId, business.id);

      if (!result.changes) {
        return res.status(404).json({
          message: "Active auditor assignment not found.",
        });
      }

      return res.json({
        message: "Auditor access revoked.",
      });
    }

    if (role === "accountant") {
      const client = db.prepare(`
        SELECT id
        FROM clients
        WHERE owner_user_id = ?
      `).get(req.user.id);

      if (!client) {
        return res.status(404).json({
          message: "Client record not found.",
        });
      }

      const assignment = db.prepare(`
        SELECT accountant_id
        FROM accountant_assignments
        WHERE client_id = ?
      `).get(client.id);

      if (!assignment ||
          assignment.accountant_id !== professionalId) {
        return res.status(404).json({
          message: "Accountant assignment not found.",
        });
      }

      setAssignment(req.user.id, null);

      return res.json({
        message: "Accountant access revoked.",
      });
    }

    return res.status(400).json({
      message: "Invalid professional role.",
    });
  } catch (error) {
    console.error("Revoke access error:", error);

    return res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : "Unable to revoke professional access.",
    });
  }
});

module.exports = router;
