
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import Alert from "../components/Alert.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import Button from "../components/Button.jsx";
import FormField from "../components/FormField.jsx";

import { useAuth } from "../hooks/useAuth.js";
import { useForm } from "../hooks/useForm.js";
import { validateLogin } from "../utils/validators.js";

const GOOGLE_SCRIPT =
  "https://accounts.google.com/gsi/client";

export default function Login() {
  const { login, refresh } = useAuth();
  const location = useLocation();

  const googleButtonRef = useRef(null);
  const googleBusyRef = useRef(false);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: validateLogin,
    onSubmit: (values) => login(values),
  });

  const handleGoogleCredential = useCallback(
    async (response) => {
      if (googleBusyRef.current) return;

      if (!response?.credential) {
        setGoogleError(
          "Google authentication did not return a credential."
        );
        return;
      }

      googleBusyRef.current = true;
      setGoogleLoading(true);
      setGoogleError("");

      try {
        const apiUrl =
          import.meta.env.VITE_API_URL || "";

        const result = await fetch(
          `${apiUrl}/api/auth/google/login`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              credential: response.credential,
            }),
          }
        );

      const responseText = await result.text();
      let data = {};

if (responseText) {
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Invalid server response (HTTP ${result.status}).`
    );
  }
}

if (!result.ok) {
  throw new Error(
    data.message ||
      `Google sign-in failed (HTTP ${result.status}).`
  );
}


        // Refresh AuthContext to trigger GuestRoute redirect.
        await refresh();
      } catch (error) {
        setGoogleError(
          error.message ||
            "Google sign-in failed. Please try again."
        );
      } finally {
        googleBusyRef.current = false;
        setGoogleLoading(false);
      }
    },
    [refresh]
  );

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) {
      return;
    }

    let cancelled = false;

    function renderGoogleButton() {
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
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: Math.min(
            googleButtonRef.current.clientWidth || 320,
            400
          ),
        }
      );
    }

    if (window.google?.accounts?.id) {
      renderGoogleButton();

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

    script.addEventListener("load", renderGoogleButton);

    return () => {
      cancelled = true;
      script.removeEventListener(
        "load",
        renderGoogleButton
      );
    };
  }, [googleClientId, handleGoogleCredential]);

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back. Enter your details to open your books."
      footer={
        <>
          New to VoiceBooks?{" "}
          <Link to="/signup">Create an account</Link>
        </>
      }
    >
      <Alert type="success">
        {location.state?.notice}
      </Alert>

      <form onSubmit={form.handleSubmit} noValidate>
        <Alert type={form.status?.type}>
          {form.status?.message}
        </Alert>

        <FormField
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          {...form.field("email")}
        />

        <FormField
          label="Password"
          type="password"
          autoComplete="current-password"
          {...form.field("password")}
        />

        <p className="inline-link">
          <Link to="/forgot-password">
            Forgot your password?
          </Link>
        </p>

        <Button
          type="submit"
          block
          loading={form.submitting}
        >
          {form.submitting
            ? "Signing in…"
            : "Sign in"}
        </Button>
      </form>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          margin: "24px 0",
          color: "#777",
        }}
      >
        <span
          style={{
            height: "1px",
            background: "#ddd",
            flex: 1,
          }}
        />

        <span>OR</span>

        <span
          style={{
            height: "1px",
            background: "#ddd",
            flex: 1,
          }}
        />
      </div>

      <Alert type="error">
        {googleError}
      </Alert>

      {googleClientId ? (
        <>
          <div
            ref={googleButtonRef}
            style={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              minHeight: "44px",
            }}
          />

          {googleLoading && (
            <p
              style={{
                textAlign: "center",
                marginTop: "12px",
              }}
            >
              Signing in with Google…
            </p>
          )}
        </>
      ) : (
        <Alert type="error">
          Google Sign-In is not configured.
        </Alert>
      )}
    </AuthLayout>
  );
}
