import type { FeatureKind } from './types';

export type DrawShape = 'Polygon' | 'Line' | 'Rectangle' | 'Marker';

interface KindMeta {
  label: string;
  color: string;
  shape: DrawShape;
  /** small inline SVG (24x24 stroke) used for map markers */
  glyph: string;
}

const g = (paths: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

export const KINDS: Record<FeatureKind, KindMeta> = {
  field: {
    label: 'Field',
    color: '#4d7c0f',
    shape: 'Polygon',
    glyph: g('<path d="M3 20h18M5 20c2-6 4-9 7-9s5 3 7 9"/>'),
  },
  track: {
    label: 'Track',
    color: '#b45309',
    shape: 'Line',
    glyph: g('<path d="M4 19c4-1 4-5 8-6s8 1 8-6"/>'),
  },
  fence: {
    label: 'Fence',
    color: '#57534e',
    shape: 'Line',
    glyph: g('<path d="M5 21V7l-1-2-1 2M12 21V7l-1-2-1 2M19 21V7l-1-2-1 2M3 11h18M3 17h18"/>'),
  },
  arena: {
    label: 'Arena',
    color: '#a16207',
    shape: 'Rectangle',
    glyph: g('<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 6v12M16 6v12"/>'),
  },
  stable: {
    label: 'Stables',
    color: '#334155',
    shape: 'Rectangle',
    glyph: g('<path d="M3 21V9l9-6 9 6v12M9 21v-8h6v8"/>'),
  },
  hardstanding: {
    label: 'Hard standing',
    color: '#64748b',
    shape: 'Rectangle',
    glyph: g('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 12h16M12 4v16"/>'),
  },
  shelter: {
    label: 'Shelter',
    color: '#0f766e',
    shape: 'Rectangle',
    glyph: g('<path d="M3 21V10l9-5 9 5v11M3 21h18"/>'),
  },
  water: {
    label: 'Water',
    color: '#0369a1',
    shape: 'Marker',
    glyph: g('<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>'),
  },
  hay: {
    label: 'Hay',
    color: '#ca8a04',
    shape: 'Marker',
    glyph: g('<path d="M4 20h16M6 20v-6a6 6 0 0 1 12 0v6M12 8V4M9 5l1.5 2.5M15 5l-1.5 2.5"/>'),
  },
  gate: {
    label: 'Gate',
    color: '#78716c',
    shape: 'Marker',
    glyph: g('<path d="M4 21V8M20 21V8M4 10l16 8M4 14h16M4 18h16"/>'),
  },
  muck: {
    label: 'Muck heap',
    color: '#92400e',
    shape: 'Marker',
    glyph: g('<path d="M3 20h18M6 20c0-4 2.5-7 6-7s6 3 6 7M10 13l2-4 2 4"/>'),
  },
};

export const KIND_ORDER: FeatureKind[] = [
  'field',
  'track',
  'fence',
  'arena',
  'stable',
  'hardstanding',
  'shelter',
  'water',
  'hay',
  'gate',
  'muck',
];
