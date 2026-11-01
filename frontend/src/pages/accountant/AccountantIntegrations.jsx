
import { useEffect, useState } from "react";
import "../ManageAccess.css";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const statusLabels = {
  connected: "Connected",
  pending: "Setup pending",
  skipped: "Not configured",
  not_connected: "Not connected",
};

export default function AccountantIntegrations() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadIntegrations() {
      try {
        const response = await fetch(
          `${API_URL}/api/accountant/integrations`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Unable to load integrations."
          );
        }

        setBusinesses(
          Array.isArray(result.data) ? result.data : []
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadIntegrations();

    return () => controller.abort();
  }, []);

  return (
    <main className="ma-page">
      <header className="ma-header">
        <div>
          <div className="ma-eyebrow">
            ACCOUNTANT WORKSPACE
          </div>
          <h1>Integrations</h1>
          <p>
            View Sage Accounting integration status for
            businesses assigned to your account.
          </p>
        </div>

        <div className="ma-header-icon" aria-hidden="true">
          ↗
        </div>
      </header>

      <div className="ma-stats">
        <div className="ma-stat">
          <span>Assigned Businesses</span>
          <strong>{loading ? "—" : businesses.length}</strong>
          <small>Businesses you can access</small>
        </div>

        <div className="ma-stat">
          <span>Setup Pending</span>
          <strong>
            {loading
              ? "—"
              : businesses.filter(
                  (item) => item.sageStatus === "pending"
                ).length}
          </strong>
          <small>Awaiting Sage setup</small>
        </div>

        <div className="ma-stat">
          <span>Reported Connected</span>
          <strong>
            {loading
              ? "—"
              : businesses.filter(
                  (item) => item.sageStatus === "connected"
                ).length}
          </strong>
          <small>Saved connection status</small>
        </div>
      </div>

      {error && (
        <div className="ma-alert ma-alert-error" role="alert">
          {error}
        </div>
      )}

      <section className="ma-card">
        <div className="ma-card-heading">
          <div className="ma-card-icon" aria-hidden="true">
            ↗
          </div>
          <div>
            <h2>Sage Accounting</h2>
            <p>
              Integration status for your assigned clients.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="ma-loading">
            Loading integrations...
          </p>
        ) : businesses.length === 0 ? (
          <div className="ma-empty">
            <strong>No businesses assigned</strong>
            <p>
              Ask a Business Owner to grant your
              Accountant account access through Manage Access.
            </p>
          </div>
        ) : (
          <div className="ma-professionals">
            {businesses.map((business) => {
              const status =
                business.sageStatus || "not_connected";

              return (
                <div
                  className="ma-person"
                  key={business.clientId}
                >
                  <div
                    className="ma-avatar"
                    aria-hidden="true"
                  >
                    S
                  </div>

                  <div className="ma-person-info">
                    <strong>{business.businessName}</strong>
                    <span>
                      Sage Accounting
                      {business.sageRegion
                        ? ` • ${business.sageRegion}`
                        : ""}
                    </span>
                    <small>
                      {statusLabels[status] ||
                        "Status unavailable"}
                    </small>
                  </div>

                  <span className="ma-active">
                    Read only
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="ma-security-note">
        <span aria-hidden="true">♢</span>
        <p>
          <strong>Integration permissions.</strong>{" "}
          Business Owners manage Sage connections.
          Accountants can view integration information
          for their assigned businesses only.
          A saved connection status does not guarantee
          that live synchronization is active.
        </p>
      </div>
    </main>
  );
}
