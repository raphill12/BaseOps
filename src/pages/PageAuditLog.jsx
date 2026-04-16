import React from 'react';
import { C } from '../config.js';
import { f$ } from '../utils.js';
import { MdaBar, SectionHeader } from '../ui.jsx';


// ─── Helpers ────────────────────────────────────────────────────────────────

const MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function cashOutToMonths(s) {
  if (!s) return null;
  // "Mon-YY" or "Mon-YYYY"  e.g. "Mar-28" or "Mar-2028"
  const m1 = s.match(/^([A-Za-z]{3})-(\d{2,4})$/);
  if (m1) {
    const mi = MO.indexOf(m1[1].charAt(0).toUpperCase() + m1[1].slice(1).toLowerCase());
    if (mi < 0) return null;
    const yr = Number(m1[2]);
    const year = yr < 100 ? 2000 + yr : yr;
    return (year - 2025) * 12 + mi;
  }
  // "M/D/YYYY" or "MM/DD/YYYY"  e.g. "3/1/2028"
  const m2 = s.match(/^(\d{1,2})\/\d{1,2}\/(\d{4})$/);
  if (m2) return (Number(m2[2]) - 2025) * 12 + (Number(m2[1]) - 1);
  // "YYYY-MM-DD"
  const m3 = s.match(/^(\d{4})-(\d{2})-\d{2}$/);
  if (m3) return (Number(m3[1]) - 2025) * 12 + (Number(m3[2]) - 1);
  return null;
}

function fmtCashOutDate(s) {
  if (!s) return '—';
  // "MM/DD/YYYY"
  const m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m2) return MO[Number(m2[1]) - 1] + '-' + String(m2[2]).padStart(2, '0');
  // "Mon-YY" or "Mon-YYYY" — already has month name, just reformat day if present
  const m1 = s.match(/^([A-Za-z]{3})-(\d{2,4})$/);
  if (m1) return m1[1] + '-' + m1[2];
  // "YYYY-MM-DD"
  const m3 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m3) return MO[Number(m3[2]) - 1] + '-' + m3[3];
  return s;
}

function fDelta$(v) {
  if (v == null || v === 0) return <span style={{ color: '#ffffff' }}>—</span>;
  const pos = v > 0;
  return <span style={{ color: pos ? C.grn : C.red }}>{pos ? '+' : ''}{f$(v)}</span>;
}

function fDeltaK$(v) {
  if (v == null || v === 0) return <span style={{ color: '#ffffff' }}>—</span>;
  const pos = v > 0;
  const s = `$${Math.round(Math.abs(v) / 1000)}K`;
  return <span style={{ color: pos ? C.grn : C.red }}>{pos ? '+' : '-'}{s}</span>;
}

function fDeltaMo(v) {
  if (v == null || v === 0) return <span style={{ color: '#ffffff' }}>—</span>;
  const pos = v > 0;
  return <span style={{ color: pos ? C.grn : C.red }}>{pos ? '+' : ''}{v} mo</span>;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function PageAuditLog({ FY26, cashOutDate, auditLog = [] }) {
  const resolved = auditLog.map(e => {
    const date = e.cashOutDate ?? cashOutDate ?? null;
    return {
      ...e,
      fy26ARR:     e.fy26ARR  ?? FY26?.totalARR ?? null,
      fy26Cash:    e.fy26Cash ?? FY26?.cash     ?? null,
      cashOutDate: date,
      // Use the row's own stored value (not the live fallback) so deltas
      // reflect actual changes between snapshots, not always 0.
      cashOutMo:   cashOutToMonths(e.cashOutDate),
    };
  });

  const rows = resolved.map((e, i) => {
    const prev      = resolved[i + 1] || null;
    const arrDelta  = prev && e.fy26ARR  != null && prev.fy26ARR  != null ? e.fy26ARR  - prev.fy26ARR  : null;
    const cashDelta = prev && e.fy26Cash != null && prev.fy26Cash != null ? e.fy26Cash - prev.fy26Cash : null;
    const moDelta   = e.cashOutMo != null && prev?.cashOutMo != null      ? e.cashOutMo - prev.cashOutMo : null;
    return { ...e, arrDelta, cashDelta, moDelta };
  });

  const hStyle = {
    padding: '10px 14px', fontSize: 10, fontWeight: 600, color: C.txt3,
    textTransform: 'uppercase', letterSpacing: '.6px',
    background: C.surf2, borderBottom: `1px solid ${C.bdr}`,
    textAlign: 'right', whiteSpace: 'nowrap',
  };
  const cell = {
    padding: '11px 14px', borderBottom: `1px solid ${C.bdr}`,
    fontSize: 12, verticalAlign: 'middle',
  };
  const mono = { ...cell, fontFamily: 'monospace', textAlign: 'right', whiteSpace: 'nowrap' };

  return (
    <>
      <MdaBar
        title="Daily Snapshot Log"
        scope="FY26 model · updated daily"
        text="One row per day captures the forecast FY26 Annualized Revenue exit, ending cash, and projected cash-out date. Deltas show the change vs the prior day's snapshot. On days with no model changes all three deltas will be flat."
      />

      <SectionHeader title="Daily History" />

      <div style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...hStyle, textAlign: 'left', minWidth: 90 }}>Date</th>
                <th style={{ ...hStyle, textAlign: 'right', minWidth: 110 }}>FY26 Annualized Revenue Exit</th>
                <th style={{ ...hStyle, minWidth: 80 }}>vs Prior</th>
                <th style={{ ...hStyle, minWidth: 120 }}>FY26 Ending Cash</th>
                <th style={{ ...hStyle, minWidth: 80 }}>vs Prior</th>
                <th style={{ ...hStyle, minWidth: 110 }}>Cash-Out Date</th>
                <th style={{ ...hStyle, minWidth: 80 }}>vs Prior</th>
                <th style={{ ...hStyle, textAlign: 'left', minWidth: 180 }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.015)' }}>
                  <td style={{ ...cell, fontFamily: 'monospace', fontSize: 11, color: C.txt, whiteSpace: 'nowrap' }}>
                    {r.date}
                  </td>
                  <td style={{ ...mono, color: C.txt }}>{f$(r.fy26ARR)}</td>
                  <td style={{ ...mono }}>{fDeltaK$(r.arrDelta)}</td>
                  <td style={{ ...mono, color: C.txt }}>{f$(r.fy26Cash)}</td>
                  <td style={{ ...mono }}>{fDelta$(r.cashDelta)}</td>
                  <td style={{ ...mono, color: C.txt }}>{fmtCashOutDate(r.cashOutDate)}</td>
                  <td style={{ ...mono }}>{fDeltaMo(r.moDelta)}</td>
                  <td style={{ ...cell, color: C.txt3, fontSize: 11, lineHeight: 1.5 }}>
                    {r.note || ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
