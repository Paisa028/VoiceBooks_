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


module.exports = { createJournalEntries };
