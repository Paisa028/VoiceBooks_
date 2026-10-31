
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client.js";
import AuthLayout from "../components/AuthLayout.jsx";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";

import { useAuth } from "../hooks/useAuth.js";
import { useSignup } from "../hooks/useSignup.js";

import { ONBOARDING_STEPS } from "../utils/constants.js";

export default function Onboarding() {
  const { user, refresh } = useAuth();
  const { reset } = useSignup();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Clear sign-up data after the account has been created.
  useEffect(() => {
    if (user) {
      reset();
    }
  }, [user, reset]);

  const role = user?.role;
  const isBusinessOwner = role === "business_owner";

  const steps = isBusinessOwner
    ? ONBOARDING_STEPS
    : ["Welcome", "Done"];

  const handleContinue = async () => {
    if (loading || !user) {
      return;
    }

    setError("");

    // Only Business Owners configure Sage.
    if (isBusinessOwner) {
      navigate("/onboarding/sage");
      return;
    }

    // Accountant and Auditor complete onboarding without Sage.
    if (role !== "accountant" && role !== "auditor") {
      setError(
        "Your account role is not supported. Please contact the administrator."
      );
      return;
    }

    try {
      setLoading(true);

      await api.completeOnboarding();

      // Update the authenticated user after onboarding.
      await refresh();

      navigate("/onboarding/success", {
        replace: true,
      });
    } catch (err) {
      setError(
        err?.message ||
          "Unable to complete onboarding. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  const roleLabel =
    user.roleLabel ||
    (role === "business_owner"
      ? "Business Owner"
      : role === "accountant"
        ? "Accountant"
        : role === "auditor"
          ? "Auditor"
          : "User");

  return (
    <AuthLayout
      title={`Welcome, ${user.firstName || "there"}`}
      subtitle={`Your ${roleLabel.toLowerCase()} account for ${
        user.business?.name || "your business"
      } is ready. Here is how VoiceBooks works.`}
      steps={{
        current: 1,
        labels: steps,
      }}
    >
      {error && (
        <Alert type="error">
          {error}
        </Alert>
      )}

      <ol className="how">
        <li>
          <strong>Record transactions</strong>
          <span>
            Business Owners can record transactions
            using voice or manual entry.
          </span>
        </li>

        <li>
          <strong>Review accounting information</strong>
          <span>
            Accountants can review assigned transactions.
            Auditors can inspect records and audit history
            according to their permissions.
          </span>
        </li>

        <li>
          <strong>Sage Accounting integration</strong>
          <span>
            Business Owners manage the Sage connection.
            Other roles can use their permitted
            VoiceBooks features without configuring Sage.
          </span>
        </li>
      </ol>

      <Button
        block
        type="button"
        onClick={handleContinue}
        loading={loading}
        disabled={loading}
      >
        {loading ? "Finishing setup..." : "Continue"}
      </Button>
    </AuthLayout>
  );
}
