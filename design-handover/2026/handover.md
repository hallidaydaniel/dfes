# DFES 2026 — Handoff to Claude Code

**Goal:** apply the new visual + IA design from `DFES 2026 Redesign.html` to the production `2026-DFES/` page in the dfes-repo, keeping all existing data pipelines and Leaflet map code intact.

This is a **styling + layout + copy** swap, not a data swap. Anything that looks like new analytics is either (a) a re-presentation of data already in `data/scenarios/*.json`, or (b) placeholder copy that needs verification — see "Data audit" below.

---

## 1. Source of truth (all in this project)

| File | What it is |
|---|---|
| `DFES 2026 Redesign.html` | Page shell — load order matters |
| `tokens.css` | NPG design tokens (colours, type, spacing, themes a–e). **Do not edit.** |
| `app.css` | All component CSS for the redesign |
| `app-hero.jsx` | Header, animated hero network, stats strip |
| `app-workspace.jsx` | Controls panel, map stage, sparkline popup, scrubber, colour scale |
| `app-about.jsx` | Scenario cards, compare table, callout band, footer |
| `app.jsx` | App shell + Tweaks panel |
| `data.js` | **Mock data** — replace entirely, see §3 |

Open `DFES 2026 Redesign.html` to see the target. Use the Tweaks panel to flip Bold/impact ↔ Calm/editorial; ship Bold.

---

## 2. Do-not-change list

- **Tokens** in `tokens.css` come from the NPG brand system. Don't add colours; consume `--red-100`, `--black-100`, `--pink-30` etc.
- **Fonts:** Bebas Neue (display) + DM Sans (body) only.
- **Buttons:** all pill (`border-radius: 999px`). No square corners on CTAs.
- **Theme map:**
  - Utility bar + header → theme-a (white)
  - Hero → theme-c (red `#ce0037`)
  - Stats strip → theme-b (black)
  - Workspace → theme-a (white)
  - Scenario cards (About) → theme-d (off-white)
  - Compare table → theme-a
  - Callout band → theme-e (pink-tinted)
  - Footer → theme-b
- **Hero network animation** is decorative SVG — do not try to make it geographically accurate.
- **Colour scale** in `scaleColour()` (app-workspace.jsx) — keep the exact stops; replaces the old map's colour ramp.

---

## 3. Data audit — invented vs. real

### Real data, just re-presented (no new computation)

| Component | Reads from |
|---|---|
| Scenario picker cards | `data/scenarios/*.json` + `data/colours.json` |
| Parameter `<select>` | `data/parameters.json` |
| View toggle (Primary / LA / GSP) | The 3 GeoJSON layers under `data/maps/` |
| Year scrubber 2024–2050 | Existing year keys in scenario JSON |
| Per-substation hover values | Existing scenario JSON |
| Map legend min/mid/max | Already computed in current `index.html` JS — port logic |
| **Sparkline trajectory** in popup | Same scenario JSON — every year is already there |

### Computed-from-existing-data (trivial sums)

| Component | Compute |
|---|---|
| Stats strip "Region total" | Sum of per-substation values for current scenario/param/year |
| Stats strip "% vs 2024 baseline" | `(total[year] - total[2024]) / total[2024]` |

### Placeholder copy — verify or remove before launch

| Where | What I wrote | Action |
|---|---|---|
| Hero chips | "3.9M homes & businesses", "63,000 substations", "Updated January 2026" | Replace with verified NPG corporate figures, or remove chips |
| Each ScenarioCard's 3 stats (e.g. "1.4M heat pumps by 2030", "+62% peak", "8,400 substations upgraded") | Made up | Compute from `data/scenarios/<id>.json`: pick the 3 most meaningful summary metrics and read real values |
| CompareTable rows (Heat strategy, ICE ban year, H₂ TWh, peak %, flexibility) | Plausible but invented | Cross-check against the existing About-section assumptions in current `index.html`; replace or delete row-by-row |
| CalloutBand numbers ("96k km of cable", "63k substations") | Plausible NPG facts but unverified | Replace with verified figures, or remove the band |
| Footer email `System.Forecasting@Northernpowergrid.com` | Plausible | Verify |
| Headline "Powering the North to net zero" + subtitle | NPG voice, my copy | Approve or amend |

