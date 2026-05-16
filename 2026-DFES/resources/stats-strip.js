/* DFES 2026 redesign — Stats strip live binding.
   Reads the live FES state (window.dfes) and re-renders the four stats
   whenever scenario / parameter / year changes. Polls dfes.options
   every 400ms — cheap, robust, and avoids needing to know dfes.js's
   internal change-event plumbing.

   Region total is summed from the primary-substation raw CSV
   (data[parameter].primary.raw) which is the single source of truth
   regardless of the current view (LAD/GSP totals derive from it). */

(function () {
	'use strict';

	// Scenarios that hit net zero by 2050. Production scenarios.json doesn't
	// carry an explicit netZero flag, so we maintain the list here. Update
	// when scenarios are added/renamed.
	var NET_ZERO = {
		'NPg Reference Scenario': true,
		'Holistic Transition': true,
		'Hydrogen Evolution': true,
		'Electric Engagement': true,
		'Counterfactual': false
	};

	function fmt(v) {
		if (v == null || isNaN(v)) return '—'; // em-dash
		var abs = Math.abs(v);
		if (abs >= 1e9) return (v / 1e9).toFixed(1) + 'B';
		if (abs >= 1e6) return (v / 1e6).toFixed(1) + 'M';
		if (abs >= 1e3) return (v / 1e3).toFixed(1) + 'k';
		// Whole numbers below 1000: locale comma format
		return Math.round(v).toLocaleString('en-GB');
	}

	function getPrimaryRaw(scenario, parameter) {
		if (!window.dfes || !dfes.scenarios) return null;
		var sd = dfes.scenarios[scenario];
		if (!sd || !sd.data || !sd.data[parameter]) return null;
		var d = sd.data[parameter];
		// Standard path used across the codebase: data[param].primary.raw
		if (d.primary && d.primary.raw) return d.primary.raw;
		// Defensive fallbacks if the structure differs
		if (d.LAD && d.LAD.raw) return d.LAD.raw;
		if (d.raw) return d.raw;
		return null;
	}

	function regionTotal(scenario, parameter, year) {
		var raw = getPrimaryRaw(scenario, parameter);
		if (!raw || !raw.header || !raw.rows) return null;
		var col = raw.header.indexOf(year);
		if (col < 0) return null;
		var sum = 0;
		for (var i = 0; i < raw.rows.length; i++) {
			var v = raw.rows[i][col];
			if (typeof v === 'number' && isFinite(v)) sum += v;
			else {
				var n = parseFloat(v);
				if (isFinite(n)) sum += n;
			}
		}
		return sum;
	}

	function scenarioTagline(scenario) {
		// Pulled from the placeholder copy in 2026-DFES/index.html About
		// section. Step 9 (copy pass) will replace these from the real
		// scenario JSON when descriptions land.
		var lines = {
			'NPg Reference Scenario': 'Net zero compliant. Aggressive low-carbon rollout.',
			'Holistic Transition':    'Net zero through electrification + hydrogen blend.',
			'Hydrogen Evolution':     'Net zero with hydrogen leading heat & industry.',
			'Electric Engagement':    'Net zero through high consumer-driven electrification.',
			'Counterfactual':         'Heavy gas reliance. Misses 2050 net zero.'
		};
		return lines[scenario] || '';
	}

	var lastKey = '';
	function update() {
		if (!window.dfes || !dfes.options || !dfes.scenarios || !dfes.parameters) return;
		var o = dfes.options;
		var key = o.scenario + '|' + o.parameter + '|' + o.key;
		if (key === lastKey) return;

		var scenario = dfes.scenarios[o.scenario];
		var param = dfes.parameters[o.parameter];
		if (!scenario || !param) return;

		// Only mark cache once we've confirmed the data is present —
		// otherwise we'd skip the next poll and never render.
		var total = regionTotal(o.scenario, o.parameter, o.key);
		if (total == null) return; // data not yet loaded
		lastKey = key;

		var base = regionTotal(o.scenario, o.parameter, '2024/25');
		var delta = (base && total != null && base !== 0)
			? Math.round(((total - base) / base) * 100)
			: 0;
		var hasUnits = !!(param.units && param.units !== '');
		var nz = NET_ZERO[o.scenario];
		if (nz === undefined) nz = !/counterfactual/i.test(o.scenario);

		var root = document.querySelector('.stats-strip');
		if (!root) return;

		var $scenarioVal = root.querySelector('.stat-scenario .value');
		var $scenarioDesc = root.querySelector('.stat-scenario .desc');
		var $yearVal = root.querySelector('.stat-year .value');
		var $totalLabel = root.querySelector('.stat-total .label');
		var $totalNumber = root.querySelector('.stat-total .number');
		var $totalUnit = root.querySelector('.stat-total .unit');
		var $totalDesc = root.querySelector('.stat-total .desc');
		var $nzVal = root.querySelector('.stat-netzero .value');
		var $nzDesc = root.querySelector('.stat-netzero .desc');

		if ($scenarioVal) {
			$scenarioVal.textContent = o.scenario;
			$scenarioVal.style.color = scenario.color || 'var(--white)';
		}
		if ($scenarioDesc) $scenarioDesc.textContent = scenarioTagline(o.scenario);

		if ($yearVal) $yearVal.textContent = o.key;

		if ($totalLabel) $totalLabel.textContent = 'Region total — ' + (param.title || o.parameter);
		if ($totalNumber) $totalNumber.textContent = fmt(total);
		if ($totalUnit) $totalUnit.textContent = hasUnits ? ' ' + param.units : '';
		if ($totalDesc) {
			if (base == null) {
				$totalDesc.textContent = 'Across all primary substations in the licence area.';
			} else {
				$totalDesc.textContent = (delta >= 0 ? '+' : '') + delta + '% vs. 2024/25 baseline.';
			}
		}

		if ($nzVal) $nzVal.textContent = nz ? 'Yes' : 'No';
		if ($nzDesc) $nzDesc.textContent = nz
			? 'Aligns with our 2050 net-zero target.'
			: 'This pathway misses the target.';
	}

	function start() {
		// Poll dfes state. Each tick is cheap (4 DOM updates + one sum).
		setInterval(update, 400);
		update();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', start);
	} else {
		start();
	}
})();
