# Design decisions

Decision record for the zoned-gauge statusline. SKILL.md describes the result; this file records what was rejected and why.

## Bar glyph: `▰▱` ticks

Chosen over macOS-slider (`━●─`), solid block (`█░`), and GitHub segments (`▮▯`). Discrete ticks read as an instrument gauge; the slider implies a draggable control, solid blocks smear the zone boundaries, and `▮▯` renders inconsistently across terminal fonts.

## Base color: ocean blue 33 `#0087ff`

Picked from DeepSkyBlue 39, Turquoise 45, DodgerBlue 33, SkyBlue3 74 (see `red-zone-palette.html`).

## Warning model: staged 3-color

Staged fill colors (ocean 33 → amber 214 → ember 202) beat every 2-color zone variant. Unfilled cells keep dim markers so the three-part division is visible at any fill level: the fuel-gauge red-zone idea.

## Unfilled ocean cells: dim ocean 25 `#005faf`

Ocean's unfilled track was neutral 237 while amber and ember already carried a tint, so the empty left half read as absent rather than as a zone. Dim ocean 25 is the exact analogue of the warning markers: 214 → 136 and 202 → 130 each darken one xterm step per channel, and the same step on 33 `#0087ff` lands on 25. Rejected (see `empty-blue.html`): 24 `#005f87` too dark and green; 18 and 17 read as near-black; 61 and 67 sit close enough to the fill color to be mistaken for filled cells.

## Proportions: 4/2/2 on 8 cells

Amber from 50%, ember from 75% (see `zone-proportions.html`). Rejected:

- **3/3/2** and 9-cell **3/3/3**: amber starts too early; mid-week usage reads as a warning.
- **6/1/1**: car-gauge style, warnings compressed into the last quarter.

Aviation arcs (wide caution band) were the closest real-world analogue; car tach/fuel gauges use much thinner warning slivers.

## Divider: dim `·`, two-space gaps

Interpunct `·` was the starting point. Chevron `❯` rejected: breadcrumb/hierarchy semantics, but the segments are peers. Dotted `┊` rejected after live use: renders ragged in real terminal fonts. `│` rejected after live use too: too visually heavy. `·` restored; its gap was tightened to one space, then restored to two after the single-space version read cramped next to the `↻` countdown.

## Reset countdown: `↻` + coarsest unit, rounded

Dim `↻2h` / `↻3d` from `resets_at`, always on. Plain floor understated remaining time by up to a whole unit (59m30s showed 59m, 23h40m showed 23h); replaced with rounding within the floor-chosen unit, carrying up at the boundary (59m30s shows 1h, 23h40m shows 1d, 3h53m shows 4h).

## Weekly reset dedup: wk carries the `↻`, fb doesn't

wk and fb reset at the same weekly instant, so a second countdown on fb was pure duplication. Options considered: both, wk-only, fb-only, one trailing shared element; wk-only chosen. Intra-segment spacing stays uniform 1-space: attaching `↻` to the percent and widening bar-to-percent to 2 spaces were both rejected.

## Context count: zone-colored

Colored by `used_percentage` through the same 4/2/2 thresholds, replacing an earlier fixed amber.

## Model-name segment

A dim model name leads the line, from stdin `.model.display_name` (e.g. "Fable 5"). Dim keeps it as context rather than data; the gauges carry the numbers.

## Gauge percent color: thresholded on p

The percent text is colored by the value itself (>50 amber, >75 ember), matching the context count. The earlier cell-count rule (echo the hottest lit cell) made 51-56% read ocean while the context count already showed amber.

## Portability pass

Review-round hardening: jq-required guard; `LC_ALL=C`; `stat -f`/`stat -c` fallback so Linux works; octal escapes replacing hex (dash-safe); User-Agent version derived from stdin `.version` instead of a stale pin; per-process cache tmp plus an in-flight guard against concurrent refreshes; bc dependency dropped in favor of awk.

## Per-model (Fable) weekly: OAuth endpoint

Absent from statusline stdin. Comes from the undocumented `GET https://api.anthropic.com/api/oauth/usage` (Bearer OAuth token from macOS Keychain `Claude Code-credentials`, header `anthropic-beta: oauth-2025-04-20`). The model bucket arrives in `limits[]` as `kind: "weekly_scoped"` with `scope.model.display_name`, not a top-level key. The endpoint 429s aggressively at 30–60s polling, hence the 300s file cache (`~/.claude/usage-scoped.json`) with background refresh.

## Freshness

Event-driven rendering plus the stdin snapshot lagged the dashboard. Fixed twice over: `"refreshInterval": 30` re-renders during idle (local only, roughly 0.3% of one core per session), and the 5h/wk gauges read cache-first from the endpoint response, falling back to stdin. The network stays TTL-gated at one request per 300s, shared across sessions via the in-flight guard.

## Percent parity

Server sends integers; display matches the /usage panel exactly. Residual 1%p differences are snapshot timing, not rounding.