**Rule of thumb:** if a number doesn't come from `data/scenarios/*.json`, it needs sign-off.

### New UI surfaces (no new data — keep or drop, your call)

1. **Hover-to-reveal sparkline** in map popup — keep, data already exists
2. **Animated hero network SVG** — decorative; can be made static via tweak
3. **Stats strip** above the map — derived from existing data
4. **Numbered control groups (1–5)** — affordance only
5. **"Compare scenarios" / "Take the tour" buttons** in workspace head — currently stubs, design as future work
6. **Postcode search** in map overlay — currently stub; either wire to existing place-search or remove

---

## 4. Leaflet integration brief

The redesign mocks the map with SVG. In production, **keep the existing Leaflet code** for tiles, projection, and GeoJSON layers. Replace only the presentation layer:

1. **Marker render:** use `scaleColour(t)` from `app-workspace.jsx` (a 6-stop red ramp) instead of the old map's colour function. `t = (value - lo) / (hi - lo)` per current year.
2. **Marker radius:** `4 + t * 9` (px), same as prototype.
3. **Popup HTML:** match `<SubPopup>` in `app-workspace.jsx` — eyebrow, title, big value + unit, % delta vs 2024, inline SVG sparkline, axis labels. Use the same CSS class names so `app.css` styles apply unchanged.
4. **Year/scenario/param state:** read from the new React control panel rather than the old `<select>` chain. Re-render markers + popup on any change.
5. **Legend:** the existing `index.html` already computes min/max per year — port that logic into the new `<MapStage>` legend bar.

---

## 5. Acceptance criteria (visual)

Cross-check at 1440×900 desktop and 390×844 mobile:

- Hero band background is exactly `#ce0037`
- Scrubber thumb: white, 18×18, 3px solid `#ce0037` border
- Each scenario card has a 6px coloured top bar in that scenario's colour from `colours.json`
- Stats strip values: Bebas Neue, 44px, line-height 1
- Footer headline ("Don't be a stranger.") in Bebas Neue, 32px, uppercase, white
- All CTAs fully pill (border-radius 999px)
- Net-zero pill: teal-20 bg + teal-100 text for "yes"; black-10 bg + black-90 text for "no"
- Utility bar: 36px tall, black, white links, red pill power-cut CTA on the right
- Header: 76px tall, sticky, white, NPG logo 38px tall on the left

---

## 6. Recommended PR sequence

1. **Tokens + fonts** — drop `tokens.css` into `2026-DFES/resources/` and import. Verify Bebas Neue + DM Sans load.
2. **Header + utility bar + footer** — new chrome around the existing page body.
3. **Hero band** — new section above the existing controls.
4. **Stats strip** — wire to existing data, place between hero and workspace.
5. **Controls panel** — replace the existing controls UI; keep state contract identical so existing map code keeps working.
6. **Map presentation swap** — colour scale + popup HTML, no logic change.
7. **About → Scenario cards + compare table** — replace existing prose About with the card grid, lifting the stats from scenario JSON.
8. **Callout band** — only if the placeholder numbers can be verified; otherwise omit.
9. **Copy pass** — final verification of every number against either repo data or NPG corporate sources.

Each step is independently shippable.

---

## Notes from Claude Code

- The reference files in this folder are the **React prototype** from Claude Design. The production 2026-DFES is plain HTML+JS+JSON (no build step). All steps below re-implement the prototype's UI in vanilla JS, sharing only the CSS and design tokens directly. The `*.jsx` files are read-only reference — do not deploy them.
- This work sits on top of the cleanup + library-bumps + CSP-hardening branch (`2026-cleanup-and-hardening`). Ordering: that goes upstream first, then this redesign rebases onto it.
- GitHub Pages can't enforce custom HTTP headers, so the CSP for Google Fonts has to be added via the `<meta>` CSP — that's done as part of step 1.
