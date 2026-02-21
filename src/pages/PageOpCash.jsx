import React from 'react';
import { ComposedChart, BarChart, LineChart, Bar, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { C } from '../config.js';
import { f$, fp, vp, vf, q26vals } from '../utils.js';
import { Card, SectionHeader, ChartCard, ChartLegendStd, BvATable, TOOLTIP_STYLE, GRID, XSTYLE, YSTYLE, yFmt$, yFmtPct } from '../ui.jsx';

export default function PageOpCash({ QD, B, FY26 }) {
  const gm26   = q26vals(QD.gm);
  const opex26 = q26vals(QD.opex);
  const cash26 = q26vals(QD.cash);
  const nrr26  = q26vals(QD.nrr);

  return (
    <div>
      <SectionHeader title="Operating & Cash · 2025A & 2026A/F vs Budget" />

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 22 }}>
        <Card label="OpEx · FY26F total"       value={f$(FY26.opex)} meta={`Budget ${f$(B.opex[4])}`} pill={vf(vp(FY26.opex, B.opex[4]))} pillGood={FY26.opex <= B.opex[4]} color={C.amb} />
        <Card label="Ending Cash · Dec-26F"    value={f$(FY26.cash)} meta={`Budget ${f$(B.cash[4])}`} pill={vf(vp(FY26.cash, B.cash[4]))} pillGood={FY26.cash >= B.cash[4]} color={C.cyn} />
        <Card label="Gross Margin · FY26F avg" value={fp(FY26.gm)}   meta={`Budget ${fp(B.gm[4])}`}   pill={vf(vp(FY26.gm,   B.gm[4]))}   pillGood={FY26.gm   >= B.gm[4]}   color={C.grn} />
        <Card label="Headcount · Q4 26F"       value="20"             meta="Full-time employees"        color={C.pur} />
      </div>

      {/* OpEx + Cash charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <ChartCard title="Operating Expenses · Quarterly" sub="vs Budget" legend={<ChartLegendStd />}>
          <ResponsiveContainer width="100%" height={240}>
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

        <ChartCard title="Ending Cash · Quarterly" sub="vs Budget" legend={<ChartLegendStd />}>
          <ResponsiveContainer width="100%" height={240}>
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

      {/* GM / NRR / Monthly burn */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
        <ChartCard title="Gross Margin %" sub="Quarterly avg vs Budget" legend={<ChartLegendStd />}>
          <ResponsiveContainer width="100%" height={220}>
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

        <ChartCard title="Corporate NRR % (TTM)" sub="Quarterly vs Budget" legend={<ChartLegendStd />}>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={QD.nrr} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
              {GRID}<XAxis dataKey="q" {...XSTYLE} /><YAxis tickFormatter={yFmtPct} {...YSTYLE} domain={[0.9, 1.15]} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => fp(v)} />
              <Bar dataKey="act" name="Actual" fill={C.act26} radius={[3, 3, 0, 0]}>
                <LabelList dataKey="act" position="top" formatter={v => v ? fp(v) : ''} style={{ fill: C.txt3, fontSize: 9 }} />
              </Bar>
              <Bar dataKey="fct" name="Forecast" fill={C.fct26} radius={[3, 3, 0, 0]}>
                <LabelList dataKey="fct" position="top" formatter={v => v ? fp(v) : ''} style={{ fill: C.txt3, fontSize: 9 }} />
              </Bar>
              <Line dataKey="bud" name="Budget" stroke={C.budLine} strokeDasharray="5 4" strokeWidth={2} dot={{ fill: C.budLine, r: 3 }} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Cash Burn" sub="Red = outflow · Green = inflow">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={QD.monthlyBurn} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
              {GRID}
              <XAxis dataKey="m" {...XSTYLE} interval={3} angle={-30} textAnchor="end" />
              <YAxis tickFormatter={yFmt$} {...YSTYLE} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => f$(v)} />
              <Bar dataKey="v" name="Cash Burn" radius={[2, 2, 0, 0]}>
                {QD.monthlyBurn.map((d, i) => <Cell key={i} fill={d.v < 0 ? C.grn : C.red} />)}
              </Bar>
              <ReferenceLine y={0} stroke={C.bdr} strokeWidth={1} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Headcount */}
      <ChartCard title="Headcount (Full-Time) · 2026F" sub="Monthly">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={QD.hc} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
            {GRID}
            <XAxis dataKey="m" {...XSTYLE} interval={1} angle={-20} textAnchor="end" />
            <YAxis {...YSTYLE} domain={[0, 25]} tickFormatter={v => Math.round(v) + ''} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Line dataKey="v" name="Headcount" stroke={C.pur} strokeWidth={2} dot={{ fill: C.pur, r: 4 }} type="stepAfter">
              <LabelList dataKey="v" position="top" formatter={v => v || ''} style={{ fill: C.txt3, fontSize: 9 }} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Detail BvA table */}
      <div style={{ marginTop: 20 }}>
        <SectionHeader title="Operating & Cash Detail" />
        <div style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
          <BvATable rows={[
            { lbl: 'Operating Expenses', a25: [1133492, 1105524, 1361137, 1367592], a26: opex26, b26: B.opex.slice(0, 4), fy: FY26.opex, fyb: B.opex[4], inv: true, h: true },
            { lbl: 'Gross Margin %',     a25: [0.8233,  0.8660,  0.8770,  0.8680],  a26: gm26,   b26: B.gm.slice(0, 4),   fy: FY26.gm,   fyb: B.gm[4],   f: fp             },
            { lbl: 'Ending Cash (EOP)',  a25: [5600656, 4953894, 4210406, 4002599], a26: cash26, b26: B.cash.slice(0, 4), fy: FY26.cash, fyb: B.cash[4], h: true           },
            { lbl: 'Corp NRR % (TTM)',   a25: [null,    null,    null,    1.105],   a26: nrr26,  b26: B.nrr.slice(0, 4),  fy: FY26.nrr,  fyb: B.nrr[4],  f: fp             },
          ]} />
        </div>
      </div>
    </div>
  );
}
