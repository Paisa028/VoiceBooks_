import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { FullPageSpinner } from './Spinner.jsx';

// Signed-in only. Optionally restrict by role: <ProtectedRoute roles={['admin']}>
export function ProtectedRoute({ roles, requireOnboarded = true, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (requireOnboarded && !user.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

// Signed-out only (login, sign-up...). Signed-in users are sent on to the app.
export function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;
  if (user) {
    const target = location.state?.from?.pathname || (user.onboardingCompleted ? '/dashboard' : '/onboarding');
    return <Navigate to={target} replace />;
  }
  return children;
}
