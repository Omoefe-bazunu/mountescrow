"use client";
import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext({
  user: null,
  loading: true,
  isEmailVerified: false,
  csrfToken: null,
  logout: async () => {},
  refresh: async () => {},
  login: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [csrfToken, setCsrfToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const idleTimerRef = useRef(null);

  // --- LOGOUT ---
  const logout = useCallback(async () => {
    try {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      setCsrfToken(null);
      console.log("✅ Logged out successfully");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [router]);

  // --- MAIN AUTH CHECK ---
  const fetchUser = async () => {
    try {
      console.log("🔍 Checking authentication...");
      const res = await fetch("/api/auth/check", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Not authenticated");
      }

      const data = await res.json();
      console.log("✅ User authenticated:", data.user);

      setUser(data.user);
      setCsrfToken(data.csrfToken);
    } catch (err) {
      console.log("Auth Check Failed:", err.message);
      setUser(null);
      setCsrfToken(null);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIN HELPER ---
  const login = async () => {
    await fetchUser();
  };

  // --- INACTIVITY TIMER ---
  useEffect(() => {
    if (!user) return;

    const timeoutMinutes =
      process.env.NEXT_PUBLIC_INACTIVITY_TIMEOUT_MINUTES || 15;
    const timeoutMs = timeoutMinutes * 60 * 1000;

    const resetTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        console.log("💤 User inactive. Logging out...");
        logout();
      }, timeoutMs);
    };

    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
    ];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [user, logout]);

  // --- INITIAL MOUNT ---
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
        login,
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
