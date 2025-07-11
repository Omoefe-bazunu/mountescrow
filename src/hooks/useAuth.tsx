
"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import React from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserWallet, UserWallet } from '@/services/fcmb.service';

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
      const userWallet = await getUserWallet(uid);
      setWallet(userWallet);
    } catch (error) {
      console.error("Failed to fetch wallet in AuthProvider:", error);
      setWallet(null);
    }
  };
  
  const refreshWallet = async () => {
    if (user) {
      await fetchWallet(user.uid);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        // If wallet info isn't already loaded, fetch it
        if (!wallet || wallet.userId !== currentUser.uid) {
            await fetchWallet(currentUser.uid);
        }
      } else {
        setUser(null);
        setWallet(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [wallet]);

  const isEmailVerified = !!user?.emailVerified;
  const isKycApproved = !!wallet;

  const value = { user, wallet, loading, isEmailVerified, isKycApproved, refreshWallet };

  return React.createElement(AuthContext.Provider, { value: value }, children);
};

export const useAuth = () => {
  return useContext(AuthContext);
};
