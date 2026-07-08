import type { Plan } from './types';
import { supabase } from './supabase';

/**
 * Designs repository. Saved designs live in Supabase (RLS scopes every query to the
 * signed-in owner); the anonymous scratch design stays in localStorage so the free
 * designer works with no account.
 */

const SCRATCH_KEY = 'osstrack-scratch';
const LEGACY_KEY = 'osstrack-plan'; // pre-library single-plan persist blob

const now = () => new Date().toISOString();

export function emptyPlan(name = 'Untitled design'): Plan {
  const t = now();
  return { id: crypto.randomUUID(), name, boundary: null, features: [], createdAt: t, updatedAt: t };
}

// ── saved designs (Supabase) ───────────────────────────────────────
interface DesignRow {
  id: string;
  owner_id: string;
  name: string;
  data: { boundary: Plan['boundary']; features: Plan['features'] };
  created_at: string;
  updated_at: string;
}

function rowToPlan(r: DesignRow): Plan {
  return {
    id: r.id,
    name: r.name,
    ownerId: r.owner_id,
    boundary: r.data?.boundary ?? null,
    features: r.data?.features ?? [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listDesigns(): Promise<Plan[]> {
  const { data, error } = await supabase
    .from('designs')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data as DesignRow[]).map(rowToPlan);
}

export async function getDesign(id: string): Promise<Plan | null> {
  const { data, error } = await supabase.from('designs').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? rowToPlan(data as DesignRow) : null;
}

// owner_id is filled by the column default auth.uid() and enforced by RLS
export async function createDesign(seed?: Partial<Plan>): Promise<Plan> {
  const { data, error } = await supabase
    .from('designs')
    .insert({
      name: seed?.name ?? 'Untitled design',
      data: { boundary: seed?.boundary ?? null, features: seed?.features ?? [] },
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToPlan(data as DesignRow);
}

export async function updateDesign(plan: Plan): Promise<void> {
  const { error } = await supabase
    .from('designs')
    .update({ name: plan.name, data: { boundary: plan.boundary, features: plan.features } })
    .eq('id', plan.id);
  if (error) throw error;
}

export async function duplicateDesign(id: string): Promise<Plan | null> {
  const src = await getDesign(id);
  if (!src) return null;
  return createDesign({ name: `${src.name} copy`, boundary: src.boundary, features: src.features });
}

export async function renameDesign(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('designs').update({ name }).eq('id', id);
  if (error) throw error;
}

export async function deleteDesign(id: string): Promise<void> {
  const { error } = await supabase.from('designs').delete().eq('id', id);
  if (error) throw error;
}

// ── anonymous scratch design (localStorage) ─────────────────────────
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
