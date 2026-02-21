// ─── Number Formatters ─────────────────────────────────────────────────────

/** Format as dollar amount: $1.2M, $450K, $350 */
export function f$(v, dec = 1) {
  if (v == null) return '—';
  const neg = v < 0, a = Math.abs(v);
  const s = a >= 1e6
    ? `$${(a / 1e6).toFixed(dec)}M`
    : a >= 1000
    ? `$${Math.round(a / 1000)}K`
    : `$${Math.round(a)}`;
  return neg ? `(${s})` : s;
}

/** Format as percentage: 12.3% */
export function fp(v) { return v == null ? '—' : `${(v * 100).toFixed(1)}%`; }

/** Format as plain number: 14.0 */
export function fn(v) { return v == null ? '—' : v.toFixed(1); }

/** Format as signed percentage: +2.3%, -1.1% */
export function fpc(v) {
  return v == null ? '—' : `${v > 0 ? '+' : ''}${(v * 100).toFixed(1)}%`;
}

/** Variance as a ratio: (actual - budget) / |budget| */
export function vp(a, b) {
  return (a != null && b != null && b !== 0) ? (a - b) / Math.abs(b) : null;
}

/** Format variance ratio as signed %: "+5.2%", "-3.1%" */
export function vf(v) {
  return v == null ? '—' : `${v > 0 ? '+' : ''}${(v * 100).toFixed(1)}%`;
}

/** Extract 2026 quarterly values (indices 4-7) from a QD series.
 *  Each entry has act (actual) or fct (forecast); returns whichever is present. */
export function q26vals(series) {
  return series.slice(4).map(d => d.act ?? d.fct ?? null);
}
