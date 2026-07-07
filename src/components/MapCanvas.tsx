'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-rotate';
import '@geoman-io/leaflet-geoman-free';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { buffer } from '@turf/turf';
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
    iconSize: [32, 32],
    iconAnchor: [16, 16],
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

export default function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tilesRef = useRef<{ satellite: L.TileLayer; street: L.TileLayer } | null>(null);
  const featureGroupRef = useRef<L.LayerGroup | null>(null);
  const boundaryGroupRef = useRef<L.LayerGroup | null>(null);
  const fittedBoundaryRef = useRef<string | null>(null);

  const boundary = useOss((s) => s.plan.boundary);
  const features = useOss((s) => s.plan.features);
  const selectedId = useOss((s) => s.selectedId);
  const mode = useOss((s) => s.mode);
  const drawKind = useOss((s) => s.drawKind);
  const basemap = useOss((s) => s.basemap);
  const mapOpacity = useOss((s) => s.mapOpacity);
  const searchTarget = useOss((s) => s.searchTarget);
  const bearing = useOss((s) => s.bearing);

  // ── init map (once) ────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.5,
      rotate: true,
      rotateControl: false,
      touchRotate: false,
      bearing: useOss.getState().bearing,
    } as L.MapOptions).setView([52.5, -1.9], 6);

    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, attribution: 'Imagery © Esri, Maxar, Earthstar Geographics' },
    );
    const street = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
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

    // click on empty map clears selection
    map.on('click', () => useOss.getState().select(null));

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
    // full opacity until the boundary exists (searching/tracing needs the imagery)
    active.setOpacity(boundary ? mapOpacity : 1);
  }, [basemap, mapOpacity, boundary]);

  // ── search flyTo ───────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !searchTarget) return;
    map.flyTo([searchTarget.lat, searchTarget.lng], 17, { duration: 1.8 });
  }, [searchTarget]);

  // ── boundary outline + outside mask ────────────────────────────────
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
    L.polygon([WORLD_RING, ring], {
      stroke: false,
      fillColor: '#f2f1ec',
      fillOpacity: 1,
      interactive: false,
      pane: 'mask',
      pmIgnore: true,
    }).addTo(group);
    L.polygon(ring, {
      color: '#1c1917',
      weight: 2.5,
      fill: false,
      interactive: false,
      pmIgnore: true,
    }).addTo(group);

    const key = JSON.stringify(boundary.geometry.coordinates);
    if (fittedBoundaryRef.current !== key) {
      fittedBoundaryRef.current = key;
      map.fitBounds(L.latLngBounds(ring), { padding: [60, 60] });
    }
  }, [boundary]);

  // ── features ───────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const group = featureGroupRef.current;
    if (!map || !group) return;
    group.clearLayers();

    const editable = mode === 'edit';

    for (const f of features) {
      const { id, kind, name, widthM } = f.properties;
      const selected = id === selectedId;

      // track width visualised as a buffered ribbon under the line
      if (kind === 'track' && (f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString')) {
        try {
          const ribbon = buffer(f as GeoJSON.Feature<GeoJSON.LineString>, (widthM ?? 4) / 2, { units: 'meters' });
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
          pmIgnore: true,
        });
        marker.on('dragend', () => {
          const p = marker.getLatLng();
          useOss.getState().updateFeatureGeometry(id, { type: 'Point', coordinates: [p.lng, p.lat] });
        });
        layer = marker;
      } else {
        const gj = L.geoJSON(f, { style: pathStyle(kind, selected) });
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

      layer.on('click', (e) => {
        L.DomEvent.stopPropagation(e as L.LeafletEvent & { originalEvent: Event });
        useOss.getState().select(id);
      });
      layer.addTo(group);

      if (selected && editable && !(layer instanceof L.Marker)) {
        (layer as L.Layer & { pm: { enable: (o?: object) => void } }).pm.enable({
          allowSelfIntersection: true,
        });
      }
    }
  }, [features, selectedId, mode]);

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
