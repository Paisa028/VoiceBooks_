
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import "../ManageAccess.css";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function AuditorProfile() {
  const { refresh } = useAuth();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      try {
        const response = await fetch(
          `${API_URL}/api/auditor/profile`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load profile."
          );
        }

        setProfile(result.data);
        setForm({
          firstName: result.data.firstName || "",
          lastName: result.data.lastName || "",
          phone: result.data.phone || "",
        });
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

    loadProfile();

    return () => controller.abort();
  }, []);

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/auditor/profile`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to update profile."
        );
      }

      setProfile(result.data);
      setEditing(false);
      setMessage("Profile updated successfully.");

      // Refresh the name displayed in the sidebar.
      await refresh().catch(() => {});
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="ma-page">Loading profile...</main>;
  }

  return (
    <main className="ma-page">
      <header className="ma-header">
        <div>
          <div className="ma-eyebrow">
            AUDITOR WORKSPACE
          </div>
          <h1>Auditor Profile</h1>
          <p>
            View and manage your professional account information.
          </p>
        </div>
      </header>

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

      {profile && (
        <section className="ma-card" style={{ maxWidth: 760 }}>
          <div className="ma-card-heading">
            <div className="ma-avatar">
              {profile.firstName?.charAt(0).toUpperCase() || "A"}
            </div>
            <div>
              <h2>
                {profile.firstName} {profile.lastName}
              </h2>
              <p>Auditor • Professional Account</p>
            </div>
          </div>

          {!editing ? (
            <div className="ma-professionals">
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

              <div className="ma-person">
                <div className="ma-person-info">
                  <strong>Account Role</strong>
                  <span>Auditor • Read-only financial access</span>
                </div>
              </div>

              <button
                type="button"
                className="ma-primary-button"
                onClick={() => {
                  setMessage("");
                  setEditing(true);
                }}
              >
                Edit Profile
              </button>
            </div>
          ) : (
            <form className="ma-form" onSubmit={handleSave}>
              <label htmlFor="auditor-first-name">
                First Name
              </label>
              <input
                id="auditor-first-name"
                className="ma-input"
                value={form.firstName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    firstName: event.target.value,
                  }))
                }
                maxLength={100}
                required
              />

              <label htmlFor="auditor-last-name">
                Last Name
              </label>
              <input
                id="auditor-last-name"
                className="ma-input"
                value={form.lastName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    lastName: event.target.value,
                  }))
                }
                maxLength={100}
                required
              />

              <label htmlFor="auditor-phone">
                Phone Number
              </label>
              <input
                id="auditor-phone"
                className="ma-input"
                type="tel"
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                maxLength={30}
              />

              <p className="ma-hint">
                Email and account permissions cannot be
                changed from this page.
              </p>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="button"
                  className="ma-revoke"
                  disabled={saving}
                  onClick={() => {
                    setEditing(false);
                    setForm({
                      firstName: profile.firstName || "",
                      lastName: profile.lastName || "",
                      phone: profile.phone || "",
                    });
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="ma-primary-button"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </section>
      )}
    </main>
  );
}
