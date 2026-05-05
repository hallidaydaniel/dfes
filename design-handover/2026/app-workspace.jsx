/* DFES 2026 prototype — Workspace (controls + map + sparkline popup) */
/* eslint-disable */

const { useState: useStateW, useEffect: useEffectW, useMemo: useMemoW, useRef: useRefW, useCallback: useCallbackW } = React;
const Dw = window.DFES_DATA;
const IconW = window.DFESLib.Icon;

/* Colour scale: takes value, returns red-family colour */
function scaleColour(t) {
  // t 0..1 -> from --pink-5 to --red-100 via warm reds
  const stops = [
    [0.00, [254, 244, 246]], // pink-5
    [0.20, [253, 235, 240]], // pink-10
    [0.40, [250, 196, 210]], // pink-30
    [0.60, [255, 71, 131]],  // pink-60
    [0.80, [183, 5, 57]],    // deep red
    [1.00, [101, 29, 50]]    // warm maroon
  ];
  let lo = stops[0], hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i][0] && t <= stops[i+1][0]) { lo = stops[i]; hi = stops[i+1]; break; }
  }
  const k = (t - lo[0]) / (hi[0] - lo[0] || 1);
  const c = lo[1].map((v, j) => Math.round(v + (hi[1][j] - v) * k));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function fmtVal(v, unit) {
  if (unit === 'MW') return v.toFixed(1) + ' MW';
  if (unit === 'TWh') return v.toFixed(2) + ' TWh';
  if (v >= 1e6) return (v/1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v/1e3).toFixed(1) + 'k';
  return Math.round(v).toLocaleString('en-GB');
}

