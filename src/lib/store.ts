import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Basemap, BoundaryFeature, FeatureKind, Mode, Plan, PlanFeature } from './types';
import { KINDS } from './kinds';
import { emptyPlan, getDesign, getScratch, putDesign, putScratch } from './designs';

export type Phase = 'search' | 'trace' | 'plan';
export type DrawTarget = FeatureKind | 'boundary';
export type SaveState = 'saved' | 'saving';

interface OssState {
  plan: Plan;
  /** id of the loaded saved design; null means the anonymous scratch design */
  designId: string | null;
  saveState: SaveState;
  selectedId: string | null;
  mode: Mode;
  drawKind: DrawTarget | null;
  basemap: Basemap;
  /** 0..1 aerial imagery opacity inside the plot */
  mapOpacity: number;
  /** hide everything outside the plot behind a clean mask */
  maskOutside: boolean;
  /** map rotation in degrees (0 = north up) */
  bearing: number;
  /** where search wants the map to fly; null until a place is picked */
  searchTarget: { lat: number; lng: number } | null;
  /** live count of points placed while tracing the boundary */
  traceVertices: number;
  /** export panel visibility */
  exportOpen: boolean;
  /** deliberately editing the plot outline (drag its vertices) */
  editingBoundary: boolean;
  /** elements list panel visibility */
  elementsOpen: boolean;

  phase: () => Phase;
  /** hydrate the working plan from the repository (null = scratch) */
  loadDesign: (id: string | null) => void;
  setMode: (m: Mode) => void;
  setDrawKind: (k: DrawTarget | null) => void;
  startBoundaryTrace: () => void;
  setEditingBoundary: (v: boolean) => void;
  setElementsOpen: (v: boolean) => void;
  setBasemap: (b: Basemap) => void;
  setMapOpacity: (o: number) => void;
  setMaskOutside: (v: boolean) => void;
  setBearing: (deg: number) => void;
  rotateBy: (delta: number) => void;
  setExportOpen: (v: boolean) => void;
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

// suppress autosave while loadDesign swaps the working plan
let suppressSave = false;

export const useOss = create<OssState>()(
  persist(
    (set, get) => ({
      plan: emptyPlan('My land'),
      designId: null,
      saveState: 'saved',
      selectedId: null,
      mode: 'edit',
      drawKind: null,
      basemap: 'satellite',
      mapOpacity: 0.7,
      maskOutside: true,
      bearing: 0,
      editingBoundary: false,
      elementsOpen: false,
      searchTarget: null,
      traceVertices: 0,
      exportOpen: false,

      phase: () => {
        const s = get();
        if (s.plan.boundary) return 'plan';
        return s.searchTarget ? 'trace' : 'search';
      },

      loadDesign: (id) => {
        suppressSave = true;
        const plan = id === null ? getScratch() : getDesign(id) ?? emptyPlan('Untitled design');
        set({
          plan,
          designId: id,
          saveState: 'saved',
          selectedId: null,
          drawKind: null,
          editingBoundary: false,
          searchTarget: null,
          traceVertices: 0,
          mode: 'edit',
        });
        suppressSave = false;
      },

      setMode: (mode) => set({ mode, drawKind: null, editingBoundary: false }),
      setDrawKind: (drawKind) => set({ drawKind, editingBoundary: false }),
      // tracing requires edit mode; force it so a stale 'view' can't silently block drawing
      startBoundaryTrace: () => set({ mode: 'edit', drawKind: 'boundary', traceVertices: 0 }),
      // editing the outline is deliberate: clear any active drawing/selection first
      setEditingBoundary: (editingBoundary) =>
        set(editingBoundary ? { editingBoundary, mode: 'edit', drawKind: null, selectedId: null } : { editingBoundary }),
      setElementsOpen: (elementsOpen) => set({ elementsOpen }),
      setBasemap: (basemap) => set({ basemap }),
      setMaskOutside: (maskOutside) => set({ maskOutside }),
      setBearing: (bearing) => set({ bearing: ((bearing % 360) + 360) % 360 }),
      rotateBy: (delta) => set((s) => ({ bearing: (((s.bearing + delta) % 360) + 360) % 360 })),
      setExportOpen: (exportOpen) => set({ exportOpen }),
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

      // clears the current design's contents but keeps its identity (id/name/owner)
      resetPlan: () =>
        set((s) => ({
          plan: touch({ ...s.plan, boundary: null, features: [] }),
          selectedId: null,
          mode: 'edit',
          drawKind: null,
          searchTarget: null,
          traceVertices: 0,
          bearing: 0,
          editingBoundary: false,
        })),
    }),
    {
      // only device-level view prefs persist globally; the plan lives in the designs repo
      name: 'osstrack-prefs',
      partialize: (s) => ({
        basemap: s.basemap,
        mapOpacity: s.mapOpacity,
        maskOutside: s.maskOutside,
        bearing: s.bearing,
      }),
    },
  ),
);

// Autosave: debounce plan changes back to the design repository (scratch or saved).
if (typeof window !== 'undefined') {
  let timer: ReturnType<typeof setTimeout> | null = null;
  useOss.subscribe((state, prev) => {
    if (suppressSave || state.plan === prev.plan) return;
    if (state.saveState !== 'saving') useOss.setState({ saveState: 'saving' });
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const s = useOss.getState();
      if (s.designId === null) putScratch(s.plan);
      else putDesign(s.plan);
      useOss.setState({ saveState: 'saved' });
    }, 500);
  });
}
