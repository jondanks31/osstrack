'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Link2, LoaderCircle, X } from 'lucide-react';
import { disableShare, enableShare, getShareId } from '@/lib/share';

export default function ShareDialog({
  designId,
  onClose,
}: {
  designId: string;
  onClose: () => void;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getShareId(designId)
      .then(setToken)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, [designId]);

  const url = token ? `${window.location.origin}/share/${token}` : '';

  async function enable() {
    setBusy(true);
    try {
      setToken(await enableShare(designId));
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      await disableShare(designId);
      setToken(null);
    } finally {
      setBusy(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 grid place-items-center">
      <div className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[min(92vw,440px)] rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Share this design</h2>
            <p className="mt-1 text-sm text-stone-500">
              Anyone with the link can view the plan and leave comments — they can&apos;t change it.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100"
          >
            <X className="size-4" />
          </button>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-stone-400">Loading…</p>
        ) : token ? (
          <>
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-stone-100 p-1.5">
              <Link2 className="ml-1 size-4 shrink-0 text-stone-400" />
              <input
                readOnly
                value={url}
                onFocus={(e) => e.target.select()}
                className="min-w-0 flex-1 bg-transparent text-sm text-stone-700 focus:outline-none"
              />
              <button
                onClick={copy}
                className="flex shrink-0 items-center gap-1 rounded-lg bg-stone-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-stone-700"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <button
              onClick={disable}
              disabled={busy}
              className="mt-3 text-sm font-medium text-red-600 transition hover:underline disabled:opacity-50"
            >
              Stop sharing
            </button>
          </>
        ) : (
          <button
            onClick={enable}
            disabled={busy}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-50"
          >
            {busy && <LoaderCircle className="size-4 animate-spin" />}
            Create share link
          </button>
        )}
      </div>
    </div>
  );
}
