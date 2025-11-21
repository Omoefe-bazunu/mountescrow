"use client";

import { useState, useEffect, createContext, useContext } from "react";

// Don't use NEXT_PUBLIC_API_URL - use Next.js API routes instead
// This avoids CSP issues and works better with cookies

const AuthContext = createContext({
  user: null,
  loading: true,
  isEmailVerified: false,
  csrfToken: null,
  logout: async () => {},
  refresh: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [csrfToken, setCsrfToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      console.log("🔍 Checking authentication...");

      // Use Next.js API route instead of direct backend call
      const res = await fetch("/api/auth/check", {
        credentials: "include",
        cache: "no-store",
      });

      console.log("📡 Auth check status:", res.status);

      if (!res.ok) {
        console.log("❌ Not authenticated (normal on first load)");
        throw new Error("Not authenticated");
      }

      const data = await res.json();
      console.log("✅ User authenticated:", data.user);

      setUser(data.user);
      setCsrfToken(data.csrfToken);
    } catch (err) {
      console.log("No active session");
      setUser(null);
      setCsrfToken(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Use Next.js API route instead of direct backend call
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      setCsrfToken(null);
      console.log("✅ Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const isEmailVerified = user?.isVerified || false;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isEmailVerified,
        csrfToken,
        logout,
        refresh: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
