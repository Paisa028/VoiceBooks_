
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

// Send Google credentials to the VoiceBooks backend for verification.
async function googleRequest(path, payload) {
  const response = await fetch(
    `${API_URL}/api/auth/google/${path}`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

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

  // Restore an existing session.
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

  // Sign in using email and password.
  const login = useCallback(async (credentials) => {
    const { user: loggedInUser } = await api.login(
      credentials
    );

    setUser(loggedInUser);

    return loggedInUser;
  }, []);

  // Register using email and password.
  const register = useCallback(async (payload) => {
    const { user: registeredUser } = await api.register(
      payload
    );

    setUser(registeredUser);

    return registeredUser;
  }, []);

  // Sign in using an already-linked Google account.
  const googleLogin = useCallback(async (credential) => {
    if (!credential) {
      throw new Error(
        "Google authentication is required."
      );
    }

    const loggedInUser = await googleRequest(
      "login",
      { credential }
    );

    setUser(loggedInUser);

    return loggedInUser;
  }, []);

  // Register with Google using the selected account role.
  const googleRegister = useCallback(
    async ({ credential, role, business }) => {
      if (!credential) {
        throw new Error(
          "Google authentication is required."
        );
      }

      if (!role) {
        throw new Error(
          "Please select an account type."
        );
      }

      // The current Google signup endpoint supports
      // public registration for Business Owners only.
      if (role !== "business_owner") {
        const error = new Error(
          "Google registration for this account type " +
          "requires an authorised registration flow."
        );

        error.status = 403;
        error.errors = {
          role: "This account type cannot be registered directly.",
        };

        throw error;
      }

      const registeredUser = await googleRequest(
        "register",
        {
          credential,
          role,
          business,
        }
      );

      if (registeredUser.role !== role) {
        // Never store an unexpected role in the frontend state.
        // The backend must enforce the role restriction.
        throw new Error(
          "The registered account type does not match the selected role."
        );
      }

      setUser(registeredUser);

      return registeredUser;
    },
    []
  );

  // Sign out of VoiceBooks.
  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  // Refresh the authenticated user's profile.
  const refresh = useCallback(async () => {
    const { user: refreshedUser } = await api.profile();

    setUser(refreshedUser || null);

    return refreshedUser || null;
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
