/* DFES 2026 prototype — Hero, Stats, Map, About, Footer components */
/* eslint-disable */

const { useState, useEffect, useMemo, useRef, useCallback } = React;
const D = window.DFES_DATA;

/* -------------------------------------------------------------------- */
/* Inline icons (Lucide-style, hand-trimmed) */
function Icon({ name, size = 16 }) {
  const s = size;
  const common = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'play':    return <svg {...common}><polygon points="6 4 20 12 6 20 6 4" fill="currentColor" stroke="none"/></svg>;
    case 'pause':   return <svg {...common}><rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none"/><rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none"/></svg>;
    case 'reset':   return <svg {...common}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>;
    case 'download':return <svg {...common}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
    case 'image':   return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
    case 'search':  return <svg {...common}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
    case 'check':   return <svg {...common}><polyline points="20 6 9 17 4 12"/></svg>;
    case 'x':       return <svg {...common}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    case 'bolt':    return <svg {...common}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" stroke="none"/></svg>;
    case 'arrow-right': return <svg {...common}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
    case 'info':    return <svg {...common}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
    case 'compare': return <svg {...common}><path d="M3 4h7v16H3z"/><path d="M14 4h7v16h-7z" opacity="0.5"/></svg>;
    default: return null;
  }
}

/* -------------------------------------------------------------------- */
/* Animated hero network */
function HeroNetwork({ animated = true, source = 'cities' }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!animated) return;
    let raf;
    const start = performance.now();
    const loop = (t) => {
      setTick((t - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [animated]);

  // Real NPG sites (when source === 'sites'), or population-centre cities (default).
  // Sites: 93 GSP/BSP/Strategic-secondary substations from NPG's open-data API.
  // Each site has lat, lon, k ('gsp' | 'bsp' | 'sec'), kva.
  const sitesData = useMemo(() => {
    const raw = (window.NPG_SITES || []).filter(s =>
      s.lat > 53 && s.lat < 56 && s.lon > -2.7 && s.lon < 0.5
    );
    return raw.map(s => ({ n: s.n, lat: s.lat, lon: s.lon, k: s.k, kva: s.kva }));
  }, []);

  // Real NPG DNO-area population centres (lat, lon).
  // Bounds: Morpeth (north) → Lincoln-ish (south), Todmorden (west) → Hull/coast (east).
  // 'gsp' = larger city node. Kept ~30 cities for legible rendering.
  const cities = useMemo(() => ([
    // North East
    { n: 'Alnwick',        lat: 55.413, lon: -1.706, k: 'p'   },
    { n: 'Morpeth',        lat: 55.166, lon: -1.687, k: 'p'   },
    { n: 'Hexham',         lat: 54.971, lon: -2.099, k: 'p'   },
    { n: 'Newcastle',      lat: 54.978, lon: -1.617, k: 'gsp' },
    { n: 'Gateshead',      lat: 54.952, lon: -1.603, k: 'p'   },
    { n: 'Sunderland',     lat: 54.906, lon: -1.381, k: 'gsp' },
    { n: 'Durham',         lat: 54.778, lon: -1.575, k: 'p'   },
    { n: 'Hartlepool',     lat: 54.692, lon: -1.213, k: 'p'   },
    { n: 'Stockton',       lat: 54.570, lon: -1.319, k: 'p'   },
    { n: 'Middlesbrough',  lat: 54.575, lon: -1.235, k: 'gsp' },
    { n: 'Darlington',     lat: 54.527, lon: -1.553, k: 'p'   },
    { n: 'Bishop Auckland',lat: 54.665, lon: -1.676, k: 'p'   },
    // Yorkshire — north / coast
    { n: 'Whitby',         lat: 54.486, lon: -0.614, k: 'p'   },
    { n: 'Scarborough',    lat: 54.279, lon: -0.402, k: 'p'   },
    { n: 'Thirsk',         lat: 54.234, lon: -1.342, k: 'p'   },
    { n: 'Ripon',          lat: 54.137, lon: -1.522, k: 'p'   },
    { n: 'Harrogate',      lat: 53.993, lon: -1.541, k: 'p'   },
    { n: 'York',           lat: 53.959, lon: -1.080, k: 'gsp' },
    // Yorkshire — west
    { n: 'Bradford',       lat: 53.795, lon: -1.759, k: 'gsp' },
    { n: 'Leeds',          lat: 53.801, lon: -1.549, k: 'gsp' },
    { n: 'Halifax',        lat: 53.720, lon: -1.864, k: 'p'   },
    { n: 'Huddersfield',   lat: 53.645, lon: -1.785, k: 'p'   },
    { n: 'Todmorden',      lat: 53.713, lon: -2.097, k: 'p'   },
    { n: 'Wakefield',      lat: 53.683, lon: -1.499, k: 'p'   },
    { n: 'Castleford',     lat: 53.725, lon: -1.355, k: 'p'   },
    // Yorkshire — south
    { n: 'Barnsley',       lat: 53.553, lon: -1.479, k: 'p'   },
    { n: 'Rotherham',      lat: 53.430, lon: -1.357, k: 'p'   },
    { n: 'Sheffield',      lat: 53.381, lon: -1.470, k: 'gsp' },
    { n: 'Doncaster',      lat: 53.523, lon: -1.135, k: 'gsp' },
    // Humber & Lincs
    { n: 'Goole',          lat: 53.704, lon: -0.872, k: 'p'   },
    { n: 'Hull',           lat: 53.745, lon: -0.337, k: 'gsp' },
    { n: 'Grimsby',        lat: 53.567, lon: -0.080, k: 'p'   },
    { n: 'Scunthorpe',     lat: 53.589, lon: -0.654, k: 'p'   }
  ]), []);

  // Choose dataset based on source prop.
  const points = source === 'sites' ? sitesData : cities;

  // Project equirectangular into the SVG viewBox (W×H). Compute bounds
  // from the data, then add a margin and correct longitude for latitude.
  const nodes = useMemo(() => {
    if (!points.length) return [];
    const lats = points.map(c => c.lat);
    const lons = points.map(c => c.lon);
    const latMin = Math.min(...lats), latMax = Math.max(...lats);
    const lonMin = Math.min(...lons), lonMax = Math.max(...lons);
    const latMid = (latMin + latMax) / 2;
    const cosLat = Math.cos(latMid * Math.PI / 180);
    // Pre-projected x = lon*cos(lat), y = -lat
    const proj = points.map(c => ({
      px: c.lon * cosLat,
      py: -c.lat,
      n: c.n, k: c.k, kva: c.kva || 0
    }));
    const pxMin = Math.min(...proj.map(p => p.px));
    const pxMax = Math.max(...proj.map(p => p.px));
    const pyMin = Math.min(...proj.map(p => p.py));
    const pyMax = Math.max(...proj.map(p => p.py));
    // Fit into the viewBox with margin, preserving aspect.
    const VB_W = 800, VB_H = 600, M = 50;
    const SW = VB_W - M * 2, SH = VB_H - M * 2;
    const dx = pxMax - pxMin, dy = pyMax - pyMin;
    const scale = Math.min(SW / dx, SH / dy);
    const offX = M + (SW - dx * scale) / 2;
    const offY = M + (SH - dy * scale) / 2;
    return proj.map((p, i) => ({
      x: offX + (p.px - pxMin) * scale,
      y: offY + (p.py - pyMin) * scale,
      n: p.n, kind: p.k, kva: p.kva, i
    }));
  }, [points]);

  const edges = useMemo(() => {
    // Sparser link rules for the dense sites view to avoid spaghetti.
    const NN = source === 'sites' ? 1 : 2;
    // Connect each node to its NN nearest neighbours; dedupe.
    const E = new Set();
    const addEdge = (i, j) => {
      const a = Math.min(i, j), b = Math.max(i, j);
      E.add(a + ',' + b);
    };
    for (let i = 0; i < nodes.length; i++) {
      const nearest = nodes
        .map((n, j) => ({ j, d: Math.hypot(n.x - nodes[i].x, n.y - nodes[i].y) }))
        .filter(o => o.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, NN);
      nearest.forEach(o => addEdge(i, o.j));
    }
    // Stitch network into one connected component (one grid).
    // Build adjacency, find components via BFS, link nearest pair across them.
    const edgeList = () => [...E].map(s => s.split(',').map(Number));
    const components = () => {
      const adj = nodes.map(() => []);
      edgeList().forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
      const seen = new Array(nodes.length).fill(-1);
      let cid = 0;
      for (let i = 0; i < nodes.length; i++) {
        if (seen[i] !== -1) continue;
        const q = [i]; seen[i] = cid;
        while (q.length) {
          const v = q.shift();
          for (const w of adj[v]) if (seen[w] === -1) { seen[w] = cid; q.push(w); }
        }
        cid++;
      }
      return { seen, count: cid };
    };
    let safety = 8;
    while (safety-- > 0) {
      const { seen, count } = components();
      if (count <= 1) break;
      // find closest pair of nodes in different components
      let best = { d: Infinity, a: -1, b: -1 };
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (seen[i] === seen[j]) continue;
          const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
          if (d < best.d) best = { d, a: i, b: j };
        }
      }
      if (best.a >= 0) addEdge(best.a, best.b);
    }
    // Force a western trans-Pennine connection in addition to the coastal route.
    // Pair Darlington <-> Ripon to bridge NE and Yorks via the A1/A66 corridor.
    // (Cities-mode only — sites mode has its own dense data.)
    if (source === 'cities') {
      const findIdx = (name) => nodes.findIndex(n => n.n === name);
      const western = [['Darlington', 'Ripon'], ['Thirsk', 'Harrogate']];
      western.forEach(([a, b]) => {
        const i = findIdx(a), j = findIdx(b);
        if (i >= 0 && j >= 0) addEdge(i, j);
      });
    }
    // Sites mode: build a clear inter-GSP trunk so the regional clusters
    // visibly connect via the high-voltage backbone (133+kV equivalent).
    // Each GSP connects to its 2 nearest GSPs, and each non-GSP node
    // connects to its nearest GSP (capped distance) for radial inflow.
    if (source === 'sites') {
      // Treat both 'gsp' and 'sec' (strategic secondary) as anchor nodes —
      // they are the visually prominent dots and should form the backbone.
      const anchorIdx = nodes.map((n, i) =>
        (n.kind === 'gsp' || n.kind === 'sec') ? i : -1
      ).filter(i => i >= 0);
      // Anchor <-> 2 nearest anchors
      anchorIdx.forEach(i => {
        const others = anchorIdx
          .filter(j => j !== i)
          .map(j => ({ j, d: Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y) }))
          .sort((a, b) => a.d - b.d)
          .slice(0, 2);
        others.forEach(o => addEdge(i, o.j));
      });
      // Force named bridge edges across the geographic NE↔Yorks gap so the
      // northern and southern clusters always read as one network.
      // Anchors picked to span the trans-Pennine corridor and the A1/A19
      // route into north Yorkshire.
      const findIdx = (name) => nodes.findIndex(n =>
        (n.n || '').toUpperCase().includes(name.toUpperCase())
      );
      const bridges = [
        ['DARLINGTON', 'LEEMING BAR'],   // A1 corridor
        ['LEEMING BAR', 'WORMALD GREEN'],// down to Harrogate
        ['LEEMING BAR', 'MALTON'],       // east into Yorks coast
        ['MALTON', 'MELROSEGATE'],       // York
        ['SPADEADAM', 'COALBURNS']       // far west tie-in
      ];
      bridges.forEach(([a, b]) => {
        const i = findIdx(a), j = findIdx(b);
        if (i >= 0 && j >= 0 && i !== j) addEdge(i, j);
      });
    }
    return [...E].map(s => {
      const [a, b] = s.split(',').map(Number);
      return { a, b };
    });
  }, [nodes, source]);

  // Pulses travel outward from the largest source nodes toward the leaves.
  // Approach: multi-source BFS from all GSPs (or 'gsp'-class nodes in cities
  // view) over the undirected edge graph. Each non-source node gets a parent
  // pointing toward its nearest source — pulses flow parent → child along
  // that edge. GSP↔GSP edges pulse in both directions (trunk line).
  const pulses = useMemo(() => {
    const cap = source === 'sites' ? 22 : 28;
    if (!nodes.length || !edges.length) return [];
    // Build adjacency
    const adj = nodes.map(() => []);
    edges.forEach((e, ei) => {
      adj[e.a].push({ n: e.b, ei });
      adj[e.b].push({ n: e.a, ei });
    });
    // Sources = anchor nodes (GSP + strategic secondaries in sites mode)
    const isSource = (i) => source === 'sites'
      ? (nodes[i].kind === 'gsp' || nodes[i].kind === 'sec')
      : nodes[i].kind === 'gsp';
    const sources = nodes.map((n, i) => isSource(i) ? i : -1).filter(i => i >= 0);
    // BFS from all sources simultaneously — assign parent for each non-source.
    const parent = new Array(nodes.length).fill(-1);
    const dist = new Array(nodes.length).fill(Infinity);
    const queue = [];
    sources.forEach(s => { dist[s] = 0; queue.push(s); });
    while (queue.length) {
      const v = queue.shift();
      for (const { n: w } of adj[v]) {
        if (dist[w] > dist[v] + 1) {
          dist[w] = dist[v] + 1;
          parent[w] = v;
          queue.push(w);
        }
      }
    }
    // For each edge, decide pulse direction(s).
    const dirEdges = []; // {a (from), b (to), speed, offset}
    edges.forEach((e, ei) => {
      const aIsSrc = isSource(e.a);
      const bIsSrc = isSource(e.b);
      if (aIsSrc && bIsSrc) {
        // Trunk: pulse both ways
        dirEdges.push({ a: e.a, b: e.b, ei, role: 'trunk' });
        dirEdges.push({ a: e.b, b: e.a, ei, role: 'trunk' });
      } else if (parent[e.b] === e.a) {
        dirEdges.push({ a: e.a, b: e.b, ei, role: 'feed' });
      } else if (parent[e.a] === e.b) {
        dirEdges.push({ a: e.b, b: e.a, ei, role: 'feed' });
      } else {
        // Edge between two leaves of different branches — pick direction
        // based on which end is closer to a source.
        const dir = dist[e.a] <= dist[e.b] ? { a: e.a, b: e.b } : { a: e.b, b: e.a };
        dirEdges.push({ a: dir.a, b: dir.b, ei, role: 'tie' });
      }
    });
    // Score & sort: prioritise trunk and short edges close to sources.
    const scored = dirEdges.map((d, k) => ({
      ...d,
      score: (d.role === 'trunk' ? 0 : 1) + dist[d.a] * 0.5,
      offset: (k * 0.31) % 1,
      speed: 0.18 + ((k * 7) % 5) * 0.04
    }));
    scored.sort((a, b) => a.score - b.score);
    return scored.slice(0, cap);
  }, [nodes, edges, source]);

  return (
    <div className="hero-network" aria-hidden="true">
      <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.95"/>
            <stop offset="100%" stopColor="#fff" stopOpacity="0"/>
          </radialGradient>
        </defs>
        {/* edges */}
        <g stroke="rgba(255,255,255,0.22)" strokeWidth="1">
          {edges.map((e, i) => {
            const a = nodes[e.a]; const b = nodes[e.b];
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
          })}
        </g>
        {/* pulses */}
        <g>
          {pulses.map((p, i) => {
            const a = nodes[p.a]; const b = nodes[p.b];
            const t = ((tick * p.speed) + p.offset) % 1;
            const x = a.x + (b.x - a.x) * t;
            const y = a.y + (b.y - a.y) * t;
            return <circle key={i} cx={x} cy={y} r="2.5" fill="#fff" opacity={0.85}/>;
          })}
        </g>
        {/* nodes */}
        <g>
          {nodes.map((n, i) => {
            const phase = Math.sin(tick * 1.2 + i * 0.7) * 0.5 + 0.5;
            // Sites view: GSP and Strategic Secondary are both anchor-class
            // (large with strong halo); BSP is mid-size.
            // Cities view: just gsp/p.
            let r;
            const isAnchor = (source === 'sites')
              ? (n.kind === 'gsp' || n.kind === 'sec')
              : (n.kind === 'gsp');
            if (source === 'sites') {
              r = isAnchor ? 7 : 4;
            } else {
              r = n.kind === 'gsp' ? 6 : 4;
            }
            return (
              <g key={i}>
                <circle cx={n.x} cy={n.y} r={r + phase * (isAnchor ? 7 : 4)} fill="url(#halo)" opacity={0.3 + phase * 0.4}/>
                <circle cx={n.x} cy={n.y} r={r} fill={isAnchor ? '#fff' : '#fdebf0'} stroke="#fff" strokeOpacity="0.6" strokeWidth="1.2"/>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/* Hero band */
function Hero({ tweaks }) {
  return (
    <section className="hero" data-screen-label="01 Hero">
      <div className="holder">
        <div>
          <div className="eyebrow">Distribution Future Energy Scenarios · 2026</div>
          <h1>
            Powering the<br/>North to net zero
            <span className="accent">A region-by-region forecast to 2050</span>
          </h1>
          <p className="lede">
            Five scenarios. 27 years of forecasts. Every primary substation across the
            North East, Yorkshire and northern Lincolnshire — modelled side by side so you
            can plan with confidence.
          </p>
          <div className="hero-meta">
            <span className="hero-chip"><Icon name="bolt" size={12}/> <strong>3.9M</strong> homes &amp; businesses</span>
            <span className="hero-chip">63,000 substations</span>
            <span className="hero-chip">Updated January 2026</span>
          </div>
          <div className="hero-cta">
            <a href="#workspace" className="btn btn--primary">Explore the map <Icon name="arrow-right" size={14}/></a>
            <a href="#about" className="btn btn--ghost-on-red">How the scenarios work</a>
          </div>
        </div>
        {tweaks.heroAnim !== 'off' && <HeroNetwork animated={tweaks.heroAnim === 'on'} source={tweaks.heroSource || 'cities'} />}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- */
/* Stats strip */
function StatsStrip({ scenario, year, param }) {
  const total = D.regionTotal(param.id, scenario.id, year);
  const peak2024 = D.regionTotal(param.id, scenario.id, 2024);
  const delta = peak2024 ? Math.round(((total - peak2024) / peak2024) * 100) : 0;
  const fmt = (n) => {
    if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n/1e3).toFixed(1) + 'k';
    return n.toLocaleString('en-GB');
  };
  return (
    <section className="stats-strip" aria-label="Region overview">
      <div className="holder">
        <div className="stat">
          <div className="label">Scenario</div>
          <div className="value" style={{color: scenario.color}}>{scenario.short || scenario.name}</div>
          <div className="desc">{scenario.tagline}</div>
        </div>
        <div className="stat">
          <div className="label">Year</div>
          <div className="value">{year}</div>
          <div className="desc">Drag the timeline to forecast each year through 2050.</div>
        </div>
        <div className="stat">
          <div className="label">Region total — {param.short}</div>
          <div className="value">{fmt(total)}<span className="unit">{param.unit !== 'count' ? ' ' + param.unit : ''}</span></div>
          <div className="desc">{delta >= 0 ? '+' : ''}{delta}% vs. 2024 baseline.</div>
        </div>
        <div className="stat">
          <div className="label">Net zero by 2050</div>
          <div className="value">{scenario.netZero ? 'Yes' : 'No'}</div>
          <div className="desc">{scenario.netZero ? 'Aligns with our 2050 net-zero target.' : 'This pathway misses the target.'}</div>
        </div>
      </div>
    </section>
  );
}

window.DFESLib = { Icon, Hero, StatsStrip };
