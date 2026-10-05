// Imports Node.js file system utilities
const fs = require("fs").promises;

// Imports path utilities
const path = require("path");

// --------------------------------------------------
// FILE LOCATIONS
// --------------------------------------------------

const transactionsFilePath = path.join(
  __dirname,
  "../data/transactions.json"
);

const auditLogFilePath = path.join(
  __dirname,
  "../data/auditLog.json"
);

// --------------------------------------------------
// READ JSON FILE
// --------------------------------------------------

const readJsonFile = async (filePath) => {
  try {
    const fileContent = await fs.readFile(
      filePath,
      "utf8"
    );

    if (!fileContent.trim()) {
      return [];
    }

    const parsedData = JSON.parse(fileContent);

    return Array.isArray(parsedData)
      ? parsedData
      : [];
  } catch (error) {
    // Creates the file if it does not exist yet
    if (error.code === "ENOENT") {
      await fs.mkdir(
        path.dirname(filePath),
        {
          recursive: true,
        }
      );

      await fs.writeFile(
        filePath,
        "[]",
        "utf8"
      );

      return [];
    }

    throw error;
  }
};

// --------------------------------------------------
// WRITE JSON FILE
// --------------------------------------------------

const writeJsonFile = async (
  filePath,
  data
) => {
  await fs.mkdir(
    path.dirname(filePath),
    {
      recursive: true,
    }
  );

  await fs.writeFile(
    filePath,
    JSON.stringify(data, null, 2),
    "utf8"
  );
};

// --------------------------------------------------
// SAVE TRANSACTION
// --------------------------------------------------

const saveTransaction = async (
  transaction
) => {
  const transactions =
    await readJsonFile(
      transactionsFilePath
    );

  transactions.push(transaction);

  await writeJsonFile(
    transactionsFilePath,
    transactions
  );

  return transaction;
};

// --------------------------------------------------
// CREATE AUDIT RECORD
// --------------------------------------------------

const createAuditRecord = async ({
  transactionId,
  action,
  status,
  source,
}) => {
  const auditLog =
    await readJsonFile(
      auditLogFilePath
    );

  const auditRecord = {
    id: `AUD-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`,

    transactionId,

    action,

    status,

    source,

    timestamp: new Date().toISOString(),
  };

  auditLog.push(auditRecord);

  await writeJsonFile(
    auditLogFilePath,
    auditLog
  );

  return auditRecord;
};

// --------------------------------------------------
// GET ALL TRANSACTIONS
// --------------------------------------------------

const getTransactions = async () => {
  return readJsonFile(
    transactionsFilePath
  );
};

// --------------------------------------------------
// GET TRANSACTION BY ID
// --------------------------------------------------

const getTransactionById = async (
  transactionId
) => {
  const transactions =
    await getTransactions();

  return (
    transactions.find(
      (transaction) =>
        transaction.id === transactionId
    ) || null
  );
};

// --------------------------------------------------
// GET AUDIT LOG
// --------------------------------------------------

const getAuditLog = async () => {
  return readJsonFile(
    auditLogFilePath
  );
};

// --------------------------------------------------
// EXPORTS
// --------------------------------------------------

module.exports = {
  saveTransaction,
  createAuditRecord,
  getTransactions,
  getTransactionById,
  getAuditLog,
};