
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { accountantApi } from "../../services/accountantApi";

const currencyFormatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

function formatAmount(value) {
  const amount = Number(value);

  return Number.isFinite(amount)
    ? currencyFormatter.format(amount)
    : "Not available";
}

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
    (!isNumericDescription ? description : "") ||
    "Uncategorised Transaction";

  const subtitle =
    description &&
    !isNumericDescription &&
    description.toLowerCase() !== title.toLowerCase()
      ? description
      : null;

  const client =
    transaction.client_name ||
    transaction.business_name ||
    "Client";

  return { title, subtitle, client };
}

function formatStatus(status) {
  const labels = {
    pending_review: "Pending Review",
    approved: "Approved",
    returned: "Returned",
  };

  return labels[status] || "Unknown";
}

export default function AccountantDashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const result = await accountantApi.dashboard();

        if (active) {
          setData(result.data ?? null);
        }
      } catch (err) {
        if (active) {
          setError(
            err.message ||
              "Unable to load accountant dashboard."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="loading" role="status">
        Loading accountant dashboard...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="error-box" role="alert">
        {error || "Dashboard information is unavailable."}
      </div>
    );
  }

  const recentTransactions = Array.isArray(
    data.recentTransactions
  )
    ? data.recentTransactions
    : [];

  return (
    <main className="accountant-dashboard-page">
      <header className="accountant-dashboard-header">
        <div>
          <p className="accountant-eyebrow">
            ACCOUNTANT WORKSPACE
          </p>

          <h1>Accountant Dashboard</h1>

          <p className="accountant-subtitle">
            Review client transactions and approve
            accounting entries.
          </p>
        </div>
      </header>

      <section className="accountant-stats-grid">
        <button
          type="button"
          className="accountant-stat-card"
          onClick={() => navigate("/accountant/clients")}
        >
          <span>Clients</span>
          <strong>{data.clients ?? 0}</strong>
          <small>Businesses assigned to you</small>
        </button>

        <div className="accountant-stat-card accountant-warning">
          <span>Pending Reviews</span>
          <strong>{data.pendingReviews ?? 0}</strong>
          <small>Transactions waiting for review</small>
        </div>

        <button
          type="button"
          className="accountant-stat-card"
          onClick={() => navigate("/accountant/approved")}
        >
          <span>Approved</span>
          <strong>{data.approvedTransactions ?? 0}</strong>
          <small>Approved accounting entries</small>
        </button>
      </section>

      <section className="accountant-content-card">
        <div className="accountant-section-heading">
          <div>
            <h2>Recent Transactions</h2>
            <p>Latest transaction activity</p>
          </div>
        </div>

        <div className="accountant-transaction-list">
          {recentTransactions.length === 0 ? (
            <div className="accountant-empty-state">
              <h3>No transactions yet</h3>
              <p>
                Transactions from your assigned clients
                will appear here.
              </p>
            </div>
          ) : (
            recentTransactions.map((transaction) => {
              const { title, subtitle, client } =
                getTransactionDetails(transaction);

              const isPending =
                transaction.status === "pending_review";

              return (
                <div
                  className="accountant-transaction-row"
                  key={transaction.id}
                >
                  <div className="accountant-transaction-details">
                    <strong>{title}</strong>

                    {subtitle && (
                      <small>{subtitle}</small>
                    )}

                    <small>{client}</small>
                  </div>

                  <strong className="accountant-amount">
                    {formatAmount(transaction.amount)}
                  </strong>

                  <span
                    className={`accountant-status ${
                      transaction.status || ""
                    }`}
                  >
                    {formatStatus(transaction.status)}
                  </span>

                  <button
                    type="button"
                    className="accountant-review-button"
                    onClick={() =>
                      navigate(
                        `/accountant/review/${transaction.id}`
                      )
                    }
                  >
                    {isPending ? "Review" : "View"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
