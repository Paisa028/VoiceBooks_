import { Navigate, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import Button from '../components/Button.jsx';
import FormField from '../components/FormField.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useSignup } from '../hooks/useSignup.js';
import { useForm } from '../hooks/useForm.js';
import { BUSINESS_SIZES, COUNTRIES, CURRENCIES, INDUSTRIES, SIGNUP_STEPS } from '../utils/constants.js';
import { validateBusiness } from '../utils/validators.js';

const EMPTY = {
  businessName: '', registrationNumber: '', vatNumber: '', industry: '', businessSize: '', country: '', currency: '',
};

export default function BusinessSetup() {
  const { draft, update } = useSignup();
  const { register } = useAuth();
  const navigate = useNavigate();
  const practice = draft.role === 'accountant';

  const form = useForm({
    initialValues: draft.business || EMPTY,
    validate: validateBusiness,
    onSubmit: async (business) => {
      try {
        // Server: validate, hash password, create user + business profile, set the JWT cookie.
        await register({ ...draft.account, role: draft.role, business });
      } catch (err) {
        if (err.status === 409) {
          update({ business });
          navigate('/signup', { replace: true, state: { emailTaken: true } });
          return;
        }
        throw err;
      }
      navigate('/onboarding', { replace: true });
    },
  });

  if (!draft.account) return <Navigate to="/signup" replace />;
  if (!draft.role) return <Navigate to="/signup/role" replace />;

  const onCountry = (e) => {
    const match = COUNTRIES.find((c) => c.name === e.target.value);
    form.setFields({ country: e.target.value, ...(match && { currency: match.currency }) });
  };

  return (
    <AuthLayout
      wide
      title={practice ? 'Set up your practice' : 'Set up your business'}
      subtitle="These details appear on your reports and are used when we connect to Sage."
      steps={{ current: 3, labels: SIGNUP_STEPS }}
    >
      <form onSubmit={form.handleSubmit} noValidate>
        <Alert type={form.status?.type}>{form.status?.message}</Alert>
        <FormField
          label={practice ? 'Practice name' : 'Business name'}
          autoComplete="organization"
          {...form.field('businessName')}
        />
        <div className="row">
          <FormField label="Registration number (optional)" {...form.field('registrationNumber')} />
          <FormField label="VAT or tax number (optional)" {...form.field('vatNumber')} />
        </div>
        <div className="row">
          <FormField as="select" label="Industry" {...form.field('industry')}>
            <option value="">Select an industry</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </FormField>
          <FormField as="select" label="Business size" {...form.field('businessSize')}>
            <option value="">Select a size</option>
            {BUSINESS_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </FormField>
        </div>
        <div className="row">
          <FormField as="select" label="Country" autoComplete="country-name" {...form.field('country')} onChange={onCountry}>
            <option value="">Select a country</option>
            {COUNTRIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </FormField>
          <FormField as="select" label="Currency" {...form.field('currency')}>
            <option value="">Select a currency</option>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </FormField>
        </div>
        <div className="actions">
          <Button variant="ghost" onClick={() => navigate('/signup/role')}>Back</Button>
          <Button type="submit" loading={form.submitting}>
            {form.submitting ? 'Creating your account…' : 'Create account'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
