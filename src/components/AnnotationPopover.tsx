'use client';

import { Trash2, X } from 'lucide-react';
import type { Annotation } from '@/lib/types';

export default function AnnotationPopover({
  annotation,
  onClose,
  onDelete,
}: {
  annotation: Annotation;
  onClose: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="pointer-events-auto w-[min(90vw,300px)] rounded-2xl bg-white/95 p-4 shadow-xl ring-1 ring-black/5 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">Comment</span>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-stone-400 transition hover:bg-stone-100"
        >
          <X className="size-4" />
        </button>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-stone-800">{annotation.body}</p>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-stone-400">
          {annotation.author || 'Guest'} ·{' '}
          {new Date(annotation.createdAt).toLocaleDateString('en-GB')}
        </p>
        {onDelete && (
          <button
            onClick={onDelete}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="size-3.5" />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
