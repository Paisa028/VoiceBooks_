// Imports the transaction processing service
const transactionProcessingService = require(
  "../services/transactionProcessingService"
);

// Imports the transaction storage service
const transactionStorageService = require(
  "../services/transactionStorageService"
);

// --------------------------------------------------
// PROCESS TRANSACTION
// --------------------------------------------------

// Handles requests to process a transaction transcript
const processTransaction = async (req, res) => {
  try {
    // Retrieves the transcript sent by the frontend
    const { transcript } = req.body;

    // Validates that a transcript was provided
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({
        status: "error",
        message: "A transaction transcript is required.",
      });
    }

    // Sends the transcript to the transaction processing service
    const transaction =
      await transactionProcessingService.processTransaction(
        transcript);

    // -----------------------------------
    // Checks for missing transaction data
    // -----------------------------------

    const missingFields = [];

    if (!transaction.type) {
      missingFields.push("type");
    }

    if (
      transaction.amount === null ||
      transaction.amount === undefined
    ) {
      missingFields.push("amount");
    }

    if (!transaction.description) {
      missingFields.push("description");
    }

    if (!transaction.paymentMethod) {
      missingFields.push("paymentMethod");
    }

    if (!transaction.transactionDate) {
      missingFields.push("transactionDate");
    }

    // -----------------------------------
    // Creates clarification questions
    // -----------------------------------

    const clarificationQuestions = [];

    if (missingFields.includes("type")) {
      clarificationQuestions.push(
        "Is this an income or an expense?"
      );
    }

    if (missingFields.includes("amount")) {
      clarificationQuestions.push(
        "What is the transaction amount?"
      );
    }

    if (missingFields.includes("description")) {
      clarificationQuestions.push(
        "What is this transaction for?"
      );
    }

    if (missingFields.includes("paymentMethod")) {
      clarificationQuestions.push(
        "How was the transaction paid?"
      );
    }

    if (missingFields.includes("transactionDate")) {
      clarificationQuestions.push(
        "What date did this transaction take place?"
      );
    }

    const needsClarification =
      missingFields.length > 0;

    return res.status(200).json({
      status: "success",

      transaction,

      clarification: {
        needsClarification,
        missingFields,
        questions: clarificationQuestions,
      },
    });
  } catch (error) {
    console.error(
      "Transaction processing error:",
      error
    );

    return res.status(500).json({
      status: "error",
      message:
        "The transaction could not be processed.",
    });
  }
};

// --------------------------------------------------
// CREATE JOURNAL ENTRIES
// --------------------------------------------------

const createJournalEntries = (transaction) => {
  const amount = Number(transaction.amount);

  const category =
    transaction.accountCategory ||
    transaction.description ||
    "Transaction";

  const paymentMethod =
    transaction.paymentMethod
      ?.toLowerCase()
      .trim();

  let paymentAccount = "Bank";

  if (paymentMethod === "cash") {
    paymentAccount = "Cash";
  } else if (
    paymentMethod === "credit card"
  ) {
    paymentAccount = "Credit Card";
  } else if (
    paymentMethod === "debit card"
  ) {
    paymentAccount = "Bank";
  } else if (
    paymentMethod === "bank transfer" ||
    paymentMethod === "eft" ||
    paymentMethod === "bank"
  ) {
    paymentAccount = "Bank";
  } else if (
    paymentMethod === "credit"
  ) {
    paymentAccount =
      transaction.type === "expense"
        ? "Accounts Payable"
        : "Accounts Receivable";
  }

  // -----------------------------------
  // EXPENSE
  // Debit expense/category
  // Credit cash/bank/payable
  // -----------------------------------

  if (transaction.type === "expense") {
    return [
      {
        account: `${category} Expense`,
        debit: amount,
        credit: 0,
      },
      {
        account: paymentAccount,
        debit: 0,
        credit: amount,
      },
    ];
  }

  // -----------------------------------
  // INCOME
  // Debit cash/bank/receivable
  // Credit revenue
  // -----------------------------------

  if (transaction.type === "income") {
    const revenueAccount =
      category
        .toLowerCase()
        .includes("revenue")
        ? category
        : `${category} Revenue`;

    return [
      {
        account: paymentAccount,
        debit: amount,
        credit: 0,
      },
      {
        account: revenueAccount,
        debit: 0,
        credit: amount,
      },
    ];
  }

  return [];
};

// --------------------------------------------------
// CONFIRM AND POST TRANSACTION
// --------------------------------------------------

