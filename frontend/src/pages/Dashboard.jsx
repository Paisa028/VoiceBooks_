import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import Alert from '../components/Alert.jsx';
import Spinner from '../components/Spinner.jsx';
import { useAuth } from '../hooks/useAuth.js';

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

function getCurrency(user) {
  return user?.business?.currency || 'ZAR';
}

function OwnerDashboard({ user }) {
  const currency = getCurrency(user);

  const recentTransactions = [
    {
      id: 1,
      direction: 'expense',
      description: 'Office National — Stationery',
      date: '12 Aug 2026',
      category: 'Stationery',
      amount: 'R 250.00',
    },
    {
      id: 2,
      direction: 'income',
      description: 'Bread & Pastry Sales — Daily',
      date: '11 Aug 2026',
      category: 'Sales Revenue',
      amount: '+R 3 850.00',
    },
    {
      id: 3,
      direction: 'expense',
      description: 'Cape Town Flour Mills — Flour',
      date: '11 Aug 2026',
      category: 'Cost of Sales',
      amount: 'R 1 200.00',
    },
    {
      id: 4,
      direction: 'income',
      description: 'Catering Order — Woolworths',
      date: '10 Aug 2026',
      category: 'Sales Revenue',
      amount: '+R 8 500.00',
    },
    {
      id: 5,
      direction: 'expense',
      description: 'Eskom — Electricity',
      date: '10 Aug 2026',
      category: 'Utilities',
      amount: 'R 1 850.00',
    },
  ];

  return (
    <div className="dashboard-page">

      <div className="dashboard-heading-row">
        <div>
          <h1>Dashboard</h1>

          <p className="dashboard-subtitle">
            {user?.business?.name || 'Your Business'} · Monday, 5 October 2026
          </p>
        </div>

        <Link
          to="/transactions/new"
          className="dashboard-record-button"
        >
          <span>◉</span>
          Record Transaction
        </Link>
      </div>

      <div className="dashboard-stat-grid">

        <section className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <span>Current Balance</span>
            <span className="dashboard-change positive">+12.4%</span>
          </div>

          <strong>{currency} 38,450.00</strong>
          <small>Aug 2026</small>
        </section>

        <section className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <span>Total Income</span>
            <span className="dashboard-change positive">+8.1%</span>
          </div>

          <strong>{currency} 19,350.00</strong>
          <small>This month</small>
        </section>

        <section className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <span>Total Expenses</span>
            <span className="dashboard-change negative">-2.3%</span>
          </div>

          <strong>{currency} 3,940.00</strong>
          <small>This month</small>
        </section>

        <section className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <span>Transactions</span>
            <span className="dashboard-change positive">+3</span>
          </div>

          <strong>8</strong>
          <small>This month</small>
        </section>

      </div>

      <div className="dashboard-content-grid">

        <section className="dashboard-recent-card">

          <div className="dashboard-card-heading">
            <h2>Recent Transactions</h2>

            <Link to="/transactions">
              View all
            </Link>
          </div>

          <div className="dashboard-transaction-list">

            {recentTransactions.map((transaction) => (
              <div
                className="dashboard-transaction"
                key={transaction.id}
              >

                <div
                  className={`dashboard-transaction-icon ${
                    transaction.direction === 'income'
                      ? 'income'
                      : 'expense'
                  }`}
                >
                  {transaction.direction === 'income' ? '↑' : '↓'}
                </div>

                <div className="dashboard-transaction-info">
                  <strong>{transaction.description}</strong>

                  <span>
                    {transaction.date} · {transaction.category}
                  </span>
                </div>

                <div className="dashboard-transaction-amount">
                  <strong
                    className={
                      transaction.direction === 'income'
                        ? 'income-text'
                        : ''
                    }
                  >
                    {transaction.amount}
                  </strong>

                  <span>✓ Sage Synced</span>
                </div>

              </div>
            ))}

          </div>

          <Link
            to="/transactions"
            className="dashboard-all-transactions"
          >
            View all transactions →
          </Link>

        </section>

        <div className="dashboard-right-column">

          <section className="dashboard-side-card">

            <div className="dashboard-card-heading">
              <h2>Income vs Expenses</h2>
              <span>Aug 2026</span>
            </div>

            <div className="dashboard-chart-legend">
              <span>
                <i className="income-dot" />
                Income
              </span>

              <span>
                <i className="expense-dot" />
                Expenses
              </span>
            </div>

            <div className="dashboard-chart-placeholder">
              <div className="dashboard-chart-bars">
                <span style={{ height: '38%' }} />
                <span style={{ height: '55%' }} />
                <span style={{ height: '47%' }} />
                <span style={{ height: '70%' }} />
              </div>

              <div className="dashboard-chart-labels">
                <span>W1</span>
                <span>W2</span>
                <span>W3</span>
                <span>W4</span>
              </div>
            </div>

          </section>

          <section className="dashboard-side-card">

            <div className="dashboard-card-heading">
              <h2>Sage Sync</h2>

              <span className="dashboard-connected">
                ● Connected
              </span>
            </div>

            <div className="dashboard-sage-row">
              <span>Company</span>
              <strong>{user?.business?.name || 'Your Business'}</strong>
            </div>

            <div className="dashboard-sage-row">
              <span>Last Sync</span>
              <strong>12 Aug, 14:35</strong>
            </div>

            <div className="dashboard-sage-row">
              <span>Records Synced</span>
              <strong>7 / 8</strong>
            </div>

            <Link
              to="/integrations"
              className="dashboard-manage-button"
            >
              Manage Integration
            </Link>

          </section>

          <section className="dashboard-side-card">

            <div className="dashboard-card-heading">
              <h2>Quick Actions</h2>
            </div>

            <div className="dashboard-quick-actions">

              <Link to="/transactions/manual">
                <span>✎</span>
                Manual Entry
              </Link>

              <Link to="/ledger">
                <span>☷</span>
                View Ledger
              </Link>

              <Link to="/reports">
                <span>↗</span>
                Generate Report
              </Link>

            </div>

          </section>

        </div>

      </div>

    </div>
  );
}

function AccountantDashboard() {
  return (
    <div className="panels">
      <Panel
        title="Clients"
        value="0"
        note="Clients you manage will appear here."
      />

      <Panel
        title="Reviews waiting"
        value="0"
        note="Entries that need your sign-off."
      />

      <Panel
        title="Reports due"
        value="0"
        note="Upcoming VAT and year-end deadlines."
      />
    </div>
  );
}

function BookkeeperDashboard() {
  return (
    <div className="panels">
      <Panel
        title="Entries to capture"
        value="0"
        note="Transactions waiting to be recorded."
      />

      <Panel
        title="To categorise"
        value="0"
        note="Entries missing an account."
      />

      <Panel
        title="Bank lines to match"
        value="0"
        note="Statement lines without a matching entry."
      />
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
    api.adminUsers()
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
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.business ?? '-'}</td>
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

const DASHBOARDS = {
  business_owner: {
    View: OwnerDashboard,
  },

  accountant: {
    View: AccountantDashboard,
  },

  bookkeeper: {
    View: BookkeeperDashboard,
  },

  admin: {
    View: AdminDashboard,
  },
};

export default function Dashboard() {
  const { user } = useAuth();

  const role = user?.role || 'business_owner';

  const { View } =
    DASHBOARDS[role] ||
    DASHBOARDS.business_owner;

  return <View user={user} />;
}