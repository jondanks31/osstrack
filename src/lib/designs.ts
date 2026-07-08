import type { Plan } from './types';

/**
 * Local designs repository. Backs the plan library on localStorage today; the same
 * surface (list/get/put/create/duplicate/rename/delete) maps cleanly onto Supabase later.
 */
const DESIGNS_KEY = 'osstrack-designs-v1';
const SCRATCH_KEY = 'osstrack-scratch';
const LEGACY_KEY = 'osstrack-plan'; // pre-library single-plan persist blob

const now = () => new Date().toISOString();

export function emptyPlan(name = 'Untitled design', ownerId?: string): Plan {
  const t = now();
  return { id: crypto.randomUUID(), name, ownerId, boundary: null, features: [], createdAt: t, updatedAt: t };
}

function readAll(): Record<string, Plan> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(DESIGNS_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, Plan>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DESIGNS_KEY, JSON.stringify(all));
}

export function listDesigns(ownerId: string): Plan[] {
  return Object.values(readAll())
    .filter((d) => d.ownerId === ownerId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getDesign(id: string): Plan | null {
  return readAll()[id] ?? null;
}

export function putDesign(design: Plan) {
  const all = readAll();
  all[design.id] = { ...design, updatedAt: now() };
  writeAll(all);
}

export function createDesign(ownerId: string, seed?: Partial<Plan>): Plan {
  const base = emptyPlan(seed?.name ?? 'Untitled design', ownerId);
  const design: Plan = {
    ...base,
    boundary: seed?.boundary ?? null,
    features: seed?.features ? structuredClone(seed.features) : [],
  };
  putDesign(design);
  return design;
}

export function duplicateDesign(id: string, ownerId: string): Plan | null {
  const src = getDesign(id);
  if (!src) return null;
  return createDesign(ownerId, { name: `${src.name} copy`, boundary: src.boundary, features: src.features });
}

export function renameDesign(id: string, name: string) {
  const d = getDesign(id);
  if (d) putDesign({ ...d, name });
}

export function deleteDesign(id: string) {
  const all = readAll();
  delete all[id];
  writeAll(all);
}

// ── anonymous scratch design ───────────────────────────────────────
export function getScratch(): Plan {
  if (typeof window === 'undefined') return emptyPlan('My land');
  let raw = localStorage.getItem(SCRATCH_KEY);

  // one-time migration: rescue a plan drawn before the library existed
  if (!raw) {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      try {
        const plan = JSON.parse(legacy)?.state?.plan as Plan | undefined;
        if (plan?.id) {
          raw = JSON.stringify(plan);
          localStorage.setItem(SCRATCH_KEY, raw);
        }
      } catch {
        // ignore malformed legacy data
      }
    }
  }

  if (raw) {
    try {
      return JSON.parse(raw) as Plan;
    } catch {
      // fall through to a fresh scratch
    }
  }
  const fresh = emptyPlan('My land');
  localStorage.setItem(SCRATCH_KEY, JSON.stringify(fresh));
  return fresh;
}

export function putScratch(plan: Plan) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SCRATCH_KEY, JSON.stringify({ ...plan, updatedAt: now() }));
}
