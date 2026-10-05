import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import AccountantAssignment from '../components/AccountantAssignment.jsx';

export default function Settings() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    businessName: "",
    registrationNumber: "",
    vatNumber: "",
    industry: "",
    businessSize: "",
    country: "",
    currency: "",
  });

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ==================================================
  // LOAD SETTINGS
  // ==================================================

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError("");

        const data = await api.getSettings();
        const user = data.user;
        const business = user?.business || {};

        setEmail(user?.email || "");

        setForm({
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          phone: user?.phone || "",
          businessName: business.name || "",
          registrationNumber: business.registrationNumber || "",
          vatNumber: business.vatNumber || "",
          industry: business.industry || "",
          businessSize: business.size || "",
          country: business.country || "",
          currency: business.currency || "",
        });
      } catch (err) {
        console.error("Settings load error:", err);

        setError(
          err.message ||
            "VoiceBooks could not load your settings."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  // ==================================================
  // HANDLE INPUT
  // ==================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  // ==================================================
  // SAVE SETTINGS
  // ==================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const data = await api.updateSettings(form);

      setMessage(
        data.message || "Settings saved successfully."
      );

      const user = data.user;
      const business = user?.business || {};

      if (user) {
        setEmail(user.email || "");

        setForm({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          phone: user.phone || "",
          businessName: business.name || "",
          registrationNumber: business.registrationNumber || "",
          vatNumber: business.vatNumber || "",
          industry: business.industry || "",
          businessSize: business.size || "",
          country: business.country || "",
          currency: business.currency || "",
        });
      }
    } catch (err) {
      console.error("Settings save error:", err);

      setError(
        err.message ||
          "VoiceBooks could not save your settings."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <main className="settings-page">
        <section className="settings-container">
          <div className="settings-state">
            <h2>Loading settings...</h2>
            <p>
              VoiceBooks is retrieving your account information.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="settings-page">
      <section className="settings-container">

        {/* HEADER */}

        <header className="settings-header">
          <p className="settings-eyebrow">
            ACCOUNT & BUSINESS
          </p>

          <h1>Settings</h1>

          <p>
            Manage your personal and business information used
            throughout VoiceBooks.
          </p>
        </header>

        {/* MESSAGES */}

        {message && (
          <div className="settings-message settings-success" role="status">
            {message}
          </div>
        )}

        {error && (
          <div className="settings-message settings-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* PERSONAL INFORMATION */}

          <section className="settings-card">

            <div className="settings-card-header">
              <div>
                <h2>Personal Information</h2>
                <p>
                  Manage the details associated with your
                  VoiceBooks account.
                </p>
              </div>
            </div>

            <div className="settings-form-grid">

              <label className="settings-field">
                <span>First Name *</span>

                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="settings-field">
                <span>Last Name *</span>

                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="settings-field">
                <span>Email Address</span>

                <input
                  type="email"
                  value={email}
                  disabled
                />

                <small>
                  Your sign-in email cannot be changed here.
                </small>
              </label>

              <label className="settings-field">
                <span>Phone Number</span>

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="e.g. +27 82 123 4567"
                />
              </label>

            </div>
          </section>

          {/* BUSINESS INFORMATION */}

          <section className="settings-card">

            <div className="settings-card-header">
              <div>
                <h2>Business Information</h2>

                <p>
                  These details are used in your accounting
                  records and reports.
                </p>
              </div>
            </div>

            <div className="settings-form-grid">

              <label className="settings-field">
                <span>Business Name *</span>

                <input
                  type="text"
                  name="businessName"
                  value={form.businessName}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="settings-field">
                <span>Registration Number</span>

                <input
                  type="text"
                  name="registrationNumber"
                  value={form.registrationNumber}
                  onChange={handleChange}
                  placeholder="Business registration number"
                />
              </label>

              <label className="settings-field">
                <span>VAT Number</span>

                <input
                  type="text"
                  name="vatNumber"
                  value={form.vatNumber}
                  onChange={handleChange}
                  placeholder="VAT registration number"
                />
              </label>

              <label className="settings-field">
                <span>Industry *</span>

                <input
                  type="text"
                  name="industry"
                  value={form.industry}
                  onChange={handleChange}
                  placeholder="e.g. Plumbing"
                  required
                />
              </label>

              <label className="settings-field">
                <span>Business Size *</span>

                <select
                  name="businessSize"
                  value={form.businessSize}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select business size
                  </option>

                  <option value="1-5">1–5 employees</option>
                  <option value="6-20">6–20 employees</option>
                  <option value="21-50">21–50 employees</option>
                  <option value="51-200">51–200 employees</option>
                  <option value="200+">200+ employees</option>
                </select>
              </label>

              <label className="settings-field">
                <span>Country *</span>

                <input
                  type="text"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  placeholder="e.g. South Africa"
                  required
                />
              </label>

              <label className="settings-field">
                <span>Currency *</span>

                <select
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select currency
                  </option>

                  <option value="ZAR">
                    ZAR — South African Rand
                  </option>

                  <option value="USD">
                    USD — US Dollar
                  </option>

                  <option value="GBP">
                    GBP — British Pound
                  </option>

                  <option value="EUR">
                    EUR — Euro
                  </option>

                  <option value="CAD">
                    CAD — Canadian Dollar
                  </option>

                  <option value="NGN">
                    NGN — Nigerian Naira
                  </option>

                  <option value="KES">
                    KES — Kenyan Shilling
                  </option>
                </select>
              </label>

            </div>
          </section>

          {/* SAVE */}

          <div className="settings-actions">

            <div>
              <strong>Save your changes</strong>

              <p>
                Updated business information will be used
                throughout VoiceBooks.
              </p>
            </div>

            <button
              type="submit"
              className="settings-save-button"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

          </div>

        </form>

        <AccountantAssignment />

      </section>
    </main>
  );
}
