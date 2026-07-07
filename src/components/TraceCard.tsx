'use client';

import { ArrowLeft, PenLine, X } from 'lucide-react';
import { useOss } from '@/lib/store';

export default function TraceCard() {
  const drawKind = useOss((s) => s.drawKind);
  const setDrawKind = useOss((s) => s.setDrawKind);
  const setSearchTarget = useOss((s) => s.setSearchTarget);
  const drawing = drawKind === 'boundary';

  return (
    <div className="pointer-events-auto w-[min(92vw,420px)] rounded-2xl bg-white/85 p-4 shadow-xl ring-1 ring-black/5 backdrop-blur-xl">
      {drawing ? (
        <div className="flex items-center gap-3">
          <p className="flex-1 text-sm text-stone-700">
            Click around your boundary — click the first point again to finish.
          </p>
          <button
            onClick={() => setDrawKind(null)}
            className="rounded-lg p-2 text-stone-500 transition hover:bg-stone-100"
            title="Cancel"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchTarget(null)}
            className="rounded-xl p-2.5 text-stone-500 transition hover:bg-stone-100"
            title="Back to search"
          >
            <ArrowLeft className="size-4" />
          </button>
          <p className="flex-1 text-sm text-stone-700">
            Found your land? Zoom in until it fills the screen, then trace the boundary.
          </p>
          <button
            onClick={() => setDrawKind('boundary')}
            className="flex items-center gap-2 rounded-xl bg-stone-900 px-3.5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            <PenLine className="size-4" />
            Trace
          </button>
        </div>
      )}
    </div>
  );
}
