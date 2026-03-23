import { C } from '../config.js';
import { f$, fp, fpc, vp, vf } from '../utils.js';
import { Card, MdaBar, SectionHeader } from '../ui.jsx';

// ─── QTD Snapshot Page ─────────────────────────────────────────────────────

function GoGetBar({ fcst, target, inv }) {
  if (!target || target === 0) return <span style={{ fontSize: 10, color: C.txt3 }}>N/A</span>;
  const p     = fcst / target;
  const good  = inv ? p <= 1 : p >= 1;
  const color = good ? C.grn : p >= 0.7 ? C.amb : C.red;
  return (
    <div style={{ width: '100%' }}>
      <div style={{ height: 6, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(p, 1) * 100}%`, background: color, borderRadius: 3 }} />
      </div>
      <div style={{ fontSize: 9, color, marginTop: 3, fontFamily: 'monospace' }}>
        {(p * 100).toFixed(0)}% of target
      </div>
    </div>
  );
}

function TableBlock({ title, rows, curQ, latestMo }) {
  return (
    <div style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.bdr}`, fontSize: 12, fontWeight: 600, color: C.txt }}>{title}</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: C.surf2 }}>
              <th style={{ padding: '7px 16px', textAlign: 'left',  fontSize: 10, color: C.txt3,    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.6px' }}>KPI</th>
              <th style={{ padding: '7px 10px', textAlign: 'right', fontSize: 10, color: C.act26,   fontWeight: 700 }}>Actual thru {curQ} · {latestMo}</th>
              <th style={{ padding: '7px 10px', textAlign: 'right', fontSize: 10, color: C.fct26,   fontWeight: 700 }}>{curQ} Forecast</th>
              <th style={{ padding: '7px 10px', textAlign: 'right', fontSize: 10, color: C.budLine, fontWeight: 700 }}>{curQ} Target</th>
              <th style={{ padding: '7px 10px', textAlign: 'right', fontSize: 10, color: C.txt3,    fontWeight: 600 }}>Go-Get</th>
              <th style={{ padding: '7px 10px', textAlign: 'left',  fontSize: 10, color: C.txt3,    fontWeight: 600, minWidth: 90 }}>Progress</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              // Go-Get and Progress are based on quarter forecast vs target (not QTD actuals)
              const fcst = r.fcst ?? r.qtd;  // fall back to qtd if no quarter forecast available
              const rem  = r.target ? r.target - fcst : null;
              const good = r.inv ? fcst <= r.target : fcst >= r.target;
              const remLabel = (() => {
                if (!r.target) return '—';
                if (r.inv) {
                  if (rem == null) return '—';
                  return rem >= 0 ? `${f$(rem)} under` : `${f$(Math.abs(rem))} over`;
                }
                if (rem == null) return '—';
                if (r.fmt === '%') return rem >= 0 ? `${fpc(Math.abs(rem))} to go` : '✓ On Track';
                return rem <= 0 ? '✓ On Track' : `${f$(rem)} to go`;
              })();
              return (
                <tr key={i} style={{ borderBottom: `1px solid rgba(30,39,64,.4)` }}>
                  <td style={{ padding: '9px 16px', color: C.txt2 }}>{r.metric}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'monospace', color: C.txt }}>
                    {r.fmt === '%' ? fp(r.qtd) : f$(r.qtd)}
                  </td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'monospace', color: C.txt2 }}>
                    {r.fcst != null ? (r.fmt === '%' ? fp(r.fcst) : f$(r.fcst)) : '—'}
                  </td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'monospace', color: C.txt3 }}>
                    {r.target ? (r.fmt === '%' ? fp(r.target) : f$(r.target)) : '—'}
                  </td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'monospace', color: good ? C.grn : C.red, fontSize: 10 }}>
                    {remLabel}
                  </td>
                  <td style={{ padding: '9px 10px', minWidth: 90 }}>
                    <GoGetBar fcst={fcst} target={r.target} inv={r.inv} />
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
  const moLeft = 3 - qtd.moComplete;   // forecast months remaining in quarter

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
    { lbl: `Enterprise ARR · ${curQ}F`,     val: f$(qtd.qCorpARRFcst), bud: f$(qCorpBud),  var: vf(vp(qtd.qCorpARRFcst, qCorpBud)),  good: qtd.qCorpARRFcst >= qCorpBud,  color: C.blue },
    { lbl: `Revenue · ${curQ}F`,      val: f$(qtd.qRevFcst),     bud: f$(qRevBud),   var: vf(vp(qtd.qRevFcst, qRevBud)),       good: qtd.qRevFcst >= qRevBud,       color: C.grn  },
    { lbl: `Gross Margin · ${curQ}F`, val: fp(qtd.qGmFcst),      bud: fp(qGmBud),    var: fpc(qtd.qGmFcst - qGmBud),           good: qtd.qGmFcst >= qGmBud,         color: C.cyn  },
    { lbl: `Enterprise NRR · ${curQ}F`,     val: fp(qtd.qNrrFcst),     bud: fp(qNrrBud),   var: fpc(qtd.qNrrFcst - qNrrBud),         good: qtd.qNrrFcst >= qNrrBud,       color: C.pur  },
    { lbl: `Ending Cash · ${curQ}F`,  val: f$(qtd.qCashFcst),    bud: f$(qCashBud),  var: vf(vp(qtd.qCashFcst, qCashBud)),     good: qtd.qCashFcst >= qCashBud,     color: C.amb  },
  ];

  const topRows = [
    { metric: 'Enterprise ARR (EOP)',      qtd: qtd.corpARR,    fcst: qtd.qCorpARRFcst,    target: qCorpBud,  fmt: '$'  },
    { metric: 'Federal ARR (EOP)',        qtd: qtd.fedARR,     fcst: qtd.qFedARRFcst,     target: qFedBud,   fmt: '$'  },
    { metric: 'Total ARR (EOP)',          qtd: qtd.totalARR,   fcst: qtd.qTotalARRFcst,   target: qTotalBud, fmt: '$'  },
    { metric: 'New Enterprise ARR (bookings)',  qtd: qtd.newCorpARR, fcst: qtd.qNewCorpARRFcst, target: qNewCBud,  fmt: '$'  },
    { metric: 'Exp Enterprise ARR (bookings)', qtd: qtd.expCorpARR, fcst: qtd.qExpCorpARRFcst, target: qExpCBud,  fmt: '$'  },
    { metric: 'Federal TCV (bookings)',  qtd: qtd.fedTCV,     fcst: qtd.qFedTCVFcst,     target: 0,         fmt: '$'  },
    { metric: 'Revenue (QTD)',           qtd: qtd.revenue,    fcst: qtd.qRevFcst,         target: qRevBud,   fmt: '$'  },
    { metric: 'Enterprise NRR % (TTM)',   qtd: qtd.nrr,        fcst: qtd.qNrrFcst,         target: qNrrBud,   fmt: '%', inv: false },
  ];

  const opRows = [
    { metric: 'Operating Expenses (QTD)', qtd: qtd.opex,     fcst: qtd.qOpexFcst,  target: qOpexBud, fmt: '$', inv: true  },
    { metric: 'Ending Cash',              qtd: qtd.cash,     fcst: qtd.qCashFcst,  target: qCashBud, fmt: '$'              },
    { metric: 'Gross Margin %',           qtd: qtd.gm,       fcst: qtd.qGmFcst,    target: qGmBud,   fmt: '%', inv: false  },
    { metric: 'Cash Burn (QTD)',          qtd: qtd.cashBurn, fcst: null,            target: null,      fmt: '$', inv: true   },
  ];

  // Count how many quarter forecasts are on/above target
  const fcstChecks = [
    qtd.qCorpARRFcst  >= qCorpBud,
    qtd.qRevFcst      >= qRevBud,
    qtd.qGmFcst       >= qGmBud,
    qtd.qCashFcst     >= qCashBud,
    qtd.qOpexFcst     <= qOpexBud,
  ].filter(Boolean).length;
  const opxQDelta = qtd.qOpexFcst - qOpexBud;

  return (
    <div>
      <MdaBar
        title={`${curQLabel} QTD Snapshot`}
        scope={`${qtd.moComplete} of 3 months actualized through ${qtd.month}${moLeft > 0 ? ` · ${moLeft} month${moLeft > 1 ? 's' : ''} forecast` : ''} · ${fcstChecks}/5 forecasts on or above target`}
        text={`Through ${qtd.month} (month ${qtd.moComplete} of ${curQ}), the quarter is projecting Enterprise ARR of ${f$(qtd.qCorpARRFcst)} (${vf(vp(qtd.qCorpARRFcst, qCorpBud))} vs target) and revenue of ${f$(qtd.qRevFcst)} (${vf(vp(qtd.qRevFcst, qRevBud))} vs target), with NRR holding at ${fp(qtd.nrr)} against our ${fp(qNrrBud)} plan. OpEx is tracking ${f$(Math.abs(opxQDelta))} ${opxQDelta <= 0 ? 'under' : 'over'} budget at ${f$(qtd.qOpexFcst)}, and ending cash is forecast at ${f$(qtd.qCashFcst)} (${vf(vp(qtd.qCashFcst, qCashBud))} vs target); gross margin stands at ${fp(qtd.qGmFcst)} vs our ${fp(qGmBud)} plan.`}
      />
      <SectionHeader title="QTD Snapshot" right={`${curQLabel} · ${qtd.moComplete} of 3 months actualized through ${qtd.month}`} />

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
        <TableBlock title={`Top-Line KPIs · QTD vs ${curQ} Target`}     rows={topRows} curQ={curQ} latestMo={qtd.month} />
        <TableBlock title={`Operating KPIs · QTD vs ${curQ} Target`}    rows={opRows}  curQ={curQ} latestMo={qtd.month} />
      </div>

    </div>
  );
}
