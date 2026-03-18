import { ComposedChart, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { C } from '../config.js';
import { f$, fp, fpc, vp, vf, q26vals, actMos26 } from '../utils.js';
import { Card, MdaBar, SectionHeader, ChartCard, ChartLegendStd, LegendDot, WaterfallChart, BvATable, TOOLTIP_STYLE, GRID, XSTYLE, YSTYLE, yFmt$, yFmtPct } from '../ui.jsx';

export default function PageRevenue({ QD, B, FY26, latestMo }) {
  const corp26 = q26vals(QD.corpARR);
  const fed26  = q26vals(QD.fedARR);
  const arr26  = QD.arr.slice(4).map(d => d.total);
  const rev26  = q26vals(QD.rev);
  const nrr26  = q26vals(QD.nrr);

  // 2025 quarterly actuals derived from live QD series (not hardcoded)
  const arr25     = QD.arr.slice(0, 4).map(d => d.total);
  const corp25    = QD.arr.slice(0, 4).map(d => d.corp);
  const fed25     = QD.arr.slice(0, 4).map(d => d.fed);
  const rev25     = QD.rev.slice(0, 4).map(d => d.act);
  const nrr25     = QD.nrr.slice(0, 4).map(d => d.act);
  const fedTCV25  = QD.fedTCVQ.slice(0, 4).map(d => d.act);
  const fedTCV26  = q26vals(QD.fedTCVQ);

  // Y/Y ARR growth quarters (vs same quarter prior year from live data)
  const arrYoY = [
    { q: 'Q1 26A', val: arr25[0] ? (arr26[0] / arr25[0]) - 1 : null },
    { q: 'Q2 26F', val: arr25[1] ? (arr26[1] / arr25[1]) - 1 : null },
    { q: 'Q3 26F', val: arr25[2] ? (arr26[2] / arr25[2]) - 1 : null },
    { q: 'Q4 26F', val: arr25[3] ? (arr26[3] / arr25[3]) - 1 : null },
  ].filter(d => d.val != null);

  const yoyQ4 = arr25[3] ? arr26[3] / arr25[3] - 1 : null;

  // Number of 2026 actual months (e.g. "Feb-26" → 2) — drives the monthly ARR line split
  const nAct26 = actMos26(latestMo) || 1;

  return (
    <div>
      <MdaBar
        title="Revenue & ARR"
        scope="2025 Actual · 2026 Actual/Forecast vs Budget"
        text={`The business is tracking to ${f$(FY26.totalARR)} total ARR at year-end — ${vf(vp(FY26.totalARR, B.totalARR[4]))} vs budget — with ${yoyQ4 != null ? fp(yoyQ4) : '—'} YoY growth off the Q4 '25 exit. Revenue is projected at ${f$(FY26.revenue)} (${vf(vp(FY26.revenue, B.revenue[4]))} vs budget), supported by NRR of ${fp(FY26.nrr)} vs our ${fp(B.nrr[4])} plan. Federal TCV bookings are pacing at ${f$(FY26.fedTCV)} vs the ${f$(B.fedTCV[4] ?? 2250000)} target.`}
      />
      <SectionHeader title="Revenue & ARR · 2025A & 2026A/F vs Budget" />

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 22 }}>
        <Card label="Total ARR · FY26F EOP"  value={f$(FY26.totalARR)} meta={`Budget ${f$(B.totalARR[4])}`} pill={vf(vp(FY26.totalARR, B.totalARR[4]))} pillGood={FY26.totalARR >= B.totalARR[4]} color={C.blue} />
        <Card label="Enterprise ARR · FY26F EOP"   value={f$(FY26.corpARR)}  meta={`Budget ${f$(B.corpARR[4])}`}  pill={vf(vp(FY26.corpARR,  B.corpARR[4]))}  pillGood={FY26.corpARR  >= B.corpARR[4]}  color={C.cyn}  />
        <Card label="Y/Y Total ARR · Q4 26F" value={fp(arr25[3] ? arr26[3] / arr25[3] - 1 : null)} meta="vs Q4 25A" pill={arr25[3] ? `▲ ${fp(arr26[3] / arr25[3] - 1)}` : '—'} pillGood={true} color={C.grn}  />
        <Card label="Enterprise NRR · TTM Q4 26F"  value={fp(FY26.nrr)}      meta={`Budget ${fp(B.nrr[4])}`}       pill={fpc(FY26.nrr - B.nrr[4])}             pillGood={FY26.nrr >= B.nrr[4]}            color={C.pur}  />
      </div>

      {/* Monthly ARR line + Y/Y growth */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 20 }}>
        <ChartCard title="Total ARR · Monthly Progression" sub="Jan-25A → Dec-26F"
          legend={<><LegendDot color={C.act25} label="2025 Actual" /><LegendDot color={C.act26} label={`${latestMo} Actual`} /><LegendDot color={C.fct26} label="2026 Forecast" /></>}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart margin={{ top: 16, right: 10, left: 0, bottom: 0 }}>
              {GRID}
              <XAxis dataKey="m" type="category" data={QD.monthlyARR} {...XSTYLE} interval={2} />
              <YAxis tickFormatter={yFmt$} {...YSTYLE} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => f$(v)} />
              <Line data={QD.monthlyARR.slice(0, 12)}                dataKey="v" name="2025A"            stroke={C.act25} strokeWidth={2} dot={false} type="monotone" />
              <Line data={QD.monthlyARR.slice(12, 12 + nAct26)}     dataKey="v" name={`${latestMo}A`}    stroke={C.act26} strokeWidth={2} dot={{ fill: C.act26, r: 4 }} type="monotone" />
              <Line data={QD.monthlyARR.slice(11 + nAct26)}         dataKey="v" name="2026F"             stroke={C.fct26} strokeWidth={2} strokeDasharray="4 3" dot={false} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Y/Y ARR Growth · 2026F"
          legend={<><LegendDot color={C.act26} label="2026A" /><LegendDot color={C.fct26} label="2026F" /></>}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={arrYoY} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
              {GRID}<XAxis dataKey="q" {...XSTYLE} /><YAxis tickFormatter={yFmtPct} {...YSTYLE} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => fp(v)} />
              <Bar dataKey="val" name="Y/Y Growth" radius={[3, 3, 0, 0]}>
                {arrYoY.map((d, i) => <Cell key={i} fill={d.q.includes('26A') ? C.act26 : C.fct26} />)}
                <LabelList dataKey="val" position="top" formatter={v => v ? fp(v) : ''} style={{ fill: C.txt3, fontSize: 9 }} />
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

        <ChartCard title="Enterprise NRR % (TTM)" sub="Quarterly vs Budget" legend={<ChartLegendStd />}>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={QD.nrr} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
              {GRID}<XAxis dataKey="q" {...XSTYLE} /><YAxis tickFormatter={yFmtPct} {...YSTYLE} domain={[0.9, 1.15]} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => fp(v)} />
              <Bar dataKey="val" name="NRR" radius={[3, 3, 0, 0]}>
                {QD.nrr.map((d, i) => <Cell key={i} fill={d.q.includes('25A') ? C.act25 : d.q.includes('26A') ? C.act26 : C.fct26} />)}
                <LabelList dataKey="val" position="top" formatter={v => v ? fp(v) : ''} style={{ fill: C.txt3, fontSize: 9 }} />
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
          { lbl: 'Total ARR (EOP)',         a25: arr25,    a26: arr26,    b26: B.totalARR.slice(0, 4), fy: FY26.totalARR, fyb: B.totalARR[4], h: true },
          { lbl: 'Enterprise ARR (EOP)',      a25: corp25,   a26: corp26,   b26: B.corpARR.slice(0, 4),  fy: FY26.corpARR,  fyb: B.corpARR[4]          },
          { lbl: 'Federal ARR (EOP)',        a25: fed25,    a26: fed26,    b26: B.fedARR.slice(0, 4),   fy: FY26.fedARR,   fyb: B.fedARR[4]           },
          { lbl: 'Federal TCV (Bookings)',   a25: fedTCV25, a26: fedTCV26, b26: B.fedTCV.slice(0, 4),   fy: FY26.fedTCV,   fyb: B.fedTCV[4] ?? 2250000 },
          { sec: true, lbl: 'Revenue & Retention' },
          { lbl: 'Revenue',                 a25: rev25,    a26: rev26,    b26: B.revenue.slice(0, 4),  fy: FY26.revenue,  fyb: B.revenue[4],  h: true },
          { lbl: 'Enterprise NRR % (TTM)',   a25: nrr25,    a26: nrr26,    b26: B.nrr.slice(0, 4),      fy: FY26.nrr,      fyb: B.nrr[4],      f: fp   },
        ]} />
      </div>
    </div>
  );
}
