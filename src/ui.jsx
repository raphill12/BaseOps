import React from 'react';
import {
  CartesianGrid, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import { C } from './config.js';
import { f$, fp, vp, vf } from './utils.js';

// ─── Chart Helpers ─────────────────────────────────────────────────────────

export const TOOLTIP_STYLE = {
  contentStyle: { background: C.surf2, border: `1px solid ${C.bdr}`, borderRadius: 8, color: C.txt, fontSize: 11 },
  labelStyle:   { color: C.txt2, fontWeight: 600 },
  itemStyle:    { color: C.txt2 },
};

export const GRID = <CartesianGrid strokeDasharray="3 3" stroke={C.bdr} />;

export const XSTYLE = { tick: { fill: C.txt3, fontSize: 10 }, axisLine: { stroke: C.bdr }, tickLine: false };
export const YSTYLE = { tick: { fill: C.txt3, fontSize: 10 }, axisLine: false, tickLine: false, width: 55 };

export function yFmt$(v) {
  return Math.abs(v) >= 1e6
    ? `$${(v / 1e6).toFixed(1)}M`
    : Math.abs(v) >= 1000
    ? `$${Math.round(v / 1000)}K`
    : `$${v}`;
}

export function yFmtPct(v) { return `${(v * 100).toFixed(0)}%`; }

// ─── KPI Card ──────────────────────────────────────────────────────────────

/** Metric card with a colored top accent, headline value, budget meta, and variance pill. */
export function Card({ label, lbl, value, val, meta, pill, pillGood, good, color, sub }) {
  const _label    = label || lbl;
  const _value    = value || val;
  const _pillGood = pillGood !== undefined ? pillGood : good;
  const pillColor = _pillGood === true ? C.grn : _pillGood === false ? C.red : C.txt3;
  const pillBg    = _pillGood === true
    ? 'rgba(16,185,129,.12)'
    : _pillGood === false
    ? 'rgba(239,68,68,.12)'
    : 'rgba(71,85,105,.2)';
  return (
    <div style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 10, padding: 16, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color || C.blue }} />
      <div style={{ fontSize: 10, color: C.txt3, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 6, fontWeight: 500 }}>{_label}</div>
      <div style={{ fontSize: 19, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '-.5px', marginBottom: 4, color: C.txt }}>{_value}</div>
      {meta && <div style={{ fontSize: 11, color: C.txt2, marginBottom: 3 }}>{meta}</div>}
      {pill && (
        <span style={{ display: 'inline-flex', padding: '1px 7px', borderRadius: 8, fontSize: 10, fontWeight: 700, fontFamily: 'monospace', background: pillBg, color: pillColor }}>
          {pill}
        </span>
      )}
      {sub && <div style={{ fontSize: 10, color: C.txt3, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────

export function SectionHeader({ title, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.txt2, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>{title}</div>
      <div style={{ flex: 1, height: 1, background: C.bdr }} />
      {right && <div style={{ fontSize: 10, color: C.txt3, whiteSpace: 'nowrap' }}>{right}</div>}
    </div>
  );
}

// ─── Chart Card ────────────────────────────────────────────────────────────

export function ChartCard({ title, sub, legend, children }) {
  return (
    <div style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 10, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.txt }}>{title}</div>
          {sub && <div style={{ fontSize: 11, color: C.txt3, marginTop: 2 }}>{sub}</div>}
        </div>
        {legend && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>{legend}</div>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Legend Dot / Line ─────────────────────────────────────────────────────

export function LegendDot({ color, label, dashed, line }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.txt2 }}>
      {line
        ? <div style={{ width: 14, height: 2, borderTop: dashed ? `2px dashed ${color}` : `2px solid ${color}` }} />
        : <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
      }
      {label}
    </div>
  );
}

export const ChartLegendStd = () => (
  <>
    <LegendDot color={C.act25}   label="2025A" />
    <LegendDot color={C.act26}   label="2026A" />
    <LegendDot color={C.fct26}   label="2026F" />
    <LegendDot color={C.budLine} label="Budget" line dashed />
  </>
);

// ─── Waterfall Chart ───────────────────────────────────────────────────────

export function WaterfallChart({ data, height = 240 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 24, right: 10, left: 0, bottom: 0 }}>
        {GRID}
        <XAxis dataKey="name" {...XSTYLE} />
        <YAxis tickFormatter={yFmt$} {...YSTYLE} />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(v, n, p) => [f$(p.payload.val), p.payload.name]}
        />
        <Bar dataKey="start" stackId="wf" fill="transparent" stroke="none" />
        <Bar dataKey="bar" stackId="wf" name="Value" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.type === 'anchor' ? C.act26 : d.type === 'pos' ? C.grn : C.red} />
          ))}
          <LabelList
            content={({ x, y, width, value, index }) => {
              const d = data[index];
              if (!d) return null;
              return (
                <text x={x + width / 2} y={y - 6} fill={C.txt2} fontSize={9} textAnchor="middle">
                  {f$(d.val)}
                </text>
              );
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Budget vs Actual Table ────────────────────────────────────────────────
/**
 * BvATable shows quarterly actual/forecast vs budget with variance %.
 *
 * Row shape:
 *   { lbl, a25, a26, b26, fy, fyb, f, inv, h, sec }
 *   - lbl:  row label
 *   - a25:  [Q1,Q2,Q3,Q4] 2025 actuals (historical, hardcoded)
 *   - a26:  [Q1,Q2,Q3,Q4] 2026 actual or forecast
 *   - b26:  [Q1,Q2,Q3,Q4] 2026 budget
 *   - fy:   FY26 forecast total/EOP
 *   - fyb:  FY26 budget total/EOP
 *   - f:    formatter function (default: f$)
 *   - inv:  true if lower is better (e.g. opex, churn)
 *   - h:    true for bold header rows
 *   - sec:  true for section divider rows (uses only lbl)
 */
export function BvATable({ rows, has25 = true }) {
  const hStyle = {
    padding: '7px 10px', fontSize: 10, fontWeight: 600, color: C.txt3,
    textTransform: 'uppercase', letterSpacing: '.6px',
    background: C.surf2, borderBottom: `1px solid ${C.bdr}`,
    textAlign: 'right', whiteSpace: 'nowrap',
  };
  const Q26       = ['Q1 26A', 'Q2 26F', 'Q3 26F', 'Q4 26F'];
  const Q26colors = [C.act26, C.fct26, C.fct26, C.fct26];

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr>
            <th rowSpan={2} style={{ ...hStyle, textAlign: 'left', minWidth: 180, paddingLeft: 16, verticalAlign: 'bottom' }}>
              Metric
            </th>
            {has25 && ['Q1 25A', 'Q2 25A', 'Q3 25A', 'Q4 25A'].map(q => (
              <th key={q} style={{ ...hStyle, borderLeft: `1px solid ${C.bdr}`, color: C.act25, fontSize: 9 }}>{q}</th>
            ))}
            {Q26.map((q, i) => (
              <th key={q} colSpan={3} style={{ ...hStyle, borderLeft: `1px solid ${C.bdr}`, textAlign: 'center', color: Q26colors[i] }}>{q}</th>
            ))}
            <th colSpan={3} style={{ ...hStyle, borderLeft: `1px solid ${C.bdr}`, textAlign: 'center', color: C.txt2 }}>FY 2026</th>
          </tr>
          <tr>
            {has25 && [0, 1, 2, 3].map(i => (
              <th key={i} style={{ ...hStyle, color: C.act25, fontSize: 9, borderLeft: `1px solid ${C.bdr}` }}>A</th>
            ))}
            {[0, 1, 2, 3].map(i => [
              <th key={`af${i}`} style={{ ...hStyle, color: Q26colors[i], fontSize: 9, borderLeft: `1px solid ${C.bdr}` }}>A/F</th>,
              <th key={`b${i}`}  style={{ ...hStyle, color: C.txt3, fontSize: 9, fontStyle: 'italic' }}>Bud</th>,
              <th key={`v${i}`}  style={{ ...hStyle, color: C.amb, fontSize: 9 }}>Var%</th>,
            ])}
            <th style={{ ...hStyle, color: C.fct26, fontSize: 9, borderLeft: `1px solid ${C.bdr}` }}>F</th>
            <th style={{ ...hStyle, color: C.txt3, fontSize: 9, fontStyle: 'italic' }}>Bud</th>
            <th style={{ ...hStyle, color: C.amb, fontSize: 9 }}>Var%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => {
            if (r.sec) {
              return (
                <tr key={ri}>
                  <td colSpan={100} style={{ background: C.surf2, color: C.txt3, fontSize: 9, textTransform: 'uppercase', letterSpacing: '.7px', padding: '5px 16px' }}>
                    {r.lbl}
                  </td>
                </tr>
              );
            }

            const fmt = r.f || f$;
            const bvaCells = (r.a26 || [null, null, null, null]).map((v, i) => {
              const bv   = r.b26 ? r.b26[i] : null;
              const va   = vp(v, bv);
              const good = va == null ? null : r.inv ? va < 0 : va > 0;
              return [
                <td key={`af${i}`} style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', color: i === 0 ? C.act26 : C.fct26, borderLeft: `1px solid ${C.bdr}`, whiteSpace: 'nowrap' }}>{fmt(v)}</td>,
                <td key={`b${i}`}  style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', color: C.txt3, whiteSpace: 'nowrap' }}>{fmt(bv)}</td>,
                <td key={`v${i}`}  style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', color: good === true ? C.grn : good === false ? C.red : C.txt3, whiteSpace: 'nowrap' }}>{vf(vp(v, bv))}</td>,
              ];
            });

            const fyVar  = vp(r.fy, r.fyb);
            const fyGood = fyVar == null ? null : r.inv ? fyVar < 0 : fyVar > 0;

            return (
              <tr key={ri} style={{ borderBottom: `1px solid rgba(30,39,64,.5)` }}>
                <td style={{ padding: '8px 16px', fontSize: 12, color: r.h ? C.txt : C.txt2, fontWeight: r.h ? 600 : 400 }}>{r.lbl}</td>
                {has25 && (r.a25 || [null, null, null, null]).map((v, i) => (
                  <td key={i} style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', color: C.act25, borderLeft: `1px solid ${C.bdr}`, whiteSpace: 'nowrap' }}>{fmt(v)}</td>
                ))}
                {bvaCells}
                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', color: C.fct26, borderLeft: `1px solid ${C.bdr}`, whiteSpace: 'nowrap', fontWeight: r.h ? 600 : 400 }}>{fmt(r.fy)}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', color: C.txt3, whiteSpace: 'nowrap' }}>{fmt(r.fyb)}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', color: fyGood === true ? C.grn : fyGood === false ? C.red : C.txt3, whiteSpace: 'nowrap' }}>{vf(fyVar)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
