---
name: visual-explainer
description: Turn a tangled technical thing (a gnarly bug and the decision it forces, a non-obvious system behavior, an architectural "why") into ONE self-contained, conclusion-first HTML page that explains it, can be handed off, and copies itself back out as Markdown. Use when the user wants something *explained and handed off*: "이거 왜 이런지 설명자료로 만들어줘", "남들도 이해하게 정리해줘", "이슈 설명 페이지", "결정 배경 정리", "explain this so the team gets it", "write up why this happens", "make a shareable explainer", "document this decision/tradeoff". Sibling of `visual-code-lecture` / `visual-code-review`, which annotate *real code*; reach for THIS when the subject is a situation, a decision, or a phenomenon. Not `visual-ui-compare` (pick by eye), not `/code-review` (audit).
---

# Visual Explainer

Turn something tangled (a bug and the product decision it forces, a "why does it only break here," a tradeoff someone has to sign off on) into **one self-contained HTML page that explains it and can be handed off**. The page leads with the answer in a single sentence, then walks the supporting beats as numbered sections built from a small kit of blocks (contrast cards, flow diagrams, timing tracks, comparison tables, glossary). It opens on a double-click and copies itself out as Markdown, so the same artifact serves the reader *and* the teammate they forward it to.

The reason this skill exists: a hard explanation given in chat is gone the moment the conversation scrolls. A gnarly "why" usually has a shape (two problems people conflate, a timing window, a dead node in a path, a fork between models), and that shape reads far better drawn than narrated. This skill captures the shape once, conclusion-first, in a form you can both *understand from* and *send*.

## When to use

- Any phrase in the description: "설명자료/설명 페이지로 만들어줘", "남들도 이해하게 정리", "이슈/결정 정리", "explain this for the team", "write up why this happens", "make a shareable explainer", "document this decision."
- A debugging session lands on a non-obvious root cause and the next move is to *explain it to someone* (a reviewer, the person who owns the area, your future self).
- A decision has a real fork and you want the tradeoff legible before anyone commits: the page tees it up; the reader (or you) decides.
- **Proactively** when you're about to write a long prose "here's why…" in chat and it carries structure: two conflated problems, a before/after, a timeline, a table of options. Drawn beats narrated.

## When to skip

- The subject is **real code walked line by line** → `visual-code-lecture` (paced lecture) or `visual-code-review` (static annotated reference). Those render the actual lines; this zooms out to the situation around them.
- A **visual choice made by eye** (which shadow, which easing) → `visual-ui-compare`.
- A **graded correctness audit** with ranked findings → `/code-review`.
- The explanation is genuinely one sentence: just say it. Don't build a page to state something the reader gets in a breath.
- It needs to be a living doc the team edits over time → that's a real markdown doc / ADR in the repo, not a `/tmp` HTML artifact.

## Relationship to the `visual-*` siblings

Same DNA (one self-contained HTML file, conclusion-first, round-trips back to text), different subject:

| | `visual-explainer` (this) | `visual-code-lecture` / `-review` | `visual-ui-compare` |
|---|---|---|---|
| Subject | A situation / decision / phenomenon | Real code, line by line | A visual property |
| Output | An explanation you understand + forward | A taught or annotated code page | A decision made by eye |
| Reader does | Gets it, then shares / decides | Follows the code | Picks a variant |

If the thing to convey *is the code*, use the code siblings. If it's *why the code (or the system, or the product) is the way it is*, use this. When genuinely unsure which one fits, ask once.

Three deliberate departures from the family, so they don't read as oversights. **No hand-drawn (rough.js) look:** a forwarded reference reads better crisp than sketched. **No viewport toggle:** this isn't rendering product UI, so there's nothing to size-check. **The global copy is whole-page,** not granular-only like `visual-code-review`, because forwarding the entire explanation is the primary move here (the per-section and TL;DR copies are additive, not the default).

## Steps

### 1. Find the shape before you write

The value is naming the structure of the tangle, not dumping everything you know. Most hard "why"s reduce to one or two of these shapes. Pick the ones that fit and drop the rest:

