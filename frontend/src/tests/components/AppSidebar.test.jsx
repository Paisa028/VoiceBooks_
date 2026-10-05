import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { it, expect, vi } from 'vitest';
import AppSidebar from '../../components/AppSidebar.jsx';
const { logout } = vi.hoisted(() => ({ logout: vi.fn() }));
vi.mock('../../hooks/useAuth.js', () => ({ useAuth: () => ({ user: {
  firstName: 'Test', lastName: 'Owner', role: 'business_owner', roleLabel: 'Business owner'
}, logout }) }));
it('provides branded navigation, user identity and actionable sign-out feedback', async () => {
  logout.mockRejectedValueOnce(new Error('Server unavailable')).mockResolvedValueOnce();
  render(<MemoryRouter><AppSidebar /></MemoryRouter>);
  expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'VoiceBooks home' })).toHaveAttribute('href', '/dashboard');
  expect(screen.getByText('Test Owner')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Server unavailable');
  fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }));
  await waitFor(() => expect(logout).toHaveBeenCalledTimes(2));
});
