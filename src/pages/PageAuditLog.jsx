import React from 'react';
import { C } from '../config.js';
import { f$ } from '../utils.js';
import { MdaBar, SectionHeader } from '../ui.jsx';


// ─── Helpers ────────────────────────────────────────────────────────────────

const MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function cashOutToMonths(s) {
  if (!s) return null;
  const [mon, yr] = s.split('-');
  const mi = MO.indexOf(mon);
  if (mi < 0) return null;
  const year = Number(yr) + (Number(yr) < 100 ? 2000 : 0);
  return (year - 2025) * 12 + mi;
}

function fDelta$(v) {
  if (v == null || v === 0) return <span style={{ color: '#4b5563' }}>—</span>;
  const pos = v > 0;
  return <span style={{ color: pos ? C.grn : C.red }}>{pos ? '+' : ''}{f$(v)}</span>;
}

function fDeltaMo(v) {
  if (v == null || v === 0) return <span style={{ color: '#4b5563' }}>—</span>;
  const pos = v > 0;
  return <span style={{ color: pos ? C.grn : C.red }}>{pos ? '+' : ''}{v} mo</span>;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function PageAuditLog({ FY26, cashOutDate, auditLog = [] }) {
  const resolved = auditLog.map(e => {
    const date        = e.cashOutDate ?? cashOutDate ?? null;
    return {
      ...e,
      fy26ARR:     e.fy26ARR  ?? FY26?.totalARR ?? null,
      fy26Cash:    e.fy26Cash ?? FY26?.cash     ?? null,
      cashOutDate: date,
      cashOutMo:   cashOutToMonths(date),
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
        text="One row per day captures the forecast FY26 ARR exit, ending cash, and projected cash-out date. Deltas show the change vs the prior day's snapshot. On days with no model changes all three deltas will be flat."
      />

      <SectionHeader title="Daily History" />

      <div style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...hStyle, textAlign: 'left', minWidth: 90 }}>Date</th>
                <th style={{ ...hStyle, textAlign: 'right', minWidth: 110 }}>FY26 ARR Exit</th>
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
                  <td style={{ ...mono }}>{fDelta$(r.arrDelta)}</td>
                  <td style={{ ...mono, color: C.txt }}>{f$(r.fy26Cash)}</td>
                  <td style={{ ...mono }}>{fDelta$(r.cashDelta)}</td>
                  <td style={{ ...mono, color: C.txt }}>{r.cashOutDate || '—'}</td>
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
