'use client';

import { Trash2, X } from 'lucide-react';
import { useOss } from '@/lib/store';
import { KINDS } from '@/lib/kinds';
import { featureStats } from '@/lib/geo';

export default function FeaturePanel() {
  const selectedId = useOss((s) => s.selectedId);
  const feature = useOss((s) => s.plan.features.find((f) => f.properties.id === selectedId));
  const mode = useOss((s) => s.mode);
  const select = useOss((s) => s.select);
  const updateProps = useOss((s) => s.updateFeatureProps);
  const removeFeature = useOss((s) => s.removeFeature);

  if (!feature) return null;
  const { id, kind, name, notes, widthM } = feature.properties;
  const meta = KINDS[kind];
  const stats = featureStats(feature);
  const editable = mode === 'edit';

  return (
    <div className="pointer-events-auto w-[min(92vw,320px)] rounded-2xl bg-white/90 p-4 shadow-xl ring-1 ring-black/5 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <span className="size-2.5 rounded-full" style={{ background: meta.color }} />
        <span className="flex-1 text-xs font-medium uppercase tracking-wide text-stone-400">
          {meta.label}
        </span>
        <button
          onClick={() => select(null)}
          className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100"
        >
          <X className="size-4" />
        </button>
      </div>

      {editable ? (
        <input
          value={name}
          onChange={(e) => updateProps(id, { name: e.target.value })}
          className="mt-2 w-full rounded-lg bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/60"
        />
      ) : (
        <p className="mt-2 text-sm font-semibold text-stone-900">{name}</p>
      )}

      {stats && <p className="mt-2 text-sm tabular-nums text-stone-500">{stats}</p>}

      {kind === 'track' && editable && (
        <label className="mt-3 block text-xs text-stone-500">
          Track width: <span className="font-medium text-stone-800">{widthM ?? 4} m</span>
          <input
            type="range"
            min={2}
            max={10}
            step={0.5}
            value={widthM ?? 4}
            onChange={(e) => updateProps(id, { widthM: parseFloat(e.target.value) })}
            className="mt-1 w-full accent-stone-900"
          />
        </label>
      )}

      {editable ? (
        <textarea
          value={notes}
          onChange={(e) => updateProps(id, { notes: e.target.value })}
          placeholder="Notes — drainage, grazing quality, jobs to do…"
          rows={3}
          className="mt-3 w-full resize-none rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/60"
        />
      ) : (
        notes && <p className="mt-3 whitespace-pre-wrap text-sm text-stone-600">{notes}</p>
      )}

      {editable && (
        <button
          onClick={() => removeFeature(id)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          <Trash2 className="size-4" />
          Delete
        </button>
      )}
    </div>
  );
}
