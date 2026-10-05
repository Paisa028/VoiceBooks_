import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from '../../context/AuthProvider.jsx';
import { useAuth } from '../../hooks/useAuth.js';

// Mock the API client
vi.mock('../../api/client.js', () => ({
  api: {
    profile: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn()
  }
}));

const api = require('../../api/client.js').api;

describe('useAuth Hook', () => {
  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    api.profile.mockResolvedValue({ user: null });
    
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
  });

  it('should set user to null when profile call fails', async () => {
    api.profile.mockRejectedValue(new Error('Not authenticated'));
    
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should set user when profile call succeeds', async () => {
    const mockUser = { id: 1, email: 'test@example.com', firstName: 'Test', lastName: 'User' };
    api.profile.mockResolvedValue({ user: mockUser });
    
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual(mockUser);
  });

  it('should login and set user', async () => {
    const mockUser = { id: 1, email: 'test@example.com', firstName: 'Test', lastName: 'User' };
    api.profile.mockResolvedValue({ user: null });
    api.login.mockResolvedValue({ user: mockUser });
    
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });
    await waitForNextUpdate(); // Wait for initial profile call

    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password123' });
    });

    expect(api.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
    expect(result.current.user).toEqual(mockUser);
  });

  it('should register and set user', async () => {
    const mockUser = { id: 1, email: 'test@example.com', firstName: 'Test', lastName: 'User' };
    api.profile.mockResolvedValue({ user: null });
    api.register.mockResolvedValue({ user: mockUser });
    
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });
    await waitForNextUpdate(); // Wait for initial profile call

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
        currency: 'USD'
      }
    };

    await act(async () => {
      await result.current.register(registerData);
    });

    expect(api.register).toHaveBeenCalledWith(registerData);
    expect(result.current.user).toEqual(mockUser);
  });

  it('should logout and clear user', async () => {
    const mockUser = { id: 1, email: 'test@example.com', firstName: 'Test', lastName: 'User' };
    api.profile.mockResolvedValue({ user: mockUser });
    api.logout.mockResolvedValue({});
    
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });
    await waitForNextUpdate(); // Wait for initial profile call

    expect(result.current.user).toEqual(mockUser);

    await act(async () => {
      await result.current.logout();
    });

    expect(api.logout).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('should handle logout errors gracefully', async () => {
    const mockUser = { id: 1, email: 'test@example.com', firstName: 'Test', lastName: 'User' };
    api.profile.mockResolvedValue({ user: mockUser });
    api.logout.mockRejectedValue(new Error('Network error'));
    
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });
    await waitForNextUpdate(); // Wait for initial profile call

    await act(async () => {
      await result.current.logout();
    });

    expect(api.logout).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('should refresh user data', async () => {
    const mockUser = { id: 1, email: 'test@example.com', firstName: 'Test', lastName: 'User' };
    const updatedUser = { id: 1, email: 'test@example.com', firstName: 'Updated', lastName: 'User' };
    
    api.profile.mockResolvedValue({ user: mockUser });
    api.profile.mockResolvedValueOnce({ user: updatedUser });
    
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });
    await waitForNextUpdate(); // Wait for initial profile call

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.user).toEqual(updatedUser);
  });
});
