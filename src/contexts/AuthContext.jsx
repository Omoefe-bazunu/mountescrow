// "use client";

// import { useState, useEffect, createContext, useContext } from "react";

// // Don't use NEXT_PUBLIC_API_URL - use Next.js API routes instead
// // This avoids CSP issues and works better with cookies

// const AuthContext = createContext({
//   user: null,
//   loading: true,
//   isEmailVerified: false,
//   csrfToken: null,
//   logout: async () => {},
//   refresh: async () => {},
// });

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [csrfToken, setCsrfToken] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const fetchUser = async () => {
//     try {
//       console.log("🔍 Checking authentication...");

//       // Use Next.js API route instead of direct backend call
//       const res = await fetch("/api/auth/check", {
//         credentials: "include",
//         cache: "no-store",
//       });

//       console.log("📡 Auth check status:", res.status);

//       if (!res.ok) {
//         console.log("❌ Not authenticated (normal on first load)");
//         throw new Error("Not authenticated");
//       }

//       const data = await res.json();
//       console.log("✅ User authenticated:", data.user);

//       setUser(data.user);
//       setCsrfToken(data.csrfToken);
//     } catch (err) {
//       console.log("No active session");
//       setUser(null);
//       setCsrfToken(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const logout = async () => {
//     try {
//       // Use Next.js API route instead of direct backend call
//       await fetch("/api/auth/logout", {
//         method: "POST",
//         credentials: "include",
//       });
//       setUser(null);
//       setCsrfToken(null);
//       console.log("✅ Logged out successfully");
//     } catch (error) {
//       console.error("Logout error:", error);
//     }
//   };

//   useEffect(() => {
//     fetchUser();
//   }, []);

//   const isEmailVerified = user?.isVerified || false;

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         loading,
//         isEmailVerified,
//         csrfToken,
//         logout,
//         refresh: fetchUser,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// };

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
  login: async () => {}, // New login helper
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

      // Kill the session flag so this tab is considered "closed"
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("mount_escrow_active_session");
      }

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
      // 1. STRICT CHECK: Is this a restored tab?
      // If the session flag is missing, we assume the tab was closed.
      const isTabActive = sessionStorage.getItem("mount_escrow_active_session");

      if (!isTabActive) {
        console.log("🔒 Tab session missing. Verifying status...");
        // We throw immediately to trigger the catch block which handles the cleanup/logout
        throw new Error("Session expired (Tab closed)");
      }

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

      // If the error was specifically because of the missing tab flag, ensure we force logout
      if (err.message === "Session expired (Tab closed)") {
        await logout("/");
        return;
      }

      setUser(null);
      setCsrfToken(null);
      // Ensure storage is clean
      sessionStorage.removeItem("mount_escrow_active_session");
    } finally {
      setLoading(false);
    }
  };

  // --- NEW: LOGIN HELPER ---
  // You MUST call this from your Login Page instead of just refreshing
  const login = async () => {
    // 1. Mark this tab as "Active"
    sessionStorage.setItem("mount_escrow_active_session", "true");
    // 2. Now check the user (it will pass the check now)
    await fetchUser();
  };

  // --- INACTIVITY TIMER ---
  useEffect(() => {
    if (!user) return;

    const timeoutMinutes =
      process.env.NEXT_PUBLIC_INACTIVITY_TIMEOUT_MINUTES || 1;
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
        login, // Expose the new login function
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
