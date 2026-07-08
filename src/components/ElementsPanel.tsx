'use client';

import { ChevronLeft, Layers3, Pencil } from 'lucide-react';
import { useOss } from '@/lib/store';
import { KINDS } from '@/lib/kinds';
import { acresOf, featureStats, fmtAcres } from '@/lib/geo';

export default function ElementsPanel() {
  const open = useOss((s) => s.elementsOpen);
  const setOpen = useOss((s) => s.setElementsOpen);
  const boundary = useOss((s) => s.plan.boundary);
  const features = useOss((s) => s.plan.features);
  const selectedId = useOss((s) => s.selectedId);
  const select = useOss((s) => s.select);
  const mode = useOss((s) => s.mode);
  const editingBoundary = useOss((s) => s.editingBoundary);
  const setEditingBoundary = useOss((s) => s.setEditingBoundary);

  if (!boundary) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Show elements"
        className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-white/85 px-3 py-2.5 text-sm font-medium text-stone-700 shadow-xl ring-1 ring-black/5 backdrop-blur-xl transition hover:bg-white"
      >
        <Layers3 className="size-4" />
        <span className="tabular-nums">{features.length + 1}</span>
      </button>
    );
  }

  return (
    <div className="pointer-events-auto ml-[68px] flex max-h-[70vh] w-60 flex-col rounded-2xl bg-white/90 shadow-xl ring-1 ring-black/5 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Elements</p>
        <button
          onClick={() => setOpen(false)}
          title="Collapse"
          className="rounded-lg p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
        >
          <ChevronLeft className="size-4" />
        </button>
      </div>

      <div className="overflow-y-auto p-1.5">
        {/* boundary row */}
        <div
          className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-2 ${
            editingBoundary ? 'bg-stone-900/5 ring-1 ring-stone-900/10' : ''
          }`}
        >
          <span className="size-2.5 shrink-0 rounded-sm border-2 border-stone-900" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-stone-900">Boundary</p>
            <p className="truncate text-xs text-stone-400">{fmtAcres(acresOf(boundary))}</p>
          </div>
          {mode === 'edit' && (
            <button
              onClick={() => setEditingBoundary(!editingBoundary)}
              title={editingBoundary ? 'Finish editing' : 'Edit outline'}
              className={`rounded-lg p-1.5 transition ${
                editingBoundary
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-400 opacity-0 group-hover:opacity-100 hover:bg-stone-100 hover:text-stone-700'
              }`}
            >
              <Pencil className="size-3.5" />
            </button>
          )}
        </div>

        {features.length === 0 && (
          <p className="px-2.5 py-3 text-xs text-stone-400">
            Nothing added yet. Use the toolbar to draw fields, tracks and more.
          </p>
        )}

        {features.map((f) => {
          const meta = KINDS[f.properties.kind];
          const active = f.properties.id === selectedId;
          const stats = featureStats(f);
          return (
            <button
              key={f.properties.id}
              onClick={() => select(active ? null : f.properties.id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
                active ? 'bg-stone-900/5 ring-1 ring-stone-900/10' : 'hover:bg-stone-100'
              }`}
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: meta.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-900">{f.properties.name}</p>
                <p className="truncate text-xs text-stone-400">
                  {meta.label}
                  {stats ? ` · ${stats}` : ''}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
