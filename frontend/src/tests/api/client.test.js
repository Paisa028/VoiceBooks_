import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError, api } from '../../api/client.js';

describe('API Client', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.clearAllMocks();
  });

  describe('ApiError class', () => {
    it('should create error with message, status, and errors', () => {
      const error = new ApiError('Test error', 400, { field: 'error message' });
      
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
      expect(error.errors).toEqual({ field: 'error message' });
    });

    it('should create error with default empty errors', () => {
      const error = new ApiError('Test error', 500);
      
      expect(error.errors).toEqual({});
    });
  });

  describe('request function', () => {
    it('should make GET request', async () => {
      const mockResponse = { ok: true, json: () => Promise.resolve({ data: 'test' }) };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await api.profile();
      
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/profile', {
        method: 'GET',
        credentials: 'include',
        headers: undefined,
        body: undefined
      });
      expect(result).toEqual({ data: 'test' });
    });

    it('should make POST request with body', async () => {
      const mockResponse = { ok: true, json: () => Promise.resolve({ user: { id: 1 } }) };
      global.fetch.mockResolvedValue(mockResponse);

      const payload = { email: 'test@example.com', password: 'password123' };
      const result = await api.login(payload);
      
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      expect(result).toEqual({ user: { id: 1 } });
    });

    it('should handle successful response', async () => {
      const mockResponse = { 
        ok: true, 
        json: () => Promise.resolve({ message: 'Success' }) 
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await api.logout();
      
      expect(result).toEqual({ message: 'Success' });
    });

    it('should throw ApiError for non-ok response', async () => {
      const mockResponse = { 
        ok: false, 
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized', errors: { email: 'Invalid' } })
      };
      global.fetch.mockResolvedValue(mockResponse);

      await expect(api.login({ email: 'test@example.com', password: 'wrong' }))
        .rejects.toThrow(ApiError);

      try {
        await api.login({ email: 'test@example.com', password: 'wrong' });
      } catch (error) {
        expect(error.message).toBe('Unauthorized');
        expect(error.status).toBe(401);
        expect(error.errors).toEqual({ email: 'Invalid' });
      }
    });

    it('should throw ApiError for network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      await expect(api.profile())
        .rejects.toThrow(ApiError);

      try {
        await api.profile();
      } catch (error) {
        expect(error.message).toBe('Cannot reach the server. Check your connection and try again.');
        expect(error.status).toBe(0);
      }
    });

    it('should handle empty JSON response', async () => {
      const mockResponse = { 
        ok: true, 
        json: () => Promise.reject(new Error('Invalid JSON'))
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await api.profile();
      
      expect(result).toEqual({});
    });

    it('should use default message for server errors without message', async () => {
      const mockResponse = { 
        ok: false, 
        status: 500,
        json: () => Promise.resolve({})
      };
      global.fetch.mockResolvedValue(mockResponse);

      try {
        await api.profile();
      } catch (error) {
        expect(error.message).toBe('Something went wrong. Try again.');
      }
    });
  });

  describe('API methods', () => {
    it('should have register method', () => {
      expect(typeof api.register).toBe('function');
    });

    it('should have login method', () => {
      expect(typeof api.login).toBe('function');
    });

    it('should have forgotPassword method', () => {
      expect(typeof api.forgotPassword).toBe('function');
    });

    it('should have resetPassword method', () => {
      expect(typeof api.resetPassword).toBe('function');
    });

    it('should have verifyResetToken method', () => {
      expect(typeof api.verifyResetToken).toBe('function');
    });

    it('should have logout method', () => {
      expect(typeof api.logout).toBe('function');
    });

    it('should have profile method', () => {
      expect(typeof api.profile).toBe('function');
    });

    it('should have setSage method', () => {
      expect(typeof api.setSage).toBe('function');
    });

    it('should have completeOnboarding method', () => {
      expect(typeof api.completeOnboarding).toBe('function');
    });

    it('should have adminUsers method', () => {
      expect(typeof api.adminUsers).toBe('function');
    });
  });
});