- **One sentence that answers it.** This is the TL;DR and it's mandatory. If you can't write it, you don't understand the thing yet; keep digging before you build the page. Everything else is a branch off this line.
- **Two problems people conflate** → a contrast pair. The classic trap: "it's all one bug." Splitting them is often the whole insight.
- **Timing / ordering** → a timeline. When the *same* call or step behaves differently because of *when* it runs.
- **A path with a dead node** → a flow diagram, optionally with a fixed twin beside it. Signal/data/control flow where one stage swallows the result.
- **A fork between options** → a comparison table. Rows are the options/candidates, columns the dimensions that decide it, cells are verdicts.
- **A phenomenon with jargon** → a glossary. Define only the terms the page itself leans on.

Verify before you draw. Don't assert a root cause, a timing window, or "it used to work in v1" from memory: read the code, the diff (`git diff`, `gh pr diff`), the logs. A confident wrong explainer is worse than none, and this one gets forwarded. Anything you couldn't confirm gets marked *on the page*, not quietly dropped: a `.callout.unverified` for a specific hedge ("unverified: needs a device test"), and the `.coverage` line for what you left out of scope. The honesty is the trust, and the trust is what makes it safe to forward.

### 2. Write it conclusion-first, every level

- **Lead with the point** in the TL;DR and in every section's `.lead`: the bottom line up front (두괄식), then the why.
- **One idea per section.** If a section needs two diagrams about two different things, it's two sections (they auto-number).
- **Generalize the lesson, not the incident.** If a section ends with a takeaway, state the transferable rule ("waking the context early is what traps it"), not the ticket ("on issue #N we…"). The page outlives the incident.
- **Clear, concise, elegant** on every line of prose, same bar as a commit body. Cut the sentence that restates the diagram; the picture is the argument.

Then run the cold pass before you ship. Read **only the TL;DR and each section's `.lead`, top to bottom, as someone who didn't write it:** that spine alone should carry the whole arc. You're anchored on the phrasing you just chose, so a buried lead or a section whose point only lands at the end is exactly what you skim past. If the spine doesn't teach it, rewrite the openings, not the bodies.

### 3. Build one self-contained HTML file

**Start from `templates/page.html`.** Copy the **mechanics verbatim**; they're solved, and re-deriving them adds bug risk:

