import { Link, useLocation, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import Button from '../components/Button.jsx';
import FormField from '../components/FormField.jsx';
import PasswordRules from '../components/PasswordRules.jsx';
import { useSignup } from '../hooks/useSignup.js';
import { useForm } from '../hooks/useForm.js';
import { SIGNUP_STEPS } from '../utils/constants.js';
import { validateAccount } from '../utils/validators.js';

const EMPTY = { firstName: '', lastName: '', phone: '', email: '', password: '', confirmPassword: '' };

export default function Signup() {
  const { draft, update } = useSignup();
  const navigate = useNavigate();
  const location = useLocation();

  const form = useForm({
    initialValues: draft.account || EMPTY,
    validate: validateAccount,
    // Sent back here by the last step when the server says the email is taken.
    initialErrors: location.state?.emailTaken
      ? { email: 'This email is already registered. Sign in or use a different email.' }
      : {},
    onSubmit: (values) => {
      update({ account: values });
      navigate('/signup/role');
    },
  });

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Tell us who you are. It takes about two minutes."
      steps={{ current: 1, labels: SIGNUP_STEPS }}
      footer={<>Already have an account? <Link to="/login">Sign in</Link></>}
    >
      <form onSubmit={form.handleSubmit} noValidate>
        <Alert type={form.status?.type}>{form.status?.message}</Alert>
        <div className="row">
          <FormField label="First name" autoComplete="given-name" {...form.field('firstName')} />
          <FormField label="Last name" autoComplete="family-name" {...form.field('lastName')} />
        </div>
        <FormField label="Email" type="email" inputMode="email" autoComplete="email" {...form.field('email')} />
        <FormField label="Phone (optional)" type="tel" autoComplete="tel" {...form.field('phone')} />
        <FormField label="Password" type="password" autoComplete="new-password" {...form.field('password')} />
        <PasswordRules password={form.values.password} />
        <FormField label="Confirm password" type="password" autoComplete="new-password" {...form.field('confirmPassword')} />
        <Button type="submit" block>Continue</Button>
      </form>
    </AuthLayout>
  );
}
