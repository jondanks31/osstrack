export type FeatureKind =
  | 'field'
  | 'pond'
  | 'stream'
  | 'track'
  | 'fence'
  | 'arena'
  | 'stable'
  | 'hardstanding'
  | 'shelter'
  | 'tree'
  | 'water'
  | 'hay'
  | 'gate'
  | 'muck';

export interface FeatureProps {
  id: string;
  kind: FeatureKind;
  name: string;
  notes: string;
  /** Track base width in metres (track kind only) */
  widthM?: number;
  /** Per-vertex track widths in metres — lets sections/corners be wider (track only) */
  widths?: number[];
}

export type PlanFeature = GeoJSON.Feature<GeoJSON.Geometry, FeatureProps>;
export type BoundaryFeature = GeoJSON.Feature<GeoJSON.Polygon>;

export interface Plan {
  id: string;
  name: string;
  /** owner user id; undefined for the anonymous scratch design */
  ownerId?: string;
  boundary: BoundaryFeature | null;
  features: PlanFeature[];
  createdAt: string;
  updatedAt: string;
}

export type Mode = 'view' | 'edit';
export type Basemap = 'satellite' | 'street';

/** A viewer's comment pin on a shared design (does not change the plan itself). */
export interface Annotation {
  id: string;
  lng: number;
  lat: number;
  body: string;
  author: string | null;
  createdAt: string;
}
