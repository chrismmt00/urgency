"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AuthContext = createContext({
  user: null,
  loading: true,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  authModalOpen: false,
  authModalMode: "signin",
  setUser: () => {},
  updateUser: () => {},
  logout: async () => {},
  refreshCurrentUser: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("signin");

  const refreshCurrentUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) {
        setUser(null);
      } else {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error("Failed to fetch current user", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCurrentUser();
  }, [refreshCurrentUser]);

  const openAuthModal = useCallback((mode = "signin") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Failed to logout", err);
    } finally {
      setUser(null);
      setAuthModalOpen(false);
    }
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      openAuthModal,
      closeAuthModal,
      authModalOpen,
      authModalMode,
      logout,
      updateUser,
      refreshCurrentUser,
    }),
    [
      user,
      loading,
      openAuthModal,
      closeAuthModal,
      authModalOpen,
      authModalMode,
      logout,
      updateUser,
      refreshCurrentUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
