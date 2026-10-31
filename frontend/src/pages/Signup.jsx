
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Alert from "../components/Alert.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import Button from "../components/Button.jsx";
import FormField from "../components/FormField.jsx";
import PasswordRules from "../components/PasswordRules.jsx";

import { useSignup } from "../hooks/useSignup.js";
import { useForm } from "../hooks/useForm.js";

import { SIGNUP_STEPS } from "../utils/constants.js";
import { validateAccount } from "../utils/validators.js";

const GOOGLE_SCRIPT =
  "https://accounts.google.com/gsi/client";

const EMPTY = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
};

// Read display information only.
// The backend verifies the Google token independently.
function readGoogleProfile(credential) {
  try {
    const payload = credential.split(".")[1];
    if (!payload) return null;

    const normalized = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded = normalized.padEnd(
      Math.ceil(normalized.length / 4) * 4,
      "="
    );

    const bytes = Uint8Array.from(
      atob(padded),
      (character) => character.charCodeAt(0)
    );

    const claims = JSON.parse(
      new TextDecoder().decode(bytes)
    );

    if (
      !claims.email ||
      !claims.sub ||
      claims.email_verified !== true
    ) {
      return null;
    }

    return {
      firstName: claims.given_name || "",
      lastName: claims.family_name || "",
      email: claims.email,
    };
  } catch {
    return null;
  }
}

export default function Signup() {
  const { draft, update } = useSignup();
  const navigate = useNavigate();
  const location = useLocation();

  const googleButtonRef = useRef(null);
  const [googleError, setGoogleError] = useState("");

  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const form = useForm({
    initialValues:
      draft.authMethod === "password" && draft.account
        ? draft.account
        : EMPTY,

    validate: validateAccount,

    initialErrors: location.state?.emailTaken
      ? {
          email:
            "This email is already registered. Sign in or use a different email.",
        }
      : {},

    onSubmit: (values) => {
      update({
        account: values,
        authMethod: "password",
        googleCredential: null,
        googleCredentialAt: null,
        role: "",
      });

      navigate("/signup/role");
    },
  });

  const handleGoogleCredential = useCallback(
    (response) => {
      const credential = response?.credential;

      if (!credential) {
        setGoogleError(
          "Google did not return a valid credential."
        );
        return;
      }

      const googleProfile = readGoogleProfile(credential);

      if (!googleProfile) {
        setGoogleError(
          "Unable to read your Google profile. Please try again."
        );
        return;
      }

      setGoogleError("");

      update({
        authMethod: "google",
        googleCredential: credential,
        googleCredentialAt: Date.now(),
        account: {
          ...EMPTY,
          firstName: googleProfile.firstName,
          lastName: googleProfile.lastName,
          email: googleProfile.email,
        },
        role: "business_owner",
      });

      navigate("/signup/role");
    },
    [navigate, update]
  );

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) {
      return;
    }

    let cancelled = false;

    const renderButton = () => {
      if (
        cancelled ||
        !googleButtonRef.current ||
        !window.google?.accounts?.id
      ) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
        auto_select: false,
      });

      googleButtonRef.current.replaceChildren();

      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signup_with",
          shape: "rectangular",
          width: Math.min(
            googleButtonRef.current.clientWidth || 320,
            400
          ),
        }
      );
    };

    if (window.google?.accounts?.id) {
      renderButton();
      return () => {
        cancelled = true;
      };
    }

    let script = document.querySelector(
      `script[src="${GOOGLE_SCRIPT}"]`
    );

    if (!script) {
      script = document.createElement("script");
      script.src = GOOGLE_SCRIPT;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    script.addEventListener("load", renderButton);

    return () => {
      cancelled = true;
      script.removeEventListener("load", renderButton);
    };
  }, [googleClientId, handleGoogleCredential]);

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Tell us who you are. It takes about two minutes."
      steps={{ current: 1, labels: SIGNUP_STEPS }}
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form onSubmit={form.handleSubmit} noValidate>
        <Alert type={form.status?.type}>
          {form.status?.message}
        </Alert>

        <div className="row">
          <FormField
            label="First name"
            autoComplete="given-name"
            {...form.field("firstName")}
          />

          <FormField
            label="Last name"
            autoComplete="family-name"
            {...form.field("lastName")}
          />
        </div>

        <FormField
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          {...form.field("email")}
        />

        <FormField
          label="Phone (optional)"
          type="tel"
          autoComplete="tel"
          {...form.field("phone")}
        />

        <FormField
          label="Password"
          type="password"
          autoComplete="new-password"
          {...form.field("password")}
        />

        <PasswordRules
          password={form.values.password}
        />

        <FormField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          {...form.field("confirmPassword")}
        />

        <Button
          type="submit"
          block
          loading={form.submitting}
        >
          Continue
        </Button>
      </form>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "24px 0",
          color: "#777",
        }}
      >
        <span
          style={{
            flex: 1,
            height: 1,
            background: "#ddd",
          }}
        />
        <span>OR</span>
        <span
          style={{
            flex: 1,
            height: 1,
            background: "#ddd",
          }}
        />
      </div>

      <Alert type="error">
        {googleError || location.state?.googleNotice}
        
        </Alert>

      {googleClientId ? (
        <div
          ref={googleButtonRef}
          style={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            minHeight: 44,
          }}
        />
      ) : (
        <Alert type="error">
          Google registration is not configured.
        </Alert>
      )}
    </AuthLayout>
  );
}
