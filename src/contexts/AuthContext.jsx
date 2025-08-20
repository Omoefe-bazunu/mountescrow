"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

const AuthContext = createContext({
  user: null,
  wallet: null,
  loading: true,
  isEmailVerified: false,
  isKycApproved: false,
  refreshWallet: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWallet = async (uid) => {
    try {
      console.log("Fetching wallet for UID:", uid);
      const idToken = await auth.currentUser.getIdToken();

      const response = await fetch(`/api/wallet/refresh-balance?uid=${uid}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        // If wallet doesn't exist (404), that's okay - user just hasn't created one yet
        if (response.status === 404) {
          console.log("Wallet not found - user hasn't created one yet");
          setWallet(null);
          return;
        }
        throw new Error("Failed to fetch wallet");
      }

      const walletData = await response.json();
      console.log("Wallet fetched:", walletData);
      setWallet(walletData);
    } catch (error) {
      console.error("Failed to fetch wallet:", error);
      setWallet(null);
      // Don't re-throw for 404s or wallet not found scenarios
      if (
        !error.message.includes("404") &&
        !error.message.includes("not found")
      ) {
        throw error;
      }
    }
  };

  const refreshWallet = async () => {
    if (user) {
      console.log("Refreshing wallet for UID:", user.uid);
      await fetchWallet(user.uid);
    }
  };

  useEffect(() => {
    console.log("Setting up onAuthStateChanged listener");
    console.log("Firebase auth instance:", auth);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("onAuthStateChanged fired, currentUser:", currentUser);
      console.log("Current user UID:", currentUser?.uid);
      console.log("Current user email:", currentUser?.email);
      console.log("Current user emailVerified:", currentUser?.emailVerified);

      if (currentUser) {
        try {
          await currentUser.getIdToken(true);
          await currentUser.reload();
          const refreshedUser = auth.currentUser;

          console.log("User reloaded successfully");
          console.log("Refreshed user:", refreshedUser);
          console.log("Refreshed emailVerified:", refreshedUser?.emailVerified);

          setUser(refreshedUser);
        } catch (error) {
          console.error("Error reloading user:", error);
          setUser(currentUser);
        }
      } else {
        console.log("No user found, setting user to null");
        setUser(null);
      }

      setLoading(false);
    });

    const timeout = setTimeout(() => {
      console.warn("Auth loading timeout, forcing loading to false");
      console.log("Auth state at timeout - user:", auth.currentUser);
      setLoading(false);
    }, 10000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (user) {
      console.log("User available, fetching wallet for:", user.uid);
      fetchWallet(user.uid).catch((error) => {
        // Only log actual errors, not expected 404s
        if (
          !error.message.includes("404") &&
          !error.message.includes("not found")
        ) {
          console.error("Unexpected wallet fetch error:", error);
        }
      });
    } else {
      console.log("No user, clearing wallet");
      setWallet(null);
    }
  }, [user]);

  const isEmailVerified = !!user?.emailVerified;
  const isKycApproved = wallet?.kycStatus === "approved";

  const value = {
    user,
    wallet,
    loading,
    isEmailVerified,
    isKycApproved,
    refreshWallet,
  };

  console.log("AuthProvider state:", {
    user: user
      ? { uid: user.uid, email: user.email, emailVerified: user.emailVerified }
      : null,
    wallet,
    loading,
    isEmailVerified,
    isKycApproved,
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
