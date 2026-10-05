// Imports Express to create the transaction routes
const express = require("express");

// Imports the transaction controller functions
const {
  processTransaction,
  confirmTransaction,
  getTransactions,
  getTransactionById,
  getAuditLog,
} = require("../controllers/transactionController");

// Creates the transaction router
const router = express.Router();

// Processes a voice transaction transcript
router.post("/process", processTransaction);

// Retrieves the transaction audit log
router.get("/audit", getAuditLog);

// Retrieves all posted transactions
router.get("/", getTransactions);

// Retrieves one posted transaction by ID
router.get("/:id", getTransactionById);

// Confirms and posts a reviewed transaction
router.post("/", confirmTransaction);

// Exports the router so that server.js can use it
module.exports = router;