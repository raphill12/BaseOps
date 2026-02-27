import { ComposedChart, BarChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { C } from '../config.js';
import { f$, fp } from '../utils.js';
import { SectionHeader, ChartCard, LegendDot, TOOLTIP_STYLE, GRID, XSTYLE, YSTYLE, yFmt$, yFmtPct } from '../ui.jsx';

// ─── Long-Term Outlook ──────────────────────────────────────────────────────
// Annual (year-end) summary comparing 2025 Actual vs 2026 Actual/Forecast.
// All stock metrics use Q4 EOP values; flow metrics use full-year sums.

export default function PageLTO({ QD, B }) {
  // Annual aggregation helpers over the 8-quarter QD series (idx 0-3 = 2025, 4-7 = 2026)
  const ann  = (s, i0) => s.slice(i0, i0 + 4).reduce((a, d) => a + (d.val ?? 0), 0);
  const eop  = (s, i)  => s[i]?.val ?? null;
  const avg4 = (s, i0) => {
    const v = s.slice(i0, i0 + 4).map(d => d.val).filter(x => x != null);
    return v.length ? v.reduce((a, b) => a + b) / v.length : null;
  };

  // FY26 label / color — flip from indigo → blue once all 4 quarters are actual
  const fy26Done = QD.arr.slice(4).every(d => d.isAct);
  const col26    = fy26Done ? C.act26   : C.fct26;
  const lbl26    = fy26Done ? '2026A'   : '2026F';
  // Fed portion of stacked ARR uses a lighter shade for visual layering
  const fedCol26 = fy26Done ? '#93c5fd' : '#a5b4fc';

  // Pre-compute revenue & opex for the opex-as-%-of-revenue line
  const rev25 = ann(QD.rev,  0), rev26 = ann(QD.rev,  4);
  const opx25 = ann(QD.opex, 0), opx26 = ann(QD.opex, 4);

  // ── Chart data sets ──────────────────────────────────────────────────────
  const arrData = [
    { yr: '2025A', corp: QD.arr[3].corp, fed: QD.arr[3].fed },
    { yr: lbl26,   corp: QD.arr[7].corp, fed: QD.arr[7].fed, bud: B.totalARR[4] },
  ];

  const booksData = [
    { yr: '2025A', newC: ann(QD.corpNewARRQ, 0), expC: ann(QD.corpExpARRQ, 0) },
    { yr: lbl26,   newC: ann(QD.corpNewARRQ, 4), expC: ann(QD.corpExpARRQ, 4) },
  ];

  const revData = [
    { yr: '2025A', val: rev25 },
    { yr: lbl26,   val: rev26, bud: B.revenue[4] },
  ];

  const fedData = [
    { yr: '2025A', val: ann(QD.fedTCVQ, 0) },
    { yr: lbl26,   val: ann(QD.fedTCVQ, 4), bud: B.fedTCV[4] },
  ];

  const cashData = [
    { yr: '2025A', val: eop(QD.cash, 3) },
    { yr: lbl26,   val: eop(QD.cash, 7), bud: B.cash[4] },
  ];

  const opxData = [
    { yr: '2025A', val: opx25, pct: rev25 ? opx25 / rev25 : null },
    { yr: lbl26,   val: opx26, pct: rev26 ? opx26 / rev26 : null, bud: B.opex[4] },
  ];

  const gmData = [
    { yr: '2025A', val: avg4(QD.gm, 0) },
    { yr: lbl26,   val: avg4(QD.gm, 4), bud: B.gm[4] },
  ];

  // Shared chart constants
  const lblStyle = { fill: C.txt3, fontSize: 10 };
  const MARGIN   = { top: 28, right: 16, left: 0, bottom: 0 };
  const BSIZE    = 72;
  const H        = 270;

  return (
    <div>
      <SectionHeader
        title="Long-Term Outlook · Annual Summary"
        right="2025 Actual vs 2026 Annual Forecast"
      />

      {/* ── Row 1: Total ARR (stacked) + Corp ARR Bookings ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>

        <ChartCard title="Total ARR (Year-End EOP)" sub="Corporate + Federal · stacked"
          legend={<>
            <LegendDot color={C.act25}   label="2025A Corp" />
            <LegendDot color={C.lgrn}    label="2025A Fed" />
            <LegendDot color={col26}     label={`${lbl26} Corp`} />
            <LegendDot color={fedCol26}  label={`${lbl26} Fed`} />
            <LegendDot color={C.budLine} label="FY26 Budget" line dashed />
          </>}>
          <ResponsiveContainer width="100%" height={H}>
            <ComposedChart data={arrData} margin={MARGIN} barSize={BSIZE}>
              {GRID}<XAxis dataKey="yr" {...XSTYLE} /><YAxis tickFormatter={yFmt$} {...YSTYLE} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => f$(v)} />
              <Bar dataKey="corp" name="Corp ARR" stackId="a" radius={[0, 0, 0, 0]}>
                {arrData.map((d, i) => <Cell key={i} fill={i === 0 ? C.act25 : col26} />)}
              </Bar>
              <Bar dataKey="fed" name="Fed ARR" stackId="a" radius={[3, 3, 0, 0]}>
                {arrData.map((d, i) => <Cell key={i} fill={i === 0 ? C.lgrn : fedCol26} />)}
                <LabelList content={({ x, y, width, index }) => {
                  const d = arrData[index];
                  const total = (d.corp || 0) + (d.fed || 0);
                  return <text x={x + width / 2} y={y - 8} fill={C.txt3} fontSize={10} textAnchor="middle">{f$(total)}</text>;
                }} />
              </Bar>
              <Line dataKey="bud" name="FY26 Budget" stroke={C.budLine} strokeDasharray="5 4"
                strokeWidth={2} dot={{ fill: C.budLine, r: 4 }} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Corp ARR Bookings · Annual" sub="New Logo & Expansion (FY totals)"
          legend={<>
            <LegendDot color={C.blue} label="New Logo ARR" />
            <LegendDot color={C.pur}  label="Expansion ARR" />
          </>}>
          <ResponsiveContainer width="100%" height={H}>
            <BarChart data={booksData} margin={MARGIN} barGap={6} barCategoryGap="40%">
              {GRID}<XAxis dataKey="yr" {...XSTYLE} /><YAxis tickFormatter={yFmt$} {...YSTYLE} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => f$(v)} />
              <Bar dataKey="newC" name="New Logo ARR"  fill={C.blue} radius={[3, 3, 0, 0]} barSize={50}>
                <LabelList dataKey="newC" position="top" formatter={v => f$(v)} style={lblStyle} />
              </Bar>
              <Bar dataKey="expC" name="Expansion ARR" fill={C.pur}  radius={[3, 3, 0, 0]} barSize={50}>
                <LabelList dataKey="expC" position="top" formatter={v => f$(v)} style={lblStyle} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>

      {/* ── Row 2: Revenue, Federal TCV, Ending Cash ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>

        <ChartCard title="Total Revenue · Annual"
          legend={<><LegendDot color={C.budLine} label="FY26 Budget" line dashed /></>}>
          <ResponsiveContainer width="100%" height={H}>
            <ComposedChart data={revData} margin={MARGIN} barSize={BSIZE}>
              {GRID}<XAxis dataKey="yr" {...XSTYLE} /><YAxis tickFormatter={yFmt$} {...YSTYLE} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => f$(v)} />
              <Bar dataKey="val" name="Revenue" radius={[3, 3, 0, 0]}>
                {revData.map((d, i) => <Cell key={i} fill={i === 0 ? C.act25 : col26} />)}
                <LabelList dataKey="val" position="top" formatter={v => f$(v)} style={lblStyle} />
              </Bar>
              <Line dataKey="bud" name="FY26 Budget" stroke={C.budLine} strokeDasharray="5 4"
                strokeWidth={2} dot={{ fill: C.budLine, r: 4 }} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Federal TCV Bookings · Annual"
          legend={<><LegendDot color={C.budLine} label="FY26 Budget" line dashed /></>}>
          <ResponsiveContainer width="100%" height={H}>
            <ComposedChart data={fedData} margin={MARGIN} barSize={BSIZE}>
              {GRID}<XAxis dataKey="yr" {...XSTYLE} /><YAxis tickFormatter={yFmt$} {...YSTYLE} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => f$(v)} />
              <Bar dataKey="val" name="Fed TCV" radius={[3, 3, 0, 0]}>
                {fedData.map((d, i) => <Cell key={i} fill={i === 0 ? C.act25 : col26} />)}
                <LabelList dataKey="val" position="top" formatter={v => f$(v)} style={lblStyle} />
              </Bar>
              <Line dataKey="bud" name="FY26 Budget" stroke={C.budLine} strokeDasharray="5 4"
                strokeWidth={2} dot={{ fill: C.budLine, r: 4 }} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Ending Cash · Year-End EOP"
          legend={<><LegendDot color={C.budLine} label="FY26 Budget" line dashed /></>}>
          <ResponsiveContainer width="100%" height={H}>
            <ComposedChart data={cashData} margin={MARGIN} barSize={BSIZE}>
              {GRID}<XAxis dataKey="yr" {...XSTYLE} /><YAxis tickFormatter={yFmt$} {...YSTYLE} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => f$(v)} />
              <Bar dataKey="val" name="Ending Cash" radius={[3, 3, 0, 0]}>
                {cashData.map((d, i) => <Cell key={i} fill={i === 0 ? C.act25 : col26} />)}
                <LabelList dataKey="val" position="top" formatter={v => f$(v)} style={lblStyle} />
              </Bar>
              <Line dataKey="bud" name="FY26 Budget" stroke={C.budLine} strokeDasharray="5 4"
                strokeWidth={2} dot={{ fill: C.budLine, r: 4 }} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>

      {/* ── Row 3: Operating Expenses (dual-axis) + Gross Margin % ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>

        <ChartCard title="Operating Expenses · Annual" sub="Bars = $ amount · Line = % of Revenue"
          legend={<>
            <LegendDot color={C.red}     label="Opex ($)" />
            <LegendDot color={C.amb}     label="Opex % of Revenue" line />
            <LegendDot color={C.budLine} label="FY26 Budget ($)" line dashed />
          </>}>
          <ResponsiveContainer width="100%" height={H}>
            <ComposedChart data={opxData} margin={{ top: 28, right: 48, left: 0, bottom: 0 }} barSize={BSIZE}>
              {GRID}<XAxis dataKey="yr" {...XSTYLE} />
              <YAxis yAxisId="left"  tickFormatter={yFmt$}   {...YSTYLE} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={yFmtPct}
                tick={{ fill: C.txt3, fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
              <Tooltip {...TOOLTIP_STYLE}
                formatter={(v, name) => name === 'Opex % Rev' ? fp(v) : f$(v)} />
              <Bar yAxisId="left" dataKey="val" name="Opex ($)" fill={C.red} radius={[3, 3, 0, 0]}>
                <LabelList dataKey="val" position="top" formatter={v => f$(v)} style={lblStyle} />
              </Bar>
              <Line yAxisId="left"  dataKey="bud" name="FY26 Budget ($)" stroke={C.budLine}
                strokeDasharray="5 4" strokeWidth={2} dot={{ fill: C.budLine, r: 4 }} connectNulls={false} />
              <Line yAxisId="right" dataKey="pct" name="Opex % Rev" stroke={C.amb}
                strokeWidth={2} dot={{ fill: C.amb, r: 5 }} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Gross Margin % · Annual Average"
          legend={<><LegendDot color={C.budLine} label="FY26 Budget" line dashed /></>}>
          <ResponsiveContainer width="100%" height={H}>
            <ComposedChart data={gmData} margin={MARGIN} barSize={BSIZE}>
              {GRID}<XAxis dataKey="yr" {...XSTYLE} /><YAxis tickFormatter={yFmtPct} {...YSTYLE} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => fp(v)} />
              <Bar dataKey="val" name="Gross Margin %" radius={[3, 3, 0, 0]}>
                {gmData.map((d, i) => <Cell key={i} fill={i === 0 ? C.cyn : col26} />)}
                <LabelList dataKey="val" position="top" formatter={v => v ? fp(v) : ''} style={lblStyle} />
              </Bar>
              <Line dataKey="bud" name="FY26 Budget" stroke={C.budLine} strokeDasharray="5 4"
                strokeWidth={2} dot={{ fill: C.budLine, r: 4 }} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>
    </div>
  );
}
