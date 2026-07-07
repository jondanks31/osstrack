'use client';

import { RotateCw, RotateCcw } from 'lucide-react';
import { useOss } from '@/lib/store';

export default function RotationControl() {
  const bearing = useOss((s) => s.bearing);
  const setBearing = useOss((s) => s.setBearing);
  const rotateBy = useOss((s) => s.rotateBy);

  return (
    <div className="pointer-events-auto flex flex-col items-center gap-1 rounded-2xl bg-white/85 p-1.5 shadow-lg ring-1 ring-black/5 backdrop-blur-xl">
      <button
        onClick={() => rotateBy(-15)}
        className="rounded-xl p-2 text-stone-600 transition hover:bg-stone-100"
        title="Rotate anticlockwise"
      >
        <RotateCcw className="size-4" />
      </button>

      <button
        onClick={() => setBearing(0)}
        title={bearing ? 'Reset to north' : 'North up'}
        className="grid size-9 place-items-center rounded-full text-stone-700 transition hover:bg-stone-100"
      >
        <svg viewBox="0 0 24 24" className="size-6" style={{ transform: `rotate(${bearing}deg)` }}>
          <path d="M12 3 L15 13 L12 11 L9 13 Z" fill="#dc2626" />
          <path d="M12 21 L9 11 L12 13 L15 11 Z" fill="#78716c" />
          <text x="12" y="2.4" textAnchor="middle" fontSize="4" fontWeight="700" fill="#1c1917">
            N
          </text>
        </svg>
      </button>

      <button
        onClick={() => rotateBy(15)}
        className="rounded-xl p-2 text-stone-600 transition hover:bg-stone-100"
        title="Rotate clockwise"
      >
        <RotateCw className="size-4" />
      </button>
    </div>
  );
}
