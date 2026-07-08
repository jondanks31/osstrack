'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, LoaderCircle, MessageSquarePlus, X } from 'lucide-react';
import MapCanvas from './MapCanvas';
import AnnotationPopover from './AnnotationPopover';
import { useOss } from '@/lib/store';
import { postAnnotation } from '@/lib/share';

export default function ShareView({ token }: { token: string }) {
  const [state, setState] = useState<'loading' | 'ready' | 'notfound'>('loading');
  const planName = useOss((s) => s.plan.name);
  const annotations = useOss((s) => s.annotations);
  const addingAnnotation = useOss((s) => s.addingAnnotation);
  const pendingAnnotation = useOss((s) => s.pendingAnnotation);
  const selectedAnnotationId = useOss((s) => s.selectedAnnotationId);
  const setAddingAnnotation = useOss((s) => s.setAddingAnnotation);
  const setPendingAnnotation = useOss((s) => s.setPendingAnnotation);
  const setAnnotations = useOss((s) => s.setAnnotations);
  const selectAnnotation = useOss((s) => s.selectAnnotation);

  const [author, setAuthor] = useState('');
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    useOss
      .getState()
      .loadSharedDesign(token)
      .then((ok) => !cancelled && setState(ok ? 'ready' : 'notfound'))
      .catch(() => !cancelled && setState('notfound'));
    return () => {
      cancelled = true;
    };
  }, [token]);

  const selected = annotations.find((a) => a.id === selectedAnnotationId) ?? null;

  async function submitComment() {
    if (!pendingAnnotation || !body.trim()) return;
    setPosting(true);
    setError(null);
    try {
      const created = await postAnnotation(token, {
        lng: pendingAnnotation.lng,
        lat: pendingAnnotation.lat,
        body: body.trim(),
        author: author.trim() || null,
      });
      setAnnotations([...useOss.getState().annotations, created]);
      setPendingAnnotation(null);
      setBody('');
    } catch {
      setError('Could not post your comment — please try again.');
    } finally {
      setPosting(false);
    }
  }

  if (state === 'loading') {
    return <div className="grid h-dvh place-items-center bg-[#f2f1ec] text-stone-400">Loading…</div>;
  }

  if (state === 'notfound') {
    return (
      <div className="grid h-dvh place-items-center bg-[#f2f1ec] p-6 text-center">
        <div>
          <p className="text-lg font-semibold text-stone-800">Link not found</p>
          <p className="mt-1 text-sm text-stone-500">
            This share link is invalid or sharing has been turned off.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            Go to OssTrack
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#f2f1ec]">
      <MapCanvas />

      <div className="pointer-events-none absolute inset-0 z-10">
        {/* top bar */}
        <div className="absolute left-1/2 top-3 -translate-x-1/2">
          <div className="pointer-events-auto flex items-center gap-2.5 rounded-2xl bg-white/85 px-3 py-2 shadow-xl ring-1 ring-black/5 backdrop-blur-xl">
            <Link href="/" className="text-sm font-bold tracking-tight text-stone-900">
              Oss<span className="text-emerald-700">Track</span>
            </Link>
            <span className="max-w-[38vw] truncate text-sm text-stone-500">{planName}</span>
            <span className="flex items-center gap-1 rounded-lg bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500">
              <Eye className="size-3" />
              Read-only
            </span>
          </div>
        </div>

        {/* selected comment */}
        {selected && (
          <div className="absolute right-3 top-16">
            <AnnotationPopover annotation={selected} onClose={() => selectAnnotation(null)} />
          </div>
        )}

        {/* add-comment control / hint */}
        {!pendingAnnotation && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            {addingAnnotation ? (
              <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-2.5 shadow-xl ring-1 ring-black/5 backdrop-blur-xl">
                <span className="text-sm text-stone-700">Click anywhere on the map to place your comment.</span>
                <button
                  onClick={() => setAddingAnnotation(false)}
                  className="rounded-lg p-1.5 text-stone-500 transition hover:bg-stone-100"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAddingAnnotation(true)}
                className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white shadow-xl transition hover:bg-stone-700"
              >
                <MessageSquarePlus className="size-4" />
                Add comment
              </button>
            )}
          </div>
        )}

        {/* compose card */}
        {pendingAnnotation && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <div className="pointer-events-auto w-[min(92vw,360px)] rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/5">
              <p className="text-sm font-semibold text-stone-900">Add a comment</p>
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Your name (optional)"
                className="mt-2 w-full rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/60"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                autoFocus
                rows={3}
                placeholder="e.g. move the muck heap here — further from the stable"
                className="mt-2 w-full resize-none rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/60"
              />
              {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setPendingAnnotation(null);
                    setBody('');
                  }}
                  className="rounded-lg px-3 py-1.5 text-sm text-stone-600 transition hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  onClick={submitComment}
                  disabled={!body.trim() || posting}
                  className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-50"
                >
                  {posting && <LoaderCircle className="size-4 animate-spin" />}
                  Post
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
