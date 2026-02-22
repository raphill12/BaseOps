import React from 'react';
import { ComposedChart, BarChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { C } from '../config.js';
import { f$, fp, vp, vf, q26vals } from '../utils.js';
import { Card, SectionHeader, ChartCard, ChartLegendStd, BvATable, TOOLTIP_STYLE, GRID, XSTYLE, YSTYLE, yFmt$, yFmtPct } from '../ui.jsx';

export default function PageOverview({ QD, B, FY26 }) {
  // 2025 quarterly actuals derived from live QD series (not hardcoded)
  const arr25  = QD.arr.slice(0, 4).map(d => d.total);
  const rev25  = QD.rev.slice(0, 4).map(d => d.act);
  const gm25   = QD.gm.slice(0, 4).map(d => d.act);
  const opex25 = QD.opex.slice(0, 4).map(d => d.act);
  const cash25 = QD.cash.slice(0, 4).map(d => d.act);
  const nrr25  = QD.nrr.slice(0, 4).map(d => d.act);

  const cards = [
    { lbl: 'Total ARR · FY26F EOP',    val: f$(FY26.totalARR), meta: `Budget ${f$(B.totalARR[4])}`, pill: vf(vp(FY26.totalARR, B.totalARR[4])), good: FY26.totalARR >= B.totalARR[4], color: C.blue },
    { lbl: 'Revenue · FY26F',           val: f$(FY26.revenue),  meta: `Budget ${f$(B.revenue[4])}`,  pill: vf(vp(FY26.revenue,  B.revenue[4])),  good: FY26.revenue  >= B.revenue[4],  color: C.grn  },
    { lbl: 'Gross Margin · FY26F avg',  val: fp(FY26.gm),       meta: `Budget ${fp(B.gm[4])}`,       pill: vf(vp(FY26.gm,       B.gm[4])),       good: FY26.gm       >= B.gm[4],       color: C.cyn  },
    { lbl: 'OpEx · FY26F total',        val: f$(FY26.opex),     meta: `Budget ${f$(B.opex[4])}`,     pill: vf(vp(FY26.opex,     B.opex[4])),     good: FY26.opex     <= B.opex[4],     color: C.amb  },
    { lbl: 'Ending Cash · Dec-26F',     val: f$(FY26.cash),     meta: `Budget ${f$(B.cash[4])}`,     pill: vf(vp(FY26.cash,     B.cash[4])),     good: FY26.cash     >= B.cash[4],     color: C.pur  },
  ];

  // Extract live 2026 quarterly values from QD series
  const arr26  = QD.arr.slice(4).map(d => d.total);
  const rev26  = q26vals(QD.rev);
  const gm26   = q26vals(QD.gm);
  const opex26 = q26vals(QD.opex);
  const cash26 = q26vals(QD.cash);
  const nrr26  = q26vals(QD.nrr);

  return (
    <div>
      <SectionHeader title="FY 2026 Forecast vs Budget" right="Jan-26A · Feb–Dec 26F" />

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 24 }}>
        {cards.map((c, i) => <Card key={i} {...c} />)}
      </div>

      {/* ARR stacked chart */}
      <SectionHeader title="Total ARR · Stacked Corp + Federal" />
      <div style={{ marginBottom: 20 }}>
        <div style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 10, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.txt }}>Total ARR by Quarter · Corp + Federal vs Budget</div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', fontSize: 10, color: C.txt2 }}>
              {[
                { color: C.act25,          label: 'Corp 25A' },
                { color: `${C.act25}66`,   label: 'Fed 25A'  },
                { color: C.act26,          label: 'Corp 26A' },
                { color: C.fct26,          label: 'Corp 26F' },
                { color: C.budLine,        label: 'Budget', line: true, dashed: true },
              ].map((leg, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {leg.line
                    ? <div style={{ width: 14, height: 2, borderTop: `2px dashed ${leg.color}` }} />
                    : <div style={{ width: 8, height: 8, borderRadius: 2, background: leg.color }} />
                  }
                  {leg.label}
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={QD.arr} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
              {GRID}
              <XAxis dataKey="q" {...XSTYLE} />
              <YAxis tickFormatter={yFmt$} {...YSTYLE} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v, n) => [f$(v), n]} />
              <Bar dataKey="corp" name="Corp ARR" stackId="a">
                {QD.arr.map((d, i) => (
                  <Cell key={i} fill={d.q.includes('25A') ? C.act25 : d.q.includes('26A') ? C.act26 : C.fct26} />
                ))}
              </Bar>
              <Bar dataKey="fed" name="Fed ARR" stackId="a" radius={[3, 3, 0, 0]}>
                {QD.arr.map((d, i) => (
                  <Cell key={i} fill={d.q.includes('25A') ? `${C.act25}66` : d.q.includes('26A') ? `${C.act26}88` : `${C.fct26}88`} />
                ))}
                <LabelList dataKey="total" position="top" formatter={v => f$(v)} style={{ fill: C.txt3, fontSize: 9 }} />
              </Bar>
              <Line dataKey="budTotal" name="Budget" stroke={C.budLine} strokeDasharray="5 4" strokeWidth={2} dot={{ fill: C.budLine, r: 3 }} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue */}
      <SectionHeader title="Revenue · Quarterly" />
      <div style={{ marginBottom: 20 }}>
        <ChartCard title="Revenue · Actual/Forecast vs Budget" legend={<ChartLegendStd />}>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={QD.rev} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
              {GRID}<XAxis dataKey="q" {...XSTYLE} /><YAxis tickFormatter={yFmt$} {...YSTYLE} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => f$(v)} />
              <Bar dataKey="act" name="Actual" radius={[3, 3, 0, 0]}>
                {QD.rev.map((d, i) => <Cell key={i} fill={d.q.includes('25A') ? C.act25 : C.act26} />)}
                <LabelList dataKey="act" position="top" formatter={v => v ? f$(v) : ''} style={{ fill: C.txt3, fontSize: 9 }} />
              </Bar>
              <Bar dataKey="fct" name="Forecast" fill={C.fct26} radius={[3, 3, 0, 0]}>
                <LabelList dataKey="fct" position="top" formatter={v => v ? f$(v) : ''} style={{ fill: C.txt3, fontSize: 9 }} />
              </Bar>
              <Line dataKey="bud" name="Budget" stroke={C.budLine} strokeDasharray="5 4" strokeWidth={2} dot={{ fill: C.budLine, r: 3 }} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* GM / OpEx / Cash */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
        <ChartCard title="Gross Margin %" sub="Quarterly avg vs Budget" legend={<ChartLegendStd />}>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={QD.gm} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
              {GRID}<XAxis dataKey="q" {...XSTYLE} /><YAxis tickFormatter={yFmtPct} {...YSTYLE} domain={[0.7, 0.95]} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => fp(v)} />
              <Bar dataKey="act" name="Actual" radius={[3, 3, 0, 0]}>
                {QD.gm.map((d, i) => <Cell key={i} fill={d.q.includes('25A') ? C.act25 : C.act26} />)}
                <LabelList dataKey="act" position="top" formatter={v => v ? fp(v) : ''} style={{ fill: C.txt3, fontSize: 9 }} />
              </Bar>
              <Bar dataKey="fct" name="Forecast" fill={C.fct26} radius={[3, 3, 0, 0]}>
                <LabelList dataKey="fct" position="top" formatter={v => v ? fp(v) : ''} style={{ fill: C.txt3, fontSize: 9 }} />
              </Bar>
              <Line dataKey="bud" name="Budget" stroke={C.budLine} strokeDasharray="5 4" strokeWidth={2} dot={{ fill: C.budLine, r: 3 }} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Operating Expenses" sub="Quarterly vs Budget" legend={<ChartLegendStd />}>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={QD.opex} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
              {GRID}<XAxis dataKey="q" {...XSTYLE} /><YAxis tickFormatter={yFmt$} {...YSTYLE} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => f$(v)} />
              <Bar dataKey="act" name="Actual" radius={[3, 3, 0, 0]}>
                {QD.opex.map((d, i) => <Cell key={i} fill={d.q.includes('25A') ? C.act25 : C.act26} />)}
                <LabelList dataKey="act" position="top" formatter={v => v ? f$(v) : ''} style={{ fill: C.txt3, fontSize: 9 }} />
              </Bar>
              <Bar dataKey="fct" name="Forecast" fill={C.fct26} radius={[3, 3, 0, 0]}>
                <LabelList dataKey="fct" position="top" formatter={v => v ? f$(v) : ''} style={{ fill: C.txt3, fontSize: 9 }} />
              </Bar>
              <Line dataKey="bud" name="Budget" stroke={C.red} strokeDasharray="5 4" strokeWidth={2} dot={{ fill: C.red, r: 3 }} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Ending Cash" sub="Quarterly vs Budget" legend={<ChartLegendStd />}>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={QD.cash} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
              {GRID}<XAxis dataKey="q" {...XSTYLE} /><YAxis tickFormatter={yFmt$} {...YSTYLE} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => f$(v)} />
              <Bar dataKey="act" name="Actual" radius={[3, 3, 0, 0]}>
                {QD.cash.map((d, i) => <Cell key={i} fill={d.q.includes('25A') ? C.act25 : C.act26} />)}
                <LabelList dataKey="act" position="top" formatter={v => v ? f$(v) : ''} style={{ fill: C.txt3, fontSize: 9 }} />
              </Bar>
              <Bar dataKey="fct" name="Forecast" fill={C.fct26} radius={[3, 3, 0, 0]}>
                <LabelList dataKey="fct" position="top" formatter={v => v ? f$(v) : ''} style={{ fill: C.txt3, fontSize: 9 }} />
              </Bar>
              <Line dataKey="bud" name="Budget" stroke={C.budLine} strokeDasharray="5 4" strokeWidth={2} dot={{ fill: C.budLine, r: 3 }} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Summary BvA table */}
      <SectionHeader title="Full Year 2026 Summary · Forecast vs Budget" />
      <div style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
        <BvATable rows={[
          { lbl: 'Total ARR (EOP)',     a25: arr25,  a26: arr26,  b26: B.totalARR.slice(0, 4), fy: FY26.totalARR, fyb: B.totalARR[4], h: true },
          { lbl: 'Revenue',             a25: rev25,  a26: rev26,  b26: B.revenue.slice(0, 4),  fy: FY26.revenue,  fyb: B.revenue[4],  h: true },
          { lbl: 'Gross Margin %',      a25: gm25,   a26: gm26,   b26: B.gm.slice(0, 4),       fy: FY26.gm,       fyb: B.gm[4],       f: fp   },
          { lbl: 'Operating Expenses',  a25: opex25, a26: opex26, b26: B.opex.slice(0, 4),     fy: FY26.opex,     fyb: B.opex[4],     inv: true, h: true },
          { lbl: 'Ending Cash',         a25: cash25, a26: cash26, b26: B.cash.slice(0, 4),     fy: FY26.cash,     fyb: B.cash[4]                  },
          { lbl: 'Corp NRR % (TTM)',    a25: nrr25,  a26: nrr26,  b26: B.nrr.slice(0, 4),      fy: FY26.nrr,      fyb: B.nrr[4],      f: fp   },
        ]} />
      </div>
    </div>
  );
}
