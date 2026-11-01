
import { useCallback, useEffect, useState } from "react";
import { auditorApi } from "./auditorApi.js";
import "./AuditorDashboard.css";

export default function AuditorBusinesses() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadBusinesses = useCallback(async (signal) => {
    const result = await auditorApi.businesses(signal);

    if (signal?.aborted) return;

    setBusinesses(Array.isArray(result) ? result : []);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setError("");
        await loadBusinesses(controller.signal);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message || "Unable to load businesses.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => controller.abort();
  }, [loadBusinesses]);

  async function handleRefresh() {
    if (refreshing || loading) return;

    setRefreshing(true);
    setError("");

    try {
      await loadBusinesses();
    } catch (err) {
      setError(err.message || "Unable to refresh businesses.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <main className="auditor-dashboard">
      <header className="auditor-topbar">
        <div>
          <p className="auditor-eyebrow">
            VOICEBOOKS / AUDITOR WORKSPACE
          </p>

          <h1>Assigned Businesses</h1>

          <p>
            View businesses that have granted you permission
            to review their financial records.
          </p>
        </div>
      </header>

      <div className="auditor-access-notice">
        <span
          className="auditor-access-icon"
          aria-hidden="true"
        >
          ✓
        </span>

        <div>
          <strong>Your Business Access</strong>
          <p>
            You can view financial records from businesses
            that have granted you permission.
          </p>
        </div>
      </div>

      <section
        className="auditor-metrics"
        aria-label="Assigned business statistics"
      >
        <article className="auditor-metric green">
          <span
            className="auditor-metric-icon"
            aria-hidden="true"
          >
            ▣
          </span>

          <div>
            <p>Assigned Businesses</p>
            <strong>{businesses.length}</strong>
            <small>Currently authorised companies</small>
          </div>
        </article>
      </section>

      {error && (
        <div
          role="alert"
          style={{
            padding: 14,
            marginBottom: 18,
            background: "#fff0ed",
            border: "1px solid #f5c8c4",
            borderRadius: 10,
            color: "#b42318",
          }}
        >
          {error}
        </div>
      )}

      <section className="auditor-panel">
        <div className="auditor-panel-heading">
          <div>
            <h2>Business Directory</h2>
            <p>
              Businesses you are authorised to review
            </p>
          </div>

          <button
            type="button"
            className="auditor-refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            aria-label="Refresh assigned businesses"
          >
            <svg
              className={`auditor-refresh-icon ${
                refreshing ? "spinning" : ""
              }`}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 11a8 8 0 0 0-14.5-4.5L3 9" />
              <path d="M3 4v5h5" />
              <path d="M4 13a8 8 0 0 0 14.5 4.5L21 15" />
              <path d="M16 15h5v5" />
            </svg>

            <span>
              {refreshing ? "Refreshing..." : "Refresh"}
            </span>
          </button>
        </div>

        {loading ? (
          <div
            className="auditor-empty"
            role="status"
          >
            <strong>Loading businesses...</strong>
            <p>
              Getting your currently authorised businesses.
            </p>
          </div>
        ) : businesses.length === 0 ? (
          <div className="auditor-empty">
            <strong>No assigned businesses</strong>
            <p>
              You do not currently have access to any
              businesses. A Business Owner can grant
              permission through Manage Access.
            </p>
          </div>
        ) : (
          <div className="auditor-table-scroll">
            <table className="auditor-table">
              <thead>
                <tr>
                  <th>Business Name</th>
                  <th>Country</th>
                  <th>Currency</th>
                  <th>Sage Status</th>
                  <th>Access</th>
                </tr>
              </thead>

              <tbody>
                {businesses.map((business) => (
                  <tr key={business.id}>
                    <td>
                      <strong>
                        {business.businessName || "Unnamed Business"}
                      </strong>
                    </td>

                    <td>{business.country || "—"}</td>

                    <td>{business.currency || "—"}</td>

                    <td>
                      {business.sageStatus
                        ? business.sageStatus.replaceAll("_", " ")
                        : "Not configured"}
                    </td>

                    <td>
                      <span className="auditor-readonly-badge">
                        Read Only
                      </span>
                    </td>
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
