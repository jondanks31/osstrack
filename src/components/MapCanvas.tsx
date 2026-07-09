'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-rotate';
import '@geoman-io/leaflet-geoman-free';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { bearing as turfBearing, buffer, destination, distance } from '@turf/turf';
import { useOss } from '@/lib/store';
import { mapController } from '@/lib/mapController';
import { KINDS } from '@/lib/kinds';
import type { FeatureKind, PlanFeature } from '@/lib/types';

const WORLD_RING: L.LatLngTuple[] = [
  [-89.9, -179.9],
  [89.9, -179.9],
  [89.9, 179.9],
  [-89.9, 179.9],
];

function markerIcon(kind: FeatureKind, selected: boolean): L.DivIcon {
  const meta = KINDS[kind];
  return L.divIcon({
    className: '',
    html: `<div class="oss-marker${selected ? ' oss-marker-selected' : ''}" style="--c:${meta.color}">${meta.glyph}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function pathStyle(kind: FeatureKind, selected: boolean): L.PathOptions {
  const c = KINDS[kind].color;
  const base: L.PathOptions = { color: c, weight: selected ? 4 : 3 };
  switch (KINDS[kind].shape) {
    case 'Line':
      return kind === 'fence'
        ? { ...base, dashArray: '6 6' }
        : { ...base, weight: selected ? 5 : 4 };
    default:
      return { ...base, fillColor: c, fillOpacity: selected ? 0.4 : 0.25 };
  }
}

// ── track ribbon geometry (supports per-vertex widths) ──────────────
type LngLat = [number, number];

/** left/right edge points offset perpendicular to the path at each vertex */
function trackOffsets(coords: LngLat[], widths: number[]): { lefts: LngLat[]; rights: LngLat[] } {
  const n = coords.length;
  const lefts: LngLat[] = [];
  const rights: LngLat[] = [];
  for (let i = 0; i < n; i++) {
    const b =
      i === 0
        ? turfBearing(coords[0], coords[1])
        : i === n - 1
          ? turfBearing(coords[n - 2], coords[n - 1])
          : turfBearing(coords[i - 1], coords[i + 1]);
    const half = Math.max(widths[i], 0.5) / 2;
    lefts.push(destination(coords[i], half, b - 90, { units: 'meters' }).geometry.coordinates as LngLat);
    rights.push(destination(coords[i], half, b + 90, { units: 'meters' }).geometry.coordinates as LngLat);
  }
  return { lefts, rights };
}

function trackRibbon(coords: LngLat[], widths: number[]): GeoJSON.Feature<GeoJSON.Polygon> {
  const { lefts, rights } = trackOffsets(coords, widths);
  const ring = [...lefts, ...rights.slice().reverse(), lefts[0]];
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } };
}

function resolveWidths(coords: LngLat[], widths: number[] | undefined, widthM: number): number[] {
  return widths && widths.length === coords.length ? widths : new Array(coords.length).fill(widthM);
}

function widthHandleIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: '<div class="oss-width-handle"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

const COMMENT_GLYPH =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

function annotationIcon(selected: boolean, pending = false): L.DivIcon {
  const cls = `oss-annotation${selected ? ' oss-annotation-selected' : ''}${pending ? ' oss-annotation-pending' : ''}`;
  return L.divIcon({
    className: '',
    html: `<div class="${cls}">${COMMENT_GLYPH}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export default function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tilesRef = useRef<{ satellite: L.TileLayer; street: L.TileLayer } | null>(null);
  const featureGroupRef = useRef<L.LayerGroup | null>(null);
  const boundaryGroupRef = useRef<L.LayerGroup | null>(null);
  const editGroupRef = useRef<L.LayerGroup | null>(null);
  const annotationGroupRef = useRef<L.LayerGroup | null>(null);
  const fittedBoundaryRef = useRef<string | null>(null);

  const boundary = useOss((s) => s.plan.boundary);
  const features = useOss((s) => s.plan.features);
  const selectedId = useOss((s) => s.selectedId);
  const mode = useOss((s) => s.mode);
  const drawKind = useOss((s) => s.drawKind);
  const basemap = useOss((s) => s.basemap);
  const mapOpacity = useOss((s) => s.mapOpacity);
  const maskOutside = useOss((s) => s.maskOutside);
  const editingBoundary = useOss((s) => s.editingBoundary);
  const searchTarget = useOss((s) => s.searchTarget);
  const bearing = useOss((s) => s.bearing);
  const annotations = useOss((s) => s.annotations);
  const addingAnnotation = useOss((s) => s.addingAnnotation);
  const pendingAnnotation = useOss((s) => s.pendingAnnotation);
  const selectedAnnotationId = useOss((s) => s.selectedAnnotationId);

  // ── init map (once) ────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.5,
      // allow zooming past the imagery's native detail for fine vertex placement
      maxZoom: 22,
      rotate: true,
      rotateControl: false,
      touchRotate: false,
      bearing: useOss.getState().bearing,
    } as L.MapOptions).setView([52.5, -1.9], 6);

    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // maxNativeZoom caps tile requests at the provider's real detail; maxZoom lets the
    // map upscale those tiles further so users can nudge points precisely.
    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxNativeZoom: 19,
        maxZoom: 22,
        crossOrigin: 'anonymous', // allow the canvas capture used by PDF export
        attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
      },
    );
    const street = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxNativeZoom: 19,
      maxZoom: 22,
      crossOrigin: 'anonymous',
      attribution: '© OpenStreetMap contributors',
    });
    satellite.addTo(map);
    tilesRef.current = { satellite, street };

    // leaflet-rotate nests tilePane + overlayPane inside rotatePane; the mask must live
    // there too so it rotates with the map. Tiles are z-index 200 and features 400, so
    // the mask sits at 350 — above the imagery but below the drawn features.
    const rotatePane = map.getPane('rotatePane');
    const maskPane = map.createPane('mask', rotatePane ?? undefined);
    maskPane.style.zIndex = '350';
    boundaryGroupRef.current = L.layerGroup().addTo(map);
    featureGroupRef.current = L.layerGroup().addTo(map);
    editGroupRef.current = L.layerGroup().addTo(map);
    annotationGroupRef.current = L.layerGroup().addTo(map);

    map.pm.setGlobalOptions({ snappable: true, snapDistance: 15 });

    map.on('pm:create', (e) => {
      const s = useOss.getState();
      const gj = (e.layer as L.Polygon).toGeoJSON() as GeoJSON.Feature;
      e.layer.remove();
      s.setTraceVertices(0);
      if (s.drawKind === 'boundary') {
        if (gj.geometry.type === 'Polygon') {
          s.setBoundary(gj as GeoJSON.Feature<GeoJSON.Polygon>);
        }
      } else if (s.drawKind) {
        s.addFeature(s.drawKind, gj.geometry);
      }
    });

    // keep the live trace point count in sync so the trace card can show progress.
    // pm:vertexadded fires on the working layer (not the map), so attach on drawstart.
    map.on('pm:drawstart', (e) => {
      useOss.getState().setTraceVertices(0);
      const wl = (e as unknown as { workingLayer?: L.Evented }).workingLayer;
      wl?.on('pm:vertexadded', () => {
        if (useOss.getState().drawKind === 'boundary') {
          useOss.getState().setTraceVertices(mapController.activeVertexCount());
        }
      });
    });

    // a map click either drops a pending comment (when armed) or clears selection
    map.on('click', (e) => {
      const s = useOss.getState();
      if (s.addingAnnotation) {
        s.setPendingAnnotation({ lng: e.latlng.lng, lat: e.latlng.lat });
      } else {
        s.select(null);
        s.selectAnnotation(null);
      }
    });

    fittedBoundaryRef.current = null; // new map instance must re-fit to the boundary
    mapRef.current = map;
    mapController.register(map);
    return () => {
      mapController.register(null);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── rotation ───────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current as (L.Map & { setBearing?: (d: number) => void }) | null;
    map?.setBearing?.(bearing);
  }, [bearing]);

  // ── basemap + opacity ──────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const tiles = tilesRef.current;
    if (!map || !tiles) return;
    const active = tiles[basemap];
    const other = basemap === 'satellite' ? tiles.street : tiles.satellite;
    if (!map.hasLayer(active)) active.addTo(map);
    if (map.hasLayer(other)) other.remove();
    // dim only applies when focused on the plot; showing surroundings keeps full imagery
    active.setOpacity(boundary && maskOutside ? mapOpacity : 1);
  }, [basemap, mapOpacity, boundary, maskOutside]);

  // ── search flyTo ───────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !searchTarget) return;
    map.flyTo([searchTarget.lat, searchTarget.lng], 17, { duration: 1.8 });
  }, [searchTarget]);

  // ── boundary outline + outside mask (static view) ──────────────────
  useEffect(() => {
    const map = mapRef.current;
    const group = boundaryGroupRef.current;
    if (!map || !group) return;
    group.clearLayers();
    if (!boundary) {
      fittedBoundaryRef.current = null;
      return;
    }

    const ring = boundary.geometry.coordinates[0].map(
      ([lng, lat]) => [lat, lng] as L.LatLngTuple,
    );

    // while editing, the edit effect owns the outline and the mask is hidden so the
    // shape can be aligned against the imagery — draw nothing here
    if (!editingBoundary) {
      if (maskOutside) {
        L.polygon([WORLD_RING, ring], {
          stroke: false,
          fillColor: '#f2f1ec',
          fillOpacity: 1,
          interactive: false,
          pane: 'mask',
          pmIgnore: true,
        }).addTo(group);
      }
      L.polygon(ring, {
        color: '#1c1917',
        weight: 2.5,
        fill: false,
        interactive: false,
        pmIgnore: true,
      }).addTo(group);
    }

    // fit once for a given plot; never while editing, or live edits would keep re-zooming
    const key = JSON.stringify(boundary.geometry.coordinates);
    if (!editingBoundary && fittedBoundaryRef.current !== key) {
      fittedBoundaryRef.current = key;
      map.fitBounds(L.latLngBounds(ring), { padding: [60, 60] });
    } else if (editingBoundary) {
      fittedBoundaryRef.current = key; // keep in sync so it won't jump when editing ends
    }
  }, [boundary, maskOutside, editingBoundary]);

  // ── editable outline (its own layer, keyed only on the edit toggle) ─
  // Kept separate so committing an edit — which updates the store boundary — never
  // tears down the very layer Geoman is mid-drag on (that threw a `baseVal` error).
  useEffect(() => {
    const map = mapRef.current;
    const group = editGroupRef.current;
    if (!map || !group) return;
    group.clearLayers();
    if (!editingBoundary) return;

    const boundaryNow = useOss.getState().plan.boundary;
    if (!boundaryNow) return;
    const ring = boundaryNow.geometry.coordinates[0].map(
      ([lng, lat]) => [lat, lng] as L.LatLngTuple,
    );

    const outline = L.polygon(ring, {
      color: '#1c1917',
      weight: 3,
      fillColor: '#1c1917',
      fillOpacity: 0.05,
    }).addTo(group);

    const commit = () => {
      const gj = outline.toGeoJSON() as GeoJSON.Feature<GeoJSON.Polygon>;
      useOss.getState().setBoundary(gj);
    };
    outline.pm.enable({ allowSelfIntersection: false });
    outline.on('pm:markerdragend', commit); // vertex moved
    outline.on('pm:vertexadded', commit); // midpoint clicked to add a vertex
    outline.on('pm:vertexremoved', commit); // vertex deleted

    return () => {
      outline.pm.disable();
      group.clearLayers();
    };
  }, [editingBoundary]);

  // ── features ───────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const group = featureGroupRef.current;
    if (!map || !group) return;
    group.clearLayers();

    // while adjusting the outline, features are inert so clicks land on boundary handles
    const editable = mode === 'edit' && !editingBoundary;
    const interactive = !editingBoundary;

    for (const f of features) {
      const { id, kind, name, widthM } = f.properties;
      const selected = id === selectedId;

      // track width visualised as a ribbon under the line (variable per-vertex when set)
      if (kind === 'track' && f.geometry.type === 'LineString' && f.geometry.coordinates.length >= 2) {
        try {
          const coords = f.geometry.coordinates as LngLat[];
          const perVertex = f.properties.widths;
          const ribbon =
            perVertex && perVertex.length === coords.length
              ? trackRibbon(coords, perVertex)
              : buffer(f as GeoJSON.Feature<GeoJSON.LineString>, (widthM ?? 4) / 2, { units: 'meters' });
          if (ribbon) {
            L.geoJSON(ribbon, {
              style: { stroke: false, fillColor: KINDS.track.color, fillOpacity: 0.25 },
              interactive: false,
              pmIgnore: true,
            }).addTo(group);
          }
        } catch {
          // buffer can fail on degenerate lines; the line itself still renders
        }
      }

      let layer: L.Layer;
      if (f.geometry.type === 'Point') {
        const [lng, lat] = f.geometry.coordinates;
        const marker = L.marker([lat, lng], {
          icon: markerIcon(kind, selected),
          draggable: editable,
          interactive,
          pmIgnore: true,
        });
        marker.on('dragend', () => {
          const p = marker.getLatLng();
          useOss.getState().updateFeatureGeometry(id, { type: 'Point', coordinates: [p.lng, p.lat] });
        });
        layer = marker;
      } else {
        const gj = L.geoJSON(f, { style: { ...pathStyle(kind, selected), interactive } });
        const inner = gj.getLayers()[0] as L.Path;
        inner.bindTooltip(name, {
          permanent: f.geometry.type !== 'LineString',
          direction: 'center',
          className: 'oss-label',
        });
        if (selected && editable) {
          const commit = () => {
            const updated = (inner as unknown as { toGeoJSON: () => GeoJSON.Feature }).toGeoJSON();
            useOss.getState().updateFeatureGeometry(id, updated.geometry);
          };
          inner.on('pm:update', commit);
          inner.on('pm:dragend', commit);
        }
        layer = inner;
      }

      if (interactive) {
        layer.on('click', (e) => {
          // while arming a comment, let the click bubble to the map to place the pin
          if (useOss.getState().addingAnnotation) return;
          L.DomEvent.stopPropagation(e as L.LeafletEvent & { originalEvent: Event });
          useOss.getState().selectAnnotation(null);
          useOss.getState().select(id);
        });
      }
      layer.addTo(group);

      if (selected && editable && !(layer instanceof L.Marker)) {
        (layer as L.Layer & { pm: { enable: (o?: object) => void } }).pm.enable({
          allowSelfIntersection: true,
        });
      }

      // per-vertex width handles for a selected track — drag outward to widen a section
      if (selected && editable && kind === 'track' && f.geometry.type === 'LineString') {
        const coords = f.geometry.coordinates as LngLat[];
        const widths = resolveWidths(coords, f.properties.widths, widthM ?? 4);
        const { rights } = trackOffsets(coords, widths);
        rights.forEach((rc, i) => {
          const handle = L.marker([rc[1], rc[0]], {
            icon: widthHandleIcon(),
            draggable: true,
            pmIgnore: true,
            zIndexOffset: 1200,
          });
          handle.bindTooltip(`${Math.round(widths[i])} m`, { direction: 'top', offset: [0, -6] });
          handle.on('dragend', () => {
            const p = handle.getLatLng();
            const half = distance(coords[i], [p.lng, p.lat], { units: 'meters' });
            useOss.getState().setVertexWidth(id, i, Math.max(1, Math.min(25, half * 2)));
          });
          handle.addTo(group);
        });
      }
    }
  }, [features, selectedId, mode, editingBoundary]);

  // ── annotations (comment pins) ─────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const group = annotationGroupRef.current;
    if (!map || !group) return;
    group.clearLayers();

    for (const a of annotations) {
      const marker = L.marker([a.lat, a.lng], {
        icon: annotationIcon(a.id === selectedAnnotationId),
        pmIgnore: true,
        // keep pins clickable to read them even in read-only share view
        interactive: true,
      });
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e as L.LeafletEvent & { originalEvent: Event });
        useOss.getState().select(null);
        useOss.getState().selectAnnotation(a.id);
      });
      marker.addTo(group);
    }

    if (pendingAnnotation) {
      L.marker([pendingAnnotation.lat, pendingAnnotation.lng], {
        icon: annotationIcon(false, true),
        interactive: false,
        pmIgnore: true,
      }).addTo(group);
    }
  }, [annotations, selectedAnnotationId, pendingAnnotation]);

  // crosshair cursor while placing a comment
  useEffect(() => {
    const el = containerRef.current;
    if (el) el.classList.toggle('oss-adding', addingAnnotation);
  }, [addingAnnotation]);

  // ── draw mode ──────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!drawKind || mode !== 'edit') {
      map.pm.disableDraw();
      return;
    }
    const kind = drawKind === 'boundary' ? null : drawKind;
    const shape = kind ? KINDS[kind].shape : 'Polygon';
    const color = kind ? KINDS[kind].color : '#1c1917';
    map.pm.enableDraw(shape, {
      templineStyle: { color },
      hintlineStyle: { color, dashArray: '5 5' },
      pathOptions: kind
        ? { color, fillColor: color, fillOpacity: 0.25 }
        : { color, fillColor: color, fillOpacity: 0.12, weight: 2.5 },
      markerStyle: kind ? { icon: markerIcon(kind, false) } : undefined,
      continueDrawing: false,
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') useOss.getState().setDrawKind(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      map.pm.disableDraw();
    };
  }, [drawKind, mode]);

  return <div ref={containerRef} className="absolute inset-0 z-0" />;
}
