import { qrSvg } from './qr-svg';
import type { StockUnit } from './stock-unit-types';

export function stockUnitsToCsv(units: StockUnit[]): string {
  const header = 'code,status,batchId,createdAt';
  const rows = units.map((unit) =>
    [unit.code, unit.status, unit.batchId, unit.createdAt]
      .map((value) => csvCell(value))
      .join(','),
  );
  return `${header}\n${rows.join('\n')}\n`;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function printQrSheet(units: StockUnit[]): void {
  const cards = units
    .map(
      (unit) => `
        <figure class="card">
          ${qrSvg(unit.code, 3)}
          <figcaption>${escapeHtml(unit.code)}</figcaption>
        </figure>`,
    )
    .join('');

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Tabasamu stock QR — ${escapeHtml(units[0]?.batchId ?? 'batch')}</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 16px; color: #111; }
      h1 { font-size: 14px; font-weight: 600; margin: 0 0 12px; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
      .card { margin: 0; text-align: center; break-inside: avoid; page-break-inside: avoid; }
      .card svg { width: 100%; height: auto; max-width: 160px; }
      figcaption { font-family: ui-monospace, monospace; font-size: 11px; margin-top: 6px; word-break: break-all; }
      @media print { body { margin: 8mm; } }
    </style>
  </head>
  <body>
    <h1>Blank stock labels — bind SKU on activate. Do not write flavour at print.</h1>
    <div class="grid">${cards}</div>
    <script>window.onload = function () { window.print(); };</script>
  </body>
</html>`;

  const sheet = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
  if (!sheet) {
    throw new Error('Allow pop-ups to print the QR sheet.');
  }
  sheet.document.write(html);
  sheet.document.close();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
