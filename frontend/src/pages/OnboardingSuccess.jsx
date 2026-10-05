import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { ONBOARDING_STEPS, SAGE_STATUS_LABELS } from '../utils/constants.js';

export default function OnboardingSuccess() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const b = user.business;

  return (
    <AuthLayout
      title="You're all set"
      subtitle="Your account is ready. Here's what we saved."
      steps={{ current: 3, labels: ONBOARDING_STEPS }}
    >
      <Alert type="success">Account created and onboarding complete.</Alert>
      <dl className="summary">
        <div><dt>Name</dt><dd>{user.firstName} {user.lastName}</dd></div>
        <div><dt>Account type</dt><dd>{user.roleLabel}</dd></div>
        <div><dt>{user.role === 'accountant' ? 'Practice' : 'Business'}</dt><dd>{b?.name}</dd></div>
        <div><dt>Country and currency</dt><dd>{b?.country}, {b?.currency}</dd></div>
        <div><dt>Sage</dt><dd>{SAGE_STATUS_LABELS[b?.sageStatus] ?? 'Not connected'}</dd></div>
      </dl>
      <Button block onClick={() => navigate('/dashboard', { replace: true })}>Go to dashboard</Button>
    </AuthLayout>
  );
}
