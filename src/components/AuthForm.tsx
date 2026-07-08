'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { createDesign, getScratch } from '@/lib/designs';

function AuthFormInner({ mode }: { mode: 'login' | 'signup' }) {
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signup = mode === 'signup';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter an email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const user = signup ? await signUp(email, password) : await signIn(email, password);
      // carry an anonymous scratch design into the new account, if requested
      if (params.get('import')) {
        const scratch = getScratch();
        const design = createDesign(user.id, {
          name: scratch.name || 'My land',
          boundary: scratch.boundary,
          features: scratch.features,
        });
        router.replace(`/design/${design.id}`);
      } else {
        router.replace(params.get('redirect') || '/dashboard');
      }
    } catch {
      setError('Something went wrong — please try again.');
      setBusy(false);
    }
  }

  const importing = params.get('import');
  const otherHref = signup
    ? `/login${importing ? '?import=1' : ''}`
    : `/signup${importing ? '?import=1' : ''}`;

  return (
    <div className="w-[min(92vw,400px)] rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">
      <Link href="/" className="text-lg font-bold tracking-tight text-stone-900">
        Oss<span className="text-emerald-700">Track</span>
      </Link>
      <h1 className="mt-4 text-xl font-semibold text-stone-900">
        {signup ? 'Create your free account' : 'Welcome back'}
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        {signup
          ? 'Save your designs and manage every layout in one place.'
          : 'Sign in to your designs.'}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoFocus
          className="w-full rounded-xl border-0 bg-stone-100 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/70"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-xl border-0 bg-stone-100 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/70"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-50"
        >
          {busy && <LoaderCircle className="size-4 animate-spin" />}
          {signup ? 'Sign up — free' : 'Sign in'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-stone-500">
        {signup ? 'Already have an account?' : "Don't have an account?"}{' '}
        <Link href={otherHref} className="font-medium text-stone-900 hover:underline">
          {signup ? 'Sign in' : 'Sign up'}
        </Link>
      </p>
      <p className="mt-4 text-center text-[11px] text-stone-400">
        Demo auth — any email and password works. Cloud accounts coming soon.
      </p>
    </div>
  );
}

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-[#f2f1ec] p-4">
      <Suspense fallback={<div className="text-stone-400">Loading…</div>}>
        <AuthFormInner mode={mode} />
      </Suspense>
    </div>
  );
}
