"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserWallet, UserWallet } from "@/services/flutterwave.service";

interface AuthContextType {
  user: User | null;
  wallet: UserWallet | null;
  loading: boolean;
  isEmailVerified: boolean;
  isKycApproved: boolean;
  refreshWallet: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  wallet: null,
  loading: true,
  isEmailVerified: false,
  isKycApproved: false,
  refreshWallet: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWallet = async (uid: string) => {
    try {
      console.log("Fetching wallet for UID:", uid);
      const userWallet = await getUserWallet(uid);
      console.log("Wallet fetched:", userWallet);
      setWallet(userWallet);
    } catch (error) {
      console.error("Failed to fetch wallet:", error);
      setWallet(null);
    }
  };

  const refreshWallet = async () => {
    if (user) {
      console.log("Refreshing wallet for UID:", user.uid);
      await fetchWallet(user.uid);
    }
  };

  // Handle auth state changes
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
          // Force token refresh to ensure we have the latest user data
          await currentUser.getIdToken(true);

          // Reload user to get the latest data
          await currentUser.reload();

          // Get the refreshed user from auth.currentUser
          const refreshedUser = auth.currentUser;

          console.log("User reloaded successfully");
          console.log("Refreshed user:", refreshedUser);
          console.log("Refreshed emailVerified:", refreshedUser?.emailVerified);

          setUser(refreshedUser);
        } catch (error) {
          console.error("Error reloading user:", error);
          // Still set the user even if reload fails
          setUser(currentUser);
        }
      } else {
        console.log("No user found, setting user to null");
        setUser(null);
      }

      setLoading(false);
    });

    // Timeout as fallback
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

  // Fetch wallet when user is available
  useEffect(() => {
    if (user) {
      console.log("User available, fetching wallet for:", user.uid);
      fetchWallet(user.uid);
    } else {
      console.log("No user, clearing wallet");
      setWallet(null);
    }
  }, [user]);

  const isEmailVerified = !!user?.emailVerified;
  const isKycApproved = !!wallet;

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
    wallet: wallet ? "present" : "null",
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
