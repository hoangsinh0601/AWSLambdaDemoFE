"use client";

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../lib/api";
import type { AuthResponse, AuthUser } from "../lib/types";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const persistAuth = ({ token, user }: AuthResponse) => {
  window.localStorage.setItem("auth_token", token);
  window.localStorage.setItem("auth_user", JSON.stringify(user));
};

const clearPersistedAuth = () => {
  window.localStorage.removeItem("auth_token");
  window.localStorage.removeItem("auth_user");
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const rawUser = window.localStorage.getItem("auth_user");
    const token = window.localStorage.getItem("auth_token");

    if (!rawUser || !token) {
      setIsLoading(false);
      return;
    }

    try {
      setUser(JSON.parse(rawUser) as AuthUser);
    } catch {
      clearPersistedAuth();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshProfile = async () => {
    const profile = await api.getProfile();
    startTransition(() => {
      setUser(profile);
      window.localStorage.setItem("auth_user", JSON.stringify(profile));
    });
  };

  const login = async (payload: { email: string; password: string }) => {
    const result = await api.login(payload);
    persistAuth(result);
    startTransition(() => {
      setUser(result.user);
    });
  };

  const register = async (payload: { name: string; email: string; password: string }) => {
    const result = await api.register(payload);
    persistAuth(result);
    startTransition(() => {
      setUser(result.user);
    });
  };

  const logout = () => {
    clearPersistedAuth();
    startTransition(() => {
      setUser(null);
    });
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "ADMIN",
      login,
      register,
      logout,
      refreshProfile,
    }),
    [isLoading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
