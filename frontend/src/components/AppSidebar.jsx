import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const displayName =
    user?.name ||
    user?.fullName ||
    user?.email ||
    'VoiceBooks User';

  const rawRole = user?.role || 'business_owner';

  const isAccountant =
    rawRole.toLowerCase() === 'accountant';

  const roleLabel = isAccountant
    ? 'Accountant'
    : 'Business Owner';

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
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="app-sidebar">

      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">
          🎙
        </span>

        <span className="sidebar-brand-name">
          VoiceBooks
        </span>
      </div>

      <nav className="sidebar-navigation">

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
            <span className="sidebar-link-icon">
              {link.icon}
            </span>

            <span>
              {link.label}
            </span>
          </NavLink>
        ))}

      </nav>

      <div className="sidebar-bottom">

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
        >
          <span>↪</span>
          <span>Sign Out</span>
        </button>

      </div>

    </aside>
  );
}