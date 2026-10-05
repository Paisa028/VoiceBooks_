import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import Alert from '../components/Alert.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import Button from '../components/Button.jsx';
import FormField from '../components/FormField.jsx';
import { useForm } from '../hooks/useForm.js';
import { validateForgot } from '../utils/validators.js';

const RESEND_SECONDS = 60; // matches the server's one-email-per-minute limit

export default function ForgotPassword() {
  const [sent, setSent] = useState(null); // { email, message, expiresInMinutes, devResetLink? }
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendNote, setResendNote] = useState(null); // { type, message }

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const form = useForm({
    initialValues: { email: '' },
    validate: validateForgot,
    onSubmit: async (values) => {
      const email = values.email.trim();
      const data = await api.forgotPassword({ email });
      setSent({ ...data, email });
      setResendNote(null);
      setCooldown(RESEND_SECONDS);
    },
  });

  const resend = async () => {
    setResending(true);
    setResendNote(null);
    try {
      const data = await api.forgotPassword({ email: sent.email });
      setSent({ ...data, email: sent.email });
      setCooldown(RESEND_SECONDS);
      setResendNote({ type: 'success', message: 'We sent the email again.' });
    } catch (err) {
      setResendNote({ type: 'error', message: err.message });
    } finally {
      setResending(false);
    }
  };

  const changeEmail = () => {
    setSent(null);
    setResendNote(null);
    setCooldown(0);
  };

  // The server only returns devResetLink when no SMTP server is configured and it is not production.
  const devLink = sent?.devResetLink && new URL(sent.devResetLink);

  if (sent) {
    return (
      <AuthLayout title="Check your email" footer={<Link to="/login">Back to sign in</Link>}>
        <p className="lede">
          If an account exists for <strong className="break">{sent.email}</strong>, we've sent a link to choose a new
          password. It works once and expires in {sent.expiresInMinutes} minutes.
        </p>
        <p className="muted">Can't find it? Check your spam folder.</p>

        {devLink && (
          <Alert type="info">
            Development only: no email server is set up, so <Link to={devLink.pathname + devLink.search}>open the reset link here</Link>.
          </Alert>
        )}
        <Alert type={resendNote?.type}>{resendNote?.message}</Alert>

        <div className="actions">
          <Button variant="ghost" onClick={changeEmail} disabled={resending}>Use a different email</Button>
          <Button onClick={resend} loading={resending} disabled={cooldown > 0}>
            {resending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email you signed up with and we'll send you a link to choose a new password."
      footer={<Link to="/login">Back to sign in</Link>}
    >
      <form onSubmit={form.handleSubmit} noValidate>
        <Alert type={form.status?.type}>{form.status?.message}</Alert>
        <FormField label="Email" type="email" inputMode="email" autoComplete="email" {...form.field('email')} />
        <Button type="submit" block loading={form.submitting}>
          {form.submitting ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </AuthLayout>
  );
}
