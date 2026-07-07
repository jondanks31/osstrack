'use client';

import { useState } from 'react';
import { Layers, Lock, Pencil } from 'lucide-react';
import { useOss } from '@/lib/store';

export default function TopControls() {
  const mode = useOss((s) => s.mode);
  const setMode = useOss((s) => s.setMode);
  const basemap = useOss((s) => s.basemap);
  const setBasemap = useOss((s) => s.setBasemap);
  const mapOpacity = useOss((s) => s.mapOpacity);
  const setMapOpacity = useOss((s) => s.setMapOpacity);
  const [layersOpen, setLayersOpen] = useState(false);

  return (
    <div className="pointer-events-auto flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {/* view / edit segmented toggle */}
        <div className="flex rounded-2xl bg-white/85 p-1 shadow-lg ring-1 ring-black/5 backdrop-blur-xl">
          <button
            onClick={() => setMode('view')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
              mode === 'view' ? 'bg-stone-900 text-white shadow' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Lock className="size-3.5" />
            View
          </button>
          <button
            onClick={() => setMode('edit')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
              mode === 'edit' ? 'bg-stone-900 text-white shadow' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Pencil className="size-3.5" />
            Edit
          </button>
        </div>

        <button
          onClick={() => setLayersOpen((o) => !o)}
          className={`rounded-2xl p-2.5 shadow-lg ring-1 ring-black/5 backdrop-blur-xl transition ${
            layersOpen ? 'bg-stone-900 text-white' : 'bg-white/85 text-stone-600 hover:bg-white'
          }`}
          title="Layers"
        >
          <Layers className="size-4" />
        </button>
      </div>

      {layersOpen && (
        <div className="w-60 rounded-2xl bg-white/90 p-4 shadow-xl ring-1 ring-black/5 backdrop-blur-xl">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Basemap</p>
          <div className="mt-2 flex rounded-xl bg-stone-100 p-1">
            {(['satellite', 'street'] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBasemap(b)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-medium capitalize transition ${
                  basemap === b ? 'bg-white text-stone-900 shadow' : 'text-stone-500'
                }`}
              >
                {b === 'satellite' ? 'Aerial' : 'Map'}
              </button>
            ))}
          </div>
          <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-stone-400">
            Aerial visibility
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={mapOpacity}
              onChange={(e) => setMapOpacity(parseFloat(e.target.value))}
              className="mt-2 w-full accent-stone-900"
            />
          </label>
          <p className="mt-1 text-[11px] text-stone-400">
            Slide to 0 for a clean planning canvas.
          </p>
        </div>
      )}
    </div>
  );
}
