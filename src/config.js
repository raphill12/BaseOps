// ─── Color Palette ─────────────────────────────────────────────────────────
// Edit these to retheme the entire dashboard at once.
export const C = {
  blue:   '#3b82f6',
  grn:    '#10b981',
  amb:    '#f59e0b',
  red:    '#ef4444',
  pur:    '#8b5cf6',
  cyn:    '#06b6d4',
  lgrn:   '#34d399',
  txt:    '#e2e8f0',
  txt2:   '#94a3b8',
  txt3:   '#475569',
  surf:   '#111520',
  surf2:  '#161c2e',
  bdr:    '#1e2740',
  bg:     '#0a0d14',
  // Series colors
  act25:    '#10b981',  // 2025 actuals  → green
  act26:    '#3b82f6',  // 2026 actuals  → blue
  fct26:    '#818cf8',  // 2026 forecast → indigo
  budLine:  '#f59e0b',  // Budget line   → amber
};

// ─── Google Sheets Config ──────────────────────────────────────────────────
// Change SHEET_ID here to point to a different workbook.
export const SHEET_ID = '1SO7-3IUEKUtuXIr6JSQeXYaat-x1nNkYHi6O1-CR-y0';

export const csvUrl = (sheetName) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

// ─── Navigation Tabs ───────────────────────────────────────────────────────
// Reorder, rename, or add tabs here.
export const TABS = [
  { id: 'qtd',      label: 'QTD Snapshot' },
  { id: 'overview', label: 'Overview' },
  { id: 'revenue',  label: 'Revenue & ARR' },
  { id: 'opcash',   label: 'Operating & Cash' },
  { id: 'corp',     label: 'Enterprise' },
  { id: 'fed',      label: 'Federal' },
  { id: 'lto',      label: 'Long-Term Outlook' },
];
