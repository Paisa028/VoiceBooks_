import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import Button from '../components/Button.jsx';
import { useSignup } from '../hooks/useSignup.js';
import { ROLES, SIGNUP_STEPS } from '../utils/constants.js';

export default function RoleSelection() {
  const { draft, update } = useSignup();
  const navigate = useNavigate();
  const [role, setRole] = useState(draft.role);
  const [error, setError] = useState('');

  if (!draft.account) return <Navigate to="/signup" replace />; // step 1 not completed

  const submit = (e) => {
    e.preventDefault();
    if (!role) return setError('Choose the account type that fits you best.');
    update({ role });
    navigate('/signup/business');
  };

  return (
    <AuthLayout
      title="How will you use VoiceBooks?"
      subtitle="Your account type decides which dashboard you see. You can't change it yourself later, so choose carefully."
      steps={{ current: 2, labels: SIGNUP_STEPS }}
    >
      <form onSubmit={submit} noValidate>
        <fieldset className="choices">
          <legend className="sr-only">Account type</legend>
          {ROLES.map((r) => (
            <label key={r.id} className={`choice${role === r.id ? ' selected' : ''}`}>
              <input
                type="radio"
                name="role"
                value={r.id}
                checked={role === r.id}
                onChange={() => { setRole(r.id); setError(''); }}
              />
              <span className="choice-title">{r.label}</span>
              <span className="choice-desc">{r.description}</span>
            </label>
          ))}
        </fieldset>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="actions">
          <Button variant="ghost" onClick={() => navigate('/signup')}>Back</Button>
          <Button type="submit">Continue</Button>
        </div>
      </form>
    </AuthLayout>
  );
}
