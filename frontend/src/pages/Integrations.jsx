import { useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../hooks/useAuth.js";
import {
  SAGE_REGIONS,
  SAGE_STATUS_LABELS,
} from "../utils/constants.js";

export default function Integrations() {
  const { user, refresh } = useAuth();

  const business = user.business || {};

  const [region, setRegion] = useState(
    business.sageRegion || business.country || ""
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sageStatus =
    business.sageStatus ||
    user.sageStatus ||
    "not_connected";

  const statusLabel =
    SAGE_STATUS_LABELS[sageStatus] ||
    "Not connected";

  const connected =
    sageStatus === "connected" ||
    sageStatus === "pending";

  const connectSage = async () => {
    if (!region) {
      setError("Please select your Sage region.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await api.setSage({
        action: "connect",
        region,
      });

      await refresh();

      setMessage(
        "Sage connection settings were saved successfully."
      );
    } catch (err) {
      setError(
        err.message ||
          "VoiceBooks could not update the Sage connection."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="integrations-page">
      <section className="integrations-container">

        <header className="integrations-header">
          <div>
            <p className="integrations-eyebrow">
              CONNECTED SERVICES
            </p>

            <h1>Integrations</h1>

            <p>
              Connect VoiceBooks with your accounting
              services and manage how your business data
              is shared.
            </p>
          </div>
        </header>

        {message && (
          <div className="integration-message success">
            {message}
          </div>
        )}

        {error && (
          <div className="integration-message error">
            {error}
          </div>
        )}

        <section className="integration-card">

          <div className="integration-card-top">
            <div className="integration-brand">
              <div className="integration-logo">
                S
              </div>

              <div>
                <h2>Sage Accounting</h2>

                <p>
                  Send approved VoiceBooks accounting
                  entries to Sage.
                </p>
              </div>
            </div>

            <span
              className={`integration-status ${
                connected
                  ? "connected"
                  : "not-connected"
              }`}
            >
              <span className="integration-status-dot" />
              {statusLabel}
            </span>
          </div>

          <div className="integration-details">

            <div className="integration-detail">
              <span>Business</span>

              <strong>
                {business.name || "Not provided"}
              </strong>
            </div>

            <div className="integration-detail">
              <span>Integration</span>

              <strong>Sage Accounting</strong>
            </div>

            <div className="integration-detail">
              <span>Region</span>

              <strong>
                {business.sageRegion ||
                  "Not selected"}
              </strong>
            </div>

            <div className="integration-detail">
              <span>Status</span>

              <strong>{statusLabel}</strong>
            </div>

          </div>

          <div className="integration-settings">

            <div className="integration-settings-copy">
              <h3>Sage region</h3>

              <p>
                Select the region associated with your
                Sage Accounting account.
              </p>
            </div>

            <div className="integration-region-control">

              <select
                value={region}
                onChange={(event) =>
                  setRegion(event.target.value)
                }
              >
                <option value="">
                  Select a region
                </option>

                {SAGE_REGIONS.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="integration-connect-button"
                onClick={connectSage}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : connected
                    ? "Update Connection"
                    : "Connect Sage"}
              </button>

            </div>
          </div>

          <div className="integration-note">
            <strong>Your Sage password stays private.</strong>

            <span>
              VoiceBooks stores the connection settings
              required by the application. Your Sage
              password is not entered into VoiceBooks.
            </span>
          </div>

        </section>

        <section className="integration-coming-soon">
          <div>
            <h2>More integrations</h2>

            <p>
              Additional accounting and business
              integrations can be added here as
              VoiceBooks expands.
            </p>
          </div>

          <span>Coming soon</span>
        </section>

      </section>
    </main>
  );
}