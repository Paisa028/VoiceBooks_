// Imports navigation and route state tools from React Router
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

// --------------------------------------------------
// TRANSACTION SUCCESS
// --------------------------------------------------

function TransactionSuccess() {
  // Allows navigation to other VoiceBooks screens
  const navigate = useNavigate();

  // Retrieves route state
  const location = useLocation();

  // Retrieves the posted transaction sent from Transaction Review
  const transaction =
    location.state?.transaction || null;

  // --------------------------------------------------
  // FORMAT AMOUNT
  // --------------------------------------------------

  // Formats money using South African Rand
  const formatAmount = (amount) => {
    const numericAmount =
      Number(amount || 0);

    return `R ${numericAmount.toFixed(2)}`;
  };

  // --------------------------------------------------
  // FORMAT LABEL
  // --------------------------------------------------

  // Formats values such as "credit card" into "Credit Card"
  const formatLabel = (value) => {
    if (!value) {
      return "Not Provided";
    }

    return String(value)
      .replace(/([A-Z])/g, " $1")
      .replace(/[_-]/g, " ")
      .trim()
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };

  // --------------------------------------------------
  // NEW TRANSACTION
  // --------------------------------------------------

  const handleNewTransaction = () => {
    navigate("/");
  };

  // --------------------------------------------------
  // VIEW TRANSACTION
  // --------------------------------------------------

  const handleViewTransaction = () => {
    // If no transaction is available,
    // safely return to transaction history
    if (!transaction) {
      navigate("/transactions");
      return;
    }

    // A posted transaction should always have an ID
    if (!transaction.id) {
      navigate("/transactions");
      return;
    }

    // Opens the stored transaction details page
    navigate(
      `/transactions/${transaction.id}`
    );
  };

  // --------------------------------------------------
  // TRANSACTION HISTORY
  // --------------------------------------------------

  const handleTransactionHistory =
    () => {
      navigate("/transactions");
    };

  // --------------------------------------------------
  // SAFE FALLBACK
  // --------------------------------------------------

  // If this page is opened directly without route state,
  // the user can still access persisted transaction history.
if (!transaction) {
return (
<main className="transaction-page">

<section className="transaction-container transaction-success-container">

 <div className="success-header">

  <div className="success-icon">
    <span>✓</span>
  </div>

  <h1 className="success-title">
    Transaction Successful
  </h1>

  <p className="success-description">
    Transaction details are not available in this browser session.
    You can open the transaction history to view posted transactions.
  </p>

</div>
   <div className="success-actions">

     <button
         type="button"
          className="success-secondary-button"
             onClick={
                handleTransactionHistory
              }
            >
              Transaction History
            </button>

            <button
              type="button"
              className="success-primary-button"
              onClick={
                handleNewTransaction
              }
            >
              New Transaction
            </button>

          </div>

        </section>

      </main>
    );
  }

  // --------------------------------------------------
// PAGE
// --------------------------------------------------

return (
  <main className="transaction-page">

    <section className="transaction-container transaction-success-container">

      {/* =========================================
          SUCCESS HEADER
          ========================================= */}
      <div className="success-header">

        <div className="success-icon">
          <span>✓</span>
        </div>

        <h1 className="success-title">
          Transaction Successful
        </h1>

        <p className="success-description">
          The transaction has been confirmed and posted successfully.
        </p>

      </div>

      {/* =========================================
          TRANSACTION SUMMARY
          ========================================= */}
      <div className="success-summary">

        <div className="success-summary-header">
          <h2>Transaction Summary</h2>
        </div>

        <div className="success-summary-body">

          {/* Transaction ID */}
          <div className="review-detail-row">
            <span className="review-detail-label">
              Transaction ID
            </span>

            <span className="review-detail-value success-reference">
              {transaction.id || "Not Available"}
            </span>
          </div>

          {/* Customer / Supplier */}
          <div className="review-detail-row">
            <span className="review-detail-label">
              Customer / Supplier
            </span>

            <span className="review-detail-value">
              {transaction.party || "Not Provided"}
            </span>
          </div>

          {/* Transaction Type */}
          <div className="review-detail-row">
            <span className="review-detail-label">
              Transaction Type
            </span>

            <span className="review-detail-value">
              {formatLabel(transaction.type)}
            </span>
          </div>

          {/* Description */}
          <div className="review-detail-row">
            <span className="review-detail-label">
              Description
            </span>

            <span className="review-detail-value">
              {transaction.description || "Not Provided"}
            </span>
          </div>

          {/* Amount */}
          <div className="review-detail-row">
            <span className="review-detail-label">
              Amount
            </span>

            <span className="review-detail-value">
              {formatAmount(transaction.amount)}
            </span>
          </div>

          {/* Payment Method */}
          <div className="review-detail-row">
            <span className="review-detail-label">
              Payment Method
            </span>

            <span className="review-detail-value">
              {formatLabel(transaction.paymentMethod)}
            </span>
          </div>

          {/* Account Category */}
          <div className="review-detail-row">
            <span className="review-detail-label">
              Account Category
            </span>

            <span className="review-detail-value">
              {transaction.accountCategory || "Not Provided"}
            </span>
          </div>

          {/* Reference / Invoice */}
          <div className="review-detail-row">
            <span className="review-detail-label">
              Reference / Invoice
            </span>

            <span className="review-detail-value">
              {transaction.reference || "Not Provided"}
            </span>
          </div>

          {/* Status */}
          <div className="review-detail-row">
            <span className="review-detail-label">
              Status
            </span>

            <span className="review-detail-value">
              <span className="success-status">
                {formatLabel(transaction.status || "confirmed")}
              </span>
            </span>
          </div>

        </div>
      </div>

        {/* Accounting journal */}
        {transaction.journalEntries &&
          transaction.journalEntries.length >
            0 && (
            <div className="accounting-preview">

              <h2>
                Accounting Entry Posted
              </h2>

              <p className="accounting-preview-description">
                The following debit and
                credit entry was created
                for this transaction.
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

                  {transaction.journalEntries.map(
                    (entry, index) => (
                      <tr
                        key={`${entry.account}-${index}`}
                      >

                        <td>
                          {entry.account}
                        </td>

                        <td className="accounting-debit">
                          {Number(
                            entry.debit
                          ) > 0
                            ? formatAmount(
                                entry.debit
                              )
                            : "—"}
                        </td>

                        <td className="accounting-credit">
                          {Number(
                            entry.credit
                          ) > 0
                            ? formatAmount(
                                entry.credit
                              )
                            : "—"}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

      {/* Actions */}
      <div className="success-actions-new">
      <div className="success-actions-row">

      <button
      type="button"
      className="success-secondary-button"
      onClick={handleViewTransaction}
     >
      View Transaction
    </button>

    <button
      type="button"
      className="success-secondary-button"
      onClick={handleTransactionHistory}
    >
      Transaction History
    </button>
  </div>

  <button
    type="button"
    className="success-new-transaction-button"
    onClick={handleNewTransaction}
  >
    + New Transaction
  </button>
</div>
      </section>

    </main>
  );
}

// Exports the screen for use in App.jsx
export default TransactionSuccess;