export interface SearchResult {
  label: string;
  lat: number;
  lng: number;
}

const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
const COORDS = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;

export async function searchPlace(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const coords = q.match(COORDS);
  if (coords) {
    const lat = parseFloat(coords[1]);
    const lng = parseFloat(coords[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return [{ label: `Coordinates ${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng }];
    }
  }

  if (UK_POSTCODE.test(q)) {
    try {
      const r = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(q)}`);
      if (r.ok) {
        const j = await r.json();
        const p = j.result;
        return [
          {
            label: `${p.postcode} — ${p.admin_ward}, ${p.admin_district}`,
            lat: p.latitude,
            lng: p.longitude,
          },
        ];
      }
    } catch {
      // fall through to Nominatim
    }
  }

  const r = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=gb&limit=5&q=${encodeURIComponent(q)}`,
    { headers: { Accept: 'application/json' } },
  );
  if (!r.ok) throw new Error('Search failed — please try again.');
  const results: { display_name: string; lat: string; lon: string }[] = await r.json();
  return results.map((x) => ({
    label: x.display_name,
    lat: parseFloat(x.lat),
    lng: parseFloat(x.lon),
  }));
}
