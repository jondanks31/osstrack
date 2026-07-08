'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Download, LandPlot, LogOut, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import {
  createDesign,
  deleteDesign,
  duplicateDesign,
  listDesigns,
  renameDesign,
} from '@/lib/designs';
import { downloadDesign, readDesignFile } from '@/lib/designFile';
import { acresOf, fmtAcres } from '@/lib/geo';
import type { Plan } from '@/lib/types';

export default function DashboardView() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [designs, setDesigns] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    listDesigns()
      .then(setDesigns)
      .catch(() => setDesigns([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function newDesign() {
    const d = await createDesign({ name: `Design ${designs.length + 1}` });
    router.push(`/design/${d.id}`);
  }

  async function duplicate(id: string) {
    await duplicateDesign(id);
    load();
  }

  async function remove(d: Plan) {
    if (window.confirm(`Delete “${d.name}”? This can’t be undone.`)) {
      await deleteDesign(d.id);
      load();
    }
  }

  // ── inline rename ──
  function startRename(d: Plan) {
    setEditingId(d.id);
    setEditValue(d.name);
  }
  async function commitRename() {
    const id = editingId;
    if (!id) return;
    const name = editValue.trim();
    setEditingId(null);
    const current = designs.find((d) => d.id === id);
    if (name && current && name !== current.name) {
      await renameDesign(id, name);
      load();
    }
  }

  // ── import ──
  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-importing the same file
    if (!file) return;
    setImportError(null);
    try {
      const seed = await readDesignFile(file);
      const d = await createDesign(seed);
      router.push(`/design/${d.id}`);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Could not import that file.');
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
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Your designs</h1>
            <p className="mt-1 text-sm text-stone-500">
              {loading
                ? 'Loading…'
                : `${designs.length} ${designs.length === 1 ? 'design' : 'designs'}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              onChange={onImportFile}
              className="hidden"
            />
            <button
              onClick={() => fileInput.current?.click()}
              className="flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-sm font-medium text-stone-700 ring-1 ring-stone-200 transition hover:bg-stone-50"
            >
              <Upload className="size-4" />
              Import
            </button>
            <button
              onClick={newDesign}
              className="flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
            >
              <Plus className="size-4" />
              New design
            </button>
          </div>
        </div>

        {importError && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{importError}</p>
        )}

        {loading ? (
          <div className="mt-10 grid place-items-center py-20 text-sm text-stone-400">
            Loading your designs…
          </div>
        ) : designs.length === 0 ? (
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
                <button
                  onClick={() => router.push(`/design/${d.id}`)}
                  className="flex-1 text-left"
                  disabled={editingId === d.id}
                >
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <LandPlot className="size-5" />
                  </div>
                  {editingId === d.id ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="mt-3 w-full rounded-lg bg-stone-100 px-2 py-1 font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/60"
                    />
                  ) : (
                    <p className="mt-3 truncate font-semibold text-stone-900">{d.name}</p>
                  )}
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
                    onClick={() => startRename(d)}
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
                    onClick={() => downloadDesign(d)}
                    title="Export backup (.json)"
                    className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                  >
                    <Download className="size-4" />
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
