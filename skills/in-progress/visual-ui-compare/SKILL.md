---
name: visual-ui-compare
description: Generate a single self-contained HTML page that puts UI/UX variants side-by-side with identical content and background, open it in the browser, and let the user pick by eye. Use whenever the user wants to compare visual variants — "비교해서 보여줘", "어떤 게 나아?", "A/B 보고 싶어", "html로 만들어 봐", "직접 보고 결정할게", "UI 결정 피로도", "compare visually", "show me side by side", "which one looks better?", "A/B these" — or any time you're about to use AskUserQuestion with 2+ options for a visual property. This covers both single-axis sweeps (color, size, spacing, shadow, radius, opacity, border) AND discrete style/treatment variants (badge styles, button treatments, card layouts) — both count as one decision. When in doubt, build the page; word-based judgment of visual variants is unreliable.
---

# Visual UI Compare

Build a single self-contained HTML page that places UI/UX variants side-by-side with identical content + background, open it in the browser, let the user decide visually, then patch the chosen variant into the codebase.

The reason this skill exists: text linearizes information. A side-by-side renders the shape of the decision, so the user can react to variants rather than imagine them. A 30-second look ends what would otherwise be five rounds of "actually maybe smaller."

## When to use

- The user uses any of the phrases in the description above.
- **Proactively**: when you're otherwise about to call AskUserQuestion with 2+ options for a visual property — including discrete style choices ("which badge style", "which card layout"), not just single-axis value sweeps. Build the comparison page first; the text question is a fallback, not the default.

## When to skip

- The user already picked — just implement.
- The choice is non-visual (logic, copy, naming, tech stack) — AskUserQuestion is fine.
- Motion / easing curves. Static side-by-side doesn't capture motion. Build a focused interactive prototype, or describe in words.

## Steps

### 1. Identify the variable under test

The user named it ("rank size 3개", "shadow 2가지") or you can infer it from the active task. Ask only if genuinely ambiguous: *"어떤 variant 비교할까? 값들 넘겨주거나 설명해줘."* — and only once.

If the user wants to compare two variables at once (e.g. "size × shadow as a matrix"), push back once with a sentence like *"두 변수 같이 비교하면 어느 쪽 효과인지 안 보여. padding 먼저 정하고 opacity 갈게 — 괜찮지?"* If they insist, build the matrix but warn that the signal is weaker and offer to re-run single-axis after.

### 2. Collect tokens from the current project

Search in this order, stopping at the first source that has the tokens you need:

- `app/globals.css`, `src/app/globals.css`, `styles/globals.css`, `styles/tokens.css`, any `tokens.css`
- Tailwind v4 `@theme { ... }` blocks (in any CSS file)
- `tailwind.config.{js,ts}` (v3 `theme.extend`)
- If none exist: fall back to Tailwind 4 defaults.

Parse what's relevant to the variable under test (colors, font sizes, radii, shadows, easing/duration). Inline as `:root { --token: value; }` in the comparison page so it renders with the project's actual visual system, not Tailwind defaults.

If the project defines both dark and light token sets (`:root` + `[data-theme="light"]`, or `@media (prefers-color-scheme)`), copy both — the theme toggle in step 4 needs them.

If the project ships **only one theme**, derive the other in-place: keep brand/accent colors (`--color-sunrise`, `--color-aurora`, etc.) unchanged, and invert lightness on the bg/fg ramp only (e.g. warm-white `#fafaf8` ↔ deep `#050608`). Don't agonize — this is just so the toggle works; the user assesses on the project's actual theme.

### 3. Build a single self-contained HTML file

**Start from `templates/page.html`.** Copy the mechanics — theme-swap `data-theme` attribute + `localStorage`, viewport-toggle wrapper, Pick-this clipboard JS (with `execCommand` fallback) — verbatim. Those are solved problems and re-deriving them just adds bug risk.

