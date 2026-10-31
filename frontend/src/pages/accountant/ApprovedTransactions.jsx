
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { accountantApi } from "../../services/accountantApi";

const formatCurrency = (value) => {
  const amount = Number(value);

  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(Number.isFinite(amount) ? amount : 0);
};

function getTransactionDetails(transaction) {
  const category = String(
    transaction.accountCategory ||
    transaction.category ||
    ""
  ).trim();

  const description = String(
    transaction.description || ""
  ).trim();

  const isNumericDescription =
    description !== "" &&
    /^\d+(?:[.,]\d+)?$/.test(description);

  const title =
    category ||
    (!isNumericDescription
      ? description
      : "") ||
    "Uncategorised Transaction";

  const subtitle =
    description &&
    !isNumericDescription &&
    description.toLowerCase() !== title.toLowerCase()
      ? description
      : null;

  return { title, subtitle };
}

export default function ApprovedTransactions() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadApproved() {
      try {
        setLoading(true);
        setError("");

        const result = await accountantApi.approved();

        const data = result.data ?? [];

        if (active) {
          setTransactions(
            Array.isArray(data) ? data : []
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err.message ||
            "Unable to load approved transactions."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadApproved();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="loading" role="status">
        Loading approved transactions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-box" role="alert">
        {error}
      </div>
    );
  }

  return (
    <main className="accountant-approved-page">
      <header className="accountant-approved-header">
        <div>
          <p className="accountant-approved-eyebrow">
            ACCOUNTING RECORDS
          </p>

          <h1>Approved Transactions</h1>

          <p className="accountant-approved-subtitle">
            Transactions approved by the accounting
            professional.
          </p>
        </div>
      </header>

      <section className="accountant-approved-card">
        <div className="accountant-approved-card-header">
          <div>
            <h2>Approved Entries</h2>

            <p>
              Review transactions that have successfully
              completed the approval process.
            </p>
          </div>

          <div className="accountant-approved-count">
            {transactions.length}{" "}
            {transactions.length === 1
              ? "transaction"
              : "transactions"}
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="accountant-approved-empty">
            <div className="accountant-approved-empty-icon">
              ✓
            </div>

            <h3>No approved transactions yet</h3>

            <p>
              Transactions you approve will appear here
              for future reference.
            </p>
          </div>
        ) : (
          <div className="accountant-approved-list">
            {transactions.map((transaction) => {
              const { title, subtitle } =
                getTransactionDetails(transaction);

              return (
                <div
                  className="accountant-approved-row"
                  key={transaction.id}
                >
                  <div className="accountant-approved-details">
                    <strong>{title}</strong>

                    {subtitle && (
                      <small>{subtitle}</small>
                    )}

                    <small>
                      {transaction.client_name ||
                        "Client"}
                      {transaction.business_name
                        ? ` · ${transaction.business_name}`
                        : ""}
                    </small>
                  </div>

                  <strong className="accountant-approved-amount">
                    {formatCurrency(transaction.amount)}
                  </strong>

                  <span className="accountant-approved-status">
                    ✓ Approved
                  </span>

                  <button
                    type="button"
                    className="accountant-approved-view"
                    onClick={() =>
                      navigate(
                        `/accountant/review/${transaction.id}`
                      )
                    }
                    aria-label={`View transaction ${title}`}
                  >
                    View
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
