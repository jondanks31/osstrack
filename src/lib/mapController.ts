import type L from 'leaflet';

/**
 * Small singleton bridge so overlay cards (which don't hold the Leaflet map)
 * can drive drawing and rotation. MapCanvas registers the map on mount.
 */
let map: L.Map | null = null;

interface PolygonDraw {
  _layer?: { getLatLngs?: () => unknown[] };
  _markers?: unknown[];
  _finishShape?: () => void;
}
type PmMap = L.Map & {
  pm: { Draw: { Polygon: PolygonDraw } };
  // provided by leaflet-rotate
  setBearing?: (deg: number) => void;
};

function polygonDraw(): PolygonDraw | undefined {
  return (map as PmMap | null)?.pm?.Draw?.Polygon;
}

export const mapController = {
  register(m: L.Map | null) {
    map = m;
  },
  get(): L.Map | null {
    return map;
  },
  /** points placed so far in the active polygon draw */
  activeVertexCount(): number {
    const d = polygonDraw();
    const latlngs = d?._layer?.getLatLngs?.();
    if (Array.isArray(latlngs)) return latlngs.length;
    return d?._markers?.length ?? 0;
  },
  /** finish the boundary polygon if it has enough points */
  finishBoundary() {
    const d = polygonDraw();
    if (d && this.activeVertexCount() >= 3) d._finishShape?.();
  },
  setBearing(deg: number) {
    (map as PmMap | null)?.setBearing?.(deg);
  },
};
