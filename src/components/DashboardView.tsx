'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, LandPlot, LogOut, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import {
  createDesign,
  deleteDesign,
  duplicateDesign,
  listDesigns,
  renameDesign,
} from '@/lib/designs';
import { acresOf, fmtAcres } from '@/lib/geo';
import type { Plan } from '@/lib/types';

export default function DashboardView() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const designs = useMemo<Plan[]>(
    () => (user ? listDesigns(user.id) : []),
    // re-list whenever a mutation bumps `tick`
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, tick],
  );

  function newDesign() {
    if (!user) return;
    const d = createDesign(user.id, { name: `Design ${designs.length + 1}` });
    router.push(`/design/${d.id}`);
  }

  function duplicate(id: string) {
    if (!user) return;
    duplicateDesign(id, user.id);
    refresh();
  }

  function rename(d: Plan) {
    const name = window.prompt('Rename design', d.name);
    if (name && name.trim()) {
      renameDesign(d.id, name.trim());
      refresh();
    }
  }

  function remove(d: Plan) {
    if (window.confirm(`Delete “${d.name}”? This can’t be undone.`)) {
      deleteDesign(d.id);
      refresh();
    }
  }

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  return (
    <div className="min-h-dvh bg-[#f2f1ec]">
      <header className="border-b border-stone-200/70 bg-white/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight text-stone-900">
            Oss<span className="text-emerald-700">Track</span>
          </span>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-stone-500 sm:inline">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-stone-600 transition hover:bg-stone-100"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Your designs</h1>
            <p className="mt-1 text-sm text-stone-500">
              {designs.length} {designs.length === 1 ? 'design' : 'designs'}
            </p>
          </div>
          <button
            onClick={newDesign}
            className="flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            <Plus className="size-4" />
            New design
          </button>
        </div>

        {designs.length === 0 ? (
          <div className="mt-10 grid place-items-center rounded-3xl border border-dashed border-stone-300 py-20 text-center">
            <LandPlot className="size-8 text-stone-300" />
            <p className="mt-3 text-sm font-medium text-stone-600">No designs yet</p>
            <p className="mt-1 text-sm text-stone-400">Create your first plot layout to get started.</p>
            <button
              onClick={newDesign}
              className="mt-4 flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
            >
              <Plus className="size-4" />
              New design
            </button>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {designs.map((d) => (
              <li
                key={d.id}
                className="group flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:shadow-md"
              >
                <button onClick={() => router.push(`/design/${d.id}`)} className="flex-1 text-left">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <LandPlot className="size-5" />
                  </div>
                  <p className="mt-3 truncate font-semibold text-stone-900">{d.name}</p>
                  <p className="mt-0.5 text-sm text-stone-400">
                    {d.boundary ? fmtAcres(acresOf(d.boundary)) : 'No boundary yet'} ·{' '}
                    {d.features.length} {d.features.length === 1 ? 'element' : 'elements'}
                  </p>
                  <p className="mt-1 text-xs text-stone-400">
                    Updated {new Date(d.updatedAt).toLocaleDateString('en-GB')}
                  </p>
                </button>
                <div className="mt-4 flex items-center gap-1 border-t border-stone-100 pt-3">
                  <button
                    onClick={() => rename(d)}
                    title="Rename"
                    className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => duplicate(d.id)}
                    title="Duplicate"
                    className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                  >
                    <Copy className="size-4" />
                  </button>
                  <button
                    onClick={() => remove(d)}
                    title="Delete"
                    className="ml-auto rounded-lg p-2 text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
