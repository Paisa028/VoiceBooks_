import { useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

// Creates the Transaction Review screen
function TransactionReview() {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieves transaction information sent by
  // Manual Transaction or Voice Capture.
  const receivedTransaction =
    location.state?.transaction || {};

  // Stores the transaction while it is being reviewed.
  const [transaction, setTransaction] = useState({
    originalTranscript:
      receivedTransaction.originalTranscript || null,
    notes: receivedTransaction.notes || null,

    type:
      receivedTransaction.type || "",

    amount:
      receivedTransaction.amount ?? "",

    party:
      receivedTransaction.party || "",

    partyType:
      receivedTransaction.partyType || "",

    description:
      receivedTransaction.description || "",

    accountCategory:
      receivedTransaction.accountCategory || "",

    paymentMethod:
      receivedTransaction.paymentMethod || "",

    transactionDate:
      receivedTransaction.transactionDate || "",

    reference:
      receivedTransaction.reference || "",

    attachment:
      receivedTransaction.attachment || null,

    vatApplicable:
      receivedTransaction.vatApplicable || false,

    vatInclusive:
      receivedTransaction.vatInclusive ?? null,

    vatRate:
      receivedTransaction.vatRate ?? 15,

    vatAmount:
      receivedTransaction.vatAmount ?? "",
  });

  // Controls edit mode.
  const [isEditing, setIsEditing] = useState(false);

  // Prevents duplicate posting while the request is running.
  const [isPosting, setIsPosting] = useState(false);

  // Stores an error returned by validation or the backend.
  const [errorMessage, setErrorMessage] = useState("");

  // Checks whether this page received a transaction.
  const hasTransaction =
    Object.keys(receivedTransaction).length > 0;

  // Determines whether the transaction originated from voice capture.
  const isVoiceTransaction =
    Boolean(transaction.originalTranscript);

  // Converts the amount into a safe number.
  const numericAmount =
    Number(transaction.amount) || 0;

  // Formats money consistently.
  const formatCurrency = (value) => {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
      return "R 0.00";
    }

    return `R ${amount.toFixed(2)}`;
  };

  // Makes stored values easier to read.
  const formatText = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "Not provided";
    }

    return String(value)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  // Formats the transaction date for the review screen.
  const formatDate = (value) => {
    if (!value) {
      return "Not provided";
    }

    const parts = value.split("-");

    if (parts.length !== 3) {
      return value;
    }

    const [year, month, day] = parts;

    return `${day}/${month}/${year}`;
  };

  // Returns the user to the correct entry screen.
  const goBack = () => {
    if (isVoiceTransaction) {
      navigate("/transactions/voice");
      return;
    }

    navigate("/transactions/manual");
  };

  // Updates editable fields.
  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setTransaction((currentTransaction) => ({
      ...currentTransaction,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // Opens edit mode.
  const startEditing = () => {
    setErrorMessage("");
    setIsEditing(true);
  };

  // Returns from edit mode to review mode.
  const saveChanges = () => {
    setErrorMessage("");

    if (!transaction.type) {
      setErrorMessage(
        "Please select a transaction type."
      );
      return;
    }

    if (
      !transaction.amount ||
      Number(transaction.amount) <= 0
    ) {
      setErrorMessage(
        "Please enter a valid transaction amount."
      );
      return;
    }

    if (!transaction.description.trim()) {
      setErrorMessage(
        "Please enter a transaction description."
      );
      return;
    }

    if (!transaction.paymentMethod.trim()) {
      setErrorMessage(
        "Please enter a payment method."
      );
      return;
    }

    if (!transaction.transactionDate) {
      setErrorMessage(
        "Please select a transaction date."
      );
      return;
    }

    setIsEditing(false);
  };

  // -------------------------------------------------
  // ACCOUNTING ENTRY PREVIEW
  // -------------------------------------------------

  // Expense example:
  //
  // Debit  Stationery Expense
  // Credit Cash
  //
  // Income reverses the general direction:
  //
  // Debit  Cash / Bank
  // Credit Revenue

  const isIncomeTransaction =
    transaction.type === "income" ||
    transaction.type === "customer_receipt" ||
    transaction.type === "sales_invoice";

  const getPaymentAccount = () => {
    const paymentMethod =
      transaction.paymentMethod
        .toLowerCase()
        .trim();

    if (
      paymentMethod.includes("bank") ||
      paymentMethod.includes("eft")
    ) {
      return "Bank";
    }

    if (
      paymentMethod.includes("credit card")
    ) {
      return "Credit Card";
    }

    if (
      paymentMethod.includes("debit card")
    ) {
      return "Bank";
    }

    if (
      paymentMethod.includes("online")
    ) {
      return "Online Payment";
    }

    if (
      paymentMethod.includes("mobile")
    ) {
      return "Mobile Payment";
    }

    if (paymentMethod.includes("cash")) {
      return "Cash";
    }

    return transaction.paymentMethod
      ? formatText(transaction.paymentMethod)
      : "Cash / Bank";
  };

  const paymentAccount =
    getPaymentAccount();

  // Determines the account used for the transaction.
  const getCategoryAccount = () => {
    if (transaction.accountCategory) {
      if (
        isIncomeTransaction &&
        !transaction.accountCategory
          .toLowerCase()
          .includes("revenue")
      ) {
        return transaction.accountCategory;
      }

      if (
        !isIncomeTransaction &&
        !transaction.accountCategory
          .toLowerCase()
          .includes("expense")
      ) {
        return `${transaction.accountCategory} Expense`;
      }

      return transaction.accountCategory;
    }

    return isIncomeTransaction
      ? "Revenue"
      : "Expense";
  };

  const categoryAccount =
    getCategoryAccount();

  // Builds the journal preview displayed to the user.
  const journalEntries =
    isIncomeTransaction
      ? [
          {
            account: paymentAccount,
            debit: numericAmount,
            credit: 0,
          },
          {
            account: categoryAccount,
            debit: 0,
            credit: numericAmount,
          },
        ]
      : [
          {
            account: categoryAccount,
            debit: numericAmount,
            credit: 0,
          },
          {
            account: paymentAccount,
            debit: 0,
            credit: numericAmount,
          },
        ];

  // -------------------------------------------------
  // CONFIRM AND POST
  // -------------------------------------------------

  const confirmAndPost = async () => {
    try {
      setErrorMessage("");
      setIsPosting(true);

      // Browser File objects cannot be serialised directly
      // into JSON. We therefore send document metadata for
      // this API request while retaining the File in the UI.
      const attachmentMetadata =
        transaction.attachment
          ? {
              name:
                transaction.attachment.name,

              size:
                transaction.attachment.size,

              type:
                transaction.attachment.type,
            }
          : null;

      const transactionForApi = {
        ...transaction,

        amount: numericAmount,

        attachment:
          attachmentMetadata,

        journalEntries,
      };

      const response = await fetch(
        receivedTransaction.status === 'returned'
          ? `/api/transactions/${encodeURIComponent(receivedTransaction.id)}`
          : '/api/transactions',
        {
          method: receivedTransaction.status === 'returned' ? 'PUT' : 'POST',

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            transactionForApi
          ),
        }
      );

      const data =
        await response.json();

        console.log("POST TRANSACTION RESPONSE:", data

        );

      if (!response.ok) {
        throw new Error(
          (data.errors ? Object.values(data.errors).join(' ') : data.message) ||
            "The transaction could not be posted."
        );
      }

      const postedTransaction = {
        ...transaction,
        ...data.transaction,

        // Keeps the local File object so the next screen
        // can still display its name.
        attachment:
          transaction.attachment,

        journalEntries,

        status:
          data.transaction?.status ||
          "pending_review",
      };

      // Successful posting now leaves the Review screen.
      navigate(
        "/transactions/success",
        {
          state: {
            transaction:
              postedTransaction,
          },
        }
      );
    } catch (error) {
      console.error(
        "Transaction posting error:",
        error
      );

      setErrorMessage(
        error.message ||
          "The transaction could not be posted. Please try again."
      );
    } finally {
      setIsPosting(false);
    }
  };

  // -------------------------------------------------
  // NO TRANSACTION
  // -------------------------------------------------

  if (!hasTransaction) {
    return (
      <main className="transaction-page">
        <section className="transaction-container transaction-review-container">

          <header className="transaction-header">
            <button
              type="button"
              className="back-button"
              onClick={() => navigate("/")}
              aria-label="Go back"
            >
              ←
            </button>

            <h1>Transaction Review</h1>
          </header>

          <p className="transaction-intro">
            No transaction information was received.
          </p>

          <div className="review-error" role="alert">
            Create a transaction before opening
            the review screen.
          </div>

          <div className="review-actions">
            <button
              type="button"
              className="review-post-button"
              onClick={() => navigate("/")}
            >
              New Transaction
            </button>
          </div>

        </section>
      </main>
    );
  }

  // -------------------------------------------------
  // EDIT MODE
  // -------------------------------------------------

  if (isEditing) {
    return (
      <main className="transaction-page">
        <section className="transaction-container manual-transaction-container">

          <header className="transaction-header">
            <button
              type="button"
              className="back-button"
              onClick={() =>
                setIsEditing(false)
              }
              aria-label="Return to review"
            >
              ← Back
            </button>

            <h1>Edit Transaction</h1>
          </header>

          <p className="transaction-intro">
            Make any necessary corrections before
            posting the transaction.
          </p>

          {errorMessage && (
            <div className="review-error" role="alert">
              {errorMessage}
            </div>
          )}

          <div className="manual-transaction-form">
            <div className="manual-form-grid">

              {/* Transaction Type */}
              <label>
                Transaction Type *

                <select
                  name="type"
                  value={transaction.type}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select transaction type
                  </option>

                  <option value="expense">
                    Expense
                  </option>

                  <option value="income">
                    Income
                  </option>

                  <option value="customer_receipt">
                    Customer Receipt
                  </option>

                  <option value="supplier_payment">
                    Supplier Payment
                  </option>

                  <option value="sales_invoice">
                    Sales Invoice
                  </option>

                  <option value="purchase_invoice">
                    Purchase Invoice
                  </option>

                  <option value="credit_note">
                    Credit Note
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </label>

              {/* Amount */}
              <label>
                Amount (R) *

                <input
                  type="number"
                  name="amount"
                  min="0.01"
                  step="0.01"
                  value={transaction.amount}
                  onChange={handleChange}
                  required
                />
              </label>

              {/* Party */}
              <label>
                Customer / Supplier

                <input
                  type="text"
                  name="party"
                  value={transaction.party}
                  onChange={handleChange}
                  placeholder="e.g. CNA"
                />
              </label>

              {/* Party Type */}
              <label>
                Party Type

                <select
                  name="partyType"
                  value={transaction.partyType}
                  onChange={handleChange}
                >
                  <option value="">
                    Select party type
                  </option>

                  <option value="customer">
                    Customer
                  </option>

                  <option value="supplier">
                    Supplier
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </label>

              {/* Description */}
              <label>
                Description *

                <input
                  type="text"
                  name="description"
                  value={transaction.description}
                  onChange={handleChange}
                  placeholder="e.g. Stationery"
                  required
                />
              </label>

              {/* Account Category */}
              <label>
                Account Category

                <select
                  name="accountCategory"
                  value={
                    transaction.accountCategory
                  }
                  onChange={handleChange}
                >
                  <option value="">
                    Select category
                  </option>

                  <option value="Stationery">
                    Stationery
                  </option>

                  <option value="Utilities">
                    Utilities
                  </option>

                  <option value="Fuel">
                    Fuel
                  </option>

                  <option value="Rent">
                    Rent
                  </option>

                  <option value="Materials">
                    Materials
                  </option>

                  <option value="Repairs and Maintenance">
                    Repairs and Maintenance
                  </option>

                  <option value="Service Revenue">
                    Service Revenue
                  </option>

                  <option value="Sales Revenue">
                    Sales Revenue
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </label>

              {/* Payment Method */}
              <label>
                Payment Method *

                <input
                  type="text"
                  name="paymentMethod"
                  value={
                    transaction.paymentMethod
                  }
                  onChange={handleChange}
                  placeholder="e.g. Cash"
                  required
                />
              </label>

              {/* Transaction Date */}
              <label>
                Transaction Date *

                <input
                  type="date"
                  name="transactionDate"
                  value={
                    transaction.transactionDate
                  }
                  onChange={handleChange}
                  required
                />
              </label>

              {/* Reference */}
              <label>
                Reference / Invoice Number

                <input
                  type="text"
                  name="reference"
                  value={transaction.reference}
                  onChange={handleChange}
                  placeholder="e.g. INV-001"
                />
              </label>

              {/* VAT */}
              <label className="manual-checkbox">
                <input
                  type="checkbox"
                  name="vatApplicable"
                  checked={
                    transaction.vatApplicable
                  }
                  onChange={handleChange}
                />

                VAT Applicable
              </label>

            </div>

            <div className="manual-form-actions">
              <button
                type="button"
                onClick={() =>
                  setIsEditing(false)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveChanges}
              >
                Save Changes
              </button>
            </div>
            </div>
        </section>
      </main>
    );
  }

  // -------------------------------------------------
  // REVIEW MODE
  // -------------------------------------------------

  return (
    <main className="transaction-page">
      <section className="transaction-container transaction-review-container">

        {/* Header */}
        <header className="transaction-header">
          <button
            type="button"
            className="back-button"
            onClick={goBack}
            aria-label="Go back"
            disabled={isPosting}
          >
            ←
          </button>

          <h1>Transaction Review</h1>
        </header>

        <p className="transaction-intro">
          Review the details and accounting
          entry before submitting this transaction.
        </p>

        {/* Voice transcript */}
        {isVoiceTransaction && (
          <div className="review-transcript">
            <span className="transcription-label">
              What You Said
            </span>

            <p>
              “{transaction.originalTranscript}”
            </p>
          </div>
        )}

        {/* Transaction Summary */}
        <section className="review-summary-card">

          <div className="review-summary-header">

            <div className="review-party">
              <h2>
                {transaction.party ||
                  transaction.description ||
                  "Transaction"}
              </h2>

              <p>
                {transaction.description ||
                  "No description provided"}
              </p>
            </div>

            <div className="review-amount">
              <strong>
                {formatCurrency(
                  transaction.amount
                )}
              </strong>

              <span>
                {formatText(
                  transaction.type
                )}
              </span>
            </div>

          </div>

          <div className="review-details">

            <div className="review-detail-row">
              <span className="review-detail-label">
                Date
              </span>

              <span className="review-detail-value">
                {formatDate(
                  transaction.transactionDate
                )}
              </span>
            </div>

            <div className="review-detail-row">
              <span className="review-detail-label">
                Party Type
              </span>

              <span className="review-detail-value">
                {formatText(
                  transaction.partyType
                )}
              </span>
            </div>

            <div className="review-detail-row">
              <span className="review-detail-label">
                Payment Method
              </span>

              <span className="review-detail-value">
                {formatText(
                  transaction.paymentMethod
                )}
              </span>
            </div>

            <div className="review-detail-row">
              <span className="review-detail-label">
                Account Category
              </span>

              <span className="review-detail-value">
                {formatText(
                  transaction.accountCategory
                )}
              </span>
            </div>

            <div className="review-detail-row">
              <span className="review-detail-label">
                Reference / Invoice
              </span>

              <span className="review-detail-value">
                {transaction.reference ||
                  "Not provided"}
              </span>
            </div>

            <div className="review-detail-row">
              <span className="review-detail-label">
                VAT
              </span>

              <span className="review-detail-value">
                {transaction.vatApplicable
                  ? `Applicable (${transaction.vatRate || 15}%)`
                  : "Not Applicable"}
              </span>
            </div>

            {transaction.vatApplicable && (
              <>
                <div className="review-detail-row">
                  <span className="review-detail-label">
                    VAT Treatment
                  </span>

                  <span className="review-detail-value">
                    {transaction.vatInclusive === true
                      ? "VAT Inclusive"
                      : transaction.vatInclusive === false
                        ? "VAT Exclusive"
                        : "Not specified"}
                  </span>
                </div>

                <div className="review-detail-row">
                  <span className="review-detail-label">
                    VAT Amount
                  </span>

                  <span className="review-detail-value">
                    {transaction.vatAmount !== ""
                      ? formatCurrency(
                          transaction.vatAmount
                        )
                      : "Not specified"}
                  </span>
                </div>
              </>
            )}

          </div>
        </section>

        {/* Accounting Entry Preview */}
        <section className="accounting-preview">

          <h2>
            Accounting Entry Preview
          </h2>

          <p className="accounting-preview-description">
            Review the debit and credit that
            VoiceBooks will create when this
            transaction is posted.
          </p>

          <table className="accounting-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Debit</th>
                <th>Credit</th>
              </tr>
            </thead>

            <tbody>
              {journalEntries.map(
                (entry, index) => (
                  <tr
                    key={`${entry.account}-${index}`}
                  >
                    <td>
                      {entry.account}
                    </td>

                    <td className="accounting-debit">
                      {entry.debit > 0
                        ? formatCurrency(
                            entry.debit
                          )
                        : "—"}
                    </td>

                    <td className="accounting-credit">
                      {entry.credit > 0
                        ? formatCurrency(
                            entry.credit
                          )
                        : "—"}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>

        </section>

        {/* Receipt / Invoice */}
        {transaction.attachment && (
          <section className="review-attachment">

            <div className="review-attachment-info">

              <div className="review-attachment-icon">
                📎
              </div>

              <div className="review-attachment-text">
                <strong>
                  Receipt / Invoice
                </strong>

                <span>
                  {transaction.attachment.name}
                </span>
              </div>

            </div>

            <span className="review-detail-value">
              {transaction.attachment.size
                ? `${(
                    transaction.attachment.size /
                    (1024 * 1024)
                  ).toFixed(2)} MB`
                : "Attached"}
            </span>

          </section>
        )}

        {/* Error */}
        {errorMessage && (
          <div className="review-error" role="alert">
            {errorMessage}
          </div>
        )}

        {/* Actions */}
        <div className="review-actions">

          <button
            type="button"
            className="review-edit-button"
            onClick={startEditing}
            disabled={isPosting}
          >
            Edit Transaction
          </button>

          <button
            type="button"
            className="review-post-button"
            onClick={confirmAndPost}
            disabled={isPosting}
          >
            {isPosting
              ? "Submitting..."
              : "Submit for Review"}
          </button>

        </div>

      </section>
    </main>
  );
}

export default TransactionReview;
