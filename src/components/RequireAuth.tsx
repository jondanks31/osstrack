'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';

/** Redirects to /login when there is no session. Wraps auth-only routes. */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="grid h-dvh place-items-center bg-[#f2f1ec] text-stone-400">Loading…</div>
    );
  }
  return <>{children}</>;
}
