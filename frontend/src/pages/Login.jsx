import { Link, useLocation } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import Button from '../components/Button.jsx';
import FormField from '../components/FormField.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useForm } from '../hooks/useForm.js';
import { validateLogin } from '../utils/validators.js';

export default function Login() {
  const { login } = useAuth();
  const location = useLocation();

  // On success the auth state changes and <GuestRoute> redirects to the right place
  // (onboarding, the page the person came from, or their dashboard).
  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: validateLogin,
    onSubmit: (values) => login(values),
  });

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back. Enter your details to open your books."
      footer={<>New to VoiceBooks? <Link to="/signup">Create an account</Link></>}
    >
      <Alert type="success">{location.state?.notice}</Alert>
      <form onSubmit={form.handleSubmit} noValidate>
        <Alert type={form.status?.type}>{form.status?.message}</Alert>
        <FormField label="Email" type="email" inputMode="email" autoComplete="email" {...form.field('email')} />
        <FormField label="Password" type="password" autoComplete="current-password" {...form.field('password')} />
        <p className="inline-link"><Link to="/forgot-password">Forgot your password?</Link></p>
        <Button type="submit" block loading={form.submitting}>
          {form.submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  );
}
