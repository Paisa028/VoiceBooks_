import { Link } from 'react-router-dom';
import LedgerSheet from './LedgerSheet.jsx';
import Logo from './Logo.jsx';
import Stepper from './Stepper.jsx';

// Shared shell for every pre-dashboard screen. steps = { current, labels }
export default function AuthLayout({ title, subtitle, steps, footer, wide = false, children }) {
  return (
    <div className="auth">
      <aside className="brand">
        <Link to="/login" className="brand-logo" aria-label="VoiceBooks">
          <Logo />
        </Link>
        <div className="brand-body">
          <h2>Say what you spent. VoiceBooks does the bookkeeping.</h2>
          <LedgerSheet />
        </div>
        <p className="brand-foot">Voice-enabled bookkeeping for your business</p>
      </aside>

      <main className="auth-main">
        <div className={`auth-card${wide ? ' wide' : ''}`}>
          {steps && <Stepper {...steps} />}
          <h1>{title}</h1>
          {subtitle && <p className="lede">{subtitle}</p>}
          {children}
          {footer && <p className="auth-footer">{footer}</p>}
        </div>
      </main>
    </div>
  );
}
