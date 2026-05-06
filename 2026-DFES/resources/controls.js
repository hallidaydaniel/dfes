/* DFES 2026 redesign — Controls panel wiring.
   Mirrors the new visual controls (scenario cards, view-segmented,
   scale-mode segmented, scrubber visuals) onto the existing form
   elements (<select id="scenarios">, <select id="views">,
   <input id="scale-mode">, <input id="slider">) which dfes.js owns
   as the source of truth.

   Pattern: state lives on the form element; visual UI is rebuilt from
   it on a poll, and clicks on visual UI write back via .value plus a
   dispatched 'change' event so dfes.js's existing handlers fire. */

(function () {
	'use strict';

	function dispatchChange(el) {
		el.dispatchEvent(new Event('change', { bubbles: true }));
	}

	// dfes.js has a long-standing typo (line 157: getElementById('view')
	// instead of 'views') that causes its init to *replace* the views
	// <select> element via innerHTML on every render rather than just
	// updating its options. So any cached reference to that element goes
	// stale. We work around it by re-querying inside each poll tick AND
	// using event delegation on a stable host element. Same defensive
	// pattern is used for scenarios in case the same gets refactored.

	// === Scenario cards ===
	function setupScenarios() {
		var cardsHost = document.querySelector('.scenario-cards');
		if (!cardsHost) return;

		// Click delegation: one listener regardless of how often we rebuild.
		cardsHost.addEventListener('click', function (e) {
			var btn = e.target.closest('.scenario-card');
			if (!btn) return;
			var sel = document.getElementById('scenarios');
			if (!sel) return;
			var v = btn.getAttribute('data-value');
			if (sel.value === v) return;
			sel.value = v;
			dispatchChange(sel);
		});

		var lastSig = '';
		function build() {
			var sel = document.getElementById('scenarios');
			if (!sel) return;
			var opts = Array.from(sel.options);
			// Signature includes selection so we re-render when the active
			// scenario changes, not only when the option set changes.
			var sig = opts.map(function (o) {
				return o.value + '|' + (o.selected ? '*' : '');
			}).join(';');
			if (sig === lastSig) return;
			lastSig = sig;

			var html = '';
			opts.forEach(function (opt) {
				var name = opt.value;
				var isActive = opt.selected;
				// Pull colour and net-zero status from the live FES object.
				var color = '#000';
				if (window.dfes && dfes.scenarios && dfes.scenarios[name]) {
					color = dfes.scenarios[name].color || '#000';
				}
				// Net-zero: hand-mapped here too (same list as stats-strip.js).
				var nz = !/counterfactual/i.test(name);
				html += '<button type="button" class="scenario-card' + (isActive ? ' active' : '') +
					'" data-value="' + escapeAttr(name) + '">' +
					'<span class="swatch" style="background:' + escapeAttr(color) + '"></span>' +
					'<div class="name">' + escapeHtml(name) + '</div>' +
					'<span class="nz ' + (nz ? 'yes' : 'no') + '">' +
					(nz ? checkSvg() + 'Net zero ‘50' : crossSvg() + 'Misses target') +
					'</span>' +
					'</button>';
			});
			cardsHost.innerHTML = html;
		}

		setInterval(build, 400);
		build();
	}

	// === View segmented ===
	function setupViews() {
		var host = document.querySelector('.view-segmented');
		if (!host) return;

		host.addEventListener('click', function (e) {
			var btn = e.target.closest('button');
			if (!btn) return;
			var sel = document.getElementById('views');
			if (!sel) return;
			var v = btn.getAttribute('data-value');
			if (sel.value === v) return;
			sel.value = v;
			dispatchChange(sel);
		});

		// Short labels per the prototype.
		var SHORT = {
			'Local Authorities': 'LA',
			'Primary Substations': 'Primary',
			'Primary Substations (with Local Authorities)': 'Primary + LA',
			'Grid Supply Points': 'GSP'
		};
		var lastSig = '';
		function build() {
			var sel = document.getElementById('views');
			if (!sel) return;
			var opts = Array.from(sel.options);
			var sig = opts.map(function (o) {
				return o.value + '|' + (o.selected ? '*' : '');
			}).join(';');
			if (sig === lastSig) return;
			lastSig = sig;

			var html = '';
			opts.forEach(function (opt) {
				var label = SHORT[opt.text] || opt.text;
				html += '<button type="button"' + (opt.selected ? ' class="active"' : '') +
					' data-value="' + escapeAttr(opt.value) + '">' +
					escapeHtml(label) + '</button>';
			});
			host.innerHTML = html;
		}
		setInterval(build, 400);
		build();
	}

	// === Scale-mode segmented ===
	function setupScaleMode() {
		var cb = document.getElementById('scale-mode');
		var host = document.querySelector('.scale-segmented');
		var help = document.querySelector('.scale-help');
		if (!cb || !host) return;

		var HELP = {
			relative: 'Colours adjust to the selected year for higher contrast within that year.',
			absolute: 'Fixed scale across all years — best for showing change over time.'
		};

		function sync() {
			var mode = cb.checked ? 'absolute' : 'relative';
			host.querySelectorAll('button').forEach(function (b) {
				b.classList.toggle('active', b.getAttribute('data-mode') === mode);
			});
			if (help) help.textContent = HELP[mode];
		}

		host.addEventListener('click', function (e) {
			var btn = e.target.closest('button');
			if (!btn) return;
			var mode = btn.getAttribute('data-mode');
			var nextChecked = (mode === 'absolute');
			if (cb.checked === nextChecked) return;
			cb.checked = nextChecked;
			dispatchChange(cb);
			sync();
		});

		// Pick up programmatic changes (dfes.js may set scale on its own).
		cb.addEventListener('change', sync);
		sync();
	}

	// === Scrubber visuals ===
	function setupScrubber() {
		var slider = document.getElementById('slider');
		if (!slider) return;
		var fill = document.querySelector('.scrubber-fill');
		var thumb = document.querySelector('.scrubber-thumb');

		function render() {
			// Don't use `|| fallback` — slider.min is often "0" which is falsy
			// but is the actual valid minimum (dfes.js uses an integer index
			// 0..N-1 for years). Use isNaN checks instead.
			var min = parseFloat(slider.min); if (isNaN(min)) min = 0;
			var max = parseFloat(slider.max); if (isNaN(max)) max = 1;
			var v = parseFloat(slider.value); if (isNaN(v)) v = min;
			var pct = (max === min) ? 0 : ((v - min) / (max - min)) * 100;
			pct = Math.max(0, Math.min(100, pct));
			if (fill) fill.style.width = pct + '%';
			if (thumb) thumb.style.left = pct + '%';
			// Accessibility — dfes.js doesn't set these.
			slider.setAttribute('aria-valuemin', String(min));
			slider.setAttribute('aria-valuemax', String(max));
			slider.setAttribute('aria-valuenow', String(v));
			if (window.dfes && dfes.options && dfes.options.key) {
				slider.setAttribute('aria-valuetext', dfes.options.key);
			}
		}

		slider.addEventListener('input', render);
		slider.addEventListener('change', render);
		// Also poll — dfes.js can set the slider value programmatically
		// during the play animation, and that doesn't always fire input.
		setInterval(render, 250);
		render();
	}

	// === Helpers ===
	function escapeHtml(s) {
		return String(s)
			.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}
	function escapeAttr(s) {
		return String(s)
			.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
	}
	function checkSvg() {
		return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="10" height="10" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> ';
	}
	function crossSvg() {
		return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="10" height="10" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> ';
	}

	function init() {
		setupScenarios();
		setupViews();
		setupScaleMode();
		setupScrubber();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
