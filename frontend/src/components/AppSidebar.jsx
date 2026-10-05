import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useState } from 'react';
import Logo from './Logo.jsx';
import Alert from './Alert.jsx';

export default function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');

  const displayName =
    user?.name ||
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    'VoiceBooks User';

  const rawRole = user?.role || 'business_owner';

  const isAccountant =
    rawRole.toLowerCase() === 'accountant';

  const roleLabel = user?.roleLabel || rawRole.replaceAll('_', ' ');

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();

  const businessOwnerLinks = [
    {
      to: '/dashboard',
      icon: '⌂',
      label: 'Dashboard',
    },
    {
      to: '/transactions/new',
      icon: '◉',
      label: 'Record Transaction',
    },
    {
      to: '/transactions',
      icon: '☷',
      label: 'Transactions',
    },
    {
      to: '/ledger',
      icon: '▣',
      label: 'Ledger',
    },
    {
      to: '/reports',
      icon: '▥',
      label: 'Reports',
    },
    {
      to: '/integrations',
      icon: '↗',
      label: 'Integrations',
    },
    {
      to: '/settings',
      icon: '⚙',
      label: 'Settings',
    },
  ];

  const accountantLinks = [
    {
      to: '/accountant',
      icon: '⌂',
      label: 'Dashboard',
    },
    {
      to: '/accountant/clients',
      icon: '♙',
      label: 'Clients',
    },
    {
      to: '/accountant/approved',
      icon: '✓',
      label: 'Approved',
    },
    {
      to: '/accountant/returned',
      icon: '↩',
      label: 'Returned',
    },
    {
      to: '/accountant/profile',
      icon: '◎',
      label: 'Profile',
    },
  ];

  const links = isAccountant
    ? accountantLinks
    : businessOwnerLinks;

  async function handleLogout() {
    setSigningOut(true);
    setError('');
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      setError(error.message || 'Could not sign out. Please try again.');
    } finally { setSigningOut(false); }
  }

  return (
    <aside className="app-sidebar">

      <NavLink to={isAccountant ? '/accountant' : '/dashboard'} className="sidebar-brand" aria-label="VoiceBooks home"><Logo /></NavLink>

      <nav className="sidebar-navigation" aria-label="Main navigation">

        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={
              link.to === '/dashboard' ||
              link.to === '/accountant'
            }
            className={({ isActive }) =>
              isActive
                ? 'sidebar-link active'
                : 'sidebar-link'
            }
          >
            <span className="sidebar-link-icon" aria-hidden="true">
              {link.icon}
            </span>

            <span>
              {link.label}
            </span>
          </NavLink>
        ))}

      </nav>

      <div className="sidebar-bottom">
        <Alert type="error">{error}</Alert>

        <div className="sidebar-user">

          <div className="sidebar-avatar">
            {initials || 'VB'}
          </div>

          <div className="sidebar-user-details">

            <strong>
              {displayName}
            </strong>

            <span>
              {roleLabel}
            </span>

          </div>

        </div>

        <button
          type="button"
          className="sidebar-signout"
          onClick={handleLogout}
          disabled={signingOut}
          aria-busy={signingOut}
          aria-label={signingOut ? 'Signing out' : 'Sign Out'}
        >
          <span>↪</span>
          <span>{signingOut ? 'Signing out…' : 'Sign Out'}</span>
        </button>

      </div>

    </aside>
  );
}
