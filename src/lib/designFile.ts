import type { Plan } from './types';

/** Portable backup format for a single design. */
interface DesignFile {
  osstrack: number; // format version
  name: string;
  boundary: Plan['boundary'];
  features: Plan['features'];
  exportedAt: string;
}

function slug(name: string): string {
  return (name || 'design').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'design';
}

/** Download a design's data as an .osstrack.json file. */
export function downloadDesign(plan: Plan) {
  const payload: DesignFile = {
    osstrack: 1,
    name: plan.name,
    boundary: plan.boundary,
    features: plan.features,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug(plan.name)}.osstrack.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Parse and lightly validate an uploaded backup file into a design seed. */
export async function readDesignFile(
  file: File,
): Promise<{ name: string; boundary: Plan['boundary']; features: Plan['features'] }> {
  let data: Partial<DesignFile>;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error('That file isn’t valid JSON.');
  }

  const boundary = (data.boundary as Plan['boundary']) ?? null;
  const features = Array.isArray(data.features) ? (data.features as Plan['features']) : [];
  if (!boundary && features.length === 0) {
    throw new Error('This file doesn’t contain an OssTrack design.');
  }

  const name =
    typeof data.name === 'string' && data.name.trim() ? data.name.trim() : 'Imported design';
  return { name, boundary, features };
}
