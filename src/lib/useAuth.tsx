'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, type AuthUser } from './auth';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  /** resolves to the user when a session exists, or null when email confirmation is pending */
  signIn: (email: string, password: string) => Promise<AuthUser | null>;
  signUp: (email: string, password: string) => Promise<AuthUser | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    auth.getSession().then((u) => {
      if (!mounted) return;
      setUser(u);
      setLoading(false);
    });
    const unsubscribe = auth.subscribe((u) => {
      if (mounted) setUser(u);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    signIn: (email, password) => auth.signIn(email, password),
    signUp: (email, password) => auth.signUp(email, password),
    signOut: () => auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
