// Imports Express to create the transaction routes
const express = require("express");

// Imports the transaction controller functions
const {
  processTransaction,
  confirmTransaction,
  getTransactions,
  getTransactionById,
  getAuditLog,
  getAssignment,
  setAssignment,
} = require("../controllers/transactionController");

// Creates the transaction router
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { transactionSchema, transcriptSchema, assignmentSchema } = require('../validators/transaction.schemas');
router.use(authenticate, requireRole('business_owner', 'bookkeeper'));
router.get('/accountant', getAssignment);
router.put('/accountant', validate(assignmentSchema), setAssignment);

// Processes a voice transaction transcript
router.post("/process", validate(transcriptSchema), processTransaction);

// Retrieves the transaction audit log
router.get("/audit", getAuditLog);

// Retrieves all posted transactions
router.get("/", getTransactions);

// Retrieves one posted transaction by ID
router.get("/:id", getTransactionById);

// Confirms and posts a reviewed transaction
router.post("/", validate(transactionSchema), confirmTransaction);
router.put('/:id', validate(transactionSchema), confirmTransaction);

// Exports the router so that server.js can use it
module.exports = router;
