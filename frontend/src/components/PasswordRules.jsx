import { PASSWORD_RULES } from '../utils/validators.js';

export default function PasswordRules({ password }) {
  return (
    <ul className="rules" aria-label="Password requirements">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(password);
        return (
          <li key={r.id} className={ok ? 'ok' : ''}>
            <span aria-hidden="true">{ok ? '✓' : '○'}</span> {r.label}
            <span className="sr-only">{ok ? ' (met)' : ' (not met)'}</span>
          </li>
        );
      })}
    </ul>
  );
}
