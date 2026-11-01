
import { useEffect, useState } from "react";
import {
  auditorApi,
  formatAuditDate,
} from "./auditorApi.js";
import "./AuditorDashboard.css";

export default function AuditorAuditTrail() {
  const [events, setEvents] = useState([]);
  const [period, setPeriod] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    auditorApi.auditTrail(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setEvents(Array.isArray(result) ? result : []);
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

  const visibleEvents = events.filter((event) => {
    if (period === "all") return true;

    const raw = event.timestamp;

    if (!raw) return false;

    const normalized =
      typeof raw === "string" &&
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(raw)
        ? `${raw.replace(" ", "T")}Z`
        : raw;

    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return false;

    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - Number(period));

    return date >= cutoff;
  });

  return (
    <main className="auditor-dashboard">
      <header className="auditor-topbar">
        <div>
          <p className="auditor-eyebrow">AUDITOR WORKSPACE</p>
          <h1>Audit Trail</h1>
          <p>
            Review recorded actions and identify who
            performed accounting operations.
          </p>
        </div>
      </header>

      <div className="auditor-access-notice">
        <span className="auditor-access-icon">✓</span>
        <div>
          <strong>Protected activity history</strong>
          <p>
            Only audit events belonging to your
            authorised businesses are displayed.
          </p>
        </div>
      </div>

      <section className="auditor-metrics">
        <article className="auditor-metric green">
          <span className="auditor-metric-icon">◷</span>
          <div>
            <p>Recorded Events</p>
            <strong>{events.length}</strong>
            <small>Latest authorised audit events</small>
          </div>
        </article>
      </section>

      {error && (
        <p role="alert" style={{ color: "#b42318" }}>
          {error}
        </p>
      )}

      <section className="auditor-panel">
        <div className="auditor-panel-heading">
          <div>
            <h2>Activity History</h2>
            <p>
              Recorded transaction and access changes
            </p>
          </div>

          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            aria-label="Filter audit trail by period"
          >
            <option value="all">All Available</option>
            <option value="3">Last 3 Months</option>
            <option value="6">Last 6 Months</option>
            <option value="12">Last 12 Months</option>
          </select>
        </div>

        {loading ? (
          <p role="status">Loading audit trail...</p>
        ) : visibleEvents.length === 0 ? (
          <div className="auditor-empty">
            <strong>No audit events found</strong>
            <p>
              Recorded activities will appear here when
              transactions are submitted or reviewed.
            </p>
          </div>
        ) : (
          <div className="auditor-table-scroll">
            <table className="auditor-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Business</th>
                  <th>Changed By</th>
                  <th>Action</th>
                  <th>Source</th>
                  <th>Transaction ID</th>
                </tr>
              </thead>

              <tbody>
                {visibleEvents.map((event) => (
                  <tr key={event.id}>
                    <td>{formatAuditDate(event.timestamp)}</td>
                    <td>{event.businessName || "—"}</td>
                    <td>{event.actorName || "Unknown"}</td>
                    <td>
                      <strong>
                        {event.action?.replaceAll("_", " ") || "—"}
                      </strong>
                    </td>
                    <td>{event.source || "—"}</td>
                    <td>{event.transactionId ?? "—"}</td>
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
