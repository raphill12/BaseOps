import { ComposedChart, BarChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { C } from '../config.js';
import { f$, fp, vp, vf, q26vals } from '../utils.js';
import { Card, MdaBar, SectionHeader, ChartCard, ChartLegendStd, LegendDot, WaterfallChart, BvATable, TOOLTIP_STYLE, GRID, XSTYLE, YSTYLE, yFmt$, smartLabel } from '../ui.jsx';

export default function PageFed({ QD, B, FY26 }) {
  const fed26 = q26vals(QD.fedARR);

  // Federal P&L summary (quarterly)
  const fedRevFY   = QD.fedPL.reduce((s, d) => s + (d.rev   || 0), 0);
  const fedOpIncFY = QD.fedPL.reduce((s, d) => s + (d.opInc || 0), 0);

  // 2025 quarterly actuals derived from live QD series (not hardcoded)
  const fed25    = QD.arr.slice(0, 4).map(d => d.fed);
  const fedTCV25 = QD.fedTCVQ.slice(0, 4).map(d => d.act);
  const fedTCV26 = q26vals(QD.fedTCVQ);

  // Federal TCV by quarter — derived from live data
  const fedTCVQtly = QD.fedTCVQ;

  const fedTCVBud = B.fedTCV[4] ?? 2250000;

  return (
    <div>
      <MdaBar
        title="Federal Business Unit"
        scope="2025 Actual · 2026 Actual/Forecast vs Budget"
        text={`The federal segment is forecast to exit FY26 at ${f$(FY26.fedARR)} annualized revenue (${vf(vp(FY26.fedARR, B.fedARR[4]))} vs budget), with TCV bookings of ${f$(FY26.fedTCV)} against our ${f$(fedTCVBud)} target (${vf(vp(FY26.fedTCV, fedTCVBud))}). Federal revenue is projected at ${f$(fedRevFY)} for the year, with operating income of ${f$(fedOpIncFY)} reflecting the planned investment-phase build-out.`}
      />
      <SectionHeader title="Federal Breakout · 2025A & 2026A/F" />

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 22 }}>
        <Card label="Federal Annualized Revenue · FY26F EOP"   value={f$(FY26.fedARR)}  meta={`Budget ${f$(B.fedARR[4])}`}  pill={vf(vp(FY26.fedARR, B.fedARR[4]))} pillGood={FY26.fedARR >= B.fedARR[4]} color={C.blue} />
        <Card label="Federal TCV · FY26F"        value={f$(FY26.fedTCV)}  meta={`Budget ${f$(B.fedTCV[4] ?? 2250000)}`} pill={vf(vp(FY26.fedTCV, B.fedTCV[4] ?? 2250000))} pillGood={FY26.fedTCV >= (B.fedTCV[4] ?? 2250000)} color={C.amb} />
        <Card label="Federal Revenue · FY26F"    value={f$(fedRevFY)}     meta="2026 Forecast"                color={C.grn} />
        <Card label="Federal Op Income · FY26F"  value={f$(fedOpIncFY)}   meta="Investment phase"             color={C.red} />
      </div>

      {/* Fed ARR quarterly + waterfall */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <ChartCard title="Federal Annualized Revenue (EOP) · Quarterly" sub="vs Budget" legend={<ChartLegendStd />}>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={QD.fedARR} margin={{ top: 40, right: 10, left: 0, bottom: 0 }}>
              {GRID}<XAxis dataKey="q" {...XSTYLE} /><YAxis tickFormatter={yFmt$} {...YSTYLE} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => f$(v)} />
              <Bar dataKey="val" name="Fed ARR" radius={[3, 3, 0, 0]}>
                {QD.fedARR.map((d, i) => <Cell key={i} fill={d.q.includes('25A') ? C.act25 : d.q.includes('26A') ? C.act26 : C.fct26} />)}
                <LabelList dataKey="val" content={smartLabel(v => v ? f$(v) : '')} />
              </Bar>
              <Line dataKey="bud" name="Budget" stroke={C.budLine} strokeDasharray="5 4" strokeWidth={2} dot={{ fill: C.budLine, r: 3 }} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Federal Annualized Revenue Waterfall · Q4 25A → FY26 Exit"
          legend={<><LegendDot color={C.act26} label="Anchor" /><LegendDot color={C.grn} label="New Logo" /><LegendDot color={C.cyn} label="Expansion" /></>}>
          <WaterfallChart data={QD.fedWaterfall} height={240} />
        </ChartCard>
      </div>

      {/* Federal TCV cumulative attainment */}
      <SectionHeader title="Federal TCV Bookings · Monthly Cumulative Attainment" />
      <div style={{ marginBottom: 20 }}>
        <ChartCard title="Federal TCV Bookings · Cumulative YTD vs FY26 Target" sub={`FY26 Target: ${f$(B.fedTCV[4] ?? 2250000)}`}
          legend={<><LegendDot color={C.act26} label="Actual" /><LegendDot color={C.fct26} label="Forecast" /><LegendDot color={C.budLine} label="Annual Target" line dashed /></>}>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={QD.fedTCVCum} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
              {GRID}<XAxis dataKey="m" {...XSTYLE} angle={-30} textAnchor="end" />
              <YAxis tickFormatter={yFmt$} {...YSTYLE} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => f$(v)} />
              <Bar dataKey="v" name="Cumulative TCV" radius={[3, 3, 0, 0]}>
                {QD.fedTCVCum.map((d, i) => <Cell key={i} fill={i === 0 ? C.act26 : C.fct26} />)}
                <LabelList content={({ x, y, width, value }) => {
                  if (!value) return null;
                  const tgt = B.fedTCV[4] ?? 2250000;
                  const pct = (value / tgt * 100).toFixed(0) + '%';
                  const cx = x + width / 2;
                  if (width < 42) {
                    return <text x={cx} y={y - 4} fill={C.txt3} fontSize={10} textAnchor="start" transform={`rotate(-65, ${cx}, ${y - 4})`}>{pct}</text>;
                  }
                  return <text x={cx} y={y - 6} fill={C.txt3} fontSize={10} textAnchor="middle">{pct}</text>;
                }} />
              </Bar>
              <Line dataKey="tgt" name="Annual Target" stroke={C.budLine} strokeDasharray="5 4" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* TCV quarterly + P&L */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <ChartCard title="Federal TCV Bookings · Quarterly" sub="vs Budget" legend={<ChartLegendStd />}>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={fedTCVQtly} margin={{ top: 40, right: 10, left: 0, bottom: 0 }}>
              {GRID}<XAxis dataKey="q" {...XSTYLE} /><YAxis tickFormatter={yFmt$} {...YSTYLE} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => f$(v)} />
              <Bar dataKey="val" name="Fed TCV" radius={[3, 3, 0, 0]}>
                {fedTCVQtly.map((d, i) => <Cell key={i} fill={d.q.includes('25A') ? C.act25 : d.q.includes('26A') ? C.act26 : C.fct26} />)}
                <LabelList dataKey="val" content={smartLabel(v => v ? f$(v) : '')} />
              </Bar>
              <Line dataKey="bud" name="Budget" stroke={C.budLine} strokeDasharray="5 4" strokeWidth={2} dot={{ fill: C.budLine, r: 3 }} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Federal Revenue & Op Income · 2026"
          legend={<><LegendDot color={C.grn} label="Revenue" /><LegendDot color={C.red} label="Op Income" /></>}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={QD.fedPL} margin={{ top: 40, right: 10, left: 0, bottom: 28 }}>
              {GRID}<XAxis dataKey="q" {...XSTYLE} /><YAxis tickFormatter={yFmt$} {...YSTYLE} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => f$(v)} />
              <Bar dataKey="rev"   name="Revenue"   fill={C.grn} radius={[3, 3, 0, 0]}>
                <LabelList dataKey="rev" content={smartLabel(v => f$(v))} />
              </Bar>
              <Bar dataKey="opInc" name="Op Income" fill={C.red} radius={[3, 3, 0, 0]}>
                <LabelList dataKey="opInc" content={({ x = 0, y = 0, width = 0, height = 0, value }) => {
                  if (!value) return null;
                  const cx = x + width / 2;
                  return <text x={cx} y={y + Math.abs(height) + 14} fill={C.txt3} fontSize={10} textAnchor="middle">{f$(value)}</text>;
                }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Federal detail BvA table */}
      <SectionHeader title="Federal Detail" />
      <div style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
        <BvATable rows={[
          { lbl: 'Federal Annualized Revenue (EOP)',      a25: fed25,    a26: fed26,    b26: B.fedARR.slice(0, 4),  fy: FY26.fedARR,  fyb: B.fedARR[4],           h: true },
          { lbl: 'Federal TCV (Bookings)', a25: fedTCV25, a26: fedTCV26, b26: B.fedTCV.slice(0, 4),  fy: FY26.fedTCV,  fyb: B.fedTCV[4] ?? 2250000         },
          { lbl: 'Federal Revenue',        a25: [null,   null,   null,   null],   a26: QD.fedPL.map(d => d.rev),   b26: [null, null, null, null], fy: fedRevFY,    fyb: null, h: true },
          { lbl: 'Federal Op Income',      a25: [null,   null,   null,   null],   a26: QD.fedPL.map(d => d.opInc), b26: [null, null, null, null], fy: fedOpIncFY, fyb: null, inv: true },
        ]} />
      </div>
    </div>
  );
}
