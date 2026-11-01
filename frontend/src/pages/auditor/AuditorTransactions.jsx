
import { useEffect, useState } from "react";
import {
  auditorApi,
  formatAuditDate,
  formatAuditMoney,
  formatAuditStatus,
} from "./auditorApi.js";
import "./AuditorDashboard.css";

export default function AuditorTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    auditorApi.transactions(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setTransactions(
            Array.isArray(result) ? result : []
          );
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const visibleTransactions = transactions.filter(
    (transaction) =>
      filter === "all" || transaction.status === filter
  );

  return (
    <main className="auditor-dashboard">
      <header className="auditor-topbar">
        <div>
          <p className="auditor-eyebrow">AUDITOR WORKSPACE</p>
          <h1>Transactions Review</h1>
          <p>
            View financial records and accounting statuses
            from authorised businesses.
          </p>
        </div>
      </header>

      <div className="auditor-access-notice">
        <span className="auditor-access-icon">✓</span>
        <div>
          <strong>Read-only transaction access</strong>
          <p>
            Accountants review and approve entries.
            Auditors can inspect those records but
            cannot modify them.
          </p>
        </div>
      </div>

      <section className="auditor-metrics">
        {[
          {
            label: "Total Transactions",
            value: transactions.length,
            tone: "green",
          },
          {
            label: "Approved",
            value: transactions.filter(
              (item) => item.status === "approved"
            ).length,
            tone: "green",
          },
          {
            label: "Pending Review",
            value: transactions.filter(
              (item) => item.status === "pending_review"
            ).length,
            tone: "yellow",
          },
          {
            label: "Returned",
            value: transactions.filter(
              (item) => item.status === "returned"
            ).length,
            tone: "red",
          },
        ].map((item) => (
          <article
            key={item.label}
            className={`auditor-metric ${item.tone}`}
          >
            <span className="auditor-metric-icon">▤</span>
            <div>
              <p>{item.label}</p>
              <strong>{item.value}</strong>
              <small>Loaded authorised records</small>
            </div>
          </article>
        ))}
      </section>

      {error && (
        <p role="alert" style={{ color: "#b42318" }}>
          {error}
        </p>
      )}

      <section className="auditor-panel">
        <div className="auditor-panel-heading">
          <div>
            <h2>Financial Transactions</h2>
            <p>
              The latest authorised transactions
              returned by VoiceBooks.
            </p>
          </div>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="Filter transactions"
          >
            <option value="all">All Transactions</option>
            <option value="approved">Approved</option>
            <option value="pending_review">Pending Review</option>
            <option value="returned">Returned</option>
          </select>
        </div>

        {loading ? (
          <p role="status">Loading transactions...</p>
        ) : visibleTransactions.length === 0 ? (
          <div className="auditor-empty">
            <strong>No matching transactions</strong>
            <p>
              Transactions will appear here when
              authorised financial records are available.
            </p>
          </div>
        ) : (
          <div className="auditor-table-scroll">
            <table className="auditor-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Business</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {visibleTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      {formatAuditDate(transaction.createdAt)}
                    </td>
                    <td>{transaction.businessName}</td>
                    <td>
                      <strong>
                        {transaction.description || "Transaction"}
                      </strong>
                    </td>
                    <td>{transaction.category || "—"}</td>
                    <td>
                      {formatAuditMoney(transaction.amount)}
                    </td>
                    <td>{formatAuditStatus(transaction.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
