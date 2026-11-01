
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { auditorApi, formatAuditDate } from "./auditorApi.js";
import "./AuditorDashboard.css";

export default function AuditorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [period, setPeriod] = useState("6");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setError("");

        const [stats, businessData, events] = await Promise.all([
          auditorApi.dashboard(controller.signal),
          auditorApi.businesses(controller.signal),
          auditorApi.auditTrail(controller.signal),
        ]);

        if (controller.signal.aborted) return;

        setDashboard(stats);
        setBusinesses(Array.isArray(businessData) ? businessData : []);
        setAuditTrail(Array.isArray(events) ? events : []);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message || "Unable to load audit overview.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => controller.abort();
  }, []);

  const displayName =
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Auditor";

  const metrics = [
    {
      label: "Assigned Businesses",
      value: businesses.length,
      icon: "▣",
      tone: "green",
      description: "Businesses granting you access",
      path: "/auditor/businesses",
    },
    {
      label: "Total Transactions",
      value: dashboard?.totalTransactions ?? 0,
      icon: "▤",
      tone: "green",
      description: "Authorised financial records",
      path: "/auditor/transactions",
    },
    {
      label: "Pending Review",
      value: dashboard?.pendingTransactions ?? 0,
      icon: "⚠",
      tone: "yellow",
      description: "Awaiting Accountant review",
      path: "/auditor/transactions",
    },
    {
      label: "Returned Transactions",
      value: dashboard?.returnedTransactions ?? 0,
      icon: "↩",
      tone: "red",
      description: "Returned for correction",
      path: "/auditor/transactions",
    },
  ];

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - Number(period));

  const recentEvents = auditTrail.filter((event) => {
    if (!event.timestamp) return false;

    const timestamp =
      typeof event.timestamp === "string" &&
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(event.timestamp)
        ? `${event.timestamp.replace(" ", "T")}Z`
        : event.timestamp;

    const date = new Date(timestamp);

    return !Number.isNaN(date.getTime()) && date >= cutoff;
  });

  const workspaceLinks = [
    {
      icon: "▣",
      title: "Assigned Businesses",
      description: "View companies that have granted you access.",
      path: "/auditor/businesses",
    },
    {
      icon: "▤",
      title: "Transactions Review",
      description: "Inspect financial records and their statuses.",
      path: "/auditor/transactions",
    },
    {
      icon: "◷",
      title: "Audit Trail",
      description: "Review recorded actions and accounting history.",
      path: "/auditor/audit-trail",
    },
  ];

  return (
    <main className="auditor-dashboard">
      <header className="auditor-topbar">
        <div>
          <p className="auditor-eyebrow">
            VOICEBOOKS / AUDITOR WORKSPACE
          </p>

          <h1>Audit Overview</h1>

          <p>
            Review financial activity from businesses that have
            authorised your access.
          </p>
        </div>

        <div className="auditor-identity">
          <div className="auditor-avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{displayName}</strong>
            <span>Auditor</span>
          </div>
        </div>
      </header>

      <div className="auditor-access-notice">
        <span className="auditor-access-icon" aria-hidden="true">
          ✓
        </span>

        <div>
          <strong>Read-only financial access</strong>
          <p>
            You can review authorised records, but cannot
            create, approve, edit or delete transactions.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: 16,
            marginBottom: 18,
            color: "#a62d2d",
            background: "#fff0ed",
            borderRadius: 10,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="auditor-panel" role="status">
          Loading audit overview...
        </div>
      ) : (
        <>
          <section
            className="auditor-metrics"
            aria-label="Audit overview statistics"
          >
            {metrics.map((metric) => (
              <button
                key={metric.label}
                type="button"
                className={`auditor-metric ${metric.tone}`}
                onClick={() => navigate(metric.path)}
                style={{
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                }}
                aria-label={`View ${metric.label}`}
              >
                <span
                  className="auditor-metric-icon"
                  aria-hidden="true"
                >
                  {metric.icon}
                </span>

                <div>
                  <p>{metric.label}</p>
                  <strong>{metric.value}</strong>
                  <small>{metric.description}</small>
                </div>
              </button>
            ))}
          </section>

          <div className="auditor-main-grid">
            <section className="auditor-panel">
              <div className="auditor-panel-heading">
                <div>
                  <h2>Recent Audit Activity</h2>
                  <p>
                    Recorded actions from authorised businesses
                  </p>
                </div>

                <select
                  value={period}
                  onChange={(event) => setPeriod(event.target.value)}
                  aria-label="Activity period"
                >
                  <option value="3">Last 3 Months</option>
                  <option value="6">Last 6 Months</option>
                  <option value="12">Last 12 Months</option>
                </select>
              </div>

              {recentEvents.length === 0 ? (
                <div className="auditor-empty">
                  <strong>No audit activity for this period</strong>
                  <p>
                    Recorded activity will appear here.
                  </p>
                </div>
              ) : (
                <div className="auditor-table-scroll">
                  <table className="auditor-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Business</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentEvents.slice(0, 10).map((event) => (
                        <tr key={event.id}>
                          <td>
                            {formatAuditDate(event.timestamp)}
                          </td>
                          <td>{event.businessName || "—"}</td>
                          <td>
                            {event.action?.replaceAll("_", " ") ||
                              "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="auditor-panel">
              <div className="auditor-panel-heading">
                <div>
                  <h2>Transaction Summary</h2>
                  <p>
                    Status of authorised accounting records
                  </p>
                </div>
              </div>

              <div className="auditor-risk-list">
                {[
                  [
                    "Approved",
                    dashboard?.approvedTransactions ?? 0,
                    "low",
                  ],
                  [
                    "Pending Review",
                    dashboard?.pendingTransactions ?? 0,
                    "medium",
                  ],
                  [
                    "Returned",
                    dashboard?.returnedTransactions ?? 0,
                    "high",
                  ],
                ].map(([label, count, tone]) => (
                  <div
                    className="auditor-risk-row"
                    key={label}
                  >
                    <span>{label}</span>

                    <div className="auditor-risk-track">
                      <div
                        className={`auditor-risk-fill ${tone}`}
                        style={{
                          width: `${
                            dashboard?.totalTransactions
                              ? Math.min(
                                  100,
                                  (count /
                                    dashboard.totalTransactions) *
                                    100
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>

                    <span>{count}</span>
                  </div>
                ))}
              </div>

              <p className="auditor-muted">
                These numbers represent transaction statuses,
                not financial risk classifications.
              </p>
            </section>
          </div>

          <section className="auditor-workspace-section">
            <div className="auditor-workspace-heading">
              <h2>Explore Your Workspace</h2>
              <p>
                Quick access to your authorised financial records
              </p>
            </div>

            <div className="auditor-workspace-grid">
              {workspaceLinks.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  className="auditor-workspace-card"
                  onClick={() => navigate(item.path)}
                >
                  <span
                    className="auditor-workspace-icon"
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>

                  <span className="auditor-workspace-content">
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </span>

                  <span
                    className="auditor-workspace-arrow"
                    aria-hidden="true"
                  >
                    ↗
                  </span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
