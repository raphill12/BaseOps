import { useState, useEffect, useRef } from 'react';
import { C, TABS, csvUrl } from './config.js';
import { parseActData, parseLTInputs, computeFromRaw, FALLBACK } from './data.js';
import PageQTD      from './pages/PageQTD.jsx';
import PageOverview from './pages/PageOverview.jsx';
import PageRevenue  from './pages/PageRevenue.jsx';
import PageOpCash   from './pages/PageOpCash.jsx';
import PageCorp     from './pages/PageCorp.jsx';
import PageFed      from './pages/PageFed.jsx';
import PageLTO      from './pages/PageLTO.jsx';

// Compute initial data from fallback so the UI renders immediately on load.
const INIT = computeFromRaw(FALLBACK);

export default function App() {
  const [tab,         setTab]         = useState('qtd');
  const [dataState,   setDataState]   = useState(INIT);
  const [fetchStatus, setFetchStatus] = useState('loading');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [cashOutDate, setCashOutDate] = useState(null);
  const [ltForecast,  setLtForecast]  = useState(null);
  const hasFetched = useRef(false);

  const { QD, B, FY26, latestMo, ltYears } = dataState;

  // ── Live fetch from Google Sheets ────────────────────────────────────────
  const fetchLive = async () => {
    setFetchStatus('loading');
    try {
      const [actRes, ltRes] = await Promise.all([
        fetch(csvUrl('Act_Data')),
        fetch(csvUrl('LT_Inputs')).catch(() => null),
      ]);
      if (!actRes.ok) throw new Error(`Act_Data fetch failed: ${actRes.status}`);

      const actCsv = await actRes.text();
      const actParsed = parseActData(actCsv);
      if (!actParsed) throw new Error('Could not parse Act_Data');

      // Budget is now embedded in Act_Data via "Bud" scenario rows
      const raw = {
        months:  actParsed.months,
        isAct:   actParsed.isAct,
        monthly: actParsed.monthly,
        budget:  actParsed.budget || FALLBACK.budget,
      };

      setDataState(computeFromRaw(raw));
      setLastUpdated(new Date());
      setFetchStatus('live');

      // Parse LT_Inputs — cash-out date + 2027-2030 annual forecast
      if (ltRes?.ok) {
        const ltCsv   = await ltRes.text();
        const ltParsed = parseLTInputs(ltCsv);
        if (ltParsed?.cashOutDate) setCashOutDate(ltParsed.cashOutDate);
        if (ltParsed?.ltForecast && Object.keys(ltParsed.ltForecast).length > 0)
          setLtForecast(ltParsed.ltForecast);
      }
    } catch (e) {
      console.warn('Live fetch failed, using fallback data:', e.message);
      setFetchStatus('error');
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchLive();
    }
  }, []);

  // ── Status badge config ───────────────────────────────────────────────────
  const statusConfig = {
    loading: { dot: C.amb, label: 'Fetching live data…', bg: 'rgba(245,158,11,.1)', border: 'rgba(245,158,11,.3)', color: C.amb },
    live:    { dot: C.grn, label: `Live · ${latestMo}`,   bg: 'rgba(16,185,129,.1)', border: 'rgba(16,185,129,.3)', color: C.grn },
    error:   { dot: C.red, label: `Offline · ${latestMo}`,bg: 'rgba(239,68,68,.1)',  border: 'rgba(239,68,68,.3)',  color: C.red },
  };
  const st = statusConfig[fetchStatus] || statusConfig.live;

  // ── Page router ───────────────────────────────────────────────────────────
  const pageProps = { QD, B, FY26, latestMo, cashOutDate, ltYears, ltForecast };
  const pages = {
    qtd:      <PageQTD      {...pageProps} />,
    overview: <PageOverview {...pageProps} />,
    revenue:  <PageRevenue  {...pageProps} />,
    opcash:   <PageOpCash   {...pageProps} />,
    corp:     <PageCorp     {...pageProps} />,
    fed:      <PageFed      {...pageProps} />,
    lto:      <PageLTO      {...pageProps} />,
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.txt, fontFamily: "'DM Sans','Segoe UI',sans-serif", fontSize: 14 }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 28px', borderBottom: `1px solid ${C.bdr}`,
        background: C.surf, position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Logo + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, background: C.blue, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#fff',
          }}>BO</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-.3px' }}>Base Ops</div>
            <div style={{ fontSize: 11, color: C.txt2 }}>Financial Dashboard · 2025–2026</div>
          </div>
        </div>

        {/* Legend + status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Series legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10, color: C.txt3 }}>
            {[
              { color: C.act25,   label: '2025 Actual' },
              { color: C.act26,   label: '2026 Actual' },
              { color: C.fct26,   label: '2026 Forecast' },
            ].map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
                {l.label}
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 2, borderTop: `2px dashed ${C.budLine}` }} />
              Budget
            </div>
          </div>

          {/* Live data status badge — click to refresh */}
          <div
            onClick={fetchLive}
            title="Click to refresh from Google Sheets"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              cursor: 'pointer', userSelect: 'none',
              background: st.bg, border: `1px solid ${st.border}`, borderRadius: 20,
              padding: '4px 12px', fontSize: 10, fontWeight: 700,
              color: st.color, textTransform: 'uppercase', letterSpacing: '.6px',
            }}
          >
            <div style={{
              width: 6, height: 6, borderRadius: '50%', background: st.dot,
              animation: fetchStatus === 'loading' ? 'pulse 1s infinite' : 'none',
            }} />
            {st.label}
            {fetchStatus !== 'loading' && <span style={{ opacity: .5, marginLeft: 2 }}>↻</span>}
          </div>
        </div>
      </div>

      {/* ── Navigation tabs ── */}
      <div style={{
        display: 'flex', padding: '0 28px',
        background: C.surf, borderBottom: `1px solid ${C.bdr}`, overflowX: 'auto',
      }}>
        {TABS.map(t => (
          <div key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 16px', fontSize: 12, fontWeight: 500,
            cursor: 'pointer', whiteSpace: 'nowrap',
            borderBottom: `2px solid ${tab === t.id ? C.blue : 'transparent'}`,
            color: tab === t.id ? C.blue : C.txt3,
            transition: 'all .15s',
          }}>
            {t.label}
          </div>
        ))}
      </div>

      {/* ── Page content ── */}
      <div style={{ padding: '24px 28px', maxWidth: 1600, margin: '0 auto' }}>
        {pages[tab]}
      </div>

      {/* ── Footer ── */}
      <div style={{
        padding: '12px 28px', borderTop: `1px solid ${C.bdr}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        color: C.txt3, fontSize: 10,
      }}>
        <div>Base Ops · Financial Dashboard · Confidential · Lone Peak Consulting Partners</div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {lastUpdated && <div style={{ opacity: .5 }}>Last synced: {lastUpdated.toLocaleTimeString()}</div>}
          <div>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        </div>
      </div>

      {/* Pulse animation for loading dot */}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }`}</style>
    </div>
  );
}
