
import { useNavigate } from "react-router-dom";

import AuthLayout from "../components/AuthLayout.jsx";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";

import { useAuth } from "../hooks/useAuth.js";

import {
  ONBOARDING_STEPS,
  SAGE_STATUS_LABELS,
} from "../utils/constants.js";

export default function OnboardingSuccess() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  const business = user.business || {};
  const role = user.role;
  const isBusinessOwner = role === "business_owner";

  const roleLabel =
    user.roleLabel ||
    (role === "business_owner"
      ? "Business Owner"
      : role === "accountant"
        ? "Accountant"
        : role === "auditor"
          ? "Auditor"
          : "User");

  const steps = isBusinessOwner
    ? ONBOARDING_STEPS
    : ["Welcome", "Done"];

  const dashboardPath =
    role === "accountant"
      ? "/accountant"
      : role === "auditor"
        ? "/auditor"
        : "/dashboard";

  const goToDashboard = () => {
    navigate(dashboardPath, { replace: true });
  };

  return (
    <AuthLayout
      title="You're all set"
      subtitle="Your account is ready. Here's what we saved."
      steps={{
        current: steps.length,
        labels: steps,
      }}
    >
      <Alert type="success">
        Account created and onboarding complete.
      </Alert>

      <dl className="summary">
        <div>
          <dt>Name</dt>
          <dd>
            {user.firstName} {user.lastName}
          </dd>
        </div>

        <div>
          <dt>Account type</dt>
          <dd>{roleLabel}</dd>
        </div>

        <div>
          <dt>
            {role === "accountant"
              ? "Practice"
              : "Business"}
          </dt>
          <dd>
            {business.name || "Not provided"}
          </dd>
        </div>

        <div>
          <dt>Country and currency</dt>
          <dd>
            {business.country || "Not provided"},{" "}
            {business.currency || "Not provided"}
          </dd>
        </div>

        {isBusinessOwner && (
          <div>
            <dt>Sage</dt>
            <dd>
              {SAGE_STATUS_LABELS[business.sageStatus] ||
                "Not connected"}
            </dd>
          </div>
        )}
      </dl>

      <Button
        block
        type="button"
        onClick={goToDashboard}
      >
        Go to dashboard
      </Button>
    </AuthLayout>
  );
}
