
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import Alert from "../components/Alert.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import Button from "../components/Button.jsx";
import FormField from "../components/FormField.jsx";

import { useAuth } from "../hooks/useAuth.js";
import { useSignup } from "../hooks/useSignup.js";
import { useForm } from "../hooks/useForm.js";

import {
  BUSINESS_SIZES,
  COUNTRIES,
  CURRENCIES,
  INDUSTRIES,
  SIGNUP_STEPS,
} from "../utils/constants.js";

import { validateBusiness } from "../utils/validators.js";

const EMPTY = {
  businessName: "",
  registrationNumber: "",
  vatNumber: "",
  industry: "",
  businessSize: "",
  country: "",
  currency: "",
};

const GOOGLE_CREDENTIAL_MAX_AGE_MS = 2 * 60 * 1000;

const FIELD_LABELS = {
  businessName: "Business name",
  registrationNumber: "Registration number",
  vatNumber: "VAT or tax number",
  industry: "Industry",
  businessSize: "Business size",
  country: "Country",
  currency: "Currency",
};

const REQUIRED_FIELDS = [
  "businessName",
  "industry",
  "businessSize",
  "country",
  "currency",
];

export default function BusinessSetup() {
  const { draft, update, reset } = useSignup();
  const { register, googleRegister } = useAuth();
  const navigate = useNavigate();

  const [fieldMessages, setFieldMessages] = useState({});

  const isGoogle = draft.authMethod === "google";
  const role = draft.role;

  const practice = role === "accountant";

  // The current backend only supports Google self-registration
  // as Business Owner. Never create a different role silently.
  const unsupportedGoogleRole =
    isGoogle && role !== "business_owner";

  // Auditor accounts require an authorised access flow.
  const unsupportedAuditorRole = role === "auditor";

  const form = useForm({
    initialValues: draft.business || EMPTY,
    validate: validateBusiness,

    onSubmit: async (business) => {
      if (unsupportedGoogleRole || unsupportedAuditorRole) {
        throw new Error(
          "This account type requires an authorised registration flow."
        );
      }

      if (isGoogle) {
        const credentialAge =
          Date.now() - (draft.googleCredentialAt || 0);

        if (
          !draft.googleCredential ||
          credentialAge > GOOGLE_CREDENTIAL_MAX_AGE_MS ||
          credentialAge < 0
        ) {
          update({ business });

          navigate("/signup", {
            replace: true,
            state: {
              googleNotice:
                "Your Google sign-in has expired. Please continue with Google again.",
            },
          });

          return;
        }

        try {
          await googleRegister({
            credential: draft.googleCredential,
           role: draft.role,
            business,
          });

          
        } catch (error) {
          if (error.status === 409) {
            update({ business });

            navigate("/signup", {
              replace: true,
              state: {
                googleNotice:
                  "This Google account already has a VoiceBooks account. Please sign in instead.",
              },
            });

            return;
          }

          throw error;
        }
      } else {
        try {
          await register({
            ...draft.account,
            role,
            business,
          });
        } catch (error) {
          if (error.status === 409) {
            update({ business });

            navigate("/signup", {
              replace: true,
              state: { emailTaken: true },
            });

            return;
          }

          throw error;
        }
      }

      reset();
      navigate("/onboarding", { replace: true });
    },
  });

  if (!draft.account) {
    return <Navigate to="/signup" replace />;
  }

  if (!role) {
    return <Navigate to="/signup/role" replace />;
  }

  const onCountry = (event) => {
    const match = COUNTRIES.find(
      (country) => country.name === event.target.value
    );

    form.setFields({
      country: event.target.value,
      ...(match ? { currency: match.currency } : {}),
    });

    setFieldMessages((previous) => ({
      ...previous,
      country: "",
      currency: "",
    }));
  };

  const fieldProps = (name) => {
    const props = form.field(name);

    return {
      ...props,
      onChange: (event) => {
        props.onChange?.(event);

        setFieldMessages((previous) => ({
          ...previous,
          [name]: "",
        }));
      },
    };
  };

  const submitForm = (event) => {
    const values = Object.fromEntries(
      Object.keys(EMPTY).map((key) => [
        key,
        form.field(key).value ?? "",
      ])
    );

    const messages = {};

    for (const key of REQUIRED_FIELDS) {
      if (!String(values[key]).trim()) {
        messages[key] = `${FIELD_LABELS[key]} is required.`;
      }
    }

    if (
      values.industry &&
      !INDUSTRIES.includes(values.industry)
    ) {
      messages.industry = "Please select a valid industry.";
    }

    if (
      values.businessSize &&
      !BUSINESS_SIZES.some(
        (size) => size.value === values.businessSize
      )
    ) {
      messages.businessSize =
        "Please select a valid business size.";
    }

    if (
      values.country &&
      !COUNTRIES.some(
        (country) => country.name === values.country
      )
    ) {
      messages.country = "Please select a valid country.";
    }

    if (
      values.currency &&
      !CURRENCIES.includes(values.currency)
    ) {
      messages.currency = "Please select a valid currency.";
    }

    setFieldMessages(messages);

    if (Object.keys(messages).length > 0) {
      event.preventDefault();
      return;
    }

    form.handleSubmit(event);
  };

  const renderFieldError = (name) =>
    fieldMessages[name] ? (
      <p
        role="alert"
        style={{
          color: "#b42318",
          fontSize: "13px",
          margin: "6px 0 12px",
        }}
      >
        {fieldMessages[name]}
      </p>
    ) : null;

  const blockedRole =
    unsupportedGoogleRole || unsupportedAuditorRole;

  const blockedMessage = unsupportedAuditorRole
    ? "Auditor accounts require authorised access to a business. The auditor registration flow is not available through this form yet."
    : "Google registration for this account type is not available yet. The current Google registration service only creates Business Owner accounts.";

  return (
    <AuthLayout
      wide
      title={
        practice
          ? "Set up your practice"
          : role === "auditor"
            ? "Auditor account setup"
            : "Set up your business"
      }
      subtitle={
        practice
          ? "Tell us about your accounting practice."
          : role === "auditor"
            ? "Auditors need authorised access to review business records."
            : "These details appear on your reports and help configure your business."
      }
      steps={{ current: 3, labels: SIGNUP_STEPS }}
    >
      {blockedRole ? (
        <div>
          <Alert type="error">{blockedMessage}</Alert>

          <div className="actions">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/signup/role")}
            >
              Back to account types
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submitForm} noValidate>
          <Alert type={form.status?.type}>
            {form.status?.message}
          </Alert>

          <FormField
            label={practice ? "Practice name" : "Business name"}
            autoComplete="organization"
            {...fieldProps("businessName")}
          />
          {renderFieldError("businessName")}

          <div className="row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <FormField
                label="Registration number (optional)"
                {...fieldProps("registrationNumber")}
              />
              {renderFieldError("registrationNumber")}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <FormField
                label="VAT or tax number (optional)"
                {...fieldProps("vatNumber")}
              />
              {renderFieldError("vatNumber")}
            </div>
          </div>

          <div className="row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <FormField
                as="select"
                label="Industry"
                {...fieldProps("industry")}
              >
                <option value="">Select an industry</option>
                {INDUSTRIES.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </FormField>
              {renderFieldError("industry")}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <FormField
                as="select"
                label="Business size"
                {...fieldProps("businessSize")}
              >
                <option value="">Select a size</option>
                {BUSINESS_SIZES.map((size) => (
                  <option key={size.value} value={size.value}>
                    {size.label}
                  </option>
                ))}
              </FormField>
              {renderFieldError("businessSize")}
            </div>
          </div>

          <div className="row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <FormField
                as="select"
                label="Country"
                autoComplete="country-name"
                {...form.field("country")}
                onChange={onCountry}
              >
                <option value="">Select a country</option>
                {COUNTRIES.map((country) => (
                  <option key={country.name} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </FormField>
              {renderFieldError("country")}

              <div style={{ flex: 1, minWidth: 0 }}>
                <FormField
                  as="select"
                  label="Currency"
                  {...fieldProps("currency")}
                >
                  <option value="">Select a currency</option>
                  {CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </FormField>
                {renderFieldError("currency")}
              </div>
            </div>
          </div>

          <div className="actions">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/signup/role")}
            >
              Back
            </Button>

            <Button
              type="submit"
              loading={form.submitting}
            >
              {form.submitting
                ? "Creating your account…"
                : "Create account"}
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
