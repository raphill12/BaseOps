// ─── Color Palette ─────────────────────────────────────────────────────────
// Edit these to retheme the entire dashboard at once.
export const C = {
  // Accent colors — three-color palette
  blue:    '#85C9FF',   // sky blue  (tertiary)

  // Status signals — keep semantic green/red/yellow
  grn:     '#22c55e',   // good / on-track
  red:     '#FF0066',   // bad / over-budget
  amb:     '#F8DC02',   // warning / secondary accent (yellow)

  // Typography
  txt:     '#FFFFFF',   // primary text
  txt2:    '#9ca3af',   // secondary text
  txt3:    '#4b5563',   // tertiary / axis labels

  // Surfaces — true-black theme (primary)
  surf:    '#111111',   // card / panel background
  surf2:   '#1a1a1a',   // table headers, elevated surfaces
  bdr:     '#2a2a2a',   // borders
  bg:      '#080808',   // page background

  // Chart series
  act25:   '#85C9FF',   // 2025 actuals  → blue (tertiary)
  act26:   '#F8DC02',   // 2026 actuals  → yellow (secondary)
  fct26:   '#6B7280',   // 2026 forecast → gray
  budLine: '#6B7280',   // budget / target line → gray (dashed)
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
