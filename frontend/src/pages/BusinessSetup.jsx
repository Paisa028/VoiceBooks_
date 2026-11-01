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
  const [professionalSubmitting, setProfessionalSubmitting] = useState(false);
  const [professionalError, setProfessionalError] = useState("");

  const role = draft.role;
  const isGoogle = draft.authMethod === "google";
  const isProfessional = role === "accountant" || role === "auditor";
  // Google registration currently supports business owners only.
  const unsupportedGoogleRole = false;

  const form = useForm({
    initialValues: draft.business || EMPTY,
    validate: validateBusiness,
    onSubmit: async (business) => {
      if (role !== "business_owner") {
        throw new Error("This form is only for Business Owners.");
      }

      if (isGoogle) {
        const credentialAge = Date.now() - (draft.googleCredentialAt || 0);
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
            role: "business_owner",
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
            role: "business_owner",
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

async function handleProfessionalRegistration(event) {
  event.preventDefault();

  if (professionalSubmitting) return;

  setProfessionalSubmitting(true);
  setProfessionalError("");

  try {
    if (isGoogle) {
      const credentialAge =
        Date.now() - (draft.googleCredentialAt || 0);

      if (
        !draft.googleCredential ||
        credentialAge < 0 ||
        credentialAge > GOOGLE_CREDENTIAL_MAX_AGE_MS
      ) {
        navigate("/signup", {
          replace: true,
          state: {
            googleNotice:
              "Your Google sign-in has expired. Please continue with Google again.",
          },
        });
        return;
      }

      await googleRegister({
        credential: draft.googleCredential,
        role,
      });
    } else {
      await register({
        ...draft.account,
        role,
      });
    }

    reset();

    navigate(
  role === "auditor" ? "/auditor" : "/accountant",
  { replace: true }
);

  } 
  catch (error) {
    setProfessionalError(
      error.message || "Unable to create your account."
    );
  } finally {
    setProfessionalSubmitting(false);
  }
}

 if (!draft.account) {
    return <Navigate to="/signup" replace />;
  }
  if (!role) {
    return <Navigate to="/signup/role" replace />;
  }

  const onCountry = (event) => {
    const match = COUNTRIES.find((country) => country.name === event.target.value);
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
        setFieldMessages((previous) => ({ ...previous, [name]: "" }));
      },
    };
  };

  const submitForm = (event) => {
    const values = Object.fromEntries(
      Object.keys(EMPTY).map((key) => [key, form.field(key).value ?? ""])
    );
    const messages = {};

    for (const key of REQUIRED_FIELDS) {
      if (!String(values[key]).trim()) {
        messages[key] = `${FIELD_LABELS[key]} is required.`;
      }
    }
    if (values.industry && !INDUSTRIES.includes(values.industry)) {
      messages.industry = "Please select a valid industry.";
    }
    if (
      values.businessSize &&
      !BUSINESS_SIZES.some((size) => size.value === values.businessSize)
    ) {
      messages.businessSize = "Please select a valid business size.";
    }
    if (values.country && !COUNTRIES.some((country) => country.name === values.country)) {
      messages.country = "Please select a valid country.";
    }
    if (values.currency && !CURRENCIES.includes(values.currency)) {
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
      <p role="alert" style={{ color: "#b42318", fontSize: 13, margin: "6px 0 12px" }}>
        {fieldMessages[name]}
      </p>
    ) : null;

  return (
    <AuthLayout
      wide
      title={
        role === "accountant"
          ? "Create your Accountant account"
          : role === "auditor"
            ? "Create your Auditor account"
            : "Set up your business"
      }
      subtitle={
        role === "accountant"
          ? "Set up your professional workspace. Client access is granted separately."
          : role === "auditor"
            ? "Create your independent audit workspace. Business access requires authorisation."
            : "These details appear on your reports and help configure your business."
      }
      steps={{ current: 3, labels: SIGNUP_STEPS }}
    >
      {unsupportedGoogleRole ? (
        <div>
          <Alert type="error">
            Google registration for this account type is not available yet.
            Please return to signup and use email and password.
          </Alert>
          <div className="actions">
            <Button type="button" variant="ghost" onClick={() => navigate("/signup")}>
              Back to signup
            </Button>
          </div>
        </div>
      ) : isProfessional ? (
        <form onSubmit={handleProfessionalRegistration}>
          {professionalError && <Alert type="error">{professionalError}</Alert>}
          <div className="professional-signup-card">
            <div className="professional-signup-symbol" aria-hidden="true">
              {role === "auditor" ? "◎" : "▣"}
            </div>
            <h2>{role === "auditor" ? "Your Auditor Workspace" : "Your Accountant Workspace"}</h2>
            <p>
              {role === "auditor"
                ? "Review authorised financial records, examine audit trails and document findings."
                : "Manage your accounting workspace and work with authorised clients."}
            </p>
            <div className="professional-signup-summary">
              <p><strong>Name:</strong> {draft.account.firstName} {draft.account.lastName}</p>
              <p><strong>Email:</strong> {draft.account.email}</p>
              <p><strong>Account type:</strong> {role === "auditor" ? "Auditor" : "Accountant"}</p>
            </div>
            <p className="professional-signup-note">
              Business access requires authorisation from the business owner.
              Creating this account does not grant access to financial records.
            </p>
          </div>
          <div className="actions">
            <Button type="button" variant="ghost" onClick={() => navigate("/signup/role")}>
              Back
            </Button>
            <Button type="submit" loading={professionalSubmitting}>
              {professionalSubmitting ? "Creating your account…" : "Create professional account"}
            </Button>
          </div>
        </form>
      ) : (
         <form onSubmit={submitForm} noValidate>
          <Alert type={form.status?.type}>{form.status?.message}</Alert>
          <FormField
            label="Business name"
            autoComplete="organization"
            {...fieldProps("businessName")}
          />
          {renderFieldError("businessName")}
          <div className="row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <FormField label="Registration number (optional)" {...fieldProps("registrationNumber")} />
              {renderFieldError("registrationNumber")}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <FormField label="VAT or tax number (optional)" {...fieldProps("vatNumber")} />
              {renderFieldError("vatNumber")}
            </div>
          </div>
          <div className="row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <FormField as="select" label="Industry" {...fieldProps("industry")}>
                <option value="">Select an industry</option>
                {INDUSTRIES.map((industry) => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </FormField>
              {renderFieldError("industry")}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <FormField as="select" label="Business size" {...fieldProps("businessSize")}>
                <option value="">Select a size</option>
                {BUSINESS_SIZES.map((size) => (
                  <option key={size.value} value={size.value}>{size.label}</option>
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
                  <option key={country.name} value={country.name}>{country.name}</option>
                ))}
              </FormField>
              {renderFieldError("country")}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <FormField as="select" label="Currency" {...fieldProps("currency")}>
                <option value="">Select a currency</option>
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </FormField>
              {renderFieldError("currency")}
            </div>
          </div>
          <div className="actions">
            <Button type="button" variant="ghost" onClick={() => navigate("/signup/role")}>
              Back
            </Button>
            <Button type="submit" loading={form.submitting}>
              {form.submitting ? "Creating your account…" : "Create account"}
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
