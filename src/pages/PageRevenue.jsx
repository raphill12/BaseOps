import React from 'react';
import { ComposedChart, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { C } from '../config.js';
import { f$, fp, fpc, vp, vf, q26vals } from '../utils.js';
import { Card, SectionHeader, ChartCard, ChartLegendStd, LegendDot, WaterfallChart, BvATable, TOOLTIP_STYLE, GRID, XSTYLE, YSTYLE, yFmt$, yFmtPct } from '../ui.jsx';

export default function PageRevenue({ QD, B, FY26 }) {
  const corp26 = q26vals(QD.corpARR);
  const fed26  = q26vals(QD.fedARR);
  const arr26  = QD.arr.slice(4).map(d => d.total);
  const rev26  = q26vals(QD.rev);
  const nrr26  = q26vals(QD.nrr);

  // Y/Y ARR growth quarters (vs same quarter prior year)
  const arrYoY = [
    { q: 'Q1 26A', act: (arr26[0] / 1612462) - 1, fct: null },
    { q: 'Q2 26F', act: null, fct: (arr26[1] / 2109500) - 1 },
    { q: 'Q3 26F', act: null, fct: (arr26[2] / 2385060) - 1 },
    { q: 'Q4 26F', act: null, fct: (arr26[3] / 2595641) - 1 },
  ].filter(d => d.act != null || d.fct != null);

  return (
    <div>
      <SectionHeader title="Revenue & ARR · 2025A & 2026A/F vs Budget" />

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 22 }}>
        <Card label="Total ARR · FY26F EOP"  value={f$(FY26.totalARR)} meta={`Budget ${f$(B.totalARR[4])}`} pill={vf(vp(FY26.totalARR, B.totalARR[4]))} pillGood={FY26.totalARR >= B.totalARR[4]} color={C.blue} />
        <Card label="Corp ARR · FY26F EOP"   value={f$(FY26.corpARR)}  meta={`Budget ${f$(B.corpARR[4])}`}  pill={vf(vp(FY26.corpARR,  B.corpARR[4]))}  pillGood={FY26.corpARR  >= B.corpARR[4]}  color={C.cyn}  />
        <Card label="Y/Y Total ARR · Q4 26F" value={fp(arr26[3] / 2595641 - 1)} meta="vs Q4 25A"            pill={`▲ ${fp(arr26[3] / 2595641 - 1)}`}    pillGood={true}                            color={C.grn}  />
        <Card label="Corp NRR · TTM Q4 26F"  value={fp(FY26.nrr)}      meta={`Budget ${fp(B.nrr[4])}`}       pill={fpc(FY26.nrr - B.nrr[4])}             pillGood={FY26.nrr >= B.nrr[4]}            color={C.pur}  />
      </div>

      {/* Monthly ARR line + Y/Y growth */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 20 }}>
        <ChartCard title="Total ARR · Monthly Progression" sub="Jan-25A → Dec-26F"
          legend={<><LegendDot color={C.act25} label="2025 Actual" /><LegendDot color={C.act26} label="Jan-26 Actual" /><LegendDot color={C.fct26} label="2026 Forecast" /></>}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart margin={{ top: 16, right: 10, left: 0, bottom: 0 }}>
              {GRID}
              <XAxis dataKey="m" type="category" data={QD.monthlyARR} {...XSTYLE} interval={2} />
              <YAxis tickFormatter={yFmt$} {...YSTYLE} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => f$(v)} />
              <Line data={QD.monthlyARR.slice(0, 12)}  dataKey="v" name="2025A"    stroke={C.act25} strokeWidth={2} dot={false} type="monotone" />
              <Line data={QD.monthlyARR.slice(12, 13)} dataKey="v" name="Jan-26A" stroke={C.act26} strokeWidth={2} dot={{ fill: C.act26, r: 4 }} type="monotone" />
              <Line data={QD.monthlyARR.slice(12)}     dataKey="v" name="2026F"   stroke={C.fct26} strokeWidth={2} strokeDasharray="4 3" dot={false} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Y/Y ARR Growth · 2026F"
          legend={<><LegendDot color={C.act26} label="Q1 Actual" /><LegendDot color={C.fct26} label="Forecast" /></>}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={arrYoY} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
              {GRID}<XAxis dataKey="q" {...XSTYLE} /><YAxis tickFormatter={yFmtPct} {...YSTYLE} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => fp(v)} />
              <Bar dataKey="act" name="Actual"   fill={C.act26} radius={[3, 3, 0, 0]}>
                <LabelList dataKey="act" position="top" formatter={v => v ? fp(v) : ''} style={{ fill: C.txt3, fontSize: 9 }} />
              </Bar>
              <Bar dataKey="fct" name="Forecast" fill={C.fct26} radius={[3, 3, 0, 0]}>
                <LabelList dataKey="fct" position="top" formatter={v => v ? fp(v) : ''} style={{ fill: C.txt3, fontSize: 9 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ARR waterfall + NRR */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <ChartCard title="ARR Waterfall · Q4 25A → FY26 Exit"
          legend={<><LegendDot color={C.act26} label="Anchor" /><LegendDot color={C.grn} label="Positive" /><LegendDot color={C.red} label="Negative" /></>}>
          <WaterfallChart data={QD.waterfall} height={260} />
        </ChartCard>

        <ChartCard title="Corporate NRR % (TTM)" sub="Quarterly vs Budget" legend={<ChartLegendStd />}>
          <ResponsiveContainer width="100%" height={260}>
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
      </div>

      {/* Detail BvA table */}
      <SectionHeader title="ARR & Revenue Detail" />
      <div style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
        <BvATable rows={[
          { sec: true, lbl: 'ARR Metrics' },
          { lbl: 'Total ARR (EOP)',         a25: [1612462, 2109500, 2385060, 2595641], a26: arr26,  b26: B.totalARR.slice(0, 4), fy: FY26.totalARR, fyb: B.totalARR[4], h: true },
          { lbl: 'Corporate ARR (EOP)',      a25: [1313730, 1469000, 1744560, 1955141], a26: corp26, b26: B.corpARR.slice(0, 4),  fy: FY26.corpARR,  fyb: B.corpARR[4]          },
          { lbl: 'Federal ARR (EOP)',        a25: [298732,  640500,  640500,  640500],  a26: fed26,  b26: B.fedARR.slice(0, 4),   fy: FY26.fedARR,   fyb: B.fedARR[4]           },
          { lbl: 'Federal TCV (Bookings)',   a25: [448098,  0,       0,       0],       a26: q26vals(QD.fedARR).map(() => null).map((_, i) => [0, 0, FY26.fedTCV * 0.56, FY26.fedTCV * 0.44][i]), b26: B.fedTCV.slice(0, 4), fy: FY26.fedTCV, fyb: B.fedTCV[4] ?? 2250000 },
          { sec: true, lbl: 'Revenue & Retention' },
          { lbl: 'Revenue',                 a25: [369102,  483870,  551089,  628065],  a26: rev26,  b26: B.revenue.slice(0, 4),  fy: FY26.revenue,  fyb: B.revenue[4],  h: true },
          { lbl: 'Corporate NRR % (TTM)',   a25: [null,    null,    null,    1.105],   a26: nrr26,  b26: B.nrr.slice(0, 4),      fy: FY26.nrr,      fyb: B.nrr[4],      f: fp   },
        ]} />
      </div>
    </div>
  );
}