The visual chrome (toolbar styling, grid gap, viewport sizes 375/768, color choices for active state) is an opinionated default — tweak freely if the project's design system calls for something else. And if the comparison needs controls the template doesn't have (e.g. a play/pause + duration slider for easing curves, a context-image picker for palette swaps, a font-weight stepper for type), **add them**. Template is a starting point, not the final form.

If you find yourself making the same deviation twice across invocations, update the template — that's how it stays useful instead of going stale.

Save to `/tmp/<project-slug>-visual-ui-compare.html`.

Slug = `basename $PWD` lower-cased, non-alphanumeric → `-`, collapsed; fall back to `compare` if empty.

Fill these three regions:

1. `<!-- TOKENS -->` — paste the token block from step 2 (both themes).
2. `<h1>` and `<p>` in `<header class="page">` — name the comparison + the variable under test.
3. `<!-- CELLS -->` — one `<div class="variant">` per cell, following the stub at the bottom of the template. Set `--cells: N` on `.grid` if you have ≠3 cells.

Rules for the cells:

- **Same content + same background across all cells.** Only the variable under test differs. This is the rule that makes comparison work — see "Design discipline" below.
- Use realistic content (real or fixture names, button labels, etc.). No lorem ipsum — fake content distracts from the visual judgment.
- 2–4 cells per row reads best.

Each cell (per the template's stub):

- Label the variant by **token name** + value: `B — --shadow-sheet`. Append `(current)` to whichever is shipping. If the variant has no matching token (user supplied raw `15px`), label it `B — 15px (no token)` — don't invent a token name. After the user picks, ask whether to add a real token or use the raw value inline.
- The Pick-this button's `data-pick` attribute is what gets copied to clipboard — match it to the label.
- *Optional* `.variant-tradeoff` line, only when the variants have non-obvious implications: `bigger touch target, eats 8px vertical`. Skip it for purely-aesthetic choices; the visual *is* the argument.

If the user supplies 6+ variants, ask which ones to drop before building — too many cells means each one shrinks and the comparison loses signal.

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

If the open command fails (headless server, SSH session, missing `xdg-open`), don't retry blindly. Print the absolute file path and ask the user to open it manually — e.g. *"브라우저 자동 오픈이 안 돼. 이거 직접 열어줘: /tmp/foo-visual-ui-compare.html"*.

### 6. Wait for the user's decision in chat

Don't poll the file. Say something like *"비교 페이지 떴어. Pick this 누르면 클립보드에 복사되니까 그거 붙여줘. 아니면 그냥 말로 알려줘도 돼."* and stop.

### 7. After the user picks: patch source + clean up

- Apply the chosen variant to the actual project files (edit tokens, component CSS, whatever the cell represented).
- Delete the comparison HTML. Keep it only if the user explicitly asks (`그대로 둬`, `--keep`).

## Design discipline

These rules came out of a real session. Bake them in — don't rediscover them.

- **One variable per cell.** Same content, same artwork, same padding, same bg. The only thing that changes is the variable under test. If the user mixes variables, run two sequential pages.
- **Label by token name, not raw value.** `B — --shadow-sheet` beats `B — 0 -8px 32px rgba(0,0,0,0.5) inset`. Decisions are made on intent, not pixel math.
- **Mark the current baseline.** Append `(current)` to whichever cell is already shipping. Users forget which one is the old one.
- **Background context changes perception.** Shadows look invisible on flat backgrounds and fine when there's a subtle gradient above the edge. If the deployed environment has a gradient/glow/image behind the element (planned or shipped), simulate it in the cell background.
- **Show the obvious-wrong default when instructive.** Tailwind's `shadow-2xl` casts downward — wrong for bottom-anchored sheets that need an upward shadow. Including a "wrong direction" cell can clarify *why* the right one is right.

## Out of scope (v1)

- **Animation comparison** (`--ease-out` vs `--ease-spring`). Future direction: a duration/easing slider per cell. Until then, build a focused interactive prototype for motion decisions.
- **Multi-variable matrices.** Run two sequential single-variable pages instead.
