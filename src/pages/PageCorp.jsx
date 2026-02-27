import { ComposedChart, BarChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { C } from '../config.js';
import { f$, fp, fpc, fn, vp, vf, q26vals } from '../utils.js';
import { Card, SectionHeader, ChartCard, ChartLegendStd, LegendDot, WaterfallChart, BvATable, TOOLTIP_STYLE, GRID, XSTYLE, YSTYLE, yFmt$, yFmtPct } from '../ui.jsx';

export default function PageCorp({ QD, B, FY26 }) {
  const corp26 = q26vals(QD.corpARR);
  const nrr26  = q26vals(QD.nrr);

  // 2025 quarterly actuals derived from live QD series (not hardcoded)
  const corp25      = QD.arr.slice(0, 4).map(d => d.corp);
  const nrr25       = QD.nrr.slice(0, 4).map(d => d.act);
  const newCorp25   = QD.corpNewARRQ.slice(0, 4).map(d => d.act);
  const expCorp25   = QD.corpExpARRQ.slice(0, 4).map(d => d.act);
  const contrCorp25 = QD.corpContrARRQ.slice(0, 4).map(d => d.act);

  // 2026 quarterly bookings from live data
  const newCorp26   = q26vals(QD.corpNewARRQ);
  const expCorp26   = q26vals(QD.corpExpARRQ);
  const contrCorp26 = q26vals(QD.corpContrARRQ);

  // Y/Y Corp ARR growth per quarter (vs same quarter prior year from live data)
  const corpARRYoY = [
    { q: 'Q1 26A', val: corp25[0] ? (corp26[0] / corp25[0]) - 1 : null },
    { q: 'Q2 26F', val: corp25[1] ? (corp26[1] / corp25[1]) - 1 : null },
    { q: 'Q3 26F', val: corp25[2] ? (corp26[2] / corp25[2]) - 1 : null },
    { q: 'Q4 26F', val: corp25[3] ? (corp26[3] / corp25[3]) - 1 : null },
  ].filter(d => d.val != null);

  return (
    <div>
      <SectionHeader title="Enterprise (Corporate) · 2025A & 2026A/F" />

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 22 }}>
        <Card label="Corp ARR · FY26F EOP"   value={f$(FY26.corpARR)} meta={`Budget ${f$(B.corpARR[4])}`} pill={vf(vp(FY26.corpARR, B.corpARR[4]))} pillGood={FY26.corpARR >= B.corpARR[4]} color={C.blue} />
        <Card label="Y/Y Corp ARR · Q4 26F"  value={fp(corp25[3] ? corp26[3] / corp25[3] - 1 : null)} meta="vs Q4 25A" pill={corp25[3] ? `▲ ${fp(corp26[3] / corp25[3] - 1)}` : '—'} pillGood={true} color={C.grn}  />
        <Card label="Corp NRR · TTM Q4 26F"  value={fp(FY26.nrr)}    meta={`Budget ${fp(B.nrr[4])}`}       pill={fpc(FY26.nrr - B.nrr[4])}           pillGood={FY26.nrr >= B.nrr[4]}         color={C.pur}  />
        <Card label="CAC Payback · Latest"   value={QD.corpCAC.filter(d => d.v != null).slice(-1)[0]?.v ? `${QD.corpCAC.filter(d => d.v != null).slice(-1)[0].v.toFixed(1)} mo` : '—'} meta="T3M rolling" color={C.amb} />
      </div>

      {/* Corp ARR vs budget + waterfall */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <ChartCard title="Corporate ARR (EOP)" sub="vs Budget" legend={<ChartLegendStd />}>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={QD.corpARR} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
              {GRID}<XAxis dataKey="q" {...XSTYLE} /><YAxis tickFormatter={yFmt$} {...YSTYLE} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => f$(v)} />
              <Bar dataKey="val" name="Corp ARR" radius={[3, 3, 0, 0]}>
                {QD.corpARR.map((d, i) => <Cell key={i} fill={d.q.includes('25A') ? C.act25 : d.q.includes('26A') ? C.act26 : C.fct26} />)}
                <LabelList dataKey="val" position="top" formatter={v => v ? f$(v) : ''} style={{ fill: C.txt3, fontSize: 9 }} />
              </Bar>
              <Line dataKey="bud" name="Budget" stroke={C.budLine} strokeDasharray="5 4" strokeWidth={2} dot={{ fill: C.budLine, r: 3 }} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Corp ARR Waterfall · Q4 25A → FY26 Exit"
          legend={<><LegendDot color={C.act26} label="Anchor" /><LegendDot color={C.grn} label="Add" /><LegendDot color={C.red} label="Churn" /></>}>
          <WaterfallChart data={QD.corpWaterfall} height={240} />
        </ChartCard>
      </div>

      {/* Bookings cumulative attainment */}
      <SectionHeader title="Bookings · Monthly Cumulative Attainment vs FY26 Target" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <ChartCard title="New Corp ARR Bookings · Cumulative YTD" sub={`FY26 Target: ${f$(B.corpNewLogo)}`}
          legend={<><LegendDot color={C.act26} label="Actual" /><LegendDot color={C.fct26} label="Forecast" /><LegendDot color={C.budLine} label="Annual Target" line dashed /></>}>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={QD.corpNewLogoCum} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
              {GRID}<XAxis dataKey="m" {...XSTYLE} angle={-30} textAnchor="end" />
              <YAxis tickFormatter={yFmt$} {...YSTYLE} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => f$(v)} />
              <Bar dataKey="v" name="Cumulative Bookings" radius={[3, 3, 0, 0]}>
                {QD.corpNewLogoCum.map((d, i) => <Cell key={i} fill={i === 0 ? C.act26 : C.fct26} />)}
                <LabelList content={({ x, y, width, value, index }) => {
                  if (!value || index % 3 !== 2) return null;
                  const pct = (value / B.corpNewLogo * 100).toFixed(0) + '%';
                  return <text x={x + width / 2} y={y - 6} fill={C.txt3} fontSize={8} textAnchor="middle">{pct}</text>;
                }} />
              </Bar>
              <Line dataKey="tgt" name="Annual Target" stroke={C.budLine} strokeDasharray="5 4" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Expansion Corp ARR Bookings · Cumulative YTD" sub={`FY26 Target: ${f$(B.corpExp)}`}
          legend={<><LegendDot color={C.act26} label="Actual" /><LegendDot color={C.fct26} label="Forecast" /><LegendDot color={C.budLine} label="Annual Target" line dashed /></>}>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={QD.corpExpCum} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
              {GRID}<XAxis dataKey="m" {...XSTYLE} angle={-30} textAnchor="end" />
              <YAxis tickFormatter={yFmt$} {...YSTYLE} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => f$(v)} />
              <Bar dataKey="v" name="Cumulative Bookings" radius={[3, 3, 0, 0]}>
                {QD.corpExpCum.map((d, i) => <Cell key={i} fill={i === 0 ? C.act26 : C.fct26} />)}
                <LabelList content={({ x, y, width, value, index }) => {
                  if (!value || index % 3 !== 2) return null;
                  const pct = (value / B.corpExp * 100).toFixed(0) + '%';
                  return <text x={x + width / 2} y={y - 6} fill={C.txt3} fontSize={8} textAnchor="middle">{pct}</text>;
                }} />
              </Bar>
              <Line dataKey="tgt" name="Annual Target" stroke={C.budLine} strokeDasharray="5 4" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* P&L / NRR / CAC */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
        <ChartCard title="Corp Revenue & Op Income · 2026"
          legend={<><LegendDot color={C.grn} label="Revenue" /><LegendDot color={C.red} label="Op Income" /></>}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={QD.corpPL} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
              {GRID}<XAxis dataKey="q" {...XSTYLE} /><YAxis tickFormatter={yFmt$} {...YSTYLE} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => f$(v)} />
              <Bar dataKey="rev"   name="Revenue"   fill={C.grn} radius={[3, 3, 0, 0]}>
                <LabelList dataKey="rev" position="top" formatter={v => f$(v)} style={{ fill: C.txt3, fontSize: 9 }} />
              </Bar>
              <Bar dataKey="opInc" name="Op Income" fill={C.red} radius={[3, 3, 0, 0]}>
                <LabelList dataKey="opInc" position="insideBottom" formatter={v => f$(v)} style={{ fill: C.txt3, fontSize: 8 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Corporate NRR % (TTM)" sub="vs Budget" legend={<ChartLegendStd />}>
          <ResponsiveContainer width="100%" height={220}>
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

        <ChartCard title="CAC Payback · T3M Rolling" sub="Months · 2026">
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={QD.corpCAC} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              {GRID}<XAxis dataKey="q" {...XSTYLE} /><YAxis {...YSTYLE} domain={[0, 20]} tickFormatter={v => `${v}mo`} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => v ? `${v.toFixed(1)} mo` : null} />
              <Bar dataKey="v" name="CAC Payback" radius={[3, 3, 0, 0]}>
                {QD.corpCAC.map((d, i) => <Cell key={i} fill={i === 0 ? C.act26 : C.fct26} />)}
                <LabelList dataKey="v" position="top" formatter={v => v ? `${v.toFixed(1)}mo` : ''} style={{ fill: C.txt3, fontSize: 9 }} />
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Enterprise detail BvA table */}
      <SectionHeader title="Enterprise Detail" />
      <div style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
        <BvATable rows={[
          { lbl: 'Corporate ARR (EOP)',    a25: corp25,      a26: corp26,      b26: B.corpARR.slice(0, 4), fy: FY26.corpARR, fyb: B.corpARR[4], h: true },
          { lbl: 'New Logo ARR',           a25: newCorp25,   a26: newCorp26,   b26: [null, null, null, null], fy: B.corpNewLogo, fyb: B.corpNewLogo },
          { lbl: 'Expansion ARR',          a25: expCorp25,   a26: expCorp26,   b26: [null, null, null, null], fy: B.corpExp,     fyb: B.corpExp     },
          { lbl: 'Contraction ARR',        a25: contrCorp25, a26: contrCorp26, b26: [null, null, null, null], fy: null,          fyb: null, inv: true },
          { lbl: 'Corporate NRR % (TTM)', a25: nrr25,       a26: nrr26,       b26: B.nrr.slice(0, 4),     fy: FY26.nrr,     fyb: B.nrr[4], f: fp },
          { lbl: 'Revenue (Corporate)',   a25: [null,   null,   null,   null],       a26: QD.corpPL.map(d => d.rev),   b26: [null, null, null, null], fy: QD.corpPL.reduce((s, d) => s + (d.rev || 0), 0),   fyb: null, h: true },
          { lbl: 'Op Income (Corp)',      a25: [null,   null,   null,   null],       a26: QD.corpPL.map(d => d.opInc), b26: [null, null, null, null], fy: QD.corpPL.reduce((s, d) => s + (d.opInc || 0), 0), fyb: null, inv: true },
          { lbl: 'CAC Payback T3M (mo)', a25: [null,   null,   null,   null],       a26: QD.corpCAC.map(d => d.v),    b26: [null, null, null, null], fy: QD.corpCAC.filter(d => d.v != null).slice(-1)[0]?.v ?? null, fyb: null, inv: true, f: fn },
        ]} />
      </div>
    </div>
  );
}
