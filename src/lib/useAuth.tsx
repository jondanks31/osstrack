'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, type AuthUser } from './auth';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (email: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(auth.getSession());
    setLoading(false);
    return auth.subscribe(setUser);
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    signIn: (email, password) => auth.signIn(email, password),
    signUp: (email, password) => auth.signUp(email, password),
    signOut: async () => {
      await auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
