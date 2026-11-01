
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

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
    draft.role && ROLES.some((r) => r.id === draft.role)
      ? draft.role
      : ""
  );

  const [error, setError] = useState("");

  // Both password and Google signup require account information.
  if (!draft.account) {
    return <Navigate to="/signup" replace />;
  }

  // Google signup requires an identity credential.
  if (isGoogle && !draft.googleCredential) {
    return <Navigate to="/signup" replace />;
  }

  const submit = (event) => {
    event.preventDefault();

    if (!ROLES.some((r) => r.id === role)) {
      setError(
        "Choose the account type that fits you best."
      );
      return;
    }

    // Save the selected role without granting permissions.
    update({ role });

    navigate("/signup/business");
  };

  return (
    <AuthLayout
      title="How will you use VoiceBooks?"
      subtitle="Choose your account type. Access to another business requires authorisation."
      steps={{
        current: 2,
        labels: SIGNUP_STEPS,
      }}
    >
      <form onSubmit={submit} noValidate>
        <fieldset className="choices">
          <legend className="sr-only">
            Account type
          </legend>

          {ROLES.map((r) => (
            <label
              key={r.id}
              className={`choice${
                role === r.id ? " selected" : ""
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r.id}
                checked={role === r.id}
                onChange={() => {
                  setRole(r.id);
                  setError("");
                }}
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
