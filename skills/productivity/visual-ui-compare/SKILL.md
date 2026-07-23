---
name: visual-ui-compare
description: Generate a single self-contained HTML page for making a visual decision by eye, open it in the browser, and let the user pick: a grid of variants side-by-side (color, size, spacing, shadow, radius, border, badge or card styles), or a live preview with sliders when the choice is motion or a continuous range (animation, easing, duration, transitions). Use whenever the user wants to compare or tune a visual choice ("비교해서 보여줘", "어떤 게 나아?", "A/B 보고 싶어", "html로 만들어 봐", "직접 보고 결정할게", "easing 비교", "이 애니메이션 느낌 좀 보자", "transition 속도 조절", "compare visually", "show me side by side", "which one looks better?", "tune this animation", "slider for this") or any time you're about to use AskUserQuestion with 2+ options for a visual property.
---

# Visual UI Compare

Build a single self-contained HTML page that makes a visual decision concrete (discrete variants side-by-side, or a live preview the user can tune), open it in the browser, let the user decide by eye, then patch the result into the codebase.

The reason this skill exists: text linearizes information. Rendering the choice lets the user react to it rather than imagine it. A 30-second look ends what would otherwise be five rounds of "actually maybe smaller." And some variables (motion, a continuous range) can't be frozen into a static cell at all; for those you hand over the knobs and let the user feel the range.

## When to use

- The user uses any of the phrases in the description above.
- **Proactively**: when you're otherwise about to call AskUserQuestion with 2+ options for a visual property, including discrete style choices ("which badge style", "which card layout"), not just single-axis value sweeps. Build the comparison page first; the text question is a fallback, not the default.

## When to skip

