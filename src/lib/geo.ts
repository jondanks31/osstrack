import { area, length } from '@turf/turf';
import type { PlanFeature } from './types';

const SQM_PER_ACRE = 4046.8564224;

export function acresOf(f: GeoJSON.Feature | GeoJSON.Geometry): number {
  return area(f) / SQM_PER_ACRE;
}

export function sqmOf(f: GeoJSON.Feature | GeoJSON.Geometry): number {
  return area(f);
}

export function lengthMOf(f: GeoJSON.Feature): number {
  return length(f, { units: 'kilometers' }) * 1000;
}

export function fmtAcres(acres: number): string {
  return `${acres.toFixed(acres < 10 ? 2 : 1)} acres`;
}

export function fmtM(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`;
}

export function fmtSqm(sqm: number): string {
  return `${Math.round(sqm).toLocaleString()} m²`;
}

/** Human summary of a feature's size */
export function featureStats(f: PlanFeature): string | null {
  const t = f.geometry.type;
  if (t === 'Polygon' || t === 'MultiPolygon') {
    return `${fmtAcres(acresOf(f))} · ${fmtSqm(sqmOf(f))}`;
  }
  if (t === 'LineString' || t === 'MultiLineString') {
    return fmtM(lengthMOf(f));
  }
  return null;
}
