/* DFES 2026 redesign — animated SVG network for the Hero band.
   Vanilla-JS port of HeroNetwork from the React prototype
   (design-handover/2026/app-hero.jsx).

   Builds an equirectangular projection of ~32 named towns/cities across
   Northern Powergrid's licence area, wires each node to its 2 nearest
   neighbours, then drives two animation loops via requestAnimationFrame:
     - halo radius/opacity pulse on every node (sin-based)
     - white dots travelling along edges as data pulses

   Runs once on DOMContentLoaded. Honours prefers-reduced-motion. Pure
   decoration, aria-hidden. No external deps. */

(function () {
	'use strict';

	var SVG_NS = 'http://www.w3.org/2000/svg';

	// Real NPG-area population centres (lat, lon).
	// 'gsp' = larger anchor node (rendered slightly bigger). Hand-picked
	// to produce a legible silhouette without crowding.
	var CITIES = [
		{ n: 'Alnwick',         lat: 55.413, lon: -1.706, k: 'p'   },
		{ n: 'Morpeth',         lat: 55.166, lon: -1.687, k: 'p'   },
		{ n: 'Hexham',          lat: 54.971, lon: -2.099, k: 'p'   },
		{ n: 'Newcastle',       lat: 54.978, lon: -1.617, k: 'gsp' },
		{ n: 'Gateshead',       lat: 54.952, lon: -1.603, k: 'p'   },
		{ n: 'Sunderland',      lat: 54.906, lon: -1.381, k: 'gsp' },
		{ n: 'Durham',          lat: 54.778, lon: -1.575, k: 'p'   },
		{ n: 'Hartlepool',      lat: 54.692, lon: -1.213, k: 'p'   },
		{ n: 'Stockton',        lat: 54.570, lon: -1.319, k: 'p'   },
		{ n: 'Middlesbrough',   lat: 54.575, lon: -1.235, k: 'gsp' },
		{ n: 'Darlington',      lat: 54.527, lon: -1.553, k: 'p'   },
		{ n: 'Bishop Auckland', lat: 54.665, lon: -1.676, k: 'p'   },
		{ n: 'Whitby',          lat: 54.486, lon: -0.614, k: 'p'   },
		{ n: 'Scarborough',     lat: 54.279, lon: -0.402, k: 'p'   },
		{ n: 'Thirsk',          lat: 54.234, lon: -1.342, k: 'p'   },
		{ n: 'Ripon',           lat: 54.137, lon: -1.522, k: 'p'   },
		{ n: 'Harrogate',       lat: 53.993, lon: -1.541, k: 'p'   },
		{ n: 'York',            lat: 53.959, lon: -1.080, k: 'gsp' },
		{ n: 'Bradford',        lat: 53.795, lon: -1.759, k: 'gsp' },
		{ n: 'Leeds',           lat: 53.801, lon: -1.549, k: 'gsp' },
		{ n: 'Halifax',         lat: 53.720, lon: -1.864, k: 'p'   },
		{ n: 'Huddersfield',    lat: 53.645, lon: -1.785, k: 'p'   },
		{ n: 'Todmorden',       lat: 53.713, lon: -2.097, k: 'p'   },
		{ n: 'Wakefield',       lat: 53.683, lon: -1.499, k: 'p'   },
		{ n: 'Castleford',      lat: 53.725, lon: -1.355, k: 'p'   },
		{ n: 'Barnsley',        lat: 53.553, lon: -1.479, k: 'p'   },
		{ n: 'Rotherham',       lat: 53.430, lon: -1.357, k: 'p'   },
		{ n: 'Sheffield',       lat: 53.381, lon: -1.470, k: 'gsp' },
		{ n: 'Doncaster',       lat: 53.523, lon: -1.135, k: 'gsp' },
		{ n: 'Goole',           lat: 53.704, lon: -0.872, k: 'p'   },
		{ n: 'Hull',            lat: 53.745, lon: -0.337, k: 'gsp' },
		{ n: 'Grimsby',         lat: 53.567, lon: -0.080, k: 'p'   },
		{ n: 'Scunthorpe',      lat: 53.589, lon: -0.654, k: 'p'   }
	];

	function project(cities, vbW, vbH, margin) {
		// Equirectangular: x = lon*cos(lat), y = -lat. Geographic-accurate
		// uniform scale so the silhouette reads as the actual NPg licence
		// area — Northumberland down to Lincolnshire, Pennines to the
		// coast. The container CSS (height: 100% inside .hero .holder
		// align-items: stretch) lets the SVG grow to match the hero
		// height, which gives the portrait data plenty of room without
		// any horizontal stretching.
		var lats = cities.map(function (c) { return c.lat; });
		var latMid = (Math.min.apply(null, lats) + Math.max.apply(null, lats)) / 2;
		var cosLat = Math.cos(latMid * Math.PI / 180);
		var proj = cities.map(function (c) {
			return { px: c.lon * cosLat, py: -c.lat, k: c.k };
		});
		var pxs = proj.map(function (p) { return p.px; });
		var pys = proj.map(function (p) { return p.py; });
		var pxMin = Math.min.apply(null, pxs);
		var pxMax = Math.max.apply(null, pxs);
		var pyMin = Math.min.apply(null, pys);
		var pyMax = Math.max.apply(null, pys);
		var sw = vbW - margin * 2, sh = vbH - margin * 2;
		var dx = pxMax - pxMin, dy = pyMax - pyMin;
		var scale = Math.min(sw / dx, sh / dy);
		var offX = margin + (sw - dx * scale) / 2;
		var offY = margin + (sh - dy * scale) / 2;
		return proj.map(function (p) {
			return {
				x: offX + (p.px - pxMin) * scale,
				y: offY + (p.py - pyMin) * scale,
				k: p.k
			};
		});
	}

	function buildEdges(nodes) {
		// Each node connects to its 2 nearest neighbours; dedupe.
		var set = {};
		for (var i = 0; i < nodes.length; i++) {
			var ranked = [];
			for (var j = 0; j < nodes.length; j++) {
				if (i === j) continue;
				ranked.push({
					j: j,
					d: Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y)
				});
			}
			ranked.sort(function (a, b) { return a.d - b.d; });
			ranked.slice(0, 2).forEach(function (o) {
				var a = Math.min(i, o.j), b = Math.max(i, o.j);
				set[a + ',' + b] = true;
			});
		}
		return Object.keys(set).map(function (key) {
			var parts = key.split(',');
			return { a: +parts[0], b: +parts[1] };
		});
	}

	function el(tag, attrs) {
		var node = document.createElementNS(SVG_NS, tag);
		if (attrs) {
			for (var k in attrs) {
				if (Object.prototype.hasOwnProperty.call(attrs, k)) {
					node.setAttribute(k, attrs[k]);
				}
			}
		}
		return node;
	}

	// Easter egg: lazy-loaded "full network" view that renders the real
	// 3-tier NPg licence-area network from the public open data:
	//   - 6 GSPs  (transmission boundary, biggest anchor dots)
	//   - 82 BSPs + 5 Secondaries (132/33 kV, medium dots)
	//   - 574 Primaries (33/11 kV, small dots)
	// = 667 nodes total. Triggered by press-and-hold on the hero
	// network (see init() below). Pulses radiate outward from the
	// actual GSPs.
	function loadFullNetAndRender() {
		Promise.all([
			fetch('data/npg-sites.json').then(function (r) { return r.json(); }),
			fetch('data/maps/npg-primaries-polygons-unique-2023_BGC.geojson').then(function (r) { return r.json(); })
		]).then(function (results) {
			var sites = results[0];
			var gj = results[1];
			var data = sites.map(function (s) {
				return { n: s.n, lat: s.lat, lon: s.lon, k: s.k };
			});
			gj.features.forEach(function (f, idx) {
				var coords = [];
				(function flatten(c) {
					if (typeof c[0] === 'number') coords.push(c);
					else c.forEach(flatten);
				})(f.geometry.coordinates);
				var sumX = 0, sumY = 0;
				for (var ci = 0; ci < coords.length; ci++) {
					sumX += coords[ci][0]; sumY += coords[ci][1];
				}
				data.push({
					n: f.properties.PRIMARYNM || ('PRIMARY-' + idx),
					lat: sumY / coords.length,
					lon: sumX / coords.length,
					k: 'p'
				});
			});
			renderNetwork(data, /* dense */ true);
		}).catch(function (e) { console.warn('hero-network fullnet load failed', e); });
	}

	function renderNetwork(cities, dense) {
		var svg = document.querySelector('.hero-network svg');
		if (!svg) return;
		// Clear any prior render (in case both code paths fire).
		while (svg.firstChild) svg.removeChild(svg.firstChild);

		// Square viewBox matching the container aspect-ratio. With
		// geographic-accurate projection (uniform x/y scale) the
		// portrait NPg silhouette fills the height and is centred
		// horizontally — readable as the licence-area shape.
		var VB_W = 500, VB_H = 500, MARGIN = 15;
		var nodes = project(cities, VB_W, VB_H, MARGIN);
		var edges = buildEdges(nodes);

		// Dense (primaries / fullnet) mode: way more nodes, so reduce
		// visual weight per node. Three node tiers in fullnet mode:
		//   gsp        → anchorR (biggest)
		//   bsp / sec  → midR    (medium — only present in fullnet)
		//   p          → nodeR   (smallest)
		var nodeR = dense ? 1.5 : 4;
		var midR = dense ? 2.4 : 5;
		var anchorR = dense ? 3.5 : 6;
		var nodeStrokeW = dense ? 0.5 : 1.2;
		var edgeStrokeW = dense ? 0.6 : 1;
		var edgeAlpha = dense ? 0.26 : 0.22;
		var pulseR = dense ? 1.4 : 2.5;
		var pulseAlpha = dense ? 0.7 : 0.85;
		var haloMaxRBoost = dense ? 2 : 4; // halo r-pulse extra
		var midMaxRBoost = dense ? 3 : 5;
		var anchorMaxRBoost = dense ? 5 : 7;
		// One pulse per edge in both modes — primaries-mode hero looked
		// quiet at the earlier 50-pulse cap. Direction rules below
		// still apply (GSP → outward; primary → primary follows BFS
		// distance from nearest GSP).
		var pulseStride = 1;

		// Pulse direction: pulses originate at the largest dots (GSP
		// nodes) and travel OUT into the network — never into a GSP.
		// For each edge:
		//   - one end GSP, one not  → pulse goes GSP → non-GSP
		//   - both ends GSP         → pulse goes lower-index → higher
		//                            (arbitrary but deterministic)
		//   - neither end GSP       → BFS from all GSPs; pulse goes
		//                            from end CLOSER to a GSP (i.e. it
		//                            continues outward through the tree)
		// One pulse per edge; deterministic offset/speed so the field
		// reads as variety not chaos.

		// Adjacency for BFS
		var adj = nodes.map(function () { return []; });
		edges.forEach(function (e) {
			adj[e.a].push(e.b);
			adj[e.b].push(e.a);
		});
		// BFS dist from any GSP
		var dist = new Array(nodes.length);
		for (var di = 0; di < dist.length; di++) dist[di] = Infinity;
		var queue = [];
		nodes.forEach(function (n, i) {
			if (n.k === 'gsp') { dist[i] = 0; queue.push(i); }
		});
		while (queue.length) {
			var v = queue.shift();
			for (var k = 0; k < adj[v].length; k++) {
				var w = adj[v][k];
				if (dist[w] > dist[v] + 1) {
					dist[w] = dist[v] + 1;
					queue.push(w);
				}
			}
		}

		var pulses = edges.filter(function (_, i) {
			return i % pulseStride === 0;
		}).map(function (e, i) {
			var aIsGsp = nodes[e.a].k === 'gsp';
			var bIsGsp = nodes[e.b].k === 'gsp';
			var from, to;
			if (aIsGsp && !bIsGsp)      { from = e.a; to = e.b; }
			else if (bIsGsp && !aIsGsp) { from = e.b; to = e.a; }
			else if (aIsGsp && bIsGsp)  { from = e.a; to = e.b; }
			else if (dist[e.a] <= dist[e.b]) { from = e.a; to = e.b; }
			else                             { from = e.b; to = e.a; }
			return {
				a: from,
				b: to,
				offset: (i * 0.31) % 1,
				speed: 0.18 + ((i * 7) % 5) * 0.04
			};
		});

		// Defs: white radial halo gradient
		var defs = el('defs');
		defs.appendChild(el('radialGradient', { id: 'hero-halo', cx: '50%', cy: '50%', r: '50%' }));
		var stop1 = el('stop', { offset: '0%', 'stop-color': '#fff', 'stop-opacity': '0.95' });
		var stop2 = el('stop', { offset: '100%', 'stop-color': '#fff', 'stop-opacity': '0' });
		defs.firstChild.appendChild(stop1);
		defs.firstChild.appendChild(stop2);
		svg.appendChild(defs);

		// Edges (static)
		var edgesG = el('g', {
			stroke: 'rgba(255,255,255,' + edgeAlpha + ')',
			'stroke-width': String(edgeStrokeW)
		});
		edges.forEach(function (e) {
			edgesG.appendChild(el('line', {
				x1: nodes[e.a].x,
				y1: nodes[e.a].y,
				x2: nodes[e.b].x,
				y2: nodes[e.b].y
			}));
		});
		svg.appendChild(edgesG);

		// Pulses (positions updated per frame)
		var pulsesG = el('g');
		var pulseEls = pulses.map(function () {
			var c = el('circle', { r: String(pulseR), fill: '#fff', opacity: String(pulseAlpha) });
			pulsesG.appendChild(c);
			return c;
		});
		svg.appendChild(pulsesG);

		// Nodes — halo (animated radius/opacity) + dot (static).
		// Three tiers: GSP (anchor), BSP/sec (mid), primary/other (leaf).
		var nodesG = el('g');
		var haloEls = [];
		nodes.forEach(function (n) {
			var tier;  // 'anchor' | 'mid' | 'leaf'
			if (n.k === 'gsp') tier = 'anchor';
			else if (n.k === 'bsp' || n.k === 'sec') tier = 'mid';
			else tier = 'leaf';
			var baseR = tier === 'anchor' ? anchorR : tier === 'mid' ? midR : nodeR;
			var halo = el('circle', { cx: n.x, cy: n.y, fill: 'url(#hero-halo)' });
			nodesG.appendChild(halo);
			haloEls.push({ el: halo, baseR: baseR, tier: tier });
			var dotFill = tier === 'anchor' ? '#fff' : tier === 'mid' ? '#ffd2dc' : '#fdebf0';
			var dot = el('circle', {
				cx: n.x, cy: n.y, r: baseR,
				fill: dotFill,
				stroke: '#fff', 'stroke-opacity': '0.6', 'stroke-width': String(nodeStrokeW)
			});
			nodesG.appendChild(dot);
		});
		svg.appendChild(nodesG);

		// Animation loop — bail if user prefers reduced motion.
		var prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (prefersReduce) {
			// Set a static "midway" frame so it doesn't look broken.
			haloEls.forEach(function (h) {
				var staticBoost = h.tier === 'anchor' ? 4 : h.tier === 'mid' ? 2.5 : 2;
				h.el.setAttribute('r', h.baseR + staticBoost);
				h.el.setAttribute('opacity', '0.45');
			});
			return;
		}

		var start = performance.now();
		function tick(now) {
			var t = (now - start) / 1000;
			haloEls.forEach(function (h, i) {
				var phase = Math.sin(t * 1.2 + i * 0.7) * 0.5 + 0.5;
				var extra = h.tier === 'anchor' ? anchorMaxRBoost : h.tier === 'mid' ? midMaxRBoost : haloMaxRBoost;
				h.el.setAttribute('r', h.baseR + phase * extra);
				h.el.setAttribute('opacity', 0.3 + phase * 0.4);
			});
			pulseEls.forEach(function (c, i) {
				var p = pulses[i];
				var u = ((t * p.speed) + p.offset) % 1;
				var a = nodes[p.a], b = nodes[p.b];
				c.setAttribute('cx', a.x + (b.x - a.x) * u);
				c.setAttribute('cy', a.y + (b.y - a.y) * u);
			});
			requestAnimationFrame(tick);
		}
		requestAnimationFrame(tick);
	}

	function init() {
		// Default page load: cheap 33-node cities network.
		renderNetwork(CITIES, false);

		// Easter egg: press-and-hold the network for ~500ms to lazy-load
		// and swap in the full 667-node multi-voltage network. Only fires
		// once per page load; reloading reverts to the default.
		var container = document.querySelector('.hero-network');
		if (!container) return;
		var holdMs = 500;
		var holdTimer = null;
		var swapped = false;
		function startHold() {
			if (swapped) return;
			holdTimer = setTimeout(function () {
				if (swapped) return;
				swapped = true;
				loadFullNetAndRender();
			}, holdMs);
		}
		function cancelHold() {
			if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
		}
		container.addEventListener('mousedown', startHold);
		container.addEventListener('mouseup', cancelHold);
		container.addEventListener('mouseleave', cancelHold);
		container.addEventListener('touchstart', startHold, { passive: true });
		container.addEventListener('touchend', cancelHold);
		container.addEventListener('touchcancel', cancelHold);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
