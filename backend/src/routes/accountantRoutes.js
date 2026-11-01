const express = require("express");
const { db } = require("../db");
const router = express.Router();

const controller =
    require("../controllers/accountantController");

const {
    authenticate,
    requireRole
} = require("../middleware/auth");


router.use(authenticate);
router.use(requireRole("accountant"));

// Dashboard
router.get(
    "/dashboard",
    controller.dashboard
);


// Client management
router.get(
    "/clients",
    controller.clients
);

router.get(
    "/clients/:id",
    controller.client
);

router.get(
    "/clients/:id/transactions",
    controller.clientTransactions
);


// Transaction review
router.get(
    "/reviews/pending",
    controller.pendingReviews
);

router.get(
    "/transactions/:id/review",
    controller.reviewTransaction
);


// Approval/rejection
router.patch(
    "/transactions/:id/approve",
    controller.approve
);

router.patch(
    "/transactions/:id/reject",
    controller.reject
);


// Approved / returned
router.get(
    "/approved",
    controller.approved
);

router.get(
    "/returned",
    controller.returned
);


// Accountant profile
router.get(
    "/profile",
    controller.profile
);

router.patch("/profile", controller.updateProfile);


  // Read Sage integration status for assigned businesses.
  router.get("/integrations", (req, res) => {
    try {

      const businesses = db.prepare(`
        SELECT
          c.id AS clientId,
          c.business_name AS businessName,
          b.sage_status AS sageStatus,
          b.sage_region AS sageRegion
        FROM accountant_assignments a
        JOIN clients c
          ON c.id = a.client_id
        JOIN business_profiles b
          ON b.user_id = c.owner_user_id
        JOIN users owner
          ON owner.id = b.user_id
        JOIN roles owner_role
          ON owner_role.id = owner.role_id
        WHERE a.accountant_id = ?
          AND owner_role.name = 'business_owner'
        ORDER BY c.business_name
      `).all(req.user.id);

      return res.json({
        success: true,
        data: businesses,
      });
    } catch (error) {
      console.error("Accountant integrations error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load integrations.",
      });
    }
  });



module.exports = router;