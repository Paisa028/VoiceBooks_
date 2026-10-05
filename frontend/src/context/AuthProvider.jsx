import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { AuthContext } from './authState.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session on page load.
  useEffect(() => {
    api
      .profile()
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = useCallback(async (credentials) => {
    const { user: loggedInUser } = await api.login(credentials);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (payload) => {
    const { user: registeredUser } = await api.register(payload);
    setUser(registeredUser);
    return registeredUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Clear local authentication state even if the request fails.
    } finally {
      setUser(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    const { user: refreshedUser } = await api.profile();
    setUser(refreshedUser);
    return refreshedUser;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refresh,
    }),
    [user, loading, login, register, logout, refresh]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}