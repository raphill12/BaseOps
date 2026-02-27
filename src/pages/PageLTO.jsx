import { ComposedChart, BarChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { C } from '../config.js';
import { f$, fp } from '../utils.js';
import { SectionHeader, ChartCard, LegendDot, TOOLTIP_STYLE, GRID, XSTYLE, YSTYLE, yFmt$, yFmtPct } from '../ui.jsx';

// ─── Long-Term Outlook ──────────────────────────────────────────────────────
// Annual summary: 2025 Actual + 2026 A/F + 2027-2030 Forecast.
// 2027-2030 data is pulled from the LT_Inputs Google Sheet tab.

const OUT_YEARS = ['2027', '2028', '2029', '2030'];

export default function PageLTO({ QD, B, ltYears, ltForecast }) {
  // Primary source: Act_Data monthly columns aggregated to annual in computeFromRaw.
  // Fallback: LT_Inputs sheet (manual annual entries). Act_Data always wins per metric+year.
  const lt = {};
  for (const [key, yearMap] of Object.entries(ltForecast || {})) {
    lt[key] = { ...yearMap };
  }
  for (const [key, yearMap] of Object.entries(ltYears || {})) {
    lt[key] = { ...(lt[key] || {}), ...yearMap };   // Act_Data overrides LT_Inputs
  }

  // Derive 2025A and 2026A/F from existing quarterly series
  const ann  = (s, i0) => s.slice(i0, i0 + 4).reduce((a, d) => a + (d.val ?? 0), 0);
  const eop  = (s, i)  => s[i]?.val ?? null;
  const avg4 = (s, i0) => {
    const v = s.slice(i0, i0 + 4).map(d => d.val).filter(x => x != null);
    return v.length ? v.reduce((a, b) => a + b) / v.length : null;
  };

  const fy26Done = QD.arr.slice(4).every(d => d.isAct);
  const col26    = fy26Done ? C.act26  : C.fct26;
  const lbl26    = fy26Done ? '2026A'  : '2026F';

  // Color per bar index: 0=2025A (green), 1=2026A/F (blue or indigo), 2+=outer forecast (indigo)
  const barColor = i => i === 0 ? C.act25 : i === 1 ? col26 : C.fct26;

  // Fed (lighter shades for stacked layering)
  const fedColor = i => i === 0 ? C.lgrn : i === 1 ? (fy26Done ? '#93c5fd' : '#a5b4fc') : '#a5b4fc';

  // Outer-year values for a metric key — only include years with non-null data
  const outerBars = (key) =>
    OUT_YEARS
      .map(yr => ({ yr: `${yr}F`, val: lt[key]?.[yr] ?? null }))
      .filter(d => d.val != null);

  // Revenue / opex needed for the opex-as-%-of-revenue line
  const rev25 = ann(QD.rev,  0), rev26 = ann(QD.rev,  4);
  const opx25 = ann(QD.opex, 0), opx26 = ann(QD.opex, 4);

  // ── Build dataset for each chart ─────────────────────────────────────────
  const arrBase = [
    { yr: '2025A', corp: QD.arr[3].corp, fed: QD.arr[3].fed },
    { yr: lbl26,   corp: QD.arr[7].corp, fed: QD.arr[7].fed, bud: B.totalARR[4] },
    ...OUT_YEARS
      .map(yr => ({
        yr: `${yr}F`,
        corp: lt.corpARR?.[yr]  ?? null,
        fed:  lt.fedARR?.[yr]   ?? null,
      }))
      .filter(d => d.corp != null || d.fed != null),
  ];
  // Add YoY % ARR growth — computed from the stacked totals so it matches the bars exactly
  const arrData = arrBase.map((d, i) => {
    const total = (d.corp || 0) + (d.fed || 0);
    const prev  = i > 0 ? (arrBase[i - 1].corp || 0) + (arrBase[i - 1].fed || 0) : null;
    return { ...d, yoy: prev ? (total - prev) / prev : null };
  });

  const booksData = [
    { yr: '2025A', newC: ann(QD.corpNewARRQ, 0), expC: ann(QD.corpExpARRQ, 0) },
    { yr: lbl26,   newC: ann(QD.corpNewARRQ, 4), expC: ann(QD.corpExpARRQ, 4) },
    ...OUT_YEARS
      .map(yr => ({
        yr:   `${yr}F`,
        newC: lt.newCorpARR?.[yr] ?? null,
        expC: lt.expCorpARR?.[yr] ?? null,
      }))
      .filter(d => d.newC != null || d.expC != null),
  ];

  const revData = [
    { yr: '2025A', val: rev25 },
    { yr: lbl26,   val: rev26, bud: B.revenue[4] },
    ...outerBars('revenue'),
  ];

  const fedData = [
    { yr: '2025A', val: ann(QD.fedTCVQ, 0) },
    { yr: lbl26,   val: ann(QD.fedTCVQ, 4), bud: B.fedTCV[4] },
    ...outerBars('fedTCV'),
  ];

  const cashData = [
    { yr: '2025A', val: eop(QD.cash, 3) },
    { yr: lbl26,   val: eop(QD.cash, 7), bud: B.cash[4] },
    ...outerBars('endCash'),
  ];

  // Opex: need revenue for the %-of-revenue line; outer years use ltForecast for both
  const opxData = [
    { yr: '2025A', val: opx25, pct: rev25 ? opx25 / rev25 : null },
    { yr: lbl26,   val: opx26, pct: rev26 ? opx26 / rev26 : null, bud: B.opex[4] },
    ...OUT_YEARS
      .map(yr => {
        const v = lt.opex?.[yr] ?? null;
        const r = lt.revenue?.[yr] ?? null;
        return { yr: `${yr}F`, val: v, pct: (v != null && r) ? v / r : null };
      })
      .filter(d => d.val != null),
  ];

  const gmData = [
    { yr: '2025A', val: avg4(QD.gm, 0) },
    { yr: lbl26,   val: avg4(QD.gm, 4), bud: B.gm[4] },
    ...outerBars('gmPct'),
  ];

  // Shared chart sizing — narrow bars when we have more years
  const hasOuterYears = outerBars('revenue').length > 0;
  const BSIZE  = hasOuterYears ? 38 : 72;
  const BSIZE2 = hasOuterYears ? 22 : 50;   // side-by-side bookings chart
  const H      = 270;
  const MARGIN = { top: 28, right: 16, left: 0, bottom: 0 };
  const lblStyle = { fill: C.txt3, fontSize: 10 };

  // Budget dot line — amber dashed, only appears at the 2026 bar (null elsewhere)
  const BudLine = () => (
    <Line dataKey="bud" name="FY26 Budget" stroke={C.budLine} strokeDasharray="5 4"
      strokeWidth={2} dot={{ fill: C.budLine, r: 4 }} connectNulls={false} />
  );

  const hasLT = hasOuterYears;

  return (
    <div>
      <SectionHeader
        title="Long-Term Outlook · Annual Summary"
        right={hasLT ? '2025A · 2026A/F · 2027–2030 Forecast' : '2025 Actual vs 2026 Annual Forecast — add 2027–2030 rows to LT_Inputs sheet to extend'}
      />

      {/* ── Row 1: Total ARR (stacked) + Corp ARR Bookings ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>

        <ChartCard title="Total ARR (Year-End EOP)" sub="Corporate + Federal · stacked"
          legend={<>
            <LegendDot color={C.act25}   label="2025A Corp" />
            <LegendDot color={C.lgrn}    label="2025A Fed" />
            <LegendDot color={col26}     label={`${lbl26} Corp`} />
            <LegendDot color={fy26Done ? '#93c5fd' : '#a5b4fc'} label={`${lbl26} Fed`} />
            {hasLT && <LegendDot color={C.fct26}  label="Forecast Corp" />}
            {hasLT && <LegendDot color="#a5b4fc"  label="Forecast Fed" />}
            <LegendDot color={C.pur}     label="YoY Growth" line />
            <LegendDot color={C.budLine} label="FY26 Budget" line dashed />
          </>}>
          <ResponsiveContainer width="100%" height={H}>
            <ComposedChart data={arrData} margin={{ ...MARGIN, right: 48 }} barSize={BSIZE}>
              {GRID}<XAxis dataKey="yr" {...XSTYLE} />
              <YAxis yAxisId="left"  tickFormatter={yFmt$}   {...YSTYLE} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={yFmtPct}
                tick={{ fill: C.txt3, fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
              <Tooltip {...TOOLTIP_STYLE}
                formatter={(v, name) => name === 'YoY Growth' ? fp(v) : f$(v)} />
              <Bar yAxisId="left" dataKey="corp" name="Corp ARR" stackId="a" radius={[0, 0, 0, 0]}>
                {arrData.map((_, i) => <Cell key={i} fill={barColor(i)} />)}
              </Bar>
              <Bar yAxisId="left" dataKey="fed" name="Fed ARR" stackId="a" radius={[3, 3, 0, 0]}>
                {arrData.map((_, i) => <Cell key={i} fill={fedColor(i)} />)}
                <LabelList content={({ x, y, width, index }) => {
                  const d = arrData[index];
                  const total = (d.corp || 0) + (d.fed || 0);
                  if (!total) return null;
                  return <text x={x + width / 2} y={y - 8} fill={C.txt3} fontSize={10} textAnchor="middle">{f$(total)}</text>;
                }} />
              </Bar>
              <Line yAxisId="left"  dataKey="bud" name="FY26 Budget" stroke={C.budLine}
                strokeDasharray="5 4" strokeWidth={2} dot={{ fill: C.budLine, r: 4 }} connectNulls={false} />
              <Line yAxisId="right" dataKey="yoy" name="YoY Growth" stroke={C.pur}
                strokeWidth={2} dot={{ fill: C.pur, r: 4 }} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Corp ARR Bookings · Annual" sub="New Logo & Expansion (FY totals)"
          legend={<>
            <LegendDot color={C.blue} label="New Logo ARR" />
            <LegendDot color={C.pur}  label="Expansion ARR" />
          </>}>
          <ResponsiveContainer width="100%" height={H}>
            <BarChart data={booksData} margin={MARGIN} barGap={4} barCategoryGap="35%">
              {GRID}<XAxis dataKey="yr" {...XSTYLE} /><YAxis tickFormatter={yFmt$} {...YSTYLE} />
              <Tooltip {...TOOLTIP_STYLE} formatter={v => f$(v)} />
              <Bar dataKey="newC" name="New Logo ARR"  fill={C.blue} radius={[3, 3, 0, 0]} barSize={BSIZE2}>
                <LabelList dataKey="newC" position="top" formatter={v => f$(v)} style={lblStyle} />
              </Bar>
              <Bar dataKey="expC" name="Expansion ARR" fill={C.pur}  radius={[3, 3, 0, 0]} barSize={BSIZE2}>
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
                {revData.map((_, i) => <Cell key={i} fill={barColor(i)} />)}
                <LabelList dataKey="val" position="top" formatter={v => f$(v)} style={lblStyle} />
              </Bar>
              <BudLine />
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
                {fedData.map((_, i) => <Cell key={i} fill={barColor(i)} />)}
                <LabelList dataKey="val" position="top" formatter={v => f$(v)} style={lblStyle} />
              </Bar>
              <BudLine />
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
                {cashData.map((_, i) => <Cell key={i} fill={barColor(i)} />)}
                <LabelList dataKey="val" position="top" formatter={v => f$(v)} style={lblStyle} />
              </Bar>
              <BudLine />
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
                {gmData.map((_, i) => <Cell key={i} fill={i === 0 ? C.cyn : i === 1 ? col26 : C.fct26} />)}
                <LabelList dataKey="val" position="top" formatter={v => v ? fp(v) : ''} style={lblStyle} />
              </Bar>
              <BudLine />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>
    </div>
  );
}
