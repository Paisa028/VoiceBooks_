import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

// --------------------------------------------------
// TRANSACTION DETAILS
// --------------------------------------------------

function TransactionDetails() {
  const navigate = useNavigate();

  const { id } = useParams();

  const [transaction, setTransaction] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  // --------------------------------------------------
  // LOAD TRANSACTION
  // --------------------------------------------------

  useEffect(() => {
    const loadTransaction =
      async () => {
        try {
          setIsLoading(true);
          setErrorMessage("");

          const response = await fetch(
            `http://localhost:3715/api/transactions/${encodeURIComponent(
              id
            )}`
          );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.message ||
                "Transaction could not be loaded."
            );
          }

          setTransaction(
            data.transaction
          );
        } catch (error) {
          console.error(
            "Transaction details error:",
            error
          );

          setErrorMessage(
            error.message ||
              "VoiceBooks could not load this transaction."
          );
        } finally {
          setIsLoading(false);
        }
      };

    loadTransaction();
  }, [id]);

  // --------------------------------------------------
  // FORMAT AMOUNT
  // --------------------------------------------------

  const formatAmount = (amount) => {
    return new Intl.NumberFormat(
      "en-ZA",
      {
        style: "currency",
        currency: "ZAR",
      }
    ).format(
      Number(amount) || 0
    );
  };

  // --------------------------------------------------
  // FORMAT DATE
  // --------------------------------------------------

  const formatDate = (value) => {
    if (!value) {
      return "Not provided";
    }

    const date = new Date(value);

    if (
      Number.isNaN(date.getTime())
    ) {
      return value;
    }

    return new Intl.DateTimeFormat(
      "en-ZA",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    ).format(date);
  };

  // --------------------------------------------------
  // FORMAT DATE AND TIME
  // --------------------------------------------------

  const formatDateTime = (
    value
  ) => {
    if (!value) {
      return "Not available";
    }

    const date = new Date(value);

    if (
      Number.isNaN(date.getTime())
    ) {
      return value;
    }

    return new Intl.DateTimeFormat(
      "en-ZA",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(date);
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (isLoading) {
    return (
      <main className="transaction-page">
        <section className="transaction-container">

          <div className="history-message">
            <h2>
              Loading transaction...
            </h2>

            <p>
              VoiceBooks is retrieving
              the transaction details.
            </p>
          </div>

        </section>
      </main>
    );
  }

  // --------------------------------------------------
  // ERROR
  // --------------------------------------------------

  if (
    errorMessage ||
    !transaction
  ) {
    return (
      <main className="transaction-page">
        <section className="transaction-container">

          <header className="transaction-header">
            <button
              type="button"
              className="back-button"
              onClick={() =>
                navigate(
                  "/transactions"
                )
              }
            >
              ←
            </button>

            <h1>
              Transaction Details
            </h1>
          </header>

          <div className="recording-error">
            {errorMessage ||
              "Transaction not found."}
          </div>

        </section>
      </main>
    );
  }

  const journalEntries =
    transaction.journalEntries ||
    [];

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <main className="transaction-page">
      <section className="transaction-container transaction-details-container">

        {/* Header */}
        <header className="transaction-header">

          <button
            type="button"
            className="back-button"
            onClick={() =>
              navigate(
                "/transactions"
              )
            }
            aria-label="Go back"
          >
            ←
          </button>

          <div>
            <h1>
              Transaction Details
            </h1>

            <p className="transaction-intro">
              Review the complete
              transaction and accounting
              information.
            </p>
          </div>

        </header>

        {/* Status */}
        <section className="details-status-card">

          <div className="details-check">
            ✓
          </div>

          <div>
            <span className="success-status">
              {transaction.status ||
                "confirmed"}
            </span>

            <h2>
              {transaction.party ||
                transaction.description}
            </h2>

            <p>
              {transaction.type ===
              "income"
                ? "Income"
                : "Expense"}
              {" · "}
              {formatAmount(
                transaction.amount
              )}
            </p>
          </div>

        </section>

        {/* Information */}
        <section className="details-section">

          <h2>
            Transaction Information
          </h2>

          <div className="details-grid">

            <div>
              <span>
                Transaction ID
              </span>
              <strong>
                {transaction.id}
              </strong>
            </div>

            <div>
              <span>
                Transaction Type
              </span>
              <strong>
                {transaction.type}
              </strong>
            </div>

            <div>
              <span>
                Customer / Supplier
              </span>
              <strong>
                {transaction.party ||
                  "Not provided"}
              </strong>
            </div>

            <div>
              <span>
                Party Type
              </span>
              <strong>
                {transaction.partyType ||
                  "Not provided"}
              </strong>
            </div>

            <div>
              <span>
                Description
              </span>
              <strong>
                {
                  transaction.description
                }
              </strong>
            </div>

            <div>
              <span>
                Account Category
              </span>
              <strong>
                {transaction.accountCategory ||
                  "Not provided"}
              </strong>
            </div>

            <div>
              <span>
                Amount
              </span>
              <strong>
                {formatAmount(
                  transaction.amount
                )}
              </strong>
            </div>

            <div>
              <span>
                Payment Method
              </span>
              <strong>
                {
                  transaction.paymentMethod
                }
              </strong>
            </div>

            <div>
              <span>
                Transaction Date
              </span>
              <strong>
                {formatDate(
                  transaction.transactionDate
                )}
              </strong>
            </div>

            <div>
              <span>
                Reference / Invoice
              </span>
              <strong>
                {transaction.reference ||
                  "Not provided"}
              </strong>
            </div>

            <div>
              <span>
                VAT
              </span>
              <strong>
                {transaction.vatApplicable
                  ? "Applicable"
                  : "Not Applicable"}
              </strong>
            </div>

            <div>
              <span>
                Posting Status
              </span>
              <strong>
                {transaction.postingStatus ||
                  "posted"}
              </strong>
            </div>

          </div>

        </section>

        {/* Accounting */}
        <section className="details-section">

          <h2>
            Accounting Entry
          </h2>

          <p className="details-section-description">
            Debit and credit entries
            created when this transaction
            was posted.
          </p>

          <div className="accounting-table-wrapper">

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

                      <td>
                        {Number(
                          entry.debit
                        ) > 0
                          ? formatAmount(
                              entry.debit
                            )
                          : "—"}
                      </td>

                      <td>
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

        </section>

        {/* Activity */}
        <section className="details-section">

          <h2>Activity Log</h2>

          <div className="details-activity">

            {transaction.originalTranscript && (
              <div className="activity-item">
                <span className="activity-check">
                  ✓
                </span>

                <div>
                  <strong>
                    Captured via Voice
                  </strong>

                  <p>
                    Voice transaction
                    captured and processed
                    by VoiceBooks.
                  </p>
                </div>
              </div>
            )}

            <div className="activity-item">
              <span className="activity-check">
                ✓
              </span>

              <div>
                <strong>
                  Transaction Reviewed
                </strong>

                <p>
                  Transaction information
                  was reviewed before
                  posting.
                </p>
              </div>
            </div>

            <div className="activity-item">
              <span className="activity-check">
                ✓
              </span>

              <div>
                <strong>
                  Transaction Posted
                </strong>

                <p>
                  {formatDateTime(
                    transaction.postedAt ||
                      transaction.confirmedAt
                  )}
                </p>
              </div>
            </div>

            <div className="activity-item">
              <span className="activity-check">
                ✓
              </span>

              <div>
                <strong>
                  Audit Record Created
                </strong>

                <p>
                  The posting activity
                  was recorded for audit
                  purposes.
                </p>
              </div>
            </div>

          </div>

        </section>

        {/* Actions */}
        <div className="details-actions">

          <button
            type="button"
            className="success-secondary-button"
            onClick={() =>
              navigate(
                "/transactions"
              )
            }
          >
            Transaction History
          </button>

          <button
            type="button"
            className="success-primary-button"
            onClick={() =>
              navigate("/")
            }
          >
            New Transaction
          </button>

        </div>

      </section>
    </main>
  );
}

export default TransactionDetails;