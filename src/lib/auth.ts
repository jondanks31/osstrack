import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

function toUser(u: User | null | undefined): AuthUser | null {
  if (!u) return null;
  const email = u.email ?? '';
  const name = (u.user_metadata?.name as string) || email.split('@')[0] || 'Rider';
  return { id: u.id, email, name };
}

export const auth = {
  async getSession(): Promise<AuthUser | null> {
    const { data } = await supabase.auth.getSession();
    return toUser(data.session?.user);
  },

  /**
   * Returns the user only when a session exists. With "Confirm email" enabled the
   * user is created but no session is issued until they confirm — we return null so
   * the UI can show a "check your email" state.
   */
  async signUp(email: string, password: string): Promise<AuthUser | null> {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data.session ? toUser(data.user) : null;
  },

  async signIn(email: string, password: string): Promise<AuthUser | null> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return toUser(data.user);
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },

  subscribe(listener: (user: AuthUser | null) => void): () => void {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      listener(toUser(session?.user));
    });
    return () => data.subscription.unsubscribe();
  },
};
