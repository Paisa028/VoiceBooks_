
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client.js";
import Alert from "../components/Alert.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import Button from "../components/Button.jsx";
import FormField from "../components/FormField.jsx";

import { useAuth } from "../hooks/useAuth.js";
import { useForm } from "../hooks/useForm.js";

import {
  ONBOARDING_STEPS,
  SAGE_REGIONS,
} from "../utils/constants.js";

import { validateSage } from "../utils/validators.js";

export default function SageConnection() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();

  const [skipping, setSkipping] = useState(false);
  const [skipError, setSkipError] = useState("");

  const role = user?.role;
  const isBusinessOwner = role === "business_owner";

  // Other roles must not manage the Sage integration.
  useEffect(() => {
    if (user && !isBusinessOwner) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, isBusinessOwner, navigate]);

  const finish = async (payload) => {
    if (!isBusinessOwner) {
      throw new Error(
        "Only Business Owners can manage Sage integration."
      );
    }

    await api.setSage(payload);
    await api.completeOnboarding();
    await refresh();

    navigate("/onboarding/success", {
      replace: true,
    });
  };

  const guess =
    user?.business?.sageRegion ||
    (SAGE_REGIONS.includes(user?.business?.country)
      ? user.business.country
      : "");

  const form = useForm({
    initialValues: {
      region: guess,
    },
    validate: validateSage,
    onSubmit: (values) =>
      finish({
        action: "connect",
        region: values.region,
      }),
  });

  const skip = async () => {
    if (skipping || form.submitting) return;

    setSkipping(true);
    setSkipError("");

    try {
      await finish({
        action: "skip",
      });
    } catch (err) {
      setSkipError(
        err.message || "Unable to skip Sage setup."
      );
    } finally {
      setSkipping(false);
    }
  };

  if (!user || !isBusinessOwner) {
    return null;
  }

  const isSouthAfrica = form.values?.region === "South Africa";

  return (
    <AuthLayout
      title="Connect Sage"
      subtitle={
        isSouthAfrica
          ? "Sage South Africa requires an Accounting API Key. You can complete your VoiceBooks setup while the integration is pending."
          : "Connect your Sage Accounting account or skip this step and configure it later."
      }
      steps={{
        current: 2,
        labels: ONBOARDING_STEPS,
      }}
    >
      <form
        onSubmit={form.handleSubmit}
        noValidate
      >
        <Alert
          type={
            form.status?.type ||
            (skipError ? "error" : undefined)
          }
        >
          {form.status?.message || skipError}
        </Alert>

        <FormField
          as="select"
          label="Where is your Sage account based?"
          hint="Pick the region associated with your Sage Accounting account."
          {...form.field("region")}
        >
          <option value="">
            Select a region
          </option>

          {SAGE_REGIONS.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </FormField>

        <div className="actions">
          <Button
            type="button"
            variant="ghost"
            onClick={skip}
            loading={skipping}
            disabled={form.submitting}
          >
            {skipping ? "Skipping…" : "Skip for now"}
          </Button>

          <Button
            type="submit"
            loading={form.submitting}
            disabled={skipping}
          >
            {form.submitting
              ? "Saving…"
              : "Save Sage setup"}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
