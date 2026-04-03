// ─── Color Palette ─────────────────────────────────────────────────────────
// Edit these to retheme the entire dashboard at once.
export const C = {
  // Accent colors (from brand palette)
  blue:    '#85C9FF',   // sky blue
  pur:     '#9151B9',   // purple
  cyn:     '#BD268E',   // magenta

  // Status signals — keep semantic green/red/yellow
  grn:     '#22c55e',   // good / on-track
  red:     '#FF0066',   // bad / over-budget (hot pink from palette)
  amb:     '#F8DC02',   // warning / primary accent (yellow from palette)
  lgrn:    '#c084fc',   // Federal stacked-bar component (light purple)

  // Typography
  txt:     '#FFFFFF',   // primary text
  txt2:    '#9ca3af',   // secondary text
  txt3:    '#6b7280',   // tertiary / axis labels

  // Surfaces — true-black theme
  surf:    '#111111',   // card / panel background
  surf2:   '#1a1a1a',   // table headers, elevated surfaces
  bdr:     '#2a2a2a',   // borders
  bg:      '#080808',   // page background

  // Chart series
  act25:   '#85C9FF',   // 2025 actuals  → sky blue
  act26:   '#85C9FF',   // 2026 actuals  → sky blue
  fct26:   '#9151B9',   // 2026 forecast → purple
  budLine: '#BD268E',   // budget / target line → magenta
};

// ─── Google Sheets Config ──────────────────────────────────────────────────
// Change SHEET_ID here to point to a different workbook.
export const SHEET_ID = '1SO7-3IUEKUtuXIr6JSQeXYaat-x1nNkYHi6O1-CR-y0';

export const csvUrl = (sheetName) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

// ─── Navigation Tabs ───────────────────────────────────────────────────────
// Reorder, rename, or add tabs here.
export const TABS = [
  { id: 'audit',    label: 'Audit Log' },
  { id: 'qtd',      label: 'QTD Snapshot' },
  { id: 'overview', label: 'Overview' },
  { id: 'revenue',  label: 'Revenue & ARR' },
  { id: 'opcash',   label: 'Operating & Cash' },
  { id: 'corp',     label: 'Enterprise' },
  { id: 'fed',      label: 'Federal' },
  { id: 'lto',      label: 'Long-Term Outlook' },
];
