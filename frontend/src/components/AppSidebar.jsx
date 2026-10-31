
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";
import Logo from "./Logo.jsx";
import Alert from "./Alert.jsx";

const businessOwnerLinks = [
  { to: "/dashboard", icon: "⌂", label: "Dashboard" },
  { to: "/transactions/new", icon: "◉", label: "Record Transaction" },
  { to: "/transactions", icon: "☷", label: "Transactions" },
  { to: "/ledger", icon: "▣", label: "Ledger" },
  { to: "/reports", icon: "▥", label: "Reports" },
  { to: "/integrations", icon: "↗", label: "Integrations" },
  { to: "/settings", icon: "⚙", label: "Settings" },
];

const accountantLinks = [
  { to: "/accountant", icon: "⌂", label: "Dashboard" },
  { to: "/accountant/clients", icon: "♙", label: "Clients" },
  { to: "/accountant/approved", icon: "✓", label: "Approved" },
  { to: "/accountant/returned", icon: "↩", label: "Returned" },
  { to: "/accountant/profile", icon: "◎", label: "Profile" },
];

// Auditor currently has a basic dashboard.
// Additional read-only pages can be added later.
const auditorLinks = [
  { to: "/auditor", icon: "⌂", label: "Dashboard" },
];

function getRoleHome(role) {
  switch (role) {
    case "accountant":
      return "/accountant";
    case "auditor":
      return "/auditor";
    case "business_owner":
      return "/dashboard";
    default:
      return "/";
  }
}

function getProfilePath(role) {
  switch (role) {
    case "accountant":
      return "/accountant/profile";
    case "business_owner":
      return "/settings";
    case "auditor":
      return "/auditor";
    default:
      return "/";
  }
}

export default function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  const role = String(user?.role || "").toLowerCase();

  const displayName =
    user?.name ||
    user?.fullName ||
    [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    user?.email ||
    "VoiceBooks User";

  const roleLabel =
    user?.roleLabel ||
    (role === "business_owner"
      ? "Business Owner"
      : role === "accountant"
        ? "Accountant"
        : role === "auditor"
          ? "Auditor"
          : "User");

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  const links =
    role === "accountant"
      ? accountantLinks
      : role === "auditor"
        ? auditorLinks
        : role === "business_owner"
          ? businessOwnerLinks
          : [];

  const homePath = getRoleHome(role);
  const profilePath = getProfilePath(role);

  // Use a saved profile image when the backend provides one.
  const profilePhoto =
    user?.profilePhotoUrl ||
    user?.avatarUrl ||
    "";

  async function handleLogout() {
    if (signingOut) return;

    setSigningOut(true);
    setError("");

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(
        err.message || "Could not sign out. Please try again."
      );
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <aside className="app-sidebar">
      <NavLink
        to={homePath}
        className="sidebar-brand"
        aria-label="VoiceBooks home"
      >
        <Logo />
      </NavLink>

      <nav
        className="sidebar-navigation"
        aria-label="Main navigation"
      >
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={
              link.to === "/dashboard" ||
              link.to === "/accountant" ||
              link.to === "/auditor"
            }
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
          >
            <span
              className="sidebar-link-icon"
              aria-hidden="true"
            >
              {link.icon}
            </span>

            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        {error && (
          <Alert type="error">
            {error}
          </Alert>
        )}

        {/* Clicking the avatar or name opens the profile. */}
        <NavLink
          to={profilePath}
          className="sidebar-user sidebar-profile-link"
          aria-label={`Open ${displayName}'s profile`}
        >
          <div className="sidebar-avatar">
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt=""
                className="sidebar-avatar-image"
              />
            ) : (
              initials || "VB"
            )}
          </div>

          <div className="sidebar-user-details">
            <strong>{displayName}</strong>
            <span>{roleLabel}</span>
          </div>

          <span
            className="sidebar-profile-arrow"
            aria-hidden="true"
          >
            ›
          </span>
        </NavLink>

        <button
          type="button"
          className="sidebar-signout"
          onClick={handleLogout}
          disabled={signingOut}
          aria-busy={signingOut}
          aria-label={
            signingOut ? "Signing out" : "Sign Out"
          }
        >
          <span aria-hidden="true">↪</span>
          <span>
            {signingOut ? "Signing out…" : "Sign Out"}
          </span>
        </button>
      </div>
    </aside>
  );
}
