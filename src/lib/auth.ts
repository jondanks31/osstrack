/**
 * Auth abstraction. Today this is a local mock (no real security — any email/password
 * is accepted and the "session" lives in localStorage) so the whole flow works with no
 * backend. A Supabase-backed provider will implement this same surface later.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

const KEY = 'osstrack-auth';
type Listener = (user: AuthUser | null) => void;
const listeners = new Set<Listener>();

function read(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
}

function write(user: AuthUser | null) {
  if (typeof window === 'undefined') return;
  if (user) localStorage.setItem(KEY, JSON.stringify(user));
  else localStorage.removeItem(KEY);
  listeners.forEach((l) => l(user));
}

// Deterministic id from the email so signing back in re-attaches the same designs.
function userFromEmail(email: string): AuthUser {
  const clean = email.trim().toLowerCase();
  return { id: `local-${clean}`, email: clean, name: clean.split('@')[0] || 'Rider' };
}

export const auth = {
  getSession(): AuthUser | null {
    return read();
  },
  async signUp(email: string, _password: string): Promise<AuthUser> {
    const user = userFromEmail(email);
    write(user);
    return user;
  },
  async signIn(email: string, _password: string): Promise<AuthUser> {
    const user = userFromEmail(email);
    write(user);
    return user;
  },
  async signOut(): Promise<void> {
    write(null);
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