/* Sparkline */
function Sparkline({ series, color }) {
  const w = 252, h = 56;
  const vals = series.map(s => s.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const pts = series.map((s, i) => {
    const x = (i / (series.length - 1)) * w;
    const y = h - ((s.value - min) / range) * (h - 8) - 4;
    return [x, y];
  });
  const path = 'M ' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L ');
  const area = path + ` L ${w},${h} L 0,${h} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="sparkfill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkfill)"/>
      <path d={path} fill="none" stroke={color} strokeWidth="2"/>
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} stroke="#fff" strokeWidth="1.5"/>
    </svg>
  );
}

/* Sub popup */
function SubPopup({ sub, paramId, scenario, year, anchor }) {
  if (!sub) return null;
  const series = Dw.getSeries(sub.id, paramId, scenario.id);
  const param = Dw.parameters.find(p => p.id === paramId);
  const cur = series[year - 2024].value;
  const base = series[0].value;
  const delta = base ? ((cur - base) / base) * 100 : 0;
  return (
    <div className="popup show" style={{ left: anchor.x, top: anchor.y }}>
      <div className="pop-eye">{sub.city} · Primary substation</div>
      <div className="pop-title">{sub.name}</div>
      <div className="pop-now">
        <span className="v">{fmtVal(cur, param.unit)}</span>
        <span className="u">{param.short} · {year}</span>
      </div>
      <div className={'pop-delta' + (delta < 0 ? ' down' : '')}>
        {delta >= 0 ? '▲ +' : '▼ '}{Math.abs(delta).toFixed(0)}% since 2024
      </div>
      <Sparkline series={series} color={scenario.color}/>
      <div className="spark-axis"><span>2024</span><span>2050</span></div>
    </div>
  );
}

/* Scrubber */
function Scrubber({ year, setYear }) {
  const min = 2024, max = 2050;
  const pct = ((year - min) / (max - min)) * 100;
  const ticks = [2024, 2030, 2035, 2040, 2045, 2050];
  return (
    <div className="scrubber" aria-label="Year">
      <div className="scrubber-track">
        <div className="scrubber-fill" style={{ width: pct + '%' }}/>
      </div>
      <div className="scrubber-thumb" style={{ left: pct + '%' }}/>
      <input
        type="range" min={min} max={max} step={1}
        value={year} onChange={e => setYear(+e.target.value)}
        className="scrubber-input"
      />
      <div className="scrubber-ticks">
        {ticks.map(t => <span key={t} className={'scrubber-tick' + ((t === 2024 || t === 2050) ? ' major' : '')}>{t}</span>)}
      </div>
    </div>
  );
}

/* Map (mock SVG, retains hover sparkline) */
function MapStage({ scenarioId, paramId, year, view, hoverSub, setHoverSub, tweaks }) {
  const wrapRef = useRefW(null);
  const [size, setSize] = useStateW({ w: 800, h: 640 });
  const scenario = Dw.scenarios.find(s => s.id === scenarioId);
  const { lo, hi } = useMemoW(() => Dw.minMaxAt(paramId, scenarioId, year), [paramId, scenarioId, year]);
  const range = hi - lo || 1;

  useEffectW(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => {
      setSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const subs = Dw.substations;
  // Compute pixel positions
  const pos = subs.map(s => ({ s, x: s.x * size.w, y: s.y * size.h }));

  const param = Dw.parameters.find(p => p.id === paramId);
  const popupAnchor = useMemoW(() => {
    if (!hoverSub) return null;
    const p = pos.find(o => o.s.id === hoverSub.id);
    return p ? { x: p.x, y: p.y } : null;
  }, [hoverSub, size.w, size.h]);

  return (
    <div className="map-stage">
      <div className="map-canvas" ref={wrapRef}>
        {/* Region outline backdrop */}
        <svg className="map-svg" viewBox={`0 0 ${size.w} ${size.h}`} preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
          {/* Coastline / region (very approximate) */}
          <path
            d={`M ${size.w*0.18} ${size.h*0.05}
                Q ${size.w*0.30} ${size.h*0.02} ${size.w*0.55} ${size.h*0.08}
                Q ${size.w*0.72} ${size.h*0.18} ${size.w*0.78} ${size.h*0.40}
                Q ${size.w*0.86} ${size.h*0.55} ${size.w*0.84} ${size.h*0.78}
                Q ${size.w*0.78} ${size.h*0.92} ${size.w*0.55} ${size.h*0.95}
                Q ${size.w*0.30} ${size.h*0.96} ${size.w*0.18} ${size.h*0.78}
                Q ${size.w*0.10} ${size.h*0.55} ${size.w*0.12} ${size.h*0.30}
                Q ${size.w*0.14} ${size.h*0.15} ${size.w*0.18} ${size.h*0.05} Z`}
            fill="#ffffff" stroke="#d2d2dc" strokeWidth="1.5"
          />
          {/* City labels */}
          {[
            ['Newcastle', 0.42, 0.07], ['Sunderland', 0.55, 0.16],
            ['Leeds', 0.32, 0.60], ['Hull', 0.78, 0.62],
            ['Sheffield', 0.36, 0.80], ['York', 0.55, 0.50]
          ].map(([n, x, y]) => (
            <text key={n} x={x*size.w} y={y*size.h} fontSize="11" fontWeight="700"
              fill="#6a6a6a" textAnchor="middle"
              style={{paintOrder: 'stroke', stroke: '#fff', strokeWidth: 3}}>{n}</text>
          ))}
          {/* Substations */}
          {pos.map(({ s, x, y }) => {
            const v = Dw.getSeries(s.id, paramId, scenarioId)[year - 2024].value;
            const t = (v - lo) / range;
            const r = 4 + t * 9;
            const col = scaleColour(t);
            const isHover = hoverSub && hoverSub.id === s.id;
            return (
              <g key={s.id}
                 onMouseEnter={() => setHoverSub(s)}
                 onMouseLeave={() => setHoverSub(null)}
                 style={{ cursor: 'pointer' }}>
                {isHover && <circle cx={x} cy={y} r={r + 6} fill={col} opacity="0.25"/>}
                <circle cx={x} cy={y} r={r} fill={col} stroke="#fff" strokeWidth={isHover ? 2 : 1} opacity="0.9"/>
              </g>
            );
          })}
        </svg>

        {/* Top-left info pills */}
        <div className="map-overlay-top">
          <span className="pill-info">
            <span className="dot" style={{background: scenario.color}}>{scenario.short.charAt(0)}</span>
            {scenario.name} · {year}
          </span>
          <span className="pill-info" style={{paddingLeft: 14}}>
            <IconW name="info" size={12}/> {param.name} — {view.name}
          </span>
        </div>

        {/* Top-right zoom + search */}
        <div className="map-overlay-right">
          <div className="map-search">
            <IconW name="search" size={14}/>
            <input placeholder="Postcode or place — e.g. NE27 0LP" />
          </div>
          <div className="map-zoom">
            <button title="Zoom in">+</button>
            <button title="Zoom out">−</button>
          </div>
        </div>

        {/* Sparkline popup */}
        {hoverSub && popupAnchor && (
          <SubPopup sub={hoverSub} paramId={paramId} scenario={scenario} year={year} anchor={popupAnchor}/>
        )}
      </div>

      {/* Legend */}
      <div className="map-legend">
        <div className="legend-bar-wrap">
          <div className="legend-title">
            <span>{param.name}</span> <strong>— {year} values across the region</strong>
          </div>
          <div className="legend-bar" style={{
            background: 'linear-gradient(90deg, ' +
              [0,0.2,0.4,0.6,0.8,1].map(t => scaleColour(t)).join(',') + ')'
          }}/>
          <div className="legend-scale">
            <span>{fmtVal(lo, param.unit)}</span>
            <span>{fmtVal((lo+hi)/2, param.unit)}</span>
            <span>{fmtVal(hi, param.unit)}</span>
          </div>
        </div>
        <div className="legend-export">
          <button className="btn btn--outline btn--sm"><IconW name="image" size={12}/> Save PNG</button>
          <button className="btn btn--dark btn--sm"><IconW name="download" size={12}/> Download CSV</button>
        </div>
      </div>
    </div>
  );
}

/* Workspace */
function Workspace({ tweaks, setHeader }) {
  const [scenarioId, setScenarioId] = useStateW('reference');
  const [paramId, setParamId] = useStateW('ev');
  const [viewId, setViewId] = useStateW('primary');
  const [year, setYear] = useStateW(2035);
  const [playing, setPlaying] = useStateW(false);
  const [scaleMode, setScaleMode] = useStateW('relative');
  const [hoverSub, setHoverSub] = useStateW(null);

  const scenario = Dw.scenarios.find(s => s.id === scenarioId);
  const param = Dw.parameters.find(p => p.id === paramId);
  const view = Dw.views.find(v => v.id === viewId);

  useEffectW(() => {
    setHeader({ scenario, param, year });
  }, [scenario, param, year]);

  // Auto-play
  useEffectW(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setYear(y => (y >= 2050 ? 2024 : y + 1));
    }, 350);
    return () => clearInterval(t);
  }, [playing]);

  return (
    <section className="workspace" id="workspace" data-screen-label="03 Workspace">
      <div className="holder">
        <div className="workspace-head">
          <div>
            <div className="eyebrow eye-red">Interactive map</div>
            <h2>Explore every primary substation</h2>
            <p>Pick a scenario, parameter and year. Hover any point to see its full 2024–2050 trajectory.</p>
          </div>
          <div className="hero-cta">
            <button className="btn btn--outline btn--sm"><IconW name="compare" size={12}/> Compare scenarios</button>
            <button className="btn btn--dark btn--sm"><IconW name="info" size={12}/> Take the tour</button>
          </div>
        </div>

        <div className="workspace-grid">
          <aside className="controls" aria-label="Map controls">
            {/* 1. Scenario */}
            <div className="control-group">
              <h3><span className="num">1</span> Scenario</h3>
              <div className="scenario-cards">
                {Dw.scenarios.map(s => (
                  <button key={s.id}
                    className={'scenario-card' + (scenarioId === s.id ? ' active' : '')}
                    onClick={() => setScenarioId(s.id)}>
                    <span className="swatch" style={{background: s.color}}/>
                    <div className="name">{s.name}</div>
                    <span className={'nz ' + (s.netZero ? 'yes' : 'no')}>
                      {s.netZero ? <IconW name="check" size={10}/> : <IconW name="x" size={10}/>}
                      {s.netZero ? 'Net zero ‘50' : 'Misses target'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Parameter */}
            <div className="control-group">
              <h3><span className="num">2</span> Parameter</h3>
              <div className="select-wrap">
                <select value={paramId} onChange={e => setParamId(e.target.value)}>
                  {Dw.parameters.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            {/* 3. View */}
            <div className="control-group">
              <h3><span className="num">3</span> View by</h3>
              <div className="segmented">
                {Dw.views.map(v => (
                  <button key={v.id} className={viewId === v.id ? 'active' : ''} onClick={() => setViewId(v.id)}>
                    {v.name.replace('Primary substation', 'Primary').replace('Local Authority', 'LA').replace('Grid Supply Point', 'GSP')}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Year + scrubber */}
            <div className="control-group">
              <h3><span className="num">4</span> Year</h3>
              <div className="timeline">
                <div className="timeline-head">
                  <div className="timeline-year">
                    <span className="small">Forecast</span>
                    {year}
                  </div>
                  <div className="timeline-controls">
                    <button className="icon-btn ghost" title="Reset to 2024" onClick={() => setYear(2024)}>
                      <IconW name="reset" size={12}/>
                    </button>
                    <button className="icon-btn" title={playing ? 'Pause' : 'Play'} onClick={() => setPlaying(p => !p)}>
                      <IconW name={playing ? 'pause' : 'play'} size={12}/>
                    </button>
                  </div>
                </div>
                <Scrubber year={year} setYear={setYear}/>
              </div>
            </div>

            {/* 5. Scale mode */}
            <div className="control-group">
              <h3><span className="num">5</span> Colour scale</h3>
              <div className="segmented" style={{display: 'flex', width: '100%'}}>
                <button className={scaleMode === 'relative' ? 'active' : ''} onClick={() => setScaleMode('relative')} style={{flex:1}}>This year</button>
                <button className={scaleMode === 'absolute' ? 'active' : ''} onClick={() => setScaleMode('absolute')} style={{flex:1}}>2024–2050 range</button>
              </div>
              <p style={{fontSize: 12, color: 'var(--black-70)', marginTop: 8, lineHeight: 1.4}}>
                {scaleMode === 'relative'
                  ? 'Colours adjust to the selected year for higher contrast within that year.'
                  : 'Fixed scale across all years — best for showing change over time.'}
              </p>
            </div>
          </aside>

          <MapStage
            scenarioId={scenarioId}
            paramId={paramId}
            year={year}
            view={view}
            hoverSub={hoverSub}
            setHoverSub={setHoverSub}
            tweaks={tweaks}
          />
        </div>
      </div>
    </section>
  );
}

window.DFESLib2 = { Workspace };