- The user already picked; just implement.
- The choice is non-visual (logic, copy, naming, tech stack); AskUserQuestion is fine.
- Real cross-browser / device rendering differences: the page previews one engine on your machine. For actual Safari-vs-Chrome or real-device behavior, test there. (Motion and continuous ranges are **not** a skip: that's what the tuner is for; see below.)

## Steps

### 1. Identify the variable under test

The user named it ("rank size 3개", "shadow 2가지") or you can infer it from the active task. Ask only if genuinely ambiguous: *"어떤 variant 비교할까? 값들 넘겨주거나 설명해줘."*, and only once.

Then read the **shape** of the decision. A discrete pick, a handful of specific options (these 3 shadows, these 2 badge styles), is a **grid**: continue with the steps below. A continuous or motion choice (finding the right duration / easing / size by adjusting until it feels right) isn't a grid of frozen snapshots; it's a **tuner** (one live preview + controls + an export): jump to *Tuning continuous & motion variables* (it reuses the token, open, and cleanup steps but builds one tuned preview instead of a grid).

When the shape is obvious, just build it; don't ask. When it's a judgment call (or when the user asked for a plain side-by-side but a tuner would clearly serve the decision better), **put it on the menu in one line** and let them choose: *"옆으로 깔아서 비교할 수도 있고, 슬라이더 달아서 직접 만져보게 할 수도 있어, 뭐가 나아?"* The tuner is a capability they may not think to ask for, so surface it rather than silently committing to a format they didn't expect.

If the user wants to compare two variables at once (e.g. "size × shadow as a matrix"), push back once with a sentence like *"두 변수 같이 비교하면 어느 쪽 효과인지 안 보여. padding 먼저 정하고 opacity 갈게, 괜찮지?"* If they insist, build the matrix but warn that the signal is weaker and offer to re-run single-axis after.

### 2. Collect tokens from the current project

Search in this order, stopping at the first source that has the tokens you need:

- `app/globals.css`, `src/app/globals.css`, `styles/globals.css`, `styles/tokens.css`, any `tokens.css`
- Tailwind v4 `@theme { ... }` blocks (in any CSS file)
- `tailwind.config.{js,ts}` (v3 `theme.extend`)
- If none exist: fall back to Tailwind 4 defaults.

Parse what's relevant to the variable under test (colors, font sizes, radii, shadows, easing/duration). Inline as `:root { --token: value; }` in the comparison page so it renders with the project's actual visual system, not Tailwind defaults.

**Route the accent through `--accent`.** Both templates read every highlight (the slider, the copied state, the sample element) from one `--accent` token (with `--accent-ink` for text/icons on top of it). Point it at the project's accent so they track together: `--accent: var(--brand-primary)` (or whatever the project names it), and give `--accent-ink` a readable on-accent color. Left unmapped it falls back to the aurora teal, which is your cue you forgot to set it.

If the project defines both dark and light token sets (`:root` + `[data-theme="light"]`, or `@media (prefers-color-scheme)`), copy both: the theme toggle in step 4 needs them.

If the project ships **only one theme**, derive the other in-place: keep brand/accent colors (`--accent`, `--color-sunrise`, etc.) unchanged, and invert lightness on the bg/fg ramp only (e.g. warm-white `#fafaf8` ↔ deep `#050608`). Don't agonize: this is just so the toggle works; the user assesses on the project's actual theme.

### 3. Build a single self-contained HTML file

**Start from `templates/page.html`.** Copy the mechanics verbatim: theme-swap `data-theme` attribute + `localStorage`, viewport-toggle wrapper, Pick-this clipboard JS (with `execCommand` fallback). Those are solved problems and re-deriving them just adds bug risk.

The visual chrome (toolbar styling, grid gap, viewport sizes 375/768, color choices for active state) is an opinionated default; tweak freely if the project's design system calls for something else. And if the comparison needs controls the template doesn't have (e.g. a play/pause + duration slider for easing curves, a context-image picker for palette swaps, a font-weight stepper for type), **add them**. Template is a starting point, not the final form.

If you find yourself making the same deviation twice across invocations, update the template: that's how it stays useful instead of going stale.

Save to `/tmp/<project-slug>-visual-ui-compare.html`.

Slug = `basename $PWD` lower-cased, non-alphanumeric → `-`, collapsed; fall back to `compare` if empty.

Fill these three regions:

1. `<!-- TOKENS -->`: paste the token block from step 2 (both themes).
2. `<h1>` and `<p>` in `<header class="page">`: name the comparison + the variable under test.
3. `<!-- CELLS -->`: one `<div class="variant">` per cell, following the stub at the bottom of the template. Set `--cells: N` on `.grid` if you have ≠3 cells.

Rules for the cells:

- **Same content + same background across all cells.** Only the variable under test differs. This is the rule that makes comparison work; see "Design discipline" below.
- Use realistic content (real or fixture names, button labels, etc.). No lorem ipsum: fake content distracts from the visual judgment.
- 2–4 cells per row reads best.

Each cell (per the template's stub):

- Label the variant by **token name** + value: `B: --shadow-sheet`. Append `(current)` to whichever is shipping. If the variant has no matching token (user supplied raw `15px`), label it `B: 15px (no token)`; don't invent a token name. After the user picks, ask whether to add a real token or use the raw value inline.
- The Pick-this button's `data-pick` attribute is what gets copied; match it to the label. On click the page appends the live `theme=… vp=…`, so the paste-back tells you exactly which context the user judged in (a pick can be right in dark/Full and wrong in light/375).
- *Optional* `.variant-tradeoff` line, only when the variants have non-obvious implications: `bigger touch target, eats 8px vertical`. Skip it for purely-aesthetic choices; the visual *is* the argument.

If the user supplies 6+ variants, ask which ones to drop before building: too many cells means each one shrinks and the comparison loses signal.

For a greenfield component with no shipping baseline, skip the `(current)` marker entirely. Don't fabricate a "current."

### 4. Toolbar (top-right, fixed)

Two controls. Both persist in `localStorage` so reloading keeps the user's choice.

- **Theme toggle**: `☀ Light` / `🌙 Dark`. Default to the project's primary theme. Toggle sets `data-theme` on `<html>`; CSS swaps `:root` token blocks via `[data-theme="dark"]` and `[data-theme="light"]`. Key: `visual-ui-compare-theme`.
- **Viewport toggle**: `375` / `768` / `Full`. Wraps the grid container in a fixed `max-width` (centered, with a thin border showing the viewport edge). Key: `visual-ui-compare-viewport`. Default `Full`.

Both matter: a decision can look right in dark/desktop and wrong in light/mobile. The user shouldn't rebuild to check.

### 5. Open in the browser

- macOS: `open <path>`
- Linux: `xdg-open <path>`
- WSL: try `wslview <path>`, else `cmd.exe /c start <path>`
- Plain Windows: `start <path>`
- Detect via `uname` and `$WSL_DISTRO_NAME`.

If the open command fails (headless server, SSH session, missing `xdg-open`), print the absolute file path and ask the user to open it manually, e.g. *"브라우저 자동 오픈이 안 돼. 이거 직접 열어줘: /tmp/foo-visual-ui-compare.html"*.

### 6. Wait for the user's decision in chat

Say something like *"비교 페이지 떴어. Pick this 누르면 클립보드에 복사되니까 그거 붙여줘. 아니면 그냥 말로 알려줘도 돼."* and stop; the user drives from here. What you'll get back is `pick: <label> @ theme=… vp=…`, the chosen variant plus the context they judged it in.

### 7. After the user picks: patch source + clean up

- Apply the chosen variant to the actual project files (edit tokens, component CSS, whatever the cell represented).
- Delete the comparison HTML. Keep it only if the user explicitly asks (`그대로 둬`, `--keep`).

## Tuning continuous & motion variables

A continuous or motion choice can't be frozen into a grid of cells: there's no discrete set to lay out, just a range to feel. So build a **tuner** instead: one live preview, a panel of controls wired to CSS variables, and a copy-back of the chosen values. (This is just the general HTML pattern pointed at a UI decision: interactive controls when text can't express the choice, always ending in an export. Reach for it when the variable calls for it; it isn't a separate product.)

**Start from `templates/interactive.html`.** Copy the mechanics verbatim: control→CSS-variable wiring, `localStorage` persistence, play/replay (re-triggers the animation with a reflow), and the "Copy these values" JS. Those are solved; what you decide is the chrome and *which* controls to expose.

Collect tokens the same way as the grid (*Collect tokens from the current project*); the preview should use the project's real colors/easings, and copy **both** themes since the theme toggle ships here too. Save to `/tmp/<project-slug>-visual-ui-compare-interactive.html` and open it with the same commands (*Open in the browser*).

The template ships a working **example** (a pop animation tuned by duration / easing / scale) so the wiring is visible; replace it with the real element, and keep only the controls the decision actually needs (asked for duration + easing? delete the scale control too). Fill the regions:

1. **Preview**: the element under test (button, card, sheet), inside `#preview`, driven by the CSS variables the controls set. Real content, project tokens. Declare each tunable variable's default on `#preview`.
2. **Controls**: one per variable. Each carries `data-var="--your-css-var"`, plus `data-unit="ms"`/`"px"` on numeric sliders (omit on selects: a unit appended to a `cubic-bezier(...)` string corrupts it), and a sibling `<span data-readout="--your-css-var">` for the live value. The JS keys entirely off these three attributes. Use a range slider for numerics (duration, size, radius, blur, opacity) and a select for discrete presets (easing functions).
3. **Trigger**: Play / Replay re-runs the motion by toggling `.run` on `#preview` and letting a `@keyframes` animation restart. So author the motion as a `.run`-gated keyframe animation that *consumes* your variables, not a bare `transition`, or Play won't replay.

**Three things move together for each variable**: the control (`data-var`), the variable's default on `#preview`, and the keyframe/style that consumes it. Add or drop all three together: a control with no consumer does nothing, and a consumer with no control silently falls back to its default.

Tuner discipline:

- **Mark the starting point.** Pre-set controls to the current shipping values and label that baseline. Without an anchor, "is this better?" has nothing to be better *than*.
- **One concept at a time, still.** A duration slider + an easing select describe one motion, fine. A dozen unrelated knobs is a control panel, not a decision. Expose only the variables the choice actually turns on.
- **The live value is the label.** Show each control's current value, and make "Copy these values" emit the full set as `--var: value;` pairs (with the theme/viewport it was tuned in) so you can read the result off and patch tokens/CSS.

When the user is done, they hit **Copy these values** and paste back, or just say what felt right. Then patch the tokens/CSS and delete the page, the same as the grid (*After the user picks*).

## Design discipline

These rules came out of a real session. Bake them in; don't rediscover them. (These are for grid comparisons; the tuner section above has its own short list.)

- **One variable per cell.** Same content, same artwork, same padding, same bg. The only thing that changes is the variable under test. If the user mixes variables, run two sequential pages.
- **Label by token name, not raw value.** `B: --shadow-sheet` beats `B: 0 -8px 32px rgba(0,0,0,0.5) inset`. Decisions are made on intent, not pixel math.
- **Mark the current baseline.** Append `(current)` to whichever cell is already shipping. Users forget which one is the old one.
- **Background context changes perception.** Shadows look invisible on flat backgrounds and fine when there's a subtle gradient above the edge. If the deployed environment has a gradient/glow/image behind the element (planned or shipped), simulate it in the cell background.
- **Show the obvious-wrong default when instructive.** Tailwind's `shadow-2xl` casts downward, wrong for bottom-anchored sheets that need an upward shadow. Including a "wrong direction" cell can clarify *why* the right one is right.

## Visual craft

The page renders the project's own UI, so the craft rule is to let that show through and keep everything else quiet.

- **Extend the token pull to the neutral, not just the accent.** The page already inlines the project's tokens; carry its background ramp too, so the cells sit on the project's real surface instead of a generic gray.
- **Keep the cell chrome quiet.** The only thing that should draw the eye is the variable under test. A loud frame, label, or accent competes with the judgment you're asking for.
- **Route the highlight through `--accent`, leave the sample alone.** Active-pick state is separate from the sample's own colors; the single `--accent` seam already carries it, so don't tint the sample to signal selection.
- **Assess on the project's real theme.** The page now first-loads the viewer's OS theme, but the decision should be judged in the project's primary theme; the toggle is there to check the other.
- **The shell is a neutral host, not an identity.** Don't restyle the toolbar and grid into their own strong look; a page with an opinion colors the comparison running through it.

## Out of scope

- **Real cross-browser / device rendering.** The page previews one engine on your machine; for actual Safari-vs-Chrome or real-device behavior, test there.
- **Multi-variable grids.** Don't lay out a grid of combinations: it hides which axis caused the effect; run two sequential single-variable pages instead. (The tuner *can* expose two genuinely independent variables at once when the user wants to feel them together; warn the signal is weaker and offer a single-axis pass afterward. Duration + easing aren't independent: they're one motion, so that's not a matrix; expose both freely.)
