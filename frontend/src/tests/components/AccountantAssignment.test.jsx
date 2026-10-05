import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AccountantAssignment from '../../components/AccountantAssignment.jsx';
import { api } from '../../api/client.js';
vi.mock('../../api/client.js', () => ({ api: { getAccountant: vi.fn(), setAccountant: vi.fn() } }));

describe('Accountant access settings', () => {
  it('loads the assignment and lets the owner revoke access', async () => {
    api.getAccountant.mockResolvedValue({ accountant: { email: 'accountant@example.com' } });
    api.setAccountant.mockResolvedValue({ accountant: null });
    render(<AccountantAssignment />);
    const input = await screen.findByLabelText('Accountant email');
    await waitFor(() => expect(input).toHaveValue('accountant@example.com'));
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save accountant access' }));
    await waitFor(() => expect(api.setAccountant).toHaveBeenCalledWith({ email: '' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Accountant access removed');
  });
  it('shows assignment failures without claiming success', async () => {
    api.getAccountant.mockResolvedValue({ accountant: null });
    api.setAccountant.mockRejectedValue(new Error('No accountant account matches this email.'));
    render(<AccountantAssignment />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save accountant access' })).toBeEnabled());
    fireEvent.change(screen.getByLabelText('Accountant email'), { target: { value: 'missing@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save accountant access' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No accountant account matches');
  });
});
