
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import "../ManageAccess.css";

const API_URL = (import.meta.env.VITE_API_URL || "")
  .replace(/\/$/, "");

async function getAuditorResource(path, signal) {
  const response = await fetch(
    `${API_URL}/api/auditor/${path}`,
    {
      credentials: "include",
      signal,
    }
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || `Unable to load ${path}.`
    );
  }

  return result.data;
}

export default function AuditorSettings() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  const loadSettings = useCallback(async (signal) => {
    const [profileData, businessData] = await Promise.all([
      getAuditorResource("profile", signal),
      getAuditorResource("businesses", signal),
    ]);

    if (signal?.aborted) return;

    setProfile(profileData);
    setBusinesses(
      Array.isArray(businessData) ? businessData : []
    );
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        await loadSettings(controller.signal);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => controller.abort();
  }, [loadSettings]);

  async function handleRefresh() {
    setRefreshing(true);
    setError("");

    try {
      await loadSettings();
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    setSigningOut(true);
    setError("");

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign out.");
      setSigningOut(false);
    }
  }

  return (
    <main className="ma-page">
      <header className="ma-header">
        <div>
          <p className="ma-eyebrow">AUDITOR WORKSPACE</p>
          <h1>Account Settings</h1>
          <p>
            Review your account, authorised businesses
            and financial access permissions.
          </p>
        </div>

        <div className="ma-header-icon" aria-hidden="true">
          ⚙
        </div>
      </header>

      {error && (
        <div className="ma-alert ma-alert-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p role="status">Loading account settings...</p>
      ) : !profile ? (
        <button
          type="button"
          className="ma-revoke"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          Retry
        </button>
      ) : (
        <>
          <div className="ma-stats">
            <div className="ma-stat">
              <span>Account Role</span>
              <strong style={{ fontSize: 23 }}>
                Auditor
              </strong>
              <small>Professional account</small>
            </div>

            <div className="ma-stat">
              <span>Assigned Businesses</span>
              <strong>{businesses.length}</strong>
              <small>Currently authorised businesses</small>
            </div>

            <div className="ma-stat">
              <span>Financial Permissions</span>
              <strong style={{ fontSize: 23 }}>
                Read Only
              </strong>
              <small>Accounting entries cannot be modified</small>
            </div>
          </div>

          <div className="ma-content">
            <section className="ma-card">
              <div className="ma-card-heading">
                <div className="ma-card-icon" aria-hidden="true">
                  ◎
                </div>
                <div>
                  <h2>Account Information</h2>
                  <p>Your registered VoiceBooks identity</p>
                </div>
              </div>

              <div className="ma-person">
                <div className="ma-person-info">
                  <strong>Full Name</strong>
                  <span>
                    {profile.firstName} {profile.lastName}
                  </span>
                </div>
              </div>

              <div className="ma-person">
                <div className="ma-person-info">
                  <strong>Email Address</strong>
                  <span>{profile.email}</span>
                </div>
              </div>

              <div className="ma-person">
                <div className="ma-person-info">
                  <strong>Phone Number</strong>
                  <span>{profile.phone || "Not provided"}</span>
                </div>
              </div>

              <button
                type="button"
                className="ma-primary-button"
                onClick={() => navigate("/auditor/profile")}
              >
                Edit Personal Information
              </button>
            </section>

            <section className="ma-card">
              <div className="ma-card-heading">
                <div className="ma-card-icon" aria-hidden="true">
                  ♢
                </div>
                <div>
                  <h2>Security & Access</h2>
                  <p>Your current account permissions</p>
                </div>
              </div>

              <div className="ma-person">
                <div className="ma-person-info">
                  <strong>Account Role</strong>
                  <span>Auditor</span>
                </div>
                <span className="ma-active">Active</span>
              </div>

              <div className="ma-person">
                <div className="ma-person-info">
                  <strong>Financial Access</strong>
                  <span>
                    Read-only access to assigned businesses
                  </span>
                </div>
              </div>

              <p className="ma-hint">
                Business Owners manage company permissions.
                You cannot create, approve, modify or delete
                accounting transactions.
              </p>

              <button
                type="button"
                className="ma-revoke"
                disabled={signingOut}
                onClick={handleLogout}
              >
                {signingOut ? "Signing out..." : "Sign Out"}
              </button>
            </section>
          </div>

          <section
            className="ma-card"
            style={{ marginTop: 20 }}
          >
            <div className="ma-card-heading">
              <div className="ma-card-icon" aria-hidden="true">
                ▣
              </div>
              <div>
                <h2>Assigned Businesses</h2>
                <p>
                  Businesses that have granted you
                  permission to review financial records.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="ma-revoke"
              onClick={handleRefresh}
              disabled={refreshing}
              style={{ marginBottom: 16 }}
            >
              {refreshing ? "Refreshing..." : "Refresh Access"}
            </button>

            {businesses.length === 0 ? (
              <div className="ma-empty">
                <strong>No authorised businesses</strong>
                <p>
                  A Business Owner must grant access
                  through Manage Access.
                </p>
              </div>
            ) : (
              <div className="ma-professionals">
                {businesses.map((business) => (
                  <div
                    className="ma-person"
                    key={business.id}
                  >
                    <div className="ma-avatar">
                      {business.businessName
                        ?.charAt(0)
                        .toUpperCase() || "B"}
                    </div>

                    <div className="ma-person-info">
                      <strong>{business.businessName}</strong>
                      <span>
                        {business.country || "Country unavailable"}
                        {" • "}
                        {business.currency || "Currency unavailable"}
                      </span>
                      <small>
                        Sage: {business.sageStatus || "Not configured"}
                      </small>
                    </div>

                    <span className="ma-active">
                      Read Only
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="ma-security-note">
            <span aria-hidden="true">♢</span>
            <p>
              <strong>Access security.</strong>{" "}
             You can only view financial records from businesses
             that have given you permission. If a Business Owner
             removes your access, you will no longer be able to
             view that company's records.
            </p>
          </div>
        </>
      )}
    </main>
  );
}
