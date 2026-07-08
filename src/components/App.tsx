'use client';

import { useEffect, useState } from 'react';
import MapCanvas from './MapCanvas';
import SearchCard from './SearchCard';
import TraceCard from './TraceCard';
import Toolbar from './Toolbar';
import FeaturePanel from './FeaturePanel';
import TopControls from './TopControls';
import RotationControl from './RotationControl';
import SideNav from './SideNav';
import ExportPanel from './ExportPanel';
import ElementsPanel from './ElementsPanel';
import { useOss } from '@/lib/store';
import { Pencil } from 'lucide-react';
import { acresOf, fmtAcres } from '@/lib/geo';

export default function App() {
  const boundary = useOss((s) => s.plan.boundary);
  const searchTarget = useOss((s) => s.searchTarget);
  const mode = useOss((s) => s.mode);
  const selectedId = useOss((s) => s.selectedId);
  const editingBoundary = useOss((s) => s.editingBoundary);
  const setEditingBoundary = useOss((s) => s.setEditingBoundary);
  const [hydrated, setHydrated] = useState(false);

  const phase = boundary ? 'plan' : searchTarget ? 'trace' : 'search';

  // touch devices open read-only so taps can't move anything
  useEffect(() => {
    setHydrated(true);
    if (useOss.getState().plan.boundary && window.matchMedia('(pointer: coarse)').matches) {
      useOss.getState().setMode('view');
    }
  }, []);

  if (!hydrated) {
    return <div className="grid h-dvh place-items-center bg-[#f2f1ec] text-stone-400">Loading OssTrack…</div>;
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#f2f1ec]">
      <MapCanvas />

      {/* overlay layer — individual cards re-enable pointer events */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <SideNav />
        </div>

        {phase === 'search' && (
          <div className="absolute inset-0 grid place-items-center">
            <SearchCard />
          </div>
        )}

        {phase === 'trace' && (
          <div className="absolute left-1/2 top-4 -translate-x-1/2">
            <TraceCard />
          </div>
        )}

        {phase === 'plan' && (
          <>
            <div className="absolute right-3 top-3">
              <TopControls />
            </div>
            <div className="absolute left-3 top-3">
              <ElementsPanel />
            </div>
            {mode === 'edit' && !editingBoundary && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <Toolbar />
              </div>
            )}
            {editingBoundary && (
              <div className="absolute left-1/2 top-4 -translate-x-1/2">
                <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-2.5 shadow-xl ring-1 ring-black/5 backdrop-blur-xl">
                  <span className="text-sm text-stone-700">
                    Drag the points to adjust your outline. Click a midpoint to add one.
                  </span>
                  <button
                    onClick={() => setEditingBoundary(false)}
                    className="rounded-xl bg-stone-900 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-stone-700"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
            {selectedId && !editingBoundary && (
              <div className="absolute right-3 top-16">
                <FeaturePanel />
              </div>
            )}
            <div className="absolute bottom-28 right-3">
              <RotationControl />
            </div>
            <div className="absolute bottom-4 left-3">
              <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-white/85 px-4 py-2.5 shadow-lg ring-1 ring-black/5 backdrop-blur-xl">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                    Your plot
                  </p>
                  <p className="text-sm font-semibold tabular-nums text-stone-900">
                    {boundary ? fmtAcres(acresOf(boundary)) : '—'}
                  </p>
                </div>
                {mode === 'edit' && !editingBoundary && (
                  <button
                    onClick={() => setEditingBoundary(true)}
                    title="Edit outline"
                    className="rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
                  >
                    <Pencil className="size-4" />
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        <ExportPanel />
      </div>
    </div>
  );
}
