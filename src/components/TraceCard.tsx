'use client';

import { ArrowLeft, Check, PenLine, RotateCcw, X } from 'lucide-react';
import { useOss } from '@/lib/store';
import { mapController } from '@/lib/mapController';

export default function TraceCard() {
  const drawKind = useOss((s) => s.drawKind);
  const traceVertices = useOss((s) => s.traceVertices);
  const startBoundaryTrace = useOss((s) => s.startBoundaryTrace);
  const setDrawKind = useOss((s) => s.setDrawKind);
  const setSearchTarget = useOss((s) => s.setSearchTarget);
  const drawing = drawKind === 'boundary';

  function restart() {
    // clears the in-progress polygon and starts a fresh one
    setDrawKind(null);
    requestAnimationFrame(() => startBoundaryTrace());
  }

  if (!drawing) {
    return (
      <div className="pointer-events-auto w-[min(92vw,440px)] rounded-2xl bg-white/85 p-4 shadow-xl ring-1 ring-black/5 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchTarget(null)}
            className="rounded-xl p-2.5 text-stone-500 transition hover:bg-stone-100"
            title="Back to search"
          >
            <ArrowLeft className="size-4" />
          </button>
          <p className="flex-1 text-sm text-stone-700">
            Pan and zoom until your land fills the screen, then trace its outline.
          </p>
          <button
            onClick={startBoundaryTrace}
            className="flex items-center gap-2 rounded-xl bg-stone-900 px-3.5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            <PenLine className="size-4" />
            Trace
          </button>
        </div>
      </div>
    );
  }

  const enough = traceVertices >= 3;

  return (
    <div className="pointer-events-auto w-[min(92vw,460px)] rounded-2xl bg-white/90 p-4 shadow-xl ring-1 ring-black/5 backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-stone-900 text-xs font-semibold text-white tabular-nums">
          {traceVertices}
        </span>
        <p className="flex-1 text-sm text-stone-700">
          <span className="font-medium text-stone-900">Click each corner</span> of your land. You can
          drag the map to move around between clicks.
          {!enough && ' Add at least 3 points.'}
        </p>
        <button
          onClick={() => setDrawKind(null)}
          className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100"
          title="Cancel"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={restart}
          disabled={traceVertices === 0}
          className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 disabled:opacity-40"
        >
          <RotateCcw className="size-4" />
          Start over
        </button>
        <button
          onClick={() => mapController.finishBoundary()}
          disabled={!enough}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-stone-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-40"
        >
          <Check className="size-4" />
          Finish outline
        </button>
      </div>
    </div>
  );
}
