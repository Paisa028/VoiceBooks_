
import { useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../hooks/useAuth.js";

import {
  SAGE_REGIONS,
  SAGE_STATUS_LABELS,
  SAGE_PROVIDER_LABELS,
  getSageProvider,
} from "../utils/constants.js";

export default function Integrations() {
  const { user, refresh } = useAuth();

  const business = user?.business || {};

  const [region, setRegion] = useState(
    business.sageRegion || business.country || ""
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sageProvider = getSageProvider(region);

  const sageProviderLabel = sageProvider
    ? SAGE_PROVIDER_LABELS[sageProvider]
    : "Select a Sage region";

  const savedRegion = business.sageRegion || "";

  const sageStatus =
    business.sageStatus ||
    user?.sageStatus ||
    "not_connected";

  // Changing the selected region does not establish a connection.
  const sameRegion = region === savedRegion;

  const connected =
    sageStatus === "connected" && sameRegion;

  const displayStatus = sameRegion
    ? sageStatus
    : "not_connected";

  const statusLabel =
    SAGE_STATUS_LABELS[displayStatus] ||
    "Not connected";

  const connectSage = async () => {
    if (!region) {
      setError("Please select your Sage region.");
      return;
    }

    if (!sageProvider) {
      setError(
        "Sage Accounting is not available for the selected region."
      );
      return;
    }

    if (saving) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (sageProvider === "sage_sa") {
        // Save the connection request without claiming it is active.
        await api.setSage({
          action: "connect",
          region,
        });

        if (typeof refresh === "function") {
          await refresh();
        }

        setMessage(
          "Your Sage connection request has been saved. " +
          "You can continue using VoiceBooks while " +
          "the connection is being prepared."
        );

        return;
      }

      if (sageProvider === "sage_international") {
        await api.setSage({
          action: "connect",
          region,
        });

        // Continue to the existing Sage authorization flow.
        window.location.assign("/api/sage/connect");
        return;
      }

      setError(
        "This Sage connection is not currently available."
      );
    } catch (err) {
      setError(
        err.message ||
          "VoiceBooks could not start the Sage connection."
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
              services and manage your business
              information in one place.
            </p>
          </div>
        </header>

        {message && (
          <div
            className="integration-message success"
            role="status"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            className="integration-message error"
            role="alert"
          >
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
                  Connect your Sage Accounting account
                  to VoiceBooks to keep your business
                  records organised.
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
              <strong>{sageProviderLabel}</strong>
            </div>

            <div className="integration-detail">
              <span>Region</span>
              <strong>{region || "Not selected"}</strong>
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
                Select the country or region associated
                with your Sage Accounting account.
              </p>
            </div>

            <div className="integration-region-control">
              <select
                aria-label="Sage region"
                value={region}
                onChange={(event) => {
                  setRegion(event.target.value);
                  setMessage("");
                  setError("");
                }}
                disabled={saving}
              >
                <option value="">
                  Select a region
                </option>

                {SAGE_REGIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="integration-connect-button"
                onClick={connectSage}
                disabled={saving || !sageProvider}
              >
                {saving
                  ? "Processing..."
                  : connected
                    ? "Reconnect Sage"
                    : "Connect Sage"}
              </button>
            </div>
          </div>

          <div className="integration-note">
            <strong>
              {connected
                ? "Your Sage connection is active."
                : "About your Sage connection"}
            </strong>

            <span>
              {connected
                ? "Your Sage account is connected to VoiceBooks."
                : region === "South Africa"
                  ? "Your Sage connection is not active yet. You can continue recording and managing transactions in VoiceBooks while we prepare this service."
                  : "You will be taken to Sage to sign in and approve the connection. VoiceBooks will not ask for your Sage password."}
            </span>
          </div>
        </section>
      </section>
    </main>
  );
}
