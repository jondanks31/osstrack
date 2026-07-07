import { toJpeg, toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import type { Plan } from './types';
import { KINDS } from './kinds';
import { acresOf, featureStats, fmtAcres } from './geo';

// leave out the on-map zoom/attribution controls
const captureFilter = (node: HTMLElement) =>
  !(node instanceof HTMLElement && node.classList.contains('leaflet-control-container'));

/**
 * Capture the current map view (tiles + drawn features) as an image data URL.
 * JPEG keeps the mostly-photographic export small enough to email; PNG stays
 * crisp for the browser print path where file size is irrelevant.
 */
async function captureMap(format: 'jpeg' | 'png' = 'jpeg'): Promise<string> {
  const el = document.querySelector('.leaflet-container') as HTMLElement | null;
  if (!el) throw new Error('Map is not ready.');
  const opts = { pixelRatio: 2, cacheBust: true, filter: captureFilter };
  return format === 'jpeg' ? toJpeg(el, { ...opts, quality: 0.92 }) : toPng(el, opts);
}

interface FeatureRow {
  color: string;
  label: string;
  name: string;
  stats: string;
}

function planRows(plan: Plan): FeatureRow[] {
  return plan.features.map((f) => ({
    color: KINDS[f.properties.kind].color,
    label: KINDS[f.properties.kind].label,
    name: f.properties.name,
    stats: featureStats(f) ?? '',
  }));
}

function today(): string {
  return new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export async function exportPdf(plan: Plan): Promise<void> {
  const img = await captureMap('jpeg');
  const props = await imageSize(img);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;

  // ── header ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(28, 25, 23);
  doc.text(plan.name || 'My land', margin, margin + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(120, 113, 108);
  const acres = plan.boundary ? fmtAcres(acresOf(plan.boundary)) : '';
  const meta = [acres, today()].filter(Boolean).join('   ·   ');
  doc.text(meta, pageW - margin, margin + 3, { align: 'right' });
  doc.text('OssTrack plan', pageW - margin, margin - 2, { align: 'right' });

  // ── map image ──
  const legendW = plan.features.length ? 62 : 0;
  const availW = pageW - margin * 2 - legendW - (legendW ? 6 : 0);
  const availH = pageH - (margin + 10) - margin;
  const scale = Math.min(availW / props.w, availH / props.h);
  const imgW = props.w * scale;
  const imgH = props.h * scale;
  const imgX = margin;
  const imgY = margin + 10;

  doc.setDrawColor(214, 211, 209);
  doc.addImage(img, 'JPEG', imgX, imgY, imgW, imgH);
  doc.rect(imgX, imgY, imgW, imgH);

  // ── legend / feature list ──
  const rows = planRows(plan);
  if (rows.length) {
    let x = margin + availW + 6;
    let y = imgY + 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(28, 25, 23);
    doc.text('Features', x, y);
    y += 6;

    doc.setFontSize(8.5);
    for (const r of rows) {
      if (y > pageH - margin) {
        doc.addPage('a4', 'landscape');
        x = margin;
        y = margin;
      }
      const [cr, cg, cb] = hexToRgb(r.color);
      doc.setFillColor(cr, cg, cb);
      doc.circle(x + 1, y - 1, 1.2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(28, 25, 23);
      doc.text(r.name, x + 4, y, { maxWidth: legendW - 4 });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 113, 108);
      doc.text([r.label, r.stats].filter(Boolean).join(' · '), x + 4, y + 3.6, {
        maxWidth: legendW - 4,
      });
      y += 9;
    }
  }

  doc.save(`${slug(plan.name)}-osstrack.pdf`);
}

export async function printPlan(plan: Plan): Promise<void> {
  const img = await captureMap();
  const rows = planRows(plan);
  const acres = plan.boundary ? fmtAcres(acresOf(plan.boundary)) : '';

  const legend = rows
    .map(
      (r) => `<li>
        <span class="dot" style="background:${r.color}"></span>
        <span class="nm">${escapeHtml(r.name)}</span>
        <span class="mt">${escapeHtml([r.label, r.stats].filter(Boolean).join(' · '))}</span>
      </li>`,
    )
    .join('');

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(
    plan.name,
  )} — OssTrack</title><style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; color: #1c1917; margin: 16mm; }
    header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #1c1917; padding-bottom: 6px; margin-bottom: 12px; }
    h1 { font-size: 20px; margin: 0; }
    .meta { color: #78716c; font-size: 12px; }
    img { width: 100%; border: 1px solid #d6d3d1; border-radius: 4px; }
    ul { list-style: none; padding: 0; margin: 14px 0 0; columns: 2; gap: 24px; font-size: 12px; }
    li { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; break-inside: avoid; }
    .dot { width: 10px; height: 10px; border-radius: 50%; flex: none; }
    .nm { font-weight: 600; }
    .mt { color: #78716c; margin-left: auto; }
    @page { size: A4 landscape; margin: 0; }
  </style></head><body>
    <header>
      <h1>${escapeHtml(plan.name || 'My land')}</h1>
      <div class="meta">${escapeHtml([acres, today()].filter(Boolean).join('   ·   '))} &nbsp;·&nbsp; OssTrack</div>
    </header>
    <img src="${img}" />
    ${rows.length ? `<ul>${legend}</ul>` : ''}
  </body></html>`;

  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  document.body.appendChild(frame);
  const fdoc = frame.contentWindow?.document;
  if (!fdoc) return;
  fdoc.open();
  fdoc.write(html);
  fdoc.close();

  const done = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(() => frame.remove(), 1000);
  };
  // wait for the embedded image to decode before printing
  const image = fdoc.querySelector('img');
  if (image && !image.complete) image.addEventListener('load', done, { once: true });
  else setTimeout(done, 300);
}

// ── helpers ──
function imageSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve({ w: i.naturalWidth, h: i.naturalHeight });
    i.onerror = reject;
    i.src = dataUrl;
  });
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function slug(name: string): string {
  return (name || 'plan').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'plan';
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
