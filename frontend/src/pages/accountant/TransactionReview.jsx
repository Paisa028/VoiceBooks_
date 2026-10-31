
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { accountantApi } from "../../services/accountantApi";

export default function TransactionReview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  // Format money in South African Rand
  const formatAmount = (value) => {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
      return "Not available";
    }

    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  const displayValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return "Not provided";
    }

    return String(value);
  };

  // Load transaction from the backend
  useEffect(() => {
    let active = true;

    const loadTransaction = async () => {
      if (!id) {
        setError("Transaction ID is missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      
try {
  const result = await accountantApi.transactionReview(id);

  if (active) {
    const responseData = result.data ?? result;

    const transactionData =
      responseData?.transaction ?? responseData;

    setTransaction(transactionData ?? null);
  }
} catch (err) {
  if (active) {
    setError(
      err.message || "Failed to load transaction."
    );
  }
} finally {
  if (active) {
    setLoading(false);
  }
}
};

    loadTransaction();

    return () => {
      active = false;
    };
  }, [id]);

  const status = transaction?.status || "unknown";

  const isPending = status === "pending_review";

  const amount = Number(transaction?.amount);

  const validAmount =
    Number.isFinite(amount) && amount > 0;

  // Read the original transcription safely
  const originalTranscription =
    transaction?.original_transcription ||
    transaction?.originalTranscript ||
    transaction?.transcript ||
    "";

  // Use only accounting entries returned by the backend
  const rawJournalEntries =
    transaction?.journalEntries ||
    transaction?.journal_entries ||
    [];

  const journalEntries = Array.isArray(rawJournalEntries)
    ? rawJournalEntries
    : [];

  const totalDebit = journalEntries.reduce(
    (total, entry) => total + Number(entry.debit || 0),
    0
  );

  const totalCredit = journalEntries.reduce(
    (total, entry) => total + Number(entry.credit || 0),
    0
  );

  const isBalanced =
    journalEntries.length >= 2 &&
    totalDebit > 0 &&
    totalCredit > 0 &&
    Math.abs(totalDebit - totalCredit) < 0.005;

  const hasValidAccounts = journalEntries.every(
    (entry) =>
      entry.account &&
      entry.account !== "Unclassified"
  );

  const canApprove =
    isPending &&
    validAmount &&
    isBalanced &&
    hasValidAccounts;

  // Approve the transaction
  const approve = async () => {
    if (!canApprove || processing) {
      setError(
        "This transaction cannot be approved until its accounting entry is valid."
      );
      return;
    }

    try {
      setProcessing(true);
      setError("");

      await accountantApi.approve(id);

      navigate("/accountant/approved");
    } catch (err) {
      setError(
        err.message || "Unable to approve transaction."
      );
    } finally {
      setProcessing(false);
    }
  };

  // Return the transaction to the client
  const reject = async () => {
    if (processing || !isPending) return;

    if (reason.trim().length < 5) {
      setError("Please provide a clear reason.");
      return;
    }

    try {
      setProcessing(true);
      setError("");

      await accountantApi.reject(id, reason.trim());

      navigate("/accountant/returned");
    } catch (err) {
      setError(
        err.message || "Unable to return transaction."
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="loading" role="status">
        Loading transaction...
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="error-box" role="alert">
        {error || "Transaction not found."}
      </div>
    );
  }

  return (
    <main className="accountant-page">
      <header className="page-header">
        <p className="eyebrow">TRANSACTION REVIEW</p>

        <h1>Review Transaction</h1>

        <p>
          Verify the transaction before approving
          or returning it to the client.
        </p>
      </header>

      {error && (
        <div className="error-box" role="alert">
          {error}
        </div>
      )}

      {/* Original transcription and client */}
      <section className="review-grid">
        <div className="content-card">
          <h2>Original Transcription</h2>

          <div className="transcription-box">
            {originalTranscription ||
              "No voice transcription available. This may be a manually entered transaction."}
          </div>
        </div>

        <div className="content-card">
          <h2>Client</h2>

          <div className="detail-list">
            <div>
              <span>Name</span>
              <strong>
                {displayValue(transaction.client_name)}
              </strong>
            </div>

            <div>
              <span>Business</span>
              <strong>
                {displayValue(transaction.business_name)}
              </strong>
            </div>

            <div>
              <span>Email</span>
              <strong>
                {displayValue(transaction.client_email)}
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* Transaction details */}
      <section className="content-card">
        <div className="section-heading">
          <div>
            <h2>Extracted Transaction</h2>

            <p>
              Information extracted from the
              client's transaction.
            </p>
          </div>

          <span className={`status ${status}`}>
            {status.replaceAll("_", " ")}
          </span>
        </div>

        <div className="details-grid">
          <div>
            <label>Description</label>
            <strong>
              {displayValue(transaction.description)}
            </strong>
          </div>

          <div>
            <label>Customer / Supplier</label>
            <strong>
              {displayValue(
                transaction.party ||
                transaction.supplier
              )}
            </strong>
          </div>

          <div>
            <label>Transaction Type</label>
            <strong>
              {displayValue(transaction.type)}
            </strong>
          </div>

          <div>
            <label>Amount</label>
            <strong>{formatAmount(transaction.amount)}</strong>
          </div>

          <div>
            <label>Account Category</label>
            <strong>
              {displayValue(
                transaction.accountCategory ||
                transaction.category
              )}
            </strong>
          </div>

          <div>
            <label>Payment Method</label>
            <strong>
              {displayValue(
                transaction.paymentMethod ||
                transaction.payment_method
              )}
            </strong>
          </div>

          <div>
            <label>Reference</label>
            <strong>
              {displayValue(transaction.reference)}
            </strong>
          </div>

          <div>
            <label>Transaction Date</label>
            <strong>
              {displayValue(
                transaction.transactionDate ||
                transaction.transaction_date
              )}
            </strong>
          </div>
        </div>
      </section>

      {/* Accounting entry */}
      <section className="content-card">
        <h2>Accounting Entry</h2>

        <p>
          Review the debit and credit entries
          generated for this transaction.
        </p>

        {journalEntries.length > 0 ? (
          <>
            <div style={{ overflowX: "auto" }}>
              <table className="accounting-table">
                <thead>
                  <tr>
                    <th scope="col">Account</th>
                    <th scope="col">Debit</th>
                    <th scope="col">Credit</th>
                  </tr>
                </thead>

                <tbody>
                  {journalEntries.map((entry, index) => (
                    <tr key={`${entry.account}-${index}`}>
                      <td>
                        {displayValue(entry.account)}
                      </td>

                      <td>
                        {Number(entry.debit) > 0
                          ? formatAmount(entry.debit)
                          : "—"}
                      </td>

                      <td>
                        {Number(entry.credit) > 0
                          ? formatAmount(entry.credit)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr>
                    <th scope="row">Total</th>

                    <td>{formatAmount(totalDebit)}</td>

                    <td>{formatAmount(totalCredit)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <p
              className="journal-balance-note"
              role="status"
            >
              {isBalanced && hasValidAccounts
                ? "Balanced accounting entry"
                : "Accounting entry requires review."}
            </p>
          </>
        ) : (
          <div className="error-box" role="alert">
            No accounting journal entries were returned
            by the backend. This transaction cannot
            be approved until the entries are available.
          </div>
        )}
      </section>

      {/* Approval and return actions */}
      {!showReject ? (
        <div className="action-bar">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setError("");
              setShowReject(true);
            }}
            disabled={processing || !isPending}
          >
            Return Transaction
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={approve}
            disabled={processing || !canApprove}
          >
            {processing
              ? "Approving..."
              : "Approve Transaction"}
          </button>
        </div>
      ) : (
        <section className="content-card rejection-card">
          <h2>Return Transaction</h2>

          <p>
            Explain what needs to be corrected
            before the client can resubmit.
          </p>

          <textarea
            value={reason}
            onChange={(event) =>
              setReason(event.target.value)
            }
            placeholder="Enter rejection reason..."
            aria-label="Reason for returning transaction"
            rows={5}
          />

          <div className="action-bar">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setError("");
                setShowReject(false);
              }}
              disabled={processing}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn-danger"
              onClick={reject}
              disabled={processing || !isPending}
            >
              {processing
                ? "Returning..."
                : "Return to Client"}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
