'use client';

import { useState } from 'react';
import { FileDown, Printer, X, LoaderCircle } from 'lucide-react';
import { useOss } from '@/lib/store';
import { exportPdf, printPlan } from '@/lib/export';

export default function ExportPanel() {
  const open = useOss((s) => s.exportOpen);
  const setExportOpen = useOss((s) => s.setExportOpen);
  const plan = useOss((s) => s.plan);
  const [busy, setBusy] = useState<null | 'pdf' | 'print'>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function run(kind: 'pdf' | 'print') {
    setBusy(kind);
    setError(null);
    try {
      if (kind === 'pdf') await exportPdf(plan);
      else await printPlan(plan);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed — please try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-30 grid place-items-center">
      <div className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm" onClick={() => setExportOpen(false)} />
      <div className="relative w-[min(92vw,420px)] rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Export your plan</h2>
            <p className="mt-1 text-sm text-stone-500">
              Captures the map exactly as shown, with a labelled list of everything you&apos;ve
              added.
            </p>
          </div>
          <button
            onClick={() => setExportOpen(false)}
            className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => run('pdf')}
            disabled={busy !== null}
            className="flex flex-col items-center gap-2 rounded-2xl border border-stone-200 p-5 text-sm font-medium text-stone-700 transition hover:border-stone-900 hover:bg-stone-50 disabled:opacity-40"
          >
            {busy === 'pdf' ? (
              <LoaderCircle className="size-6 animate-spin text-stone-900" />
            ) : (
              <FileDown className="size-6 text-stone-900" />
            )}
            Download PDF
          </button>
          <button
            onClick={() => run('print')}
            disabled={busy !== null}
            className="flex flex-col items-center gap-2 rounded-2xl border border-stone-200 p-5 text-sm font-medium text-stone-700 transition hover:border-stone-900 hover:bg-stone-50 disabled:opacity-40"
          >
            {busy === 'print' ? (
              <LoaderCircle className="size-6 animate-spin text-stone-900" />
            ) : (
              <Printer className="size-6 text-stone-900" />
            )}
            Print
          </button>
        </div>

        <p className="mt-4 text-xs text-stone-400">
          Tip: use the Layers panel first to show or hide the surrounding map, or fade the aerial
          for a clean line drawing.
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
