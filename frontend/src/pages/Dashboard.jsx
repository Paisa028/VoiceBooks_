
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "../api/client.js";
import Alert from "../components/Alert.jsx";
import Spinner from "../components/Spinner.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { dashboardSummary } from "../utils/dashboard.js";
import { SAGE_STATUS_LABELS } from "../utils/constants.js";

// Reusable panel
function Panel({ title, value, note, wide, children }) {
  return (
    <section className={`panel${wide ? " wide" : ""}`}>
      <h2>{title}</h2>

      {value !== undefined && (
        <p className="figure">{value}</p>
      )}

      {note && <p className="muted">{note}</p>}

      {children}
    </section>
  );
}

// Business Owner Dashboard
function OwnerDashboard({ user }) {
  const [state, setState] = useState({
    loading: true,
    transactions: [],
    error: "",
  });

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    api
      .getTransactions()
      .then((data) => {
        if (!active) return;

        setState({
          loading: false,
          transactions: Array.isArray(data?.transactions)
            ? data.transactions
            : [],
          error: "",
        });
      })
      .catch((error) => {
        if (!active) return;

        setState({
          loading: false,
          transactions: [],
          error: error.message || "Failed to load transactions.",
        });
      });

    return () => {
      active = false;
    };
  }, [user.id, attempt]);

  const now = new Date();

  const currency = user.business?.currency || "ZAR";

  const money = (amount) => {
    const number = Number(amount);

    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency,
    }).format(Number.isFinite(number) ? number : 0);
  };

  const date = (value) => {
    if (!value) return "Date unavailable";

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return "Date unavailable";
    }

    return new Intl.DateTimeFormat("en-ZA", {
      dateStyle: "medium",
    }).format(parsed);
  };

  const month = new Intl.DateTimeFormat("en-ZA", {
    month: "long",
    year: "numeric",
  }).format(now);

  const summary = dashboardSummary(state.transactions, now);

  // Show descriptive transaction titles rather than IDs
  const getTransactionTitle = (transaction) => {
    const description = String(
      transaction.description || ""
    ).trim();

    const category = String(
      transaction.accountCategory ||
      transaction.category ||
      ""
    ).trim();

    const party = String(
      transaction.party ||
      transaction.customer ||
      transaction.supplier ||
      ""
    ).trim();

    // Numeric descriptions are usually not helpful as titles
    if (
      description &&
      !/^[\d\s.,]+$/.test(description)
    ) {
      return description;
    }

    if (category) {
      return category;
    }

    if (party) {
      return `Transaction with ${party}`;
    }

    if (transaction.type === "income") {
      return "Income Transaction";
    }

    if (transaction.type === "expense") {
      return "Expense Transaction";
    }

    return "Transaction";
  };

  const getTransactionCategory = (transaction) =>
    transaction.accountCategory ||
    transaction.category ||
    (transaction.type === "income"
      ? "Income"
      : transaction.type === "expense"
        ? "Expense"
        : "Uncategorised");

  const formatStatus = (status) => {
    if (!status) return "Unknown";

    return String(status)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const recentTransactions = [...state.transactions]
    .sort((a, b) => {
      const aDate = new Date(
        a.transactionDate || a.createdAt || 0
      ).getTime();

      const bDate = new Date(
        b.transactionDate || b.createdAt || 0
      ).getTime();

      return (Number.isFinite(bDate) ? bDate : 0) -
        (Number.isFinite(aDate) ? aDate : 0);
    })
    .slice(0, 5);

  if (state.loading) {
    return (
      <div className="dashboard-page">
        <Spinner large />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Dashboard Header */}
      <div className="dashboard-heading-row">
        <div>
          <p className="dashboard-eyebrow">
            BUSINESS OVERVIEW
          </p>

          <h1>Dashboard</h1>

          <p className="dashboard-subtitle">
            {user.business?.name || "Your Business"}
            {" · "}
            {date(now)}
          </p>
        </div>

        <Link
          to="/transactions/new"
          className="dashboard-record-button"
        >
          + Record Transaction
        </Link>
      </div>

      <Alert type="error">{state.error}</Alert>

      {state.error ? (
        <button
          type="button"
          onClick={() => {
            setState((previous) => ({
              ...previous,
              loading: true,
            }));

            setAttempt((value) => value + 1);
          }}
        >
          Retry Dashboard
        </button>
      ) : (
        <>
          {/* Financial Summary */}
          <div className="dashboard-stat-grid">
            {[
              {
                label: "Net Income",
                value: money(summary.income - summary.expenses),
                symbol: "↗",
              },
              {
                label: "Total Income",
                value: money(summary.income),
                symbol: "+",
              },
              {
                label: "Total Expenses",
                value: money(summary.expenses),
                symbol: "−",
              },
              {
                label: "Approved Transactions",
                value: summary.count,
                symbol: "✓",
              },
            ].map((item) => (
              <section
                className="dashboard-stat-card"
                key={item.label}
              >
                <div className="dashboard-stat-header">
                  <span className="dashboard-stat-top">
                    {item.label}
                  </span>

                  <span
                    className="dashboard-stat-icon"
                    aria-hidden="true"
                  >
                    {item.symbol}
                  </span>
                </div>

                <strong>{item.value}</strong>

                <small>
                  {month} · Approved entries
                </small>
              </section>
            ))}
          </div>

          {/* Dashboard Content */}
          <div className="dashboard-content-grid">
            {/* Recent Transactions */}
            <section className="dashboard-recent-card">
              <div className="dashboard-card-heading">
                <div>
                  <h2>Recent Transactions</h2>
                  <p>
                    Your latest recorded business activity
                  </p>
                </div>

                <Link to="/transactions">
                  View all
                </Link>
              </div>

              {recentTransactions.length === 0 ? (
                <div className="dashboard-empty-state">
                  <span aria-hidden="true">↗</span>

                  <h3>No transactions yet</h3>

                  <p>
                    Record your first transaction to
                    start tracking your business finances.
                  </p>

                  <Link to="/transactions/new">
                    Record Transaction
                  </Link>
                </div>
              ) : (
                <div className="dashboard-transaction-list">
                  {recentTransactions.map((transaction) => (
                    <div
                      className="dashboard-transaction"
                      key={transaction.id}
                    >
                      <div className="dashboard-transaction-info">
                        <Link
                          to={`/transactions/${transaction.id}`}
                        >
                          {getTransactionTitle(transaction)}
                        </Link>

                        <span>
                          {date(
                            transaction.transactionDate ||
                            transaction.createdAt
                          )}
                          {" · "}
                          {getTransactionCategory(transaction)}
                        </span>
                      </div>

                      <div className="dashboard-transaction-amount">
                        <strong>
                          {money(transaction.amount)}
                        </strong>

                        <span
                          className={`dashboard-status dashboard-status-${String(
                            transaction.status || "unknown"
                          ).replace(/[^a-z0-9_-]/gi, "")}`}
                        >
                          {formatStatus(transaction.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Right Column */}
            <div className="dashboard-right-column">
              <section className="dashboard-side-card">
                <h2>Income vs Expenses</h2>

                <p>{month} · Approved entries</p>

                <dl className="dashboard-totals">
                  <dt>Income</dt>
                  <dd>{money(summary.income)}</dd>

                  <dt>Expenses</dt>
                  <dd>{money(summary.expenses)}</dd>
                </dl>

                <p className="dashboard-review-count">
                  {summary.pending} pending review
                  {" · "}
                  {summary.returned} returned
                </p>

                <Link to="/reports">
                  View Reports
                </Link>
              </section>

              <section className="dashboard-side-card">
                <div className="dashboard-integration-header">
                  <h2>Sage Accounting</h2>

                  <span className="dashboard-integration-dot" />
                </div>

                <p>
                  {SAGE_STATUS_LABELS[
                    user.business?.sageStatus
                  ] || "Not connected"}
                </p>

                <p>
                  Synchronization is not available yet.
                </p>

                <Link
                  to="/integrations"
                  className="dashboard-manage-button"
                >
                  Manage Integration
                </Link>
              </section>

              <section className="dashboard-side-card">
                <h2>Quick Actions</h2>

                <div className="dashboard-quick-actions">
                  <Link to="/transactions/manual">
                    Manual Entry
                  </Link>

                  <Link to="/ledger">
                    View Ledger
                  </Link>

                  <Link to="/reports">
                    View Reports
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Administrator Dashboard
function AdminDashboard() {
  const [state, setState] = useState({
    loading: true,
    users: [],
    error: "",
  });

  useEffect(() => {
    let active = true;

    api
      .adminUsers()
      .then((data) => {
        if (!active) return;

        setState({
          loading: false,
          users: Array.isArray(data?.users)
            ? data.users
            : [],
          error: "",
        });
      })
      .catch((error) => {
        if (!active) return;

        setState({
          loading: false,
          users: [],
          error: error.message || "Failed to load users.",
        });
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="panels">
      <Panel wide title="Recent Accounts">
        <Alert type="error">{state.error}</Alert>

        {state.loading ? (
          <Spinner />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Business</th>
                </tr>
              </thead>

              <tbody>
                {state.users.map((account) => (
                  <tr key={account.id}>
                    <td>
                      {account.first_name}{" "}
                      {account.last_name}
                    </td>

                    <td>{account.email}</td>
                    <td>{account.role}</td>

                    <td>
                      {account.business_name ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

// Dashboard Router
export default function Dashboard() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "accountant") {
    return <Navigate to="/accountant" replace />;
  }

  if (user.role === "admin") {
    return <AdminDashboard />;
  }

  return <OwnerDashboard user={user} />;
}
