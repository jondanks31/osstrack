'use client';

import { Map, FileDown, Settings, RotateCcw } from 'lucide-react';
import { useOss } from '@/lib/store';

export default function SideNav() {
  const resetPlan = useOss((s) => s.resetPlan);

  function confirmReset() {
    if (window.confirm('Start again? This deletes your boundary and everything drawn on it.')) {
      resetPlan();
    }
  }

  return (
    <nav className="pointer-events-auto flex flex-col items-center gap-1 rounded-full bg-white/85 p-2 shadow-xl ring-1 ring-black/5 backdrop-blur-xl">
      <div className="mb-1 flex size-9 items-center justify-center rounded-full bg-stone-900 text-sm font-bold text-white">
        O
      </div>
      <button
        className="rounded-full bg-stone-100 p-2.5 text-stone-900"
        title="Plan"
      >
        <Map className="size-4" />
      </button>
      <button
        className="cursor-not-allowed rounded-full p-2.5 text-stone-300"
        title="Export — coming soon"
        disabled
      >
        <FileDown className="size-4" />
      </button>
      <button
        className="cursor-not-allowed rounded-full p-2.5 text-stone-300"
        title="Settings — coming soon"
        disabled
      >
        <Settings className="size-4" />
      </button>
      <div className="my-1 h-px w-6 bg-stone-200" />
      <button
        onClick={confirmReset}
        className="rounded-full p-2.5 text-stone-400 transition hover:bg-red-50 hover:text-red-600"
        title="Start again"
      >
        <RotateCcw className="size-4" />
      </button>
    </nav>
  );
}