- **Auto-numbering + side nav:** sections get their badge number and their scrollspy nav entry from their order, so adding or removing one never desyncs. The nav hides itself when narrow or when there are ≤2 sections.
- **Round-trip at three grains:** the toolbar **Copy as Markdown** (whole page), a **TL;DR-only** copy (the forwardable one-liner), and a per-section **⧉ section** copy on hover. All share one serializer (TL;DR, each section's lead, contrast panes, flows, timelines, tables, coverage, glossary → clean Markdown) with an `execCommand` fallback.
- **Decision round-trip:** any `<table class="cmp" data-decision>` gets a per-row **이걸로 / pick** button injected; clicking copies `decision: <option> @ theme=…` back to chat. This is the "stay in the loop on a decision" hook; use it whenever the page tees up a fork.
- **Theme toggle:** `data-theme` + `localStorage`.

The **chrome is yours to tweak**: the token colors, which block types each section uses, the eyebrow label, the icons in flow nodes, whether you ship a light theme at all. The template includes one worked instance of every block type (contrast / timeline / flow / table / prose / glossary) as scaffolding. **Replace the placeholder content; delete the block types you don't need.** If you find yourself making the same deviation twice across invocations, update the template instead of re-patching it each time.

Block kit: `references/block-kit.md` maps each block type to the shape it fits (from step 1) and the classes it uses; the template's `TYPE:` comments mark where each lives.

Content rules:

- **Escape code as text.** Inside the page, write `&lt;`, `&gt;`, `&amp;` for literal `<`, `>`, `&`: one stray `<` eats the rest of the line.
- **The TL;DR is not optional and not a summary of the page;** it's the answer. The sections justify it; it doesn't preview them.
- **Build the minimum that nails the shape.** Three sections that carry it beat eight that pad it; if the whole thing is one contrast pair plus a TL;DR, ship that.

Save to `/tmp/<project-slug>-visual-explainer.html`. Slug = `basename $PWD` lower-cased, non-alphanumeric → `-`, collapsed; fall back to `explainer` if empty.

**Desktop-first.** It's a `/tmp` artifact opened on the machine running Claude Code; the layout already collapses `.grid2` on narrow widths, but don't invest in mobile chrome unless the workflow starts sharing these as hosted pages.

### 4. Open in the browser

- macOS: `open <path>` · Linux: `xdg-open <path>` · WSL: `wslview <path>`, else `cmd.exe /c start <path>` · Windows: `start <path>`.
- Detect via `uname` and `$WSL_DISTRO_NAME`.

If the open command fails (headless / SSH / no `xdg-open`), print the absolute path and ask the user to open it: *"브라우저 자동 오픈이 안 돼. 이거 직접 열어줘: /tmp/foo-visual-explainer.html"*.

### 5. Round-trip, then wait in chat

The explainer isn't done when it renders; its job is to be carried off, and any decision it tees up has to come back here.

- **Copy at the grain that fits.** Whole page → toolbar **Copy as Markdown** (drop it into a PR/issue). Just the headline → **TL;DR** (one line into Slack). One section → hover its heading for **⧉ section**.
- **Decision pick.** If the page laid out a fork (`data-decision` table), the user clicks **이걸로** on a row and pastes back `decision: <option> @ theme=…`. Apply that choice.

Say something like *"설명 페이지 띄웠어. 위에서부터 읽으면 돼. 통째로 보낼 거면 우상단 'Copy as Markdown', 한 줄만이면 'TL;DR'. 모델 정할 거면 표에서 '이걸로' 눌러서 붙여줘."* and stop; the user reads and replies when ready.

### 6. After: act, then clean up

- Apply whatever the page drives: implement the recommended model, file the decision, fix the verified root cause.
- Delete the HTML. Keep it only on an explicit ask (`그대로 둬`, `--keep`).

## Design discipline

Before you ship, re-check these, each defined in the steps above:

- **Conclusion-first.** The TL;DR answers; the sections justify.
- **Name the shape.** Split, draw, or tabulate the structure; that's the worth.
- **Draw what's drawable**; prose carries what isn't structural.
- **Verify before you forward.** A confident wrong explainer travels.
- **Mark the gaps.** `.callout.unverified` for a hedge, `.coverage` for what's out of scope.
- **Generalize the lesson**, keep the incident out.
- **One file, no build, no CDN.**
- **Round-trip every grain.**

## Visual craft

This page has the most design freedom of the family (the subject is a situation, not fixed code), so the template look is a floor to build on, not the finish. Aim for a polished utilitarian treatment: real hierarchy, considered spacing, a chosen palette. It's a read-and-act reference, not a landing page, so skip the flashy hero and ornament.

- **Derive the palette from the subject.** When the tangle has its own world (the system, the product, the domain), pull the accent and neutral from that, not the template default. Bias the gray toward that accent; never a pure mid-gray.
- **Semantic color carries state, not the accent.** `bad` / `warn` / `ok` / `unverified` are meaning; keep them separate from the one accent and don't rainbow the blocks.
- **Numbering encodes a real sequence.** Sections auto-number, so lean on that order only when the beats are an actual sequence; a pile of parallel points shouldn't wear numbers it doesn't earn.
- **Both themes, through the tokens.** The page now first-loads the viewer's OS theme. Style every block via the token vars so both themes cover anything you add.
- **Don't spend the freedom on an AI-design default.** Cream-and-serif-and-terracotta, a lone acid-green pop, a purple-to-blue gradient hero, emoji as section markers, everything centered: where nothing forces a look, pick from the subject instead.

## What this is not

- Not a code walkthrough or annotated diff: that's `visual-code-lecture` / `visual-code-review`.
- Not a visual A/B: that's `visual-ui-compare`.
- Not a correctness audit: that's `/code-review`.
- Not a living team doc: if it needs editing over time, write an ADR / markdown doc in the repo instead.
- Not a slide deck or a presentation tool: it's a single scrolling page meant to be read and forwarded.
