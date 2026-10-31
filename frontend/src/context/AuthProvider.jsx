
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api } from "../api/client.js";
import { AuthContext } from "./authState.js";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(
  /\/$/,
  ""
);

// Send a verified Google credential to the VoiceBooks backend.
async function googleRequest(path, payload) {
  const response = await fetch(`${API_URL}/api/auth/google/${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.message || "Google authentication failed."
    );

    error.status = response.status;
    error.errors = data.errors || {};

    throw error;
  }

  if (!data.user) {
    throw new Error(
      "Authentication succeeded, but no user was returned."
    );
  }

  return data.user;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the existing VoiceBooks session.
  useEffect(() => {
    let active = true;

    api
      .profile()
      .then((data) => {
        if (active) {
          setUser(data.user || null);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Traditional login.
  const login = useCallback(async (credentials) => {
    const { user: loggedInUser } = await api.login(
      credentials
    );

    setUser(loggedInUser);

    return loggedInUser;
  }, []);

  // Traditional registration.
  const register = useCallback(async (payload) => {
    const { user: registeredUser } = await api.register(
      payload
    );

    setUser(registeredUser);

    return registeredUser;
  }, []);

  // Google login for accounts already linked to VoiceBooks.
  const googleLogin = useCallback(async (credential) => {
    const loggedInUser = await googleRequest("login", {
      credential,
    });

    setUser(loggedInUser);

    return loggedInUser;
  }, []);

  // Register a new Business Owner using Google.
  const googleRegister = useCallback(
    async ({ credential, business }) => {
      if (!credential) {
        throw new Error(
          "Google authentication is required."
        );
      }

      const registeredUser = await googleRequest(
        "register",
        {
          credential,
          business,
        }
      );

      setUser(registeredUser);

      return registeredUser;
    },
    []
  );

  // End the VoiceBooks session.
  const logout = useCallback(async () => {
    await api.logout();

    setUser(null);
  }, []);

  // Reload the current profile from the backend.
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
      googleLogin,
      googleRegister,
      logout,
      refresh,
    }),
    [
      user,
      loading,
      login,
      register,
      googleLogin,
      googleRegister,
      logout,
      refresh,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
