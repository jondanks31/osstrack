import { supabase } from './supabase';
import type { Annotation, Plan } from './types';

export interface SharedDesign {
  id: string;
  name: string;
  boundary: Plan['boundary'];
  features: Plan['features'];
}

interface AnnRow {
  id: string;
  lng: number;
  lat: number;
  body: string;
  author: string | null;
  created_at: string;
}

function rowToAnn(r: AnnRow): Annotation {
  return { id: r.id, lng: r.lng, lat: r.lat, body: r.body, author: r.author, createdAt: r.created_at };
}

// ── owner (authenticated, RLS-scoped) ───────────────────────────────
export async function getShareId(designId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('designs')
    .select('share_id')
    .eq('id', designId)
    .maybeSingle();
  if (error) throw error;
  return (data?.share_id as string | null) ?? null;
}

export async function enableShare(designId: string): Promise<string> {
  const existing = await getShareId(designId);
  if (existing) return existing;
  const token = crypto.randomUUID();
  const { error } = await supabase.from('designs').update({ share_id: token }).eq('id', designId);
  if (error) throw error;
  return token;
}

export async function disableShare(designId: string): Promise<void> {
  const { error } = await supabase.from('designs').update({ share_id: null }).eq('id', designId);
  if (error) throw error;
}

export async function listDesignAnnotations(designId: string): Promise<Annotation[]> {
  const { data, error } = await supabase
    .from('annotations')
    .select('*')
    .eq('design_id', designId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as AnnRow[]).map(rowToAnn);
}

export async function deleteAnnotation(id: string): Promise<void> {
  const { error } = await supabase.from('annotations').delete().eq('id', id);
  if (error) throw error;
}

// ── public (token-scoped RPCs; the only anon path) ──────────────────
export async function fetchSharedDesign(token: string): Promise<SharedDesign | null> {
  const { data, error } = await supabase.rpc('get_shared_design', { p_token: token });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    boundary: row.data?.boundary ?? null,
    features: row.data?.features ?? [],
  };
}

export async function fetchSharedAnnotations(token: string): Promise<Annotation[]> {
  const { data, error } = await supabase.rpc('list_annotations', { p_token: token });
  if (error) throw error;
  return ((data as AnnRow[]) ?? []).map(rowToAnn);
}

export async function postAnnotation(
  token: string,
  a: { lng: number; lat: number; body: string; author: string | null },
): Promise<Annotation> {
  const { data, error } = await supabase.rpc('add_annotation', {
    p_token: token,
    p_lng: a.lng,
    p_lat: a.lat,
    p_body: a.body,
    p_author: a.author,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return rowToAnn(row);
}