const confirmTransaction = async (req, res) => {
  try {
    const transaction = req.body;

    // -----------------------------------
    // Checks transaction exists
    // -----------------------------------

    if (
      !transaction ||
      Object.keys(transaction).length === 0
    ) {
      return res.status(400).json({
        status: "error",
        message: "Transaction data is required.",
      });
    }

    // -----------------------------------
    // Validates required information
    // -----------------------------------

    const missingFields = [];

    if (
      !transaction.type ||
      !["income", "expense"].includes(
        transaction.type.toLowerCase()
      )
    ) {
      missingFields.push("type");
    }

    if (
      transaction.amount === null ||
      transaction.amount === undefined ||
      transaction.amount === "" ||
      !Number.isFinite(
        Number(transaction.amount)
      ) ||
      Number(transaction.amount) <= 0
    ) {
      missingFields.push("amount");
    }

    if (
      !transaction.description ||
      !transaction.description.trim()
    ) {
      missingFields.push("description");
    }

    if (
      !transaction.paymentMethod ||
      !transaction.paymentMethod.trim()
    ) {
      missingFields.push("paymentMethod");
    }

    if (!transaction.transactionDate) {
      missingFields.push("transactionDate");
    }
    console.log("=== CONFIRM TRANSACTION DEBUG ===");
    console.log("Transaction received:", transaction);
    console.log("Missing fields:", missingFields);

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: "error",

        message:
          "The transaction cannot be posted because required information is missing.",

        missingFields,
      });
    }

    // -----------------------------------
    // Normalises transaction
    // -----------------------------------

    const transactionToPost = {
      ...transaction,

      type:
        transaction.type
          .toLowerCase()
          .trim(),

      amount:
        Number(transaction.amount),

      party:
        transaction.party?.trim() ||
        null,

      partyType:
        transaction.partyType
          ?.toLowerCase()
          .trim() || null,

      description:
        transaction.description.trim(),

      accountCategory:
        transaction.accountCategory
          ?.trim() || null,

      paymentMethod:
        transaction.paymentMethod
          .toLowerCase()
          .trim(),

      reference:
        transaction.reference?.trim() ||
        null,

      vatApplicable:
        Boolean(
          transaction.vatApplicable
        ),
    };

    // -----------------------------------
    // Creates accounting entries
    // -----------------------------------

    const journalEntries =
      createJournalEntries(
        transactionToPost
      );

    if (journalEntries.length === 0) {
      return res.status(400).json({
        status: "error",
        message:
          "VoiceBooks could not create the accounting entry for this transaction.",
      });
    }

    // -----------------------------------
    // Creates final posted transaction
    // -----------------------------------

    const now =
      new Date().toISOString();

    const postedTransaction = {
      id: `TXN-${Date.now()}`,

      ...transactionToPost,

      journalEntries,

      status: "confirmed",

      postingStatus: "posted",

      confirmedAt: now,

      postedAt: now,

      audit: {
        createdAt:
          transaction.createdAt || now,

        updatedAt: now,
      },
    };

    // -----------------------------------
    // Saves transaction
    // -----------------------------------

    await transactionStorageService
      .saveTransaction(
        postedTransaction
      );

    // -----------------------------------
    // Creates audit record
    // -----------------------------------

    const auditRecord =
      await transactionStorageService
        .createAuditRecord({
          transactionId:
            postedTransaction.id,

          action:
            "TRANSACTION_POSTED",

          status: "success",

          source:
            postedTransaction
              .originalTranscript
              ? "voice"
              : "manual",
        });

    // -----------------------------------
    // Backend log
    // -----------------------------------

    console.log(
      "Posted VoiceBooks transaction:",
      postedTransaction
    );

    console.log(
      "VoiceBooks audit record:",
      auditRecord
    );

    // -----------------------------------
    // Success response
    // -----------------------------------

    return res.status(201).json({
      status: "success",

      message:
        "Transaction confirmed and posted successfully.",

      transaction:
        postedTransaction,

      auditRecord,
    });
  } catch (error) {
    console.error(
      "Transaction posting error:",
      error
    );

    return res.status(500).json({
      status: "error",

      message:
        "The transaction could not be posted.",
    });
  }
};

// --------------------------------------------------
// GET ALL TRANSACTIONS
// --------------------------------------------------

const getTransactions = async (
  req,
  res
) => {
  try {
    const transactions =
      await transactionStorageService
        .getTransactions();

    // Shows newest transactions first
    const sortedTransactions = [
      ...transactions,
    ].sort((a, b) => {
      const dateA = new Date(
        a.postedAt ||
          a.confirmedAt ||
          0
      );

      const dateB = new Date(
        b.postedAt ||
          b.confirmedAt ||
          0
      );

      return dateB - dateA;
    });

    return res.status(200).json({
      status: "success",

      count:
        sortedTransactions.length,

      transactions:
        sortedTransactions,
    });
  } catch (error) {
    console.error(
      "Get transactions error:",
      error
    );

    return res.status(500).json({
      status: "error",

      message:
        "Transactions could not be retrieved.",
    });
  }
};

// --------------------------------------------------
// GET TRANSACTION BY ID
// --------------------------------------------------

const getTransactionById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const transaction =
      await transactionStorageService
        .getTransactionById(id);

    if (!transaction) {
      return res.status(404).json({
        status: "error",

        message:
          "Transaction not found.",
      });
    }

    return res.status(200).json({
      status: "success",

      transaction,
    });
  } catch (error) {
    console.error(
      "Get transaction error:",
      error
    );

    return res.status(500).json({
      status: "error",

      message:
        "The transaction could not be retrieved.",
    });
  }
};

// --------------------------------------------------
// GET AUDIT LOG
// --------------------------------------------------

const getAuditLog = async (
  req,
  res
) => {
  try {
    const auditLog =
      await transactionStorageService
        .getAuditLog();

    const sortedAuditLog = [
      ...auditLog,
    ].sort(
      (a, b) =>
        new Date(b.timestamp) -
        new Date(a.timestamp)
    );

    return res.status(200).json({
      status: "success",

      count: sortedAuditLog.length,

      auditLog: sortedAuditLog,
    });
  } catch (error) {
    console.error(
      "Get audit log error:",
      error
    );

    return res.status(500).json({
      status: "error",

      message:
        "The audit log could not be retrieved.",
    });
  }
};

// --------------------------------------------------
// EXPORTS
// --------------------------------------------------

module.exports = {
  processTransaction,
  confirmTransaction,
  getTransactions,
  getTransactionById,
  getAuditLog,
};