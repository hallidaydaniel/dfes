/* DFES 2026 prototype data — scenarios, parameters, mock substation grid */

window.DFES_DATA = (function () {
  // Scenarios with NPG-aligned colours (red family + accents)
  const scenarios = [
    {
      id: 'reference',
      name: 'NPg Reference',
      short: 'Reference',
      color: '#ce0037',
      netZero: true,
      year: 2050,
      tagline: 'Our region’s pathway to net zero by 2050.',
      desc: 'Aggressive rollout of EVs and heat pumps, intensive investment in low-carbon technology, early action from government and engaged customers.',
      stats: [
        { k: 'Heat pumps by 2030', v: '1.4M' },
        { k: 'Peak demand 2050', v: '+62%' },
        { k: 'Substations upgraded', v: '8,400' }
      ],
      // Per-substation modifier (multiplies base series)
      mod: 1.0
    },
    {
      id: 'holistic',
      name: 'Holistic Transition',
      short: 'Holistic',
      color: '#b70539',
      netZero: true,
      year: 2050,
      tagline: 'A blend of electrification and hydrogen.',
      desc: 'Net zero met through a mix of electrification and hydrogen. Strong consumer engagement; smart homes and EVs supply flexibility to the grid.',
      stats: [
        { k: 'Heat pumps by 2030', v: '1.1M' },
        { k: 'Peak demand 2050', v: '+48%' },
        { k: 'Substations upgraded', v: '7,200' }
      ],
      mod: 0.92
    },
    {
      id: 'electric',
      name: 'Electric Engagement',
      short: 'Electric',
      color: '#e40046',
      netZero: true,
      year: 2050,
      tagline: 'Demand met mostly through electrification.',
      desc: 'Highly engaged consumers driving smart electric demand. Highest peak electricity, requiring most renewable and nuclear capacity.',
      stats: [
        { k: 'Heat pumps by 2030', v: '1.5M' },
        { k: 'Peak demand 2050', v: '+71%' },
        { k: 'Substations upgraded', v: '9,100' }
      ],
      mod: 1.12
    },
    {
      id: 'hydrogen',
      name: 'Hydrogen Evolution',
      short: 'Hydrogen',
      color: '#651d32',
      netZero: true,
      year: 2050,
      tagline: 'Hydrogen takes a lead role in heat and industry.',
      desc: 'Hydrogen progresses fastest in industry and heating, with lower consumer engagement. Lower renewable demand, more dispatchable hydrogen power.',
      stats: [
        { k: 'Heat pumps by 2030', v: '0.8M' },
        { k: 'Peak demand 2050', v: '+34%' },
        { k: 'Substations upgraded', v: '5,600' }
      ],
      mod: 0.74
    },
    {
      id: 'counterfactual',
      name: 'Counterfactual',
      short: 'Counter­factual',
      color: '#494949',
      netZero: false,
      year: null,
      tagline: 'A slower path — net zero is missed.',
      desc: 'Slowest decarbonisation effort, heavy reliance on natural gas, limited fossil-fuel switching until the 2030s.',
      stats: [
        { k: 'Heat pumps by 2030', v: '0.4M' },
        { k: 'Peak demand 2050', v: '+18%' },
        { k: 'Substations upgraded', v: '3,200' }
      ],
      mod: 0.55
    }
  ];

  const parameters = [
    { id: 'ev', name: 'Electric vehicles', unit: 'count', short: 'EVs' },
    { id: 'heatpumps', name: 'Heat pumps', unit: 'count', short: 'Heat pumps' },
    { id: 'peak', name: 'Peak demand', unit: 'MW', short: 'Peak MW' },
    { id: 'solar', name: 'Domestic solar PV', unit: 'kW', short: 'Solar' },
    { id: 'storage', name: 'Battery storage', unit: 'kWh', short: 'Storage' },
    { id: 'hydrogen', name: 'Industrial hydrogen', unit: 'TWh', short: 'H₂' }
  ];

  const views = [
    { id: 'primary', name: 'Primary substation' },
    { id: 'la', name: 'Local Authority' },
    { id: 'gsp', name: 'Grid Supply Point' }
  ];

  // Generate a mock grid of substations clustered around the NE/Yorks/Humber region.
  // Approximate cities: Newcastle (54.97, -1.61), Sunderland, Stockton, Castleford, Shildon, Hull, Leeds, Sheffield, Doncaster, Lincoln.
  const cityClusters = [
    { name: 'Newcastle', x: 0.42, y: 0.10, n: 18 },
    { name: 'Sunderland', x: 0.50, y: 0.16, n: 10 },
    { name: 'Stockton',   x: 0.50, y: 0.27, n: 12 },
    { name: 'Shildon',    x: 0.36, y: 0.30, n: 8 },
    { name: 'Castleford', x: 0.42, y: 0.55, n: 9 },
    { name: 'Leeds',      x: 0.38, y: 0.60, n: 22 },
    { name: 'Bradford',   x: 0.30, y: 0.62, n: 14 },
    { name: 'Sheffield',  x: 0.38, y: 0.78, n: 18 },
    { name: 'Doncaster',  x: 0.55, y: 0.74, n: 12 },
    { name: 'Hull',       x: 0.74, y: 0.62, n: 14 },
    { name: 'York',       x: 0.52, y: 0.50, n: 10 },
    { name: 'Lincoln',    x: 0.74, y: 0.85, n: 8 },
    { name: 'Scarborough', x: 0.66, y: 0.40, n: 6 },
    { name: 'Harrogate', x: 0.36, y: 0.50, n: 8 }
  ];

  // Seeded pseudo-random
  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = mulberry32(2026);

  const substations = [];
  let id = 0;
  for (const c of cityClusters) {
    for (let i = 0; i < c.n; i++) {
      const dx = (rand() - 0.5) * 0.08;
      const dy = (rand() - 0.5) * 0.08;
      const x = Math.max(0.04, Math.min(0.96, c.x + dx));
      const y = Math.max(0.04, Math.min(0.96, c.y + dy));
      // base 2024 value (per parameter, scaled later)
      const baseEv = 200 + Math.round(rand() * 1800);
      const baseHp = 80 + Math.round(rand() * 700);
      const basePk = 4 + +(rand() * 18).toFixed(1);
      const baseSol = 100 + Math.round(rand() * 900);
      const baseSt = 50 + Math.round(rand() * 600);
      const baseH2 = +(rand() * 0.6).toFixed(2);
      // Growth shape per substation (some hotter than others)
      const heat = 0.5 + rand() * 0.9;
      substations.push({
        id: 'sub_' + (id++),
        name: c.name + ' ' + (i + 1).toString().padStart(2, '0'),
        city: c.name,
        x, y,
        heat,
        base: { ev: baseEv, heatpumps: baseHp, peak: basePk, solar: baseSol, storage: baseSt, hydrogen: baseH2 }
      });
    }
  }

  // Year series builder for a given substation/parameter/scenario
  function seriesFor(sub, paramId, scenarioId) {
    const sc = scenarios.find(s => s.id === scenarioId);
    const base = sub.base[paramId];
    const out = [];
    for (let yr = 2024; yr <= 2050; yr++) {
      const t = (yr - 2024) / 26; // 0..1
      // Sigmoid-shaped growth modulated by heat and scenario mod
      const k = 8;
      const sig = 1 / (1 + Math.exp(-k * (t - 0.5)));
      const growth = 1 + sig * (3.5 * sc.mod * sub.heat);
      let v = base * growth;
      // Slight noise for realism (deterministic per sub+yr)
      v *= 0.95 + 0.10 * Math.sin((yr * 13 + (sub.x + sub.y) * 100));
      if (paramId === 'peak') v = +v.toFixed(2);
      else v = Math.round(v);
      out.push({ year: yr, value: Math.max(0, v) });
    }
    return out;
  }

  // Pre-compute series for fast hover rendering
  const seriesCache = new Map();
  function getSeries(subId, paramId, scenarioId) {
    const key = subId + '|' + paramId + '|' + scenarioId;
    if (seriesCache.has(key)) return seriesCache.get(key);
    const sub = substations.find(s => s.id === subId);
    const s = seriesFor(sub, paramId, scenarioId);
    seriesCache.set(key, s);
    return s;
  }

  // Min/Max across all substations for a param/scenario/year (for legend + colour scale)
  function minMaxAt(paramId, scenarioId, year) {
    let lo = Infinity, hi = -Infinity;
    for (const sub of substations) {
      const s = getSeries(sub.id, paramId, scenarioId);
      const v = s[year - 2024].value;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    return { lo, hi };
  }

  // Headline numbers (region totals) by scenario+param+year
  function regionTotal(paramId, scenarioId, year) {
    let sum = 0;
    for (const sub of substations) {
      sum += getSeries(sub.id, paramId, scenarioId)[year - 2024].value;
    }
    return sum;
  }

  return {
    scenarios, parameters, views,
    substations,
    getSeries, minMaxAt, regionTotal
  };
})();
