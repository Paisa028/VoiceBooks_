
import {
  Navigate,
  useNavigate,
} from "react-router-dom";

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

import {
  validateBusiness,
} from "../utils/validators.js";

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

export default function BusinessSetup() {
  const { draft, update, reset } = useSignup();

  const {
    register,
    googleRegister,
  } = useAuth();

  const navigate = useNavigate();

  const isGoogle = draft.authMethod === "google";
  const practice =
    !isGoogle && draft.role === "accountant";

  const form = useForm({
    initialValues: draft.business || EMPTY,
    validate: validateBusiness,

    onSubmit: async (business) => {
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
            business,
          });
        } catch (error) {
          if (error.status === 409) {
            update({ business });

            navigate("/signup", {
              replace: true,
              state: {
                googleNotice:
                  "This account already exists. Sign in with your existing account or link Google from your profile.",
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
            role: draft.role,
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

  if (!draft.role) {
    return <Navigate to="/signup/role" replace />;
  }

  if (isGoogle && draft.role !== "business_owner") {
    return <Navigate to="/signup/role" replace />;
  }

  const onCountry = (event) => {
    const match = COUNTRIES.find(
      (country) => country.name === event.target.value
    );

    form.setFields({
      country: event.target.value,
      ...(match && {
        currency: match.currency,
      }),
    });
  };

  return (
    <AuthLayout
      wide
      title={
        practice
          ? "Set up your practice"
          : "Set up your business"
      }
      subtitle="These details appear on your reports and are used when we connect to Sage."
      steps={{ current: 3, labels: SIGNUP_STEPS }}
    >
      <form onSubmit={form.handleSubmit} noValidate>
        <Alert type={form.status?.type}>
          {form.status?.message}
        </Alert>

        <FormField
          label={
            practice
              ? "Practice name"
              : "Business name"
          }
          autoComplete="organization"
          {...form.field("businessName")}
        />

        <div className="row">
          <FormField
            label="Registration number (optional)"
            {...form.field("registrationNumber")}
          />

          <FormField
            label="VAT or tax number (optional)"
            {...form.field("vatNumber")}
          />
        </div>

        <div className="row">
          <FormField
            as="select"
            label="Industry"
            {...form.field("industry")}
          >
            <option value="">
              Select an industry
            </option>

            {INDUSTRIES.map((industry) => (
              <option
                key={industry}
                value={industry}
              >
                {industry}
              </option>
            ))}
          </FormField>

          <FormField
            as="select"
            label="Business size"
            {...form.field("businessSize")}
          >
            <option value="">
              Select a size
            </option>

            {BUSINESS_SIZES.map((size) => (
              <option
                key={size.value}
                value={size.value}
              >
                {size.label}
              </option>
            ))}
          </FormField>
        </div>

        <div className="row">
          <FormField
            as="select"
            label="Country"
            autoComplete="country-name"
            {...form.field("country")}
            onChange={onCountry}
          >
            <option value="">
              Select a country
            </option>

            {COUNTRIES.map((country) => (
              <option
                key={country.name}
                value={country.name}
              >
                {country.name}
              </option>
            ))}
          </FormField>

          <FormField
            as="select"
            label="Currency"
            {...form.field("currency")}
          >
            <option value="">
              Select a currency
            </option>

            {CURRENCIES.map((currency) => (
              <option
                key={currency}
                value={currency}
              >
                {currency}
              </option>
            ))}
          </FormField>
        </div>

        <div className="actions">
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              navigate("/signup/role")
            }
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
    </AuthLayout>
  );
}
