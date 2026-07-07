'use client';

import {
  Fence,
  DoorOpen,
  Droplets,
  Grid2x2,
  Home,
  LandPlot,
  Route,
  Shovel,
  Tent,
  Warehouse,
  Wheat,
  type LucideIcon,
} from 'lucide-react';
import { KINDS, KIND_ORDER } from '@/lib/kinds';
import type { FeatureKind } from '@/lib/types';
import { useOss } from '@/lib/store';

const ICONS: Record<FeatureKind, LucideIcon> = {
  field: LandPlot,
  track: Route,
  fence: Fence,
  arena: Grid2x2,
  stable: Home,
  hardstanding: Warehouse,
  shelter: Tent,
  water: Droplets,
  hay: Wheat,
  gate: DoorOpen,
  muck: Shovel,
};

export default function Toolbar() {
  const drawKind = useOss((s) => s.drawKind);
  const setDrawKind = useOss((s) => s.setDrawKind);

  return (
    <div className="pointer-events-auto flex max-w-[94vw] items-center gap-1 overflow-x-auto rounded-2xl bg-white/85 p-1.5 shadow-xl ring-1 ring-black/5 backdrop-blur-xl">
      {KIND_ORDER.map((kind) => {
        const Icon = ICONS[kind];
        const active = drawKind === kind;
        return (
          <button
            key={kind}
            onClick={() => setDrawKind(active ? null : kind)}
            title={KINDS[kind].label}
            className={`flex shrink-0 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-medium transition ${
              active
                ? 'bg-stone-900 text-white shadow-md'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Icon className="size-4" style={active ? undefined : { color: KINDS[kind].color }} />
            {KINDS[kind].label}
          </button>
        );
      })}
    </div>
  );
}
