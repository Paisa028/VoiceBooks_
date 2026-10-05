import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../api/client.js';
import Alert from '../components/Alert.jsx';
import Spinner from '../components/Spinner.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { dashboardSummary } from '../utils/dashboard.js';
import { SAGE_STATUS_LABELS } from '../utils/constants.js';

function Panel({ title, value, note, wide, children }) {
  return (
    <section className={`panel${wide ? ' wide' : ''}`}>
      <h2>{title}</h2>
      {value !== undefined && <p className="figure">{value}</p>}
      {note && <p className="muted">{note}</p>}
      {children}
    </section>
  );
}

function OwnerDashboard({ user }) {
  const [state, setState] = useState({
    loading: true,
    transactions: [],
    error: '',
  });

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    api
      .getTransactions()
      .then((data) => {
        if (active) {
          setState({
            loading: false,
            transactions: data.transactions,
            error: '',
          });
        }
      })
      .catch((error) => {
        if (active) {
          setState({
            loading: false,
            transactions: [],
            error: error.message,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [user.id, attempt]);

  const now = new Date();

  const summary = dashboardSummary(state.transactions, now);

  const currency = user.business?.currency || 'ZAR';

  const money = (amount) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency,
    }).format(amount);

  const date = (value) =>
    new Intl.DateTimeFormat('en-ZA', {
      dateStyle: 'medium',
    }).format(new Date(value));

  const month = new Intl.DateTimeFormat('en-ZA', {
    month: 'long',
    year: 'numeric',
  }).format(now);

  if (state.loading) {
    return (
      <div className="dashboard-page">
        <Spinner large />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading-row">
        <div>
          <h1>Dashboard</h1>

          <p className="dashboard-subtitle">
            {user.business?.name || 'Your Business'} • {date(now)}
          </p>
        </div>

        <Link
          to="/transactions/new"
          className="dashboard-record-button"
        >
          Record Transaction
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
          Retry dashboard
        </button>
      ) : (
        <>
          <div className="dashboard-stat-grid">
            {[
              [
                'Net income',
                money(summary.income - summary.expenses),
              ],
              [
                'Total Income',
                money(summary.income),
              ],
              [
                'Total Expenses',
                money(summary.expenses),
              ],
              [
                'Approved transactions',
                summary.count,
              ],
            ].map(([label, value]) => (
              <section
                className="dashboard-stat-card"
                key={label}
              >
                <div className="dashboard-stat-top">
                  {label}
                </div>

                <strong>{value}</strong>

                <small>
                  {month} • Approved entries
                </small>
              </section>
            ))}
          </div>

          <div className="dashboard-content-grid">
            <section className="dashboard-recent-card">
              <div className="dashboard-card-heading">
                <h2>Recent Transactions</h2>

                <Link to="/transactions">
                  View all
                </Link>
              </div>

              {state.transactions.length === 0 && (
                <p>
                  No transactions yet. Record your first
                  transaction to get started.
                </p>
              )}

              <div className="dashboard-transaction-list">
                {state.transactions
                  .slice(0, 5)
                  .map((transaction) => (
                    <div
                      className="dashboard-transaction"
                      key={transaction.id}
                    >
                      <div className="dashboard-transaction-info">
                        <Link
                          to={
                            '/transactions/' +
                            transaction.id
                          }
                        >
                          {transaction.description}
                        </Link>

                        <span>
                          {date(
                            transaction.transactionDate
                          )}{' '}
                          •{' '}
                          {transaction.accountCategory ||
                            'Uncategorised'}
                        </span>
                      </div>

                      <div className="dashboard-transaction-amount">
                        <strong>
                          {money(transaction.amount)}
                        </strong>

                        <span>
                          {transaction.status.replaceAll(
                            '_',
                            ' '
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            <div className="dashboard-right-column">
              <section className="dashboard-side-card">
                <h2>Income vs Expenses</h2>

                <p>
                  {month} • Approved entries
                </p>

                <dl className="dashboard-totals">
                  <dt>Income</dt>
                  <dd>{money(summary.income)}</dd>

                  <dt>Expenses</dt>
                  <dd>{money(summary.expenses)}</dd>
                </dl>

                <p>
                  {summary.pending} pending review •{' '}
                  {summary.returned} returned
                </p>

                <Link to="/reports">
                  View reports
                </Link>
              </section>

              <section className="dashboard-side-card">
                <h2>Sage Accounting</h2>

                <p>
                  {SAGE_STATUS_LABELS[
                    user.business?.sageStatus
                  ] || 'Not connected'}
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

function AdminDashboard() {
  const [state, setState] = useState({
    loading: true,
    users: [],
    error: '',
  });

  useEffect(() => {
    api
      .adminUsers()
      .then((data) =>
        setState({
          loading: false,
          users: data.users,
          error: '',
        })
      )
      .catch((error) =>
        setState({
          loading: false,
          users: [],
          error: error.message,
        })
      );
  }, []);

  return (
    <div className="panels">
      <Panel wide title="Recent accounts">
        <Alert type="error">
          {state.error}
        </Alert>

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
                {state.users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      {user.first_name}{' '}
                      {user.last_name}
                    </td>

                    <td>{user.email}</td>
                    <td>{user.role}</td>

                    <td>
                      {user.business_name ?? '-'}
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

export default function Dashboard() {
  const { user } = useAuth();

  if (user.role === 'accountant') {
    return <Navigate to="/accountant" replace />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  return <OwnerDashboard user={user} />;
}