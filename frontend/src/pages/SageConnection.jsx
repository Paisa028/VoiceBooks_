import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import Alert from '../components/Alert.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import Button from '../components/Button.jsx';
import FormField from '../components/FormField.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useForm } from '../hooks/useForm.js';
import { ONBOARDING_STEPS, SAGE_REGIONS } from '../utils/constants.js';
import { validateSage } from '../utils/validators.js';

export default function SageConnection() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [skipping, setSkipping] = useState(false);
  const [skipError, setSkipError] = useState('');

  const finish = async (payload) => {
    await api.setSage(payload);
    await api.completeOnboarding();
    await refresh(); // user.onboardingCompleted is now true
    navigate('/onboarding/success', { replace: true });
  };

  const guess = user.business?.sageRegion || (SAGE_REGIONS.includes(user.business?.country) ? user.business.country : '');
  const form = useForm({
    initialValues: { region: guess },
    validate: validateSage,
    onSubmit: (values) => finish({ action: 'connect', region: values.region }),
  });

  const skip = async () => {
    setSkipping(true);
    setSkipError('');
    try {
      await finish({ action: 'skip' });
    } catch (err) {
      setSkipError(err.message);
      setSkipping(false);
    }
  };

  return (
    <AuthLayout
      title="Connect Sage"
      subtitle="VoiceBooks sends approved entries to Sage Accounting. You'll sign in to Sage to give access, and VoiceBooks never sees your Sage password."
      steps={{ current: 2, labels: ONBOARDING_STEPS }}
    >
      <form onSubmit={form.handleSubmit} noValidate>
        <Alert type={form.status?.type || (skipError ? 'error' : undefined)}>
          {form.status?.message || skipError}
        </Alert>
        <FormField
          as="select"
          label="Where is your Sage account based?"
          hint="Pick the region you use to sign in to Sage."
          {...form.field('region')}
        >
          <option value="">Select a region</option>
          {SAGE_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </FormField>
        <div className="actions">
          <Button variant="ghost" onClick={skip} loading={skipping} disabled={form.submitting}>
            {skipping ? 'Skipping…' : 'Skip for now'}
          </Button>
          <Button type="submit" loading={form.submitting} disabled={skipping}>
            {form.submitting ? 'Connecting…' : 'Connect Sage'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
