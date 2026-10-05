import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import Button from '../components/Button.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useSignup } from '../hooks/useSignup.js';
import { ONBOARDING_STEPS } from '../utils/constants.js';

export default function Onboarding() {
  const { user } = useAuth();
  const { reset } = useSignup();
  const navigate = useNavigate();

  // The account exists now, so drop the sign-up draft (it held the password in memory).
  useEffect(() => { reset(); }, [reset]);

  return (
    <AuthLayout
      title={`Welcome, ${user.firstName}`}
      subtitle={`Your ${user.roleLabel.toLowerCase()} account for ${user.business?.name ?? 'your business'} is ready. Here is how VoiceBooks works.`}
      steps={{ current: 1, labels: ONBOARDING_STEPS }}
    >
      <ol className="how">
        <li>
          <strong>Say the transaction</strong>
          <span>Describe a sale, expense or payment out loud, the way you'd tell a colleague.</span>
        </li>
        <li>
          <strong>Check the entry</strong>
          <span>VoiceBooks turns it into a ledger line with the date, amount and account filled in.</span>
        </li>
        <li>
          <strong>Send it to Sage</strong>
          <span>Approved entries sync to Sage Accounting so your books stay in one place.</span>
        </li>
      </ol>
      <Button block onClick={() => navigate('/onboarding/sage')}>Continue</Button>
    </AuthLayout>
  );
}
