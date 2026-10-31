
import { useState } from "react";
import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import AuthLayout from "../components/AuthLayout.jsx";
import Button from "../components/Button.jsx";

import { useSignup } from "../hooks/useSignup.js";
import {
  ROLES,
  SIGNUP_STEPS,
} from "../utils/constants.js";

export default function RoleSelection() {
  const { draft, update } = useSignup();
  const navigate = useNavigate();

  const isGoogle = draft.authMethod === "google";

  const [role, setRole] = useState(
    isGoogle ? "business_owner" : draft.role || ""
  );

  const [error, setError] = useState("");

  if (!draft.account) {
    return <Navigate to="/signup" replace />;
  }

  if (isGoogle && !draft.googleCredential) {
    return <Navigate to="/signup" replace />;
  }

  const availableRoles = isGoogle
    ? ROLES.filter((r) => r.id === "business_owner")
    : ROLES;

  const submit = (event) => {
    event.preventDefault();

    const selectedRole = isGoogle
      ? "business_owner"
      : role;

    if (!selectedRole) {
      setError(
        "Choose the account type that fits you best."
      );
      return;
    }

    update({
      role: selectedRole,
    });

    navigate("/signup/business");
  };

  return (
    <AuthLayout
      title="How will you use VoiceBooks?"
      subtitle={
        isGoogle
          ? "Google registration is available for Business Owners."
          : "Your account type decides which dashboard you see. You can't change it yourself later, so choose carefully."
      }
      steps={{ current: 2, labels: SIGNUP_STEPS }}
    >
      <form onSubmit={submit} noValidate>
        <fieldset className="choices">
          <legend className="sr-only">
            Account type
          </legend>

          {availableRoles.map((r) => (
            <label
              key={r.id}
              className={`choice${
                (isGoogle
                  ? "business_owner"
                  : role) === r.id
                  ? " selected"
                  : ""
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r.id}
                checked={
                  (isGoogle
                    ? "business_owner"
                    : role) === r.id
                }
                onChange={() => {
                  if (!isGoogle) {
                    setRole(r.id);
                    setError("");
                  }
                }}
                disabled={isGoogle}
              />

              <span className="choice-title">
                {r.label}
              </span>

              <span className="choice-desc">
                {r.description}
              </span>
            </label>
          ))}
        </fieldset>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <div className="actions">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/signup")}
          >
            Back
          </Button>

          <Button type="submit">
            Continue
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
