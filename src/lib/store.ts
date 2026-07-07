import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Basemap, BoundaryFeature, FeatureKind, Mode, Plan, PlanFeature } from './types';
import { KINDS } from './kinds';

export type Phase = 'search' | 'trace' | 'plan';
export type DrawTarget = FeatureKind | 'boundary';

function newPlan(): Plan {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: 'My land',
    boundary: null,
    features: [],
    createdAt: now,
    updatedAt: now,
  };
}

interface OssState {
  plan: Plan;
  selectedId: string | null;
  mode: Mode;
  drawKind: DrawTarget | null;
  basemap: Basemap;
  /** 0..1 aerial imagery opacity inside the plot */
  mapOpacity: number;
  /** map rotation in degrees (0 = north up) */
  bearing: number;
  /** where search wants the map to fly; null until a place is picked */
  searchTarget: { lat: number; lng: number } | null;
  /** live count of points placed while tracing the boundary */
  traceVertices: number;

  phase: () => Phase;
  setMode: (m: Mode) => void;
  setDrawKind: (k: DrawTarget | null) => void;
  startBoundaryTrace: () => void;
  setBasemap: (b: Basemap) => void;
  setMapOpacity: (o: number) => void;
  setBearing: (deg: number) => void;
  rotateBy: (delta: number) => void;
  setSearchTarget: (t: { lat: number; lng: number } | null) => void;
  setTraceVertices: (n: number) => void;
  setPlanName: (name: string) => void;
  setBoundary: (b: BoundaryFeature | null) => void;
  addFeature: (kind: FeatureKind, geometry: GeoJSON.Geometry) => string;
  updateFeatureProps: (id: string, patch: Partial<Omit<PlanFeature['properties'], 'id' | 'kind'>>) => void;
  updateFeatureGeometry: (id: string, geometry: GeoJSON.Geometry) => void;
  removeFeature: (id: string) => void;
  select: (id: string | null) => void;
  resetPlan: () => void;
}

const touch = (plan: Plan): Plan => ({ ...plan, updatedAt: new Date().toISOString() });

export const useOss = create<OssState>()(
  persist(
    (set, get) => ({
      plan: newPlan(),
      selectedId: null,
      mode: 'edit',
      drawKind: null,
      basemap: 'satellite',
      mapOpacity: 0.7,
      bearing: 0,
      searchTarget: null,
      traceVertices: 0,

      phase: () => {
        const s = get();
        if (s.plan.boundary) return 'plan';
        return s.searchTarget ? 'trace' : 'search';
      },

      setMode: (mode) => set({ mode, drawKind: null }),
      setDrawKind: (drawKind) => set({ drawKind }),
      // tracing requires edit mode; force it so a stale 'view' can't silently block drawing
      startBoundaryTrace: () => set({ mode: 'edit', drawKind: 'boundary', traceVertices: 0 }),
      setBasemap: (basemap) => set({ basemap }),
      setBearing: (bearing) => set({ bearing: ((bearing % 360) + 360) % 360 }),
      rotateBy: (delta) => set((s) => ({ bearing: (((s.bearing + delta) % 360) + 360) % 360 })),
      setTraceVertices: (traceVertices) => set({ traceVertices }),
      setMapOpacity: (mapOpacity) => set({ mapOpacity }),
      setSearchTarget: (searchTarget) => set({ searchTarget }),
      setPlanName: (name) => set((s) => ({ plan: touch({ ...s.plan, name }) })),

      setBoundary: (boundary) =>
        set((s) => ({ plan: touch({ ...s.plan, boundary }), drawKind: null })),

      addFeature: (kind, geometry) => {
        const id = crypto.randomUUID();
        set((s) => {
          const count = s.plan.features.filter((f) => f.properties.kind === kind).length + 1;
          const feature: PlanFeature = {
            type: 'Feature',
            geometry,
            properties: {
              id,
              kind,
              name: `${KINDS[kind].label} ${count}`,
              notes: '',
              ...(kind === 'track' ? { widthM: 4 } : {}),
            },
          };
          return {
            plan: touch({ ...s.plan, features: [...s.plan.features, feature] }),
            selectedId: id,
            drawKind: null,
          };
        });
        return id;
      },

      updateFeatureProps: (id, patch) =>
        set((s) => ({
          plan: touch({
            ...s.plan,
            features: s.plan.features.map((f) =>
              f.properties.id === id ? { ...f, properties: { ...f.properties, ...patch } } : f,
            ),
          }),
        })),

      updateFeatureGeometry: (id, geometry) =>
        set((s) => ({
          plan: touch({
            ...s.plan,
            features: s.plan.features.map((f) => (f.properties.id === id ? { ...f, geometry } : f)),
          }),
        })),

      removeFeature: (id) =>
        set((s) => ({
          plan: touch({ ...s.plan, features: s.plan.features.filter((f) => f.properties.id !== id) }),
          selectedId: s.selectedId === id ? null : s.selectedId,
        })),

      select: (selectedId) => set({ selectedId }),

      resetPlan: () =>
        set({
          plan: newPlan(),
          selectedId: null,
          mode: 'edit',
          drawKind: null,
          searchTarget: null,
          traceVertices: 0,
          bearing: 0,
        }),
    }),
    {
      name: 'osstrack-plan',
      partialize: (s) => ({
        plan: s.plan,
        basemap: s.basemap,
        mapOpacity: s.mapOpacity,
        bearing: s.bearing,
      }),
    },
  ),
);
