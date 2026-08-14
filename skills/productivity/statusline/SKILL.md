---
name: statusline
description: Install, update, or customize the zoned-gauge Claude Code statusline, one line showing the model name and context tokens plus 5-hour, weekly, and per-model usage limits as instrument-style bars with reset countdowns. Use when the user wants usage limits or token info in the Claude Code statusline, asks to tweak its bars, colors, zones, or divider, or wants per-model weekly usage that the /usage panel shows but statusline stdin does not provide. Triggers: "statusline 설정", "상태줄에 사용량", "게이지 바꿔줘", "Fable 사용량 보여줘", "set up my statusline", "usage bars in statusline", "show weekly limit in status bar", "/statusline".
---

# Statusline

Ships a single-line Claude Code statusline: a dim model name, a context-token readout, and three instrument-style gauges:

```
Fable 5  ·  186.0k (19.0%)  ·  5h ▱▱▱▱▱▱▱▱ 5% ↻1h  ·  wk ▰▰▱▱▱▱▱▱ 23% ↻3d  ·  fb ▰▰▰▰▱▱▱▱ 45%
```

- **Model name**: the active model from stdin `.model.display_name`, dim, leading the line.
- **Context count**: actual tokens in context (input + cache fields), colored by the same zone system as the bars.
- **5h / wk gauges**: session (5-hour) and weekly all-models rate limits, read from statusline stdin JSON.
- **fb gauge**: per-model weekly limit, Fable by default; see Customizing to match another model. Not available in stdin; fetched from the OAuth usage endpoint (see Data sources).
- **↻ countdown**: dim time-until-reset after a gauge, coarsest unit, rounded (`↻2h`, `↻3d`). The weekly gauges share one reset instant, so only wk shows it; fb carries no countdown of its own.

## Gauge design

8 cells of `▰`/`▱`, zoned 4/2/2 like an aviation arc:

| Zone | Cells | Range | Fill color | Unfilled marker |
|---|---|---|---|---|
| ocean | 1–4 | ≤50% | 33 `#0087ff` | 237 (plain track) |
| amber | 5–6 | 50–75% | 214 `#ffaf00` | 136 (dim amber) |
| ember | 7–8 | >75% | 202 `#ff5f00` | 130 (dim ember) |

Unfilled amber/ember cells stay visible as dim markers so the three-part division reads at any fill level (fuel-gauge red-zone idea). The percent text is thresholded on the value itself (amber above 50, ember above 75) like the context count, so at 51% the number reads amber before an amber cell lights. Segments divide with a dim `·` in two-space gaps.

`references/red-zone-palette.html` and `references/zone-proportions.html` are the visual-ui-compare pages these decisions came from; `references/design-decisions.md` records the rationale.

## Install

1. Copy `templates/statusline-command.sh` to `~/.claude/statusline-command.sh`.
2. In `~/.claude/settings.json`:
   ```json
   "statusLine": { "type": "command", "command": "sh ~/.claude/statusline-command.sh", "refreshInterval": 30 }
   ```
   `refreshInterval` re-renders every 30 seconds during idle, so countdowns tick and cache updates surface without waiting for a prompt.
3. Requires `jq` and `curl`. The fb gauge needs a Claude subscription (OAuth token in the macOS Keychain item `Claude Code-credentials`, or `~/.claude/.credentials.json`); without it the gauge simply doesn't render.

## Data sources

- **stdin JSON** (piped by Claude Code on every refresh): `context_window.current_usage.*` for the token count; `rate_limits.five_hour` / `rate_limits.seven_day` (`used_percentage`, `resets_at` epoch) as the 5h/wk fallback when the cache is absent. No per-model field exists here.
- **OAuth usage endpoint** (undocumented, same one the /usage panel calls): `GET https://api.anthropic.com/api/oauth/usage` with `Authorization: Bearer <accessToken>` and `anthropic-beta: oauth-2025-04-20`. All three gauges prefer this cached response (at most 300s old, the same data the /usage panel shows): 5h/wk from `limits[]` kinds `session` and `weekly_all`, per-model from `kind: "weekly_scoped"` with `scope.model.display_name` naming the model, not a top-level key. The endpoint rate-limits aggressively (30–60s polling earns persistent 429s), so the script caches the response at `~/.claude/usage-scoped.json` with a 300s TTL and refreshes in a background subshell; the statusline never waits on the network.

All displayed percentages are the server's own integers, so the numbers match the /usage panel exactly; any 1%p disagreement is snapshot timing (stdin updates on the last API response, the panel queries live), not rounding.

## Customizing

Everything lives in the `bar()` awk function of the script:

- **Zone split**: the two ternaries mapping cell index → zone/marker color (`i <= 4`, `i <= 6`). See `references/zone-proportions.html` for how 3/3/2, 3/3/3, 4/2/2, and 6/1/1 read.
- **Colors**: the three 256-color codes per ternary. Keep fill and marker in the same hue family per zone.
- **Bar width**: `w = 8`. A 9-cell bar allows true thirds.
- **Divider**: the `sep` variable, a dim interpunct `·` with two spaces of breathing room on each side. Avoid chevrons: they read as breadcrumb hierarchy, and the segments are peers. The rejected alternatives are in `references/design-decisions.md`.
- **Model matched by fb**: the `test("Fable")` filter in the jq expression near the end.

When the user wants to *see* options rather than hear them, build a comparison page with the visual-ui-compare skill the way the two reference HTMLs were made: dark terminal mock, exact xterm-256 hex values, one variable per round.
