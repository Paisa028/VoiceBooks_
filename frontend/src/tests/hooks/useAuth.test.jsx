import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AuthProvider } from '../../context/AuthProvider.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { api } from '../../api/client.js';

// Mock the API client
vi.mock('../../api/client.js', () => ({
  api: {
    profile: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

describe('useAuth Hook', () => {
  const wrapper = ({ children }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    api.profile.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
  });

  it('should set user to null when profile call fails', async () => {
    api.profile.mockRejectedValue(new Error('Not authenticated'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });

  it('should set user when profile call succeeds', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    api.profile.mockResolvedValue({ user: mockUser });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it('should login and set user', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    api.profile.mockResolvedValue({ user: null });
    api.login.mockResolvedValue({ user: mockUser });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(api.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it('should register and set user', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    api.profile.mockResolvedValue({ user: null });
    api.register.mockResolvedValue({ user: mockUser });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const registerData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'ValidPass123',
      confirmPassword: 'ValidPass123',
      role: 'business_owner',
      business: {
        businessName: 'Test Business',
        industry: 'Technology',
        businessSize: '1',
        country: 'US',
        currency: 'USD',
      },
    };

    await act(async () => {
      await result.current.register(registerData);
    });

    expect(api.register).toHaveBeenCalledWith(registerData);
    expect(result.current.user).toEqual(mockUser);
  });

  it('should logout and clear user', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    api.profile.mockResolvedValue({ user: mockUser });
    api.logout.mockResolvedValue({});

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);

    await act(async () => {
      await result.current.logout();
    });

    expect(api.logout).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('should handle logout errors gracefully', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    api.profile.mockResolvedValue({ user: mockUser });
    api.logout.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await expect(result.current.logout()).rejects.toThrow('Network error');
    });

    expect(api.logout).toHaveBeenCalled();

    // A failed server request leaves the session active so the user can retry.
    expect(result.current.user).toEqual(mockUser);
  });

  it('should refresh user data', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    const updatedUser = {
      id: 1,
      email: 'test@example.com',
      firstName: 'Updated',
      lastName: 'User',
    };

    // First call = initial AuthProvider profile request.
    // Second call = refresh().
    api.profile
      .mockResolvedValueOnce({ user: mockUser })
      .mockResolvedValueOnce({ user: updatedUser });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(updatedUser);
    });

    expect(api.profile).toHaveBeenCalledTimes(2);
  });
});
