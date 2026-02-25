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
              <th style={{ padding: '7px 10px', textAlign: 'right', fontSize: 10, color: C.act26,   fontWeight: 700 }}>Actual (MTD)</th>
              <th style={{ padding: '7px 10px', textAlign: 'right', fontSize: 10, color: C.budLine, fontWeight: 700 }}>Q1 2026 Target</th>
              <th style={{ padding: '7px 10px', textAlign: 'right', fontSize: 10, color: C.txt3,    fontWeight: 600 }}>Go-Get</th>
              <th style={{ padding: '7px 10px', textAlign: 'left',  fontSize: 10, color: C.txt3,    fontWeight: 600, minWidth: 90 }}>Progress</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const rem      = r.target ? r.target - r.qtd : null;
              const good     = r.inv ? r.qtd <= r.target : r.qtd >= r.target;
              const remFmt   = r.fmt === '%' ? fpc(r.qtd - r.target) : (rem !== null ? f$(Math.abs(rem)) : '—');
              const remLabel = r.target === 0 ? '—' : rem !== null ? (rem <= 0 ? '✓ Achieved' : `${remFmt} to go`) : '—';
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
  const qtd = QD.qtd;

  // Q1 budget targets (index 0 = Q1)
  const q1Corp  = qtd.q1BudCorpARR  || B.corpARR[0];
  const q1Fed   = qtd.q1BudFedARR   || B.fedARR[0];
  const q1Total = qtd.q1BudTotalARR || B.totalARR[0];
  const q1Rev   = qtd.q1BudRevenue  || B.revenue[0];
  const q1Cash  = qtd.q1BudCash     || B.cash[0];
  const q1Gm    = qtd.q1BudGm       || B.gm[0];
  const q1Nrr   = qtd.q1BudNrr      || B.nrr[0];

  const topCards = [
    { lbl: `Corp ARR · ${qtd.month}`,      val: f$(qtd.corpARR),     bud: f$(q1Corp),  var: vf(vp(qtd.corpARR, q1Corp)),   good: qtd.corpARR >= q1Corp,  color: C.blue },
    { lbl: `Revenue · ${qtd.month}`,        val: f$(qtd.revenue),     bud: f$(q1Rev/3), var: vf(vp(qtd.revenue, q1Rev/3)),  good: qtd.revenue >= q1Rev/3, color: C.grn  },
    { lbl: `Gross Margin · ${qtd.month}`,   val: fp(qtd.gm),          bud: fp(q1Gm),    var: fpc(qtd.gm - q1Gm),            good: qtd.gm >= q1Gm,         color: C.cyn  },
    { lbl: `Corp NRR (TTM) · ${qtd.month}`, val: fp(qtd.nrr),         bud: fp(q1Nrr),   var: fpc(qtd.nrr - q1Nrr),          good: qtd.nrr >= q1Nrr,       color: C.pur  },
    { lbl: `Ending Cash · ${qtd.month}`,    val: f$(qtd.cash),        bud: f$(q1Cash),  var: vf(vp(qtd.cash, q1Cash)),      good: qtd.cash >= q1Cash,     color: C.amb  },
  ];

  const topRows = [
    { metric: 'Corporate ARR (EOP)',      qtd: qtd.corpARR,    target: q1Corp,         fmt: '$'  },
    { metric: 'Federal ARR (EOP)',        qtd: qtd.fedARR,     target: q1Fed,          fmt: '$'  },
    { metric: 'Total ARR (EOP)',          qtd: qtd.totalARR,   target: q1Total,        fmt: '$'  },
    { metric: 'New Corp ARR (bookings)',  qtd: qtd.newCorpARR, target: B.corpNewLogo * (1/12), fmt: '$' },
    { metric: 'Exp Corp ARR (bookings)', qtd: qtd.expCorpARR, target: B.corpExp * (1/12),    fmt: '$' },
    { metric: 'Federal TCV (bookings)',  qtd: qtd.fedTCV,     target: 0,              fmt: '$'  },
    { metric: 'Revenue (MTD)',            qtd: qtd.revenue,    target: q1Rev / 3,      fmt: '$'  },
    { metric: 'Corporate NRR % (TTM)',   qtd: qtd.nrr,        target: q1Nrr,          fmt: '%', inv: false },
  ];

  const opRows = [
    { metric: 'Operating Expenses', qtd: qtd.opex,     target: B.opex[0] / 3,  fmt: '$', inv: true  },
    { metric: 'Ending Cash',        qtd: qtd.cash,     target: q1Cash,     fmt: '$'              },
    { metric: 'Gross Margin %',     qtd: qtd.gm,       target: q1Gm,       fmt: '%', inv: false  },
    { metric: 'Cash Burn (MTD)',    qtd: qtd.cashBurn, target: null,        fmt: '$', inv: true  },
  ];

  const months = Math.round((new Date() - new Date('2026-01-01')) / (1000 * 60 * 60 * 24 * 30)) + 1;
  const moComplete = Math.min(months, 3);

  return (
    <div>
      <SectionHeader title={`Q1 2026 · QTD Snapshot (${qtd.month} only)`} right={`${moComplete} of 3 months complete`} />

      {/* KPI headline cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 24 }}>
        {topCards.map((c, i) => (
          <Card key={i} label={c.lbl} value={c.val}
            meta={`Q1 Target: ${c.bud}`}
            pill={c.var} pillGood={c.good} color={c.color} />
        ))}
      </div>

      {/* Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <TableBlock title="Top-Line KPIs · QTD vs Q1 Target" rows={topRows} />
        <TableBlock title="Operating KPIs · QTD vs Q1 Target" rows={opRows} />
      </div>

    </div>
  );
}
