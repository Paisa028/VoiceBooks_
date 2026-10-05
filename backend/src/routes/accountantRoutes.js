const express = require("express");

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


module.exports = router;