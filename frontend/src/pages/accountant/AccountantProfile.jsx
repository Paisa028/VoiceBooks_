import { useEffect, useRef, useState } from "react";
import { accountantApi } from "../../services/accountantApi";
import { useAuth } from "../../hooks/useAuth.js";

const MAX_PHOTO_SIZE = 2 * 1024 * 1024;

function createFormFromProfile(profile) {
  const nameParts = String(profile?.name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return {
    firstName: profile?.first_name || nameParts[0] || "",
    lastName:
      profile?.last_name ||
      nameParts.slice(1).join(" ") ||
      "",
    phone: profile?.phone || "",
  };
}

export default function AccountantProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { refresh } = useAuth();


  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("info");

  const fileInputRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const result = await accountantApi.profile();
        const data = result.data ?? null;

        if (!active) return;

        setProfile(data);

        if (data) {
          setForm(createFormFromProfile(data));
        }
      } catch (err) {
        if (active) {
          setError(
            err.message || "Unable to load profile."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview("");
      return;
    }

    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const displayName =
    profile?.name ||
    `${profile?.first_name || ""} ${
      profile?.last_name || ""
    }`.trim() ||
    "Accounting Professional";

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  function showNotice(message, type = "info") {
    setNotice(message);
    setNoticeType(type);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setNotice("");
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(file.type) ||
      file.size > MAX_PHOTO_SIZE
    ) {
      showNotice(
        "Please select a JPG, PNG or WebP image under 2 MB.",
        "error"
      );

      event.target.value = "";
      return;
    }

    setPhotoFile(file);

    showNotice(
      "Photo preview selected. The photo has not been uploaded or saved yet.",
      "info"
    );
  }

  function cancelEditing() {
    setForm(createFormFromProfile(profile));
    setEditing(false);
    setNotice("");
  }

  async function saveChanges() {
    if (saving) return;

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const phone = form.phone.trim();

    if (!firstName || !lastName) {
      showNotice(
        "First name and last name are required.",
        "error"
      );
      return;
    }

    if (
      firstName.length > 100 ||
      lastName.length > 100 ||
      phone.length > 30
    ) {
      showNotice(
        "Please check the maximum field lengths.",
        "error"
      );
      return;
    }

    try {
      setSaving(true);
      setNotice("");

      const result = await accountantApi.updateProfile({
        firstName,
        lastName,
        phone,
      });

      if (!result.success || !result.data) {
        throw new Error(
          "The server did not confirm the profile update."
        );
      }

   
setProfile(result.data);
setForm(createFormFromProfile(result.data));
setEditing(false);

// Refresh the authenticated user displayed in the sidebar.
try {
  await refresh();

  showNotice(
    "Profile updated successfully.",
    "success"
  );
} catch (refreshError) {
  console.error(
    "Profile saved, but session refresh failed:",
    refreshError
  );

  showNotice(
    "Profile saved. Refresh the page to update the sidebar.",
    "info"
  );
}

    } catch (err) {
      showNotice(
        err.message || "Unable to save profile changes.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="loading" role="status">
        Loading profile...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="error-box" role="alert">
        {error || "Profile not found."}
      </div>
    );
  }

  return (
    <main className="accountant-profile-page">
      <header className="accountant-profile-header">
        <div>
          <p className="accountant-profile-eyebrow">
            ACCOUNTANT WORKSPACE
          </p>

          <h1>Accountant Profile</h1>

          <p className="accountant-profile-subtitle">
            Manage your professional account information.
          </p>
        </div>
      </header>

      <section className="accountant-profile-card">
        <div className="accountant-profile-top">
          <div className="accountant-profile-avatar">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Selected profile preview"
                className="accountant-profile-photo"
              />
            ) : (
              initials || "A"
            )}
          </div>

          <div className="accountant-profile-identity">
            <h2>{displayName}</h2>
            <p>Accounting Professional</p>

            <span className="accountant-profile-role">
              Accountant
            </span>
          </div>

          <div className="accountant-profile-actions">
            <button
              type="button"
              className="accountant-profile-edit-button"
              onClick={() => {
                if (editing) {
                  cancelEditing();
                } else {
                  setEditing(true);
                  setNotice("");
                }
              }}
              disabled={saving}
            >
              {editing ? "Close Editor" : "Edit Profile"}
            </button>

            <button
              type="button"
              className="accountant-profile-photo-button"
              onClick={() => fileInputRef.current?.click()}
            >
              Change Photo
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              hidden
            />
          </div>
        </div>

        <div className="accountant-profile-divider" />

        {notice && (
          <div
            className={`accountant-profile-notice ${noticeType}`}
            role={noticeType === "error" ? "alert" : "status"}
          >
            {notice}
          </div>
        )}

        {editing ? (
          <form
            className="accountant-profile-form"
            onSubmit={(event) => {
              event.preventDefault();
              saveChanges();
            }}
          >
            <div className="accountant-profile-form-grid">
              <label>
                First Name
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  maxLength={100}
                  required
                  disabled={saving}
                />
              </label>

              <label>
                Last Name
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  maxLength={100}
                  required
                  disabled={saving}
                />
              </label>

              <label>
                Phone
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Optional"
                  maxLength={30}
                  disabled={saving}
                />
              </label>

              <label>
                Email Address
                <input
                  type="email"
                  value={profile.email || ""}
                  disabled
                />
              </label>
            </div>

            <div className="accountant-profile-form-actions">
              <button
                type="button"
                className="accountant-profile-cancel-button"
                onClick={cancelEditing}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="accountant-profile-save-button"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="accountant-profile-details">
            <div className="accountant-profile-field">
              <span>FULL NAME</span>
              <strong>{displayName}</strong>
            </div>

            <div className="accountant-profile-field">
              <span>EMAIL ADDRESS</span>
              <strong>
                {profile.email || "Not provided"}
              </strong>
            </div>

            <div className="accountant-profile-field">
              <span>PHONE NUMBER</span>
              <strong>
                {profile.phone || "Not provided"}
              </strong>
            </div>

            <div className="accountant-profile-field">
              <span>ACCOUNT ROLE</span>
              <strong>Accountant</strong>
            </div>

            <div className="accountant-profile-field">
              <span>ACCOUNT STATUS</span>
              <div className="accountant-profile-status">
                <i />
                Active
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
