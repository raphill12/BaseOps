import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { C } from '../config.js';
import { f$, fp, fpc, vp, vf } from '../utils.js';
import { Card, SectionHeader, ChartCard, LegendDot, TOOLTIP_STYLE, GRID, XSTYLE, YSTYLE, yFmt$ } from '../ui.jsx';

// ─── QTD Snapshot Page ─────────────────────────────────────────────────────
// Shows the latest month's actuals vs the full Q1 2026 budget target.

function GoGetBar({ qtd, target, inv }) {
  if (!target || target === 0) return <span style={{ fontSize: 10, color: C.txt3 }}>N/A</span>;
  const p     = qtd / target;
  const good  = inv ? p <= 1 : p >= 1;
  const color = good ? C.grn : p >= 0.7 ? C.amb : C.red;
  return (
    <div style={{ width: '100%' }}>
      <div style={{ height: 6, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(p, 1) * 100}%`, background: color, borderRadius: 3 }} />
      </div>
      <div style={{ fontSize: 9, color, marginTop: 3, fontFamily: 'monospace' }}>
        {(p * 100).toFixed(0)}% attained
      </div>
    </div>
  );
}

function TableBlock({ title, rows }) {
  return (
    <div style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.bdr}`, fontSize: 12, fontWeight: 600, color: C.txt }}>{title}</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: C.surf2 }}>
              <th style={{ padding: '7px 16px', textAlign: 'left',  fontSize: 10, color: C.txt3,    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.6px' }}>KPI</th>
              <th style={{ padding: '7px 10px', textAlign: 'right', fontSize: 10, color: C.act26,   fontWeight: 700 }}>Actual (QTD / Latest)</th>
              <th style={{ padding: '7px 10px', textAlign: 'right', fontSize: 10, color: C.budLine, fontWeight: 700 }}>Q1 2026 Target</th>
              <th style={{ padding: '7px 10px', textAlign: 'right', fontSize: 10, color: C.txt3,    fontWeight: 600 }}>Go-Get</th>
              <th style={{ padding: '7px 10px', textAlign: 'left',  fontSize: 10, color: C.txt3,    fontWeight: 600, minWidth: 90 }}>Progress</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const rem  = r.target ? r.target - r.qtd : null;  // positive = under target
              const good = r.inv ? r.qtd <= r.target : r.qtd >= r.target;
              const remLabel = (() => {
                if (!r.target) return '—';
                if (r.inv) {
                  // lower is better — show under/over budget
                  if (rem == null) return '—';
                  return rem >= 0 ? `${f$(rem)} under` : `${f$(Math.abs(rem))} over`;
                }
                if (rem == null) return '—';
                if (r.fmt === '%') return rem >= 0 ? `${fpc(Math.abs(rem))} to go` : '✓ Achieved';
                return rem <= 0 ? '✓ Achieved' : `${f$(rem)} to go`;
              })();
              return (
                <tr key={i} style={{ borderBottom: `1px solid rgba(30,39,64,.4)` }}>
                  <td style={{ padding: '9px 16px', color: C.txt2 }}>{r.metric}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'monospace', color: C.txt }}>
                    {r.fmt === '%' ? fp(r.qtd) : f$(r.qtd)}
                  </td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'monospace', color: C.txt3 }}>
                    {r.target ? (r.fmt === '%' ? fp(r.target) : f$(r.target)) : '—'}
                  </td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'monospace', color: good ? C.grn : C.red, fontSize: 10 }}>
                    {remLabel}
                  </td>
                  <td style={{ padding: '9px 10px', minWidth: 90 }}>
                    <GoGetBar qtd={r.qtd} target={r.target} inv={r.inv} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PageQTD({ QD, B }) {
  const qtd  = QD.qtd;
  const qi   = qtd.curQIdx ?? 0;       // 0=Q1, 1=Q2, 2=Q3, 3=Q4
  const curQ = qtd.curQ     || 'Q1';
  const curQLabel = qtd.curQLabel || 'Q1 2026';

  // Budget targets for the active quarter (live data preferred, fallback to B array)
  const qCorpBud  = qtd.qBudCorpARR    || B.corpARR[qi];
  const qFedBud   = qtd.qBudFedARR     || B.fedARR[qi];
  const qTotalBud = qtd.qBudTotalARR   || B.totalARR[qi];
  const qRevBud   = qtd.qBudRevenue    || B.revenue[qi];
  const qCashBud  = qtd.qBudCash       || B.cash[qi];
  const qGmBud    = qtd.qBudGm         || B.gm[qi];
  const qNrrBud   = qtd.qBudNrr        || B.nrr[qi];
  const qOpexBud  = qtd.qBudOpex       || B.opex[qi];
  const qNewCBud  = qtd.qBudNewCorpARR || B.corpNewLogo / 4;
  const qExpCBud  = qtd.qBudExpCorpARR || B.corpExp / 4;

  const topCards = [
    { lbl: `Corp ARR · ${curQ}F`,     val: f$(qtd.qCorpARRFcst), bud: f$(qCorpBud),  var: vf(vp(qtd.qCorpARRFcst, qCorpBud)),  good: qtd.qCorpARRFcst >= qCorpBud,  color: C.blue },
    { lbl: `Revenue · ${curQ}F`,      val: f$(qtd.qRevFcst),     bud: f$(qRevBud),   var: vf(vp(qtd.qRevFcst, qRevBud)),       good: qtd.qRevFcst >= qRevBud,       color: C.grn  },
    { lbl: `Gross Margin · ${curQ}F`, val: fp(qtd.qGmFcst),      bud: fp(qGmBud),    var: fpc(qtd.qGmFcst - qGmBud),           good: qtd.qGmFcst >= qGmBud,         color: C.cyn  },
    { lbl: `Corp NRR · ${curQ}F`,     val: fp(qtd.qNrrFcst),     bud: fp(qNrrBud),   var: fpc(qtd.qNrrFcst - qNrrBud),         good: qtd.qNrrFcst >= qNrrBud,       color: C.pur  },
    { lbl: `Ending Cash · ${curQ}F`,  val: f$(qtd.qCashFcst),    bud: f$(qCashBud),  var: vf(vp(qtd.qCashFcst, qCashBud)),     good: qtd.qCashFcst >= qCashBud,     color: C.amb  },
  ];

  const topRows = [
    { metric: 'Corporate ARR (EOP)',      qtd: qtd.corpARR,    target: qCorpBud,  fmt: '$'  },
    { metric: 'Federal ARR (EOP)',        qtd: qtd.fedARR,     target: qFedBud,   fmt: '$'  },
    { metric: 'Total ARR (EOP)',          qtd: qtd.totalARR,   target: qTotalBud, fmt: '$'  },
    { metric: 'New Corp ARR (bookings)',  qtd: qtd.newCorpARR, target: qNewCBud,  fmt: '$'  },
    { metric: 'Exp Corp ARR (bookings)', qtd: qtd.expCorpARR, target: qExpCBud,  fmt: '$'  },
    { metric: 'Federal TCV (bookings)',  qtd: qtd.fedTCV,     target: 0,         fmt: '$'  },
    { metric: 'Revenue (QTD)',           qtd: qtd.revenue,    target: qRevBud,   fmt: '$'  },
    { metric: 'Corporate NRR % (TTM)',   qtd: qtd.nrr,        target: qNrrBud,   fmt: '%', inv: false },
  ];

  const opRows = [
    { metric: 'Operating Expenses (QTD)', qtd: qtd.opex,     target: qOpexBud, fmt: '$', inv: true  },
    { metric: 'Ending Cash',              qtd: qtd.cash,     target: qCashBud, fmt: '$'              },
    { metric: 'Gross Margin %',           qtd: qtd.gm,       target: qGmBud,   fmt: '%', inv: false  },
    { metric: 'Cash Burn (MTD)',          qtd: qtd.cashBurn, target: null,      fmt: '$', inv: true   },
  ];

  return (
    <div>
      <SectionHeader title="QTD Snapshot" right={`${curQLabel} · ${qtd.moComplete} of 3 months complete`} />

      {/* KPI headline cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 24 }}>
        {topCards.map((c, i) => (
          <Card key={i} label={c.lbl} value={c.val}
            meta={`${curQ} Target: ${c.bud}`}
            pill={c.var} pillGood={c.good} color={c.color} />
        ))}
      </div>

      {/* Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <TableBlock title={`Top-Line KPIs · QTD vs ${curQ} Target`}     rows={topRows} />
        <TableBlock title={`Operating KPIs · QTD vs ${curQ} Target`}    rows={opRows} />
      </div>

    </div>
  );
}
