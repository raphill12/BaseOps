// ─── CSV Parser ────────────────────────────────────────────────────────────
/** Parse raw CSV text into a 2D array of strings, handling quoted cells. */
function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cell += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else if (ch === '\r') { /* skip */ }
      else cell += ch;
    }
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

/** Parse a cell string to a number or null. Handles $, commas, %, (negatives). */
function parseNum(v) {
  if (!v || v.trim() === '' || v.trim() === '-' || v.trim() === '—') return null;
  const s = v.trim().replace(/[$,\s]/g, '');
  if (/^\([\d.]+\)$/.test(s)) return -parseFloat(s.slice(1, -1));
  if (s.endsWith('%')) return parseFloat(s) / 100;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

// ─── Act_Data Sheet Parser ──────────────────────────────────────────────────
// Row 1 = headers.  Col A = metric label.  Col B = scenario ("Act/Fcst" or "Bud").
// Data columns (Jan-25 … Dec-26) follow.
// Budget rows carry quarterly targets in the LAST month of each FY26 quarter:
//   Q1 → Mar-26 (idx 14)  Q2 → Jun-26 (idx 17)  Q3 → Sep-26 (idx 20)  Q4 → Dec-26 (idx 23)

/** Map from JS key → label string to look for in Col A of Act_Data sheet. */
export const ACT_LABELS = {
  totalARR:     'Total ARR',
  corpARR:      'Corporate ARR',
  fedARR:       'Federal ARR',
  fedTCV:       'Federal TCV',
  newCorpARR:   'New Corporate ARR',
  expCorpARR:   'Expansion Corporate ARR',
  contrCorpARR: 'Contraction ARR (Corporate)',
  newFedARR:    'New Logo ARR (Federal)',
  expFedARR:    'Expansion ARR (Federal)',
  revenue:      'Revenue',
  opex:         'Operating Expenses',
  endCash:      'Ending Cash',
  gmPct:        'Gross Margin',
  nrrPct:       'Corporate NRR %',
  cashBurn:     'Cash Burn',
  headcount:    'Headcount',
  corpRev:      'Revenue (Corporate)',
  corpOpEx:     'Operating Expenses (Corporate)',
  corpOpInc:    'Operating Income (Corporate)',
  cacPayback:   'CAC Payback',
  fedRev:       'Revenue (Federal)',
  fedOpEx:      'Operating Expenses (Federal)',
  fedOpInc:     'Operating Income (Federal)',
};

/** Keys that have "Bud" scenario rows in Act_Data. */
const BUD_METRIC_KEYS = [
  'totalARR','corpARR','fedARR','fedTCV','newCorpARR','expCorpARR',
  'revenue','opex','endCash','gmPct','nrrPct',
];
/** Flow metrics whose FY = sum(Q1…Q4). Others use FY = Q4 (stock/EOP). */
const FLOW_METRICS = new Set(['revenue','opex','fedTCV','newCorpARR','expCorpARR']);

export function parseActData(csv) {
  const rows = parseCSV(csv);
  if (!rows.length) return null;
  const header = rows[0];

  // Find column range for Jan-25 through Dec-26
  let startCol = -1, endCol = -1;
  for (let c = 0; c < header.length; c++) {
    const h = header[c].trim();
    if (h.match(/jan.?25/i) && startCol === -1) startCol = c;
    if (h.match(/dec.?26/i)) endCol = c;
  }
  if (startCol === -1) startCol = 2;   // Col A=label, Col B=scenario
  if (endCol === -1)   endCol   = startCol + 23;

  // Build (label|scenario) → row-index map  (Col A = label, Col B = scenario)
  const lsMap = {};
  for (let r = 1; r < rows.length; r++) {
    const lbl = (rows[r][0] || '').trim().toLowerCase();
    const sc  = (rows[r][1] || '').trim().toLowerCase();
    if (lbl) {
      const key = `${lbl}|${sc}`;
      if (lsMap[key] === undefined) lsMap[key] = r;
    }
  }

  function findRow(label, scenario) {
    const tl = label.toLowerCase();
    const sl = scenario.toLowerCase();
    // 1. exact match
    const key = `${tl}|${sl}`;
    if (lsMap[key] !== undefined) return lsMap[key];
    // 2. fuzzy — sheet row label contains our target
    for (const [k, ri] of Object.entries(lsMap)) {
      const sep = k.lastIndexOf('|');
      if (k.substring(sep + 1) === sl && k.substring(0, sep).includes(tl)) return ri;
    }
    return -1;
  }

  function getMonthly(label, scenario = 'act/fcst') {
    const ri = findRow(label, scenario);
    if (ri < 0) return Array(24).fill(null);
    const row = rows[ri];
    const vals = [];
    for (let c = startCol; c <= endCol && vals.length < 24; c++) {
      vals.push(parseNum(row[c] || ''));
    }
    while (vals.length < 24) vals.push(null);
    return vals;
  }

  // Detect actual vs forecast from header columns
  const isAct = [], months = [];
  for (let c = startCol; c <= endCol && isAct.length < 24; c++) {
    const h = (header[c] || '').trim();
    isAct.push(h.endsWith('A') || h.match(/-25/i) !== null);
    months.push(h.replace(/[AF]$/, '').trim() || `M${c - startCol + 1}`);
  }

  // ── Monthly actuals / forecast ────────────────────────────────────────────
  const monthly = {};
  for (const [key, label] of Object.entries(ACT_LABELS)) {
    monthly[key] = getMonthly(label, 'act/fcst');
  }
  monthly.contrCorpARR = monthly.contrCorpARR.map(v => v != null ? -Math.abs(v) : null);

  // ── Budget extraction from "Bud" scenario rows ────────────────────────────
  // Targets sit in the last month of each FY26 quarter:
  const Q_END = [14, 17, 20, 23]; // Mar-26, Jun-26, Sep-26, Dec-26

  const budget = {};
  for (const key of BUD_METRIC_KEYS) {
    const label  = ACT_LABELS[key];
    if (!label) continue;
    const budRow = getMonthly(label, 'bud');
    const qVals  = Q_END.map(i => budRow[i] ?? null);
    const fy     = FLOW_METRICS.has(key)
      ? (qVals.some(v => v != null) ? qVals.reduce((s, v) => s + (v || 0), 0) : null)
      : qVals[3];  // stock/EOP → Q4 = FY exit
    budget[key] = [...qVals, fy];
  }
  // Aliases so computeFromRaw can use its existing key references
  budget.cash = budget.endCash;
  budget.nrr  = budget.nrrPct;
  // Derive totalARR budget if not directly present
  if (!budget.totalARR && budget.corpARR && budget.fedARR) {
    budget.totalARR = budget.corpARR.map((v, i) =>
      v != null && budget.fedARR[i] != null ? v + budget.fedARR[i] : (v ?? budget.fedARR[i] ?? null)
    );
  }

  return { monthly, budget, isAct, months };
}

/** Parse LT_Inputs sheet and return the forecasted cash-out date string. */
export function parseLTInputs(csv) {
  const rows = parseCSV(csv);
  for (const row of rows) {
    // Search any column in the row for "cash-out" label text
    if (row.some(cell => (cell || '').toLowerCase().includes('cash-out') || (cell || '').toLowerCase().includes('cash out'))) {
      return (row[6] || '').trim() || null;
    }
  }
  return null;
}

// ─── Bud_Data Sheet Parser ──────────────────────────────────────────────────
// Col A = label. Then quarterly columns for Q1-Q4 2026 + FY total.

/** Map from JS key → array of label strings to search for in Col A of Bud_Data. */
export const BUD_LABELS = {
  corpARR:     ['corporate arr', 'corp arr'],
  fedARR:      ['federal arr', 'fed arr'],
  revenue:     ['revenue'],
  opex:        ['operating expenses', 'opex'],
  cash:        ['ending cash', 'cash'],
  gmPct:       ['gross margin'],
  nrr:         ['nrr'],
  fedTCV:      ['federal tcv', 'fed tcv'],
  corpNewLogo: ['new logo', 'new corporate arr', 'new corp'],
  corpExp:     ['expansion arr', 'expansion corp'],
};

export function parseBudData(csv) {
  const rows = parseCSV(csv);
  if (!rows.length) return null;
  const header = rows[0];

  // Find Q1-Q4 2026 and FY columns
  const qCols = [];
  for (let c = 0; c < header.length; c++) {
    const h = (header[c] || '').trim().toLowerCase();
    if (h.match(/q1.*(26|2026)/) || h.match(/(26|2026).*q1/)) qCols[0] = c;
    if (h.match(/q2.*(26|2026)/) || h.match(/(26|2026).*q2/)) qCols[1] = c;
    if (h.match(/q3.*(26|2026)/) || h.match(/(26|2026).*q3/)) qCols[2] = c;
    if (h.match(/q4.*(26|2026)/) || h.match(/(26|2026).*q4/)) qCols[3] = c;
    if (h.match(/fy.*(26|2026)/) || h.match(/(26|2026).*fy/) || h === 'fy26' || h === 'fy 2026') qCols[4] = c;
  }
  // Fallback to columns B-F (indices 1-5) if not found by header scan
  for (let i = 0; i < 5; i++) {
    if (qCols[i] === undefined) qCols[i] = i + 1;
  }

  const labelMap = {};
  for (let r = 1; r < rows.length; r++) {
    const lbl = (rows[r][0] || '').trim().toLowerCase();
    if (lbl) labelMap[lbl] = r;
  }

  function findRow(labels) {
    for (const lbl of labels) {
      if (labelMap[lbl] !== undefined) return labelMap[lbl];
      for (const [k, ri] of Object.entries(labelMap)) {
        if (k.includes(lbl)) return ri;
      }
    }
    return -1;
  }

  function getBud(labels) {
    const ri = findRow(labels);
    if (ri < 0) return [null, null, null, null, null];
    return qCols.map(c => parseNum(rows[ri][c] || ''));
  }

  const budget = {};
  for (const [key, labels] of Object.entries(BUD_LABELS)) {
    budget[key] = getBud(labels);
  }
  // Derive total ARR = corp + fed
  budget.totalARR = (budget.corpARR || []).map((v, i) =>
    v != null && budget.fedARR?.[i] != null ? v + budget.fedARR[i] : null
  );

  return budget;
}

// ─── Data Compute Engine ───────────────────────────────────────────────────
/** Transform raw monthly data + budget into all chart-ready data structures. */
export function computeFromRaw(raw) {
  const m   = raw.monthly;
  const bud = raw.budget;
  const isA = raw.isAct;

  const QTRS = [
    { lbl: 'Q1', s: 0,  e: 3  },
    { lbl: 'Q2', s: 3,  e: 6  },
    { lbl: 'Q3', s: 6,  e: 9  },
    { lbl: 'Q4', s: 9,  e: 12 },
    { lbl: 'Q1', s: 12, e: 15 },
    { lbl: 'Q2', s: 15, e: 18 },
    { lbl: 'Q3', s: 18, e: 21 },
    { lbl: 'Q4', s: 21, e: 24 },
  ];

  // A quarter is "actual" only when ALL months in it are actual.
  function qAllAct(q, i) {
    return i < 4 || isA.slice(q.s, q.e).every(Boolean);
  }

  function qLabel(q, i) {
    if (i < 4) return q.lbl + ' 25A';
    return qAllAct(q, i) ? q.lbl + ' 26A' : q.lbl + ' 26F';
  }

  const qLabels = QTRS.map((q, i) => qLabel(q, i));
  const qIsAct  = QTRS.map((q, i) => qAllAct(q, i));

  const sum   = (arr, s, e) => arr.slice(s, e).reduce((a, v) => a + (v || 0), 0);
  // Like sum, but returns null when every value in the slice is null (avoids 0-bar rendering).
  const sumPL = (arr, s, e) => {
    const vals = arr.slice(s, e);
    if (vals.every(v => v == null)) return null;
    return vals.reduce((a, v) => a + (v || 0), 0);
  };
  const eov = (arr, qi)   => arr[QTRS[qi].e - 1];
  const avg = (arr, s, e) => {
    const v = arr.slice(s, e).filter(x => x != null);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };

  const lastActIdx = isA.reduce((acc, v, i) => v ? i : acc, 0);
  const latestMo   = raw.months ? raw.months[lastActIdx] : 'Jan-26';

  /** Build a quarterly series with act / fct / val / bud fields.
   *  val = act ?? fct — use this single field for consolidated bar charts. */
  function qSeries(metric, budArr, isEOQ = false) {
    return QTRS.map((q, i) => {
      const v    = isEOQ ? eov(m[metric], i) : sum(m[metric], q.s, q.e);
      const qi26 = i - 4;
      return {
        q:   qLabels[i],
        act: qIsAct[i] ? v : null,
        fct: !qIsAct[i] ? v : null,
        val: v ?? null,
        bud: qi26 >= 0 && budArr ? (budArr[qi26] ?? null) : null,
      };
    });
  }

  /** Same as qSeries but uses average instead of sum (for % metrics). */
  function qSeriesPct(metric, budArr, isEOQ = false) {
    return QTRS.map((q, i) => {
      const v    = isEOQ ? eov(m[metric], i) : avg(m[metric], q.s, q.e);
      const qi26 = i - 4;
      return {
        q:   qLabels[i],
        act: qIsAct[i] ? v : null,
        fct: !qIsAct[i] ? v : null,
        val: v ?? null,
        bud: qi26 >= 0 && budArr ? (budArr[qi26] ?? null) : null,
      };
    });
  }

  const arrQ = QTRS.map((q, i) => {
    const corp = eov(m.corpARR, i), fed = eov(m.fedARR, i);
    const qi26 = i - 4;
    return {
      q:        qLabels[i],
      corp,
      fed,
      total:    (corp || 0) + (fed || 0),
      isAct:    qIsAct[i],
      budTotal: qi26 >= 0 && bud.totalARR ? (bud.totalARR[qi26] ?? null) : null,
    };
  });

  /** Build a waterfall bridge chart starting from `start`. */
  function buildWaterfall(start, steps) {
    const data = [{ name: 'Q4 25A\nExit', start: 0, bar: start, val: start, type: 'anchor' }];
    let running = start;
    for (const s of steps) {
      if (s.val >= 0) data.push({ name: s.name, start: running,         bar: s.val,  val: s.val, type: 'pos' });
      else            data.push({ name: s.name, start: running + s.val, bar: -s.val, val: s.val, type: 'neg' });
      running += s.val;
    }
    data.push({ name: 'FY26\nExit', start: 0, bar: running, val: running, type: 'anchor' });
    return data;
  }

  const newCorp26 = sum(m.newCorpARR,   12, 24);
  const expCorp26 = sum(m.expCorpARR,   12, 24);
  const conCorp26 = sum(m.contrCorpARR, 12, 24);
  const newFed26  = sum(m.newFedARR,    12, 24);
  const expFed26  = sum(m.expFedARR,    12, 24);

  const FY26 = {
    totalARR: eov(m.totalARR, 7),
    corpARR:  eov(m.corpARR,  7),
    fedARR:   eov(m.fedARR,   7),
    revenue:  sum(m.revenue, 12, 24),
    opex:     sum(m.opex,    12, 24),
    cash:     eov(m.endCash,  7),
    gm:       avg(m.gmPct,   12, 24),
    nrr:      eov(m.nrrPct,   7),
    fedTCV:   sum(m.fedTCV,  12, 24),
  };

  function budArr(key) { return bud[key] || [null, null, null, null, null]; }

  const B = {
    totalARR:    budArr('totalARR'),
    corpARR:     budArr('corpARR'),
    fedARR:      budArr('fedARR'),
    revenue:     budArr('revenue'),
    opex:        budArr('opex'),
    cash:        budArr('endCash') [0] != null ? budArr('endCash') : budArr('cash'),
    gm:          budArr('gmPct'),
    nrr:         budArr('nrrPct')  [0] != null ? budArr('nrrPct')  : budArr('nrr'),
    fedTCV:      budArr('fedTCV'),
    corpNewLogo: (budArr('newCorpARR')[4] ?? budArr('corpNewLogo')[4]) ?? newCorp26,
    corpExp:     (budArr('expCorpARR')[4] ?? budArr('corpExp')[4])     ?? expCorp26,
  };

  /** Build a cumulative-YTD series for a metric starting from month index 12. */
  function buildCum(metric, target) {
    let cum = 0;
    return (raw.months || []).slice(12).map((mo, i) => {
      cum += m[metric][12 + i] || 0;
      return { m: mo, v: cum, tgt: target };
    });
  }

  const corpPL = [12, 15, 18, 21].map((s, i) => ({
    q:     qLabels[i + 4],
    rev:   sum(m.corpRev,   s, s + 3),
    opex:  sum(m.corpOpEx,  s, s + 3),
    opInc: sumPL(m.corpOpInc, s, s + 3),
  }));

  const fedPL = [12, 15, 18, 21].map((s, i) => ({
    q:     qLabels[i + 4],
    rev:   sum(m.fedRev,   s, s + 3),
    opex:  sum(m.fedOpEx,  s, s + 3),
    opInc: sumPL(m.fedOpInc, s, s + 3),
  }));

  const QD = {
    arr:     arrQ,
    rev:     qSeries('revenue',  bud.revenue),
    opex:    qSeries('opex',     bud.opex),
    cash:    qSeries('endCash',  bud.cash,    true),
    gm:      qSeriesPct('gmPct', bud.gmPct),
    nrr:     qSeriesPct('nrrPct',bud.nrr,     true),
    corpARR: qSeries('corpARR',  bud.corpARR, true),
    fedARR:  qSeries('fedARR',   bud.fedARR,  true),

    waterfall:     buildWaterfall(eov(m.totalARR, 3), [
      { name: 'New Corp',   val: newCorp26 },
      { name: 'Exp Corp',   val: expCorp26 },
      { name: 'Corp Churn', val: conCorp26 },
      { name: 'New Fed',    val: newFed26  },
      { name: 'Fed Exp',    val: expFed26  },
    ]),
    corpWaterfall: buildWaterfall(eov(m.corpARR, 3), [
      { name: 'New Logo',  val: newCorp26 },
      { name: 'Expansion', val: expCorp26 },
      { name: 'Churn',     val: conCorp26 },
    ]),
    fedWaterfall: buildWaterfall(eov(m.fedARR, 3), [
      { name: 'New Logo',  val: newFed26 },
      { name: 'Expansion', val: expFed26 },
    ]),

    monthlyARR:  (raw.months || []).map((mo, i) => ({ m: mo, v: m.totalARR[i], isAct: isA[i] })),
    monthlyBurn: (raw.months || []).map((mo, i) => ({ m: mo, v: m.cashBurn[i] })),
    hc: (raw.months || []).slice(12).map((mo, i) => {
      const hcVal  = m.headcount[12 + i];
      const arrVal = m.totalARR[12 + i];
      return { m: mo, v: hcVal, ratio: hcVal && arrVal ? arrVal / hcVal : null };
    }),

    corpNewLogoCum: buildCum('newCorpARR', B.corpNewLogo),
    corpExpCum:     buildCum('expCorpARR', B.corpExp),
    fedTCVCum:      buildCum('fedTCV',     B.fedTCV[4] ?? 2250000),

    corpNewARRQ:   qSeries('newCorpARR',   null),
    corpExpARRQ:   qSeries('expCorpARR',   null),
    corpContrARRQ: qSeries('contrCorpARR', null),
    fedTCVQ:       qSeries('fedTCV',       bud.fedTCV),

    corpPL,
    fedPL,

    corpCAC: [12, 15, 18, 21].map((s, i) => ({
      q: qLabels[i + 4],
      v: m.cacPayback ? m.cacPayback[s + 2] : null,
    })),

    qtd: (() => {
      // Derive the active quarter from the most recent actualized month.
      // Monthly index 12 = Jan-26, 13 = Feb-26, 14 = Mar-26 (Q1),
      //                15 = Apr-26 … 17 = Jun-26 (Q2), etc.
      const curQIdx    = Math.min(3, Math.max(0, Math.floor((lastActIdx - 12) / 3)));
      const qStart     = 12 + curQIdx * 3;   // first month of active quarter
      const qEnd       = qStart + 2;          // last  month of active quarter
      const moComplete = Math.min(lastActIdx - qStart + 1, 3);
      const curQ       = ['Q1', 'Q2', 'Q3', 'Q4'][curQIdx];

      return {
        month:       latestMo,
        curQ,
        curQLabel:   `${curQ} 2026`,
        curQIdx,
        moComplete,

        // Stock / rate metrics — latest actual value
        corpARR:  m.corpARR[lastActIdx],
        fedARR:   m.fedARR[lastActIdx],
        totalARR: m.totalARR[lastActIdx],
        cash:     m.endCash[lastActIdx],
        gm:       m.gmPct[lastActIdx],
        nrr:      m.nrrPct[lastActIdx],
        cashBurn: m.cashBurn[lastActIdx],

        // Flow metrics — cumulative from start of active quarter to latest actual
        revenue:    sum(m.revenue,    qStart, lastActIdx + 1),
        opex:       sum(m.opex,       qStart, lastActIdx + 1),
        newCorpARR: sum(m.newCorpARR, qStart, lastActIdx + 1),
        expCorpARR: sum(m.expCorpARR, qStart, lastActIdx + 1),
        fedTCV:     sum(m.fedTCV,     qStart, lastActIdx + 1),

        // Full-quarter projections for KPI scorecards (actual + forecast through qEnd)
        qCorpARRFcst: m.corpARR[qEnd],
        qRevFcst:     sum(m.revenue, qStart, qEnd + 1),
        qGmFcst:      m.gmPct[qEnd],
        qNrrFcst:     m.nrrPct[qEnd],
        qCashFcst:    m.endCash[qEnd],

        // Budget targets for the active quarter
        qBudCorpARR:    bud.corpARR?.[curQIdx],
        qBudFedARR:     bud.fedARR?.[curQIdx],
        qBudTotalARR:   bud.totalARR?.[curQIdx],
        qBudRevenue:    bud.revenue?.[curQIdx],
        qBudOpex:       bud.opex?.[curQIdx],
        qBudCash:       bud.cash?.[curQIdx],
        qBudGm:         bud.gmPct?.[curQIdx],
        qBudNrr:        bud.nrr?.[curQIdx],
        qBudNewCorpARR: bud.newCorpARR?.[curQIdx],
        qBudExpCorpARR: bud.expCorpARR?.[curQIdx],
      };
    })(),
  };

  return { QD, B, FY26, latestMo };
}

// ─── Fallback Data ──────────────────────────────────────────────────────────
// Used while the live fetch is in-flight or if it fails.
// Last updated: 2026-02-20. Replace with your own snapshot if needed.
export const FALLBACK = {
  generatedAt: '2026-02-20T00:00:00Z',
  months: [
    'Jan-25','Feb-25','Mar-25','Apr-25','May-25','Jun-25',
    'Jul-25','Aug-25','Sep-25','Oct-25','Nov-25','Dec-25',
    'Jan-26','Feb-26','Mar-26','Apr-26','May-26','Jun-26',
    'Jul-26','Aug-26','Sep-26','Oct-26','Nov-26','Dec-26',
  ],
  isAct: [
    true,true,true,true,true,true,true,true,true,true,true,true,
    true,false,false,false,false,false,false,false,false,false,false,false,
  ],
  monthly: {
    totalARR:     [1217050,1599712,1612462,1615904,2081030,2109500,2109500,2118500,2385060,2455060,2486091,2595641,2781737,2782341,3077399,3238419,3276900,3436610,3511610,4419943,4539870,4618370,5360036,5433456],
    corpARR:      [1217050,1300980,1313730,1317172,1440530,1469000,1469000,1478000,1744560,1814560,1845591,1955141,1958741,1959341,2254399,2415419,2453900,2613610,2688610,2763610,2883536,2962036,3037036,3110456],
    fedARR:       [0,298732,298732,298732,640500,640500,640500,640500,640500,640500,640500,640500,822996,823000,823000,823000,823000,823000,823000,1656333,1656333,1656333,2323000,2323000],
    fedTCV:       [0,448098,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1250000,0,0,1000000,0],
    newCorpARR:   [0,72200,71250,0,142407,16500,0,0,242110,70000,0,84200,0,0,296500,154000,0,143750,75000,75000,75000,75000,75000,75000],
    expCorpARR:   [12002,11730,0,3442,5950,11970,0,9000,24450,0,31031,25350,4200,600,15058,7020,38481,15960,0,0,44927,3500,0,28420],
    contrCorpARR: [-1,0,-58500,0,-25000,0,0,0,0,0,0,0,-600,0,-16500,0,0,0,0,0,0,0,0,-30000],
    newFedARR:    [0,298732,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,833333,0,0,666667,0],
    expFedARR:    [0,0,0,0,341768,0,0,0,0,0,0,0,182496,4,0,0,0,0,0,0,0,0,0,0],
    revenue:      [101421,133309,134372,134659,173419,175792,175792,176542,198755,204588,207174,216303,231811,231862,256450,269868,273075,286384,292634,368329,378322,384864,446670,452788],
    opex:         [409021,365184,359287,374010,378391,353123,459649,455226,446262,439206,389403,538983,614366,614772,520360,495913,512217,549009,530044,561890,575817,546383,550570,549698],
    endCash:      [6358690,5822899,5600656,5327754,5258548,4953894,4646573,4420917,4210406,3884149,3730661,4002599,3365056,3346324,2857606,2489162,2314630,1963751,1959458,2075250,1476175,1133659,831532,465190],
    gmPct:        [0.769,0.849,0.852,0.844,0.878,0.876,0.878,0.869,0.884,0.885,0.857,0.862,0.880,0.871,0.827,0.820,0.813,0.814,0.809,0.841,0.819,0.815,0.822,0.820],
    nrrPct:       [null,null,null,null,null,null,null,null,null,null,null,1.105,1.093,1.081,1.079,1.075,1.078,1.080,1.082,1.084,1.083,1.082,1.079,1.081],
    cashBurn:     [76586,535791,222243,272902,69205,304654,307321,225656,210511,326257,153489,-271939,637543,18732,488718,368444,174532,350879,4293,-115792,599075,342516,302126,366343],
    headcount:    [0,0,0,0,0,0,0,0,0,0,0,0,0,17,18,18,18,19,20,20,20,20,20,20],
    corpRev:      [null,null,null,null,null,null,null,null,null,null,null,null,163228,163278,187867,201285,204492,217801,224051,230301,240295,246836,253086,259205],
    fedRev:       [null,null,null,null,null,null,null,null,null,null,null,null,68583,68583,68583,68583,68583,68583,68583,138028,138028,138028,193583,193583],
    corpOpEx:     [null,null,null,null,null,null,null,null,null,null,null,null,384605,270474,297716,293686,291803,326592,308944,336101,346323,311278,301500,300628],
    fedOpEx:      [null,null,null,null,null,null,null,null,null,null,null,null,229761,344297,222644,202227,220414,222417,221100,225789,229494,235105,249070,249070],
    corpOpInc:    [null,null,null,null,null,null,null,null,null,null,null,null,-240889,-128246,-142342,-128653,-125522,-149296,-127623,-142378,-149559,-110160,-93515,-88135],
    fedOpInc:     [null,null,null,null,null,null,null,null,null,null,null,null,-169377,-284556,-165922,-145995,-164645,-166588,-165596,-109684,-116471,-122643,-89984,-90373],
    cacPayback:   [null,null,null,null,null,null,null,null,null,null,null,null,null,null,13.7,7.4,6.8,9.8,12.9,12.7,15.9,16.1,14.8,14.0],
  },
  budget: {
    totalARR:    [3280000, 3634000, 4744000, 5625000, 5625000],
    corpARR:     [2330000, 2670000, 3000000, 3375000, 3375000],
    fedARR:      [950000,  964000,  1744000, 2250000, 2250000],
    revenue:     [782000,  899000,  1018000, 1340000, 4039000],
    opex:        [1599000, 1560000, 1685000, 1666000, 6510000],
    endCash:     [2700000, 1950000, 1300000,  950000,  950000],
    cash:        [2700000, 1950000, 1300000,  950000,  950000],
    gmPct:       [0.82,    0.83,    0.84,    0.85,    0.85   ],
    nrrPct:      [1.07,    1.09,    1.09,    1.08,    1.08   ],
    nrr:         [1.07,    1.09,    1.09,    1.08,    1.08   ],
    fedTCV:      [0,       0,       1125000, 1125000, 2250000],
    newCorpARR:  [null, null, null, null, 1044250],
    expCorpARR:  [null, null, null, null,  158166],
  },
};
