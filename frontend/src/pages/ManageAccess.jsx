
import { useCallback, useEffect, useState } from "react";
import "./ManageAccess.css";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function ManageAccess() {
  const [data, setData] = useState({
    accountant: null,
    auditors: [],
  });
  const [role, setRole] = useState("accountant");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadAccess = useCallback(async () => {
    const response = await fetch(`${API_URL}/api/manage-access`, {
      credentials: "include",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Unable to load access.");
    }

    setData({
      accountant: result.accountant || null,
      auditors: Array.isArray(result.auditors) ? result.auditors : [],
    });
  }, []);

  useEffect(() => {
    loadAccess()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [loadAccess]);

  async function handleAssign(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/api/manage-access`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          email: email.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to assign professional.");
      }

      setEmail("");
      await loadAccess();
      setMessage(result.message || "Access granted successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke(targetRole, userId) {
    if (!window.confirm("Revoke this professional's access?")) {
      return;
    }

    setError("");
    setMessage("");
    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/api/manage-access/${targetRole}/${userId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to revoke access.");
      }

      await loadAccess();
      setMessage(result.message || "Access revoked successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const accountantCount = data.accountant ? 1 : 0;
  const auditorCount = data.auditors.length;
  const total = accountantCount + auditorCount;

  return (
    <div className="ma-page">
      <header className="ma-header">
        <div>
          <div className="ma-eyebrow">BUSINESS SETTINGS</div>
          <h1>Manage Access</h1>
          <p>
            Control who can access your business financial records.
            Add professionals and manage their permissions.
          </p>
        </div>
        <div className="ma-header-icon" aria-hidden="true">♙</div>
      </header>

      <div className="ma-stats">
        <div className="ma-stat">
          <span>Active Professionals</span>
          <strong>{loading ? "—" : total}</strong>
          <small>Connected to your business</small>
        </div>
        <div className="ma-stat">
          <span>Accountant</span>
          <strong>{loading ? "—" : accountantCount}</strong>
          <small>Accounting review access</small>
        </div>
        <div className="ma-stat">
          <span>Auditors</span>
          <strong>{loading ? "—" : auditorCount}</strong>
          <small>Read-only financial access</small>
        </div>
      </div>

      {error && (
        <div className="ma-alert ma-alert-error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="ma-alert ma-alert-success" role="status">
          {message}
        </div>
      )}

      <div className="ma-content">
        <section className="ma-card">
          <div className="ma-card-heading">
            <div className="ma-card-icon" aria-hidden="true">＋</div>
            <div>
              <h2>Add Professional</h2>
              <p>Grant access to an existing VoiceBooks account.</p>
            </div>
          </div>

          <form className="ma-form" onSubmit={handleAssign}>
            <label>Professional role</label>
            <div className="ma-role-options" role="group" aria-label="Professional role">
              <button
                type="button"
                className={`ma-role-option ${role === "accountant" ? "selected" : ""}`}
                aria-pressed={role === "accountant"}
                onClick={() => setRole("accountant")}
                disabled={saving}
              >
                <span className="ma-role-symbol" aria-hidden="true">▣</span>
                <strong>Accountant</strong>
                <small>Review & approve transactions</small>
              </button>
              <button
                type="button"
                className={`ma-role-option ${role === "auditor" ? "selected" : ""}`}
                aria-pressed={role === "auditor"}
                onClick={() => setRole("auditor")}
                disabled={saving}
              >
                <span className="ma-role-symbol" aria-hidden="true">◎</span>
                <strong>Auditor</strong>
                <small>Read-only financial review</small>
              </button>
            </div>

            <label htmlFor="ma-email">Professional email address</label>
            <input
              id="ma-email"
              className="ma-input"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              placeholder="professional@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={saving}
            />
            <p className="ma-hint">
              The professional must already have a VoiceBooks account
              with the selected role.
            </p>
            <button
              className="ma-primary-button"
              type="submit"
              disabled={saving || !email.trim()}
            >
              {saving ? "Saving..." : "＋ Grant Access"}
            </button>
          </form>
        </section>

        <section className="ma-card">
          <div className="ma-card-heading">
            <div className="ma-card-icon" aria-hidden="true">♙</div>
            <div>
              <h2>Assigned Professionals</h2>
              <p>View professionals connected to your business.</p>
            </div>
          </div>

          {loading ? (
            <p className="ma-loading">Loading professionals...</p>
          ) : (
            <div className="ma-professionals">
              <div className="ma-section-heading">
                <h3>Accountant</h3>
                <span className="ma-count">{accountantCount}</span>
              </div>

              {data.accountant ? (
                <div className="ma-person">
                  <div className="ma-avatar" aria-hidden="true">A</div>
                  <div className="ma-person-info">
                    <strong>{data.accountant.name}</strong>
                    <span>{data.accountant.email}</span>
                    <small>Accountant • Active</small>
                  </div>
                  <button
                  
                  type="button"
                   className="ma-revoke"
                   disabled={saving || !data.accountant?.id}
                   onClick={() =>
                    
                    handleRevoke("accountant", data.accountant.id)
                    }
                    
                    >Revoke
                    </button>
                </div>
              ) : (
                <div className="ma-empty">
                  <span className="ma-empty-icon" aria-hidden="true">▣</span>
                  <strong>No accountant assigned</strong>
                  <p>Add an accountant to review your transactions.</p>
                </div>
              )}

              <div className="ma-section-heading">
                <h3>Auditors</h3>
                <span className="ma-count">{auditorCount}</span>
              </div>

              {data.auditors.length === 0 ? (
                <div className="ma-empty">
                  <span className="ma-empty-icon" aria-hidden="true">◎</span>
                  <strong>No auditors assigned</strong>
                  <p>Grant an auditor read-only access to your records.</p>
                </div>
              ) : (
                data.auditors.map((auditor) => (
                  <div className="ma-person" key={auditor.id}>
                    <div className="ma-avatar" aria-hidden="true">◎</div>
                    <div className="ma-person-info">
                      <strong>{auditor.name}</strong>
                      <span>{auditor.email}</span>
                      <small>Auditor • Read-only</small>
                    </div>
                    <button
                      type="button"
                      className="ma-revoke"
                      disabled={saving}
                      onClick={() => handleRevoke("auditor", auditor.id)}
                    >
                      Revoke
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>

      <div className="ma-security-note">
        <span aria-hidden="true">♢</span>
        <p>
          <strong>Secure professional access.</strong>{" "}
          Accountants can review assigned transactions.
          Auditors are assigned read-only access to authorised records.
          You remain in control of your business.
        </p>
      </div>
    </div>
  );
}
