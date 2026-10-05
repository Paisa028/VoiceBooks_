const express = require("express");

const router = express.Router();

const {
    getDashboardSummary
} = require("../controllers/dashboardController");

const authenticateToken = require("../middleware/authMiddleware");

router.get(
    "/summary",
    authenticateToken,
    getDashboardSummary
);

module.exports = router;