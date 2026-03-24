import React from 'react';
import { C } from '../config.js';
import { f$ } from '../utils.js';
import { MdaBar, SectionHeader } from '../ui.jsx';

// ─── Audit Log Entries ──────────────────────────────────────────────────────
// Add newest entries at the TOP of this array.
// For the first entry, deltas are null (baseline). For subsequent entries,
// deltas are computed automatically from the prior row.
//
// cashOutDate: string like "Sep-28" or "Nov-27"
// cashOutMonths: numeric representation as total months from a fixed epoch
//                (e.g. Jan-25 = 0, Feb-25 = 1, … Dec-26 = 23, Jan-27 = 24 …)
//                This is used to compute month deltas between entries.
const AUDIT_LOG = [
  {
    date:          '2026-03-24',
    title:         'Baseline Model Snapshot',
    fy26ARR:       null,   // null = use live FY26.totalARR
    fy26Cash:      null,   // null = use live FY26.cash
    cashOutDate:   null,   // null = use live cashOutDate
    description:   'Initial audit log entry capturing the current state of the FY26 financial model as the baseline for tracking future changes.',
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

const MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** Parse "Sep-28" → total months from Jan-25 epoch, for delta calculation. */
function cashOutToMonths(s) {
  if (!s) return null;
  const [mon, yr] = s.split('-');
  const mi = MO.indexOf(mon);
  if (mi < 0) return null;
  const year = Number(yr) + (Number(yr) < 100 ? 2000 : 0);
  return (year - 2025) * 12 + mi;
}

function fDelta$(v) {
  if (v == null) return '';
  const sign = v > 0 ? '+' : '';
  return `${sign}${f$(v)}`;
}

function fDeltaMo(v) {
  if (v == null) return '';
  const sign = v > 0 ? '+' : '';
  return `${sign}${v} mo`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function PageAuditLog({ FY26, cashOutDate }) {
  // Resolve live values for entries that use null
  const resolvedLog = AUDIT_LOG.map(entry => ({
    ...entry,
    fy26ARR:     entry.fy26ARR     ?? FY26?.totalARR ?? null,
    fy26Cash:    entry.fy26Cash    ?? FY26?.cash     ?? null,
    cashOutDate: entry.cashOutDate ?? cashOutDate    ?? null,
  }));

  // Compute deltas (each entry vs the one AFTER it, since newest is first)
  const rows = resolvedLog.map((entry, i) => {
    const prior = resolvedLog[i + 1] || null;
    const arrDelta  = (prior && entry.fy26ARR != null && prior.fy26ARR != null)
      ? entry.fy26ARR - prior.fy26ARR : null;
    const cashDelta = (prior && entry.fy26Cash != null && prior.fy26Cash != null)
      ? entry.fy26Cash - prior.fy26Cash : null;

    const curMo  = cashOutToMonths(entry.cashOutDate);
    const prevMo = prior ? cashOutToMonths(prior.cashOutDate) : null;
    const moDelta = (curMo != null && prevMo != null) ? curMo - prevMo : null;

    return { ...entry, arrDelta, cashDelta, moDelta };
  });

  const hStyle = {
    padding: '10px 14px', fontSize: 10, fontWeight: 600, color: C.txt3,
    textTransform: 'uppercase', letterSpacing: '.6px',
    background: C.surf2, borderBottom: `1px solid ${C.bdr}`,
    textAlign: 'left', whiteSpace: 'nowrap',
  };

  const cellStyle = {
    padding: '12px 14px', borderBottom: `1px solid ${C.bdr}`,
    fontSize: 12, color: C.txt2, verticalAlign: 'top',
  };

  const monoCell = {
    ...cellStyle,
    fontFamily: 'monospace', textAlign: 'right', whiteSpace: 'nowrap',
  };

  return (
    <>
      <MdaBar
        title="Model Audit Log"
        scope="All model revisions"
        text="Tracks every material change to the FY26 financial model. Each entry records the forecasted FY26 ARR exit, ending cash, and cash-out date — along with the delta from the prior version — so stakeholders can see exactly how the model has evolved over time."
      />

      <SectionHeader title="Change History" />

      <div style={{
        background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 10,
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...hStyle, minWidth: 90 }}>Date</th>
                <th style={{ ...hStyle, minWidth: 160 }}>Change</th>
                <th style={{ ...hStyle, textAlign: 'right', minWidth: 100 }}>FY26 ARR Exit</th>
                <th style={{ ...hStyle, textAlign: 'right', minWidth: 70 }}>Delta</th>
                <th style={{ ...hStyle, textAlign: 'right', minWidth: 110 }}>FY26 Ending Cash</th>
                <th style={{ ...hStyle, textAlign: 'right', minWidth: 70 }}>Delta</th>
                <th style={{ ...hStyle, textAlign: 'right', minWidth: 100 }}>Cash-Out Date</th>
                <th style={{ ...hStyle, textAlign: 'right', minWidth: 70 }}>Delta</th>
                <th style={{ ...hStyle, minWidth: 220 }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.015)' }}>
                  <td style={{ ...cellStyle, fontFamily: 'monospace', fontSize: 11, color: C.txt, whiteSpace: 'nowrap' }}>
                    {r.date}
                  </td>
                  <td style={{ ...cellStyle, fontWeight: 600, color: C.txt }}>
                    {r.title}
                  </td>
                  <td style={{ ...monoCell, color: C.txt }}>
                    {f$(r.fy26ARR)}
                  </td>
                  <td style={{
                    ...monoCell,
                    color: r.arrDelta == null ? C.txt3
                      : r.arrDelta > 0 ? C.grn : r.arrDelta < 0 ? C.red : C.txt3,
                  }}>
                    {r.arrDelta != null ? fDelta$(r.arrDelta) : '—'}
                  </td>
                  <td style={{ ...monoCell, color: C.txt }}>
                    {f$(r.fy26Cash)}
                  </td>
                  <td style={{
                    ...monoCell,
                    color: r.cashDelta == null ? C.txt3
                      : r.cashDelta > 0 ? C.grn : r.cashDelta < 0 ? C.red : C.txt3,
                  }}>
                    {r.cashDelta != null ? fDelta$(r.cashDelta) : '—'}
                  </td>
                  <td style={{ ...monoCell, color: C.txt }}>
                    {r.cashOutDate || '—'}
                  </td>
                  <td style={{
                    ...monoCell,
                    color: r.moDelta == null ? C.txt3
                      : r.moDelta > 0 ? C.grn : r.moDelta < 0 ? C.red : C.txt3,
                  }}>
                    {r.moDelta != null ? fDeltaMo(r.moDelta) : '—'}
                  </td>
                  <td style={{ ...cellStyle, fontSize: 11, lineHeight: 1.5, maxWidth: 360 }}>
                    {r.description}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ ...cellStyle, textAlign: 'center', color: C.txt3, padding: 32 }}>
                    No audit log entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: 10, color: C.txt3, lineHeight: 1.6 }}>
        To add a new entry, update the <span style={{ fontFamily: 'monospace', color: C.txt2 }}>AUDIT_LOG</span> array
        in <span style={{ fontFamily: 'monospace', color: C.txt2 }}>src/pages/PageAuditLog.jsx</span>.
        Add newest entries at the top. Set <span style={{ fontFamily: 'monospace', color: C.txt2 }}>fy26ARR</span>,{' '}
        <span style={{ fontFamily: 'monospace', color: C.txt2 }}>fy26Cash</span>, and{' '}
        <span style={{ fontFamily: 'monospace', color: C.txt2 }}>cashOutDate</span> to{' '}
        <span style={{ fontFamily: 'monospace', color: C.txt2 }}>null</span> to pull from the live model,
        or set explicit values to freeze a historical snapshot.
      </div>
    </>
  );
}
