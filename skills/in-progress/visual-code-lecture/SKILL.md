---
name: visual-code-lecture
description: Walk through code one line at a time as a guided, hand-drawn lecture: one self-contained HTML page you SCROLL, code pinned left and notes scrolling right, one note and its line(s) lit at a time, like a 족집게 강의. Use whenever the user wants code *taught* sequentially rather than scanned ("코드 한 줄씩 설명해줘", "족집게 강의처럼", "이 함수 따라가면서 설명", "이 로직 흐름 짚어줘", "라인별로 설명", "walk me through this line by line", "teach me this code", "explain this step by step", "guided tour of this function/file", "narrate this logic"). Sibling of `visual-code-review`, the static all-annotations-at-once page; reach for THIS when the goal is a paced, one-thing-at-a-time walkthrough. NOT a correctness audit (`/code-review`).
---

# Visual Code Lecture

Turn a function, a logic flow, or an unfamiliar diff into a **guided, hand-drawn walkthrough you scroll**, a single self-contained HTML page with the real code **pinned on the left** and the notes **scrolling down the right** (scrollytelling). As each note reaches the focus band it becomes active: its line(s) light up (the rest dim), a mark is sketched on them like a teacher's pen, and a rough.js connector arcs from the note across to the code. One note is in focus at a time, so it reads like a lecture, not a wall of annotations; the reader sets the pace by scrolling (with ◀ ▶ / arrow keys / dots / click-a-line / click-a-dimmed-note as jumps: a focused card copies, a dimmed one navigates).

A static annotated page (that's `visual-code-review`) puts every note on screen at once: great for scanning a change you already half-understand, overwhelming when you're meeting the code cold. A lecture inverts that: it controls attention. The page shows you exactly where to look *and nothing else*, in the order the logic actually runs. It's the 족집게 강의 model: pick the one line that matters right now, circle it, say why, move on.

## When to use

- Any phrase in the description: "한 줄씩 / 족집게 / 따라가면서 / line by line / teach me / step by step / guided tour / narrate this logic."
- Teaching or onboarding: someone needs to *understand a flow in order*, not get a reference doc.
- A clever or dense function where the insight is the **sequence**: "first this guard, then we spend the token, only then success."
- **Proactively** when you're about to explain a non-trivial control/data flow in prose and the reader would follow it far better stepped through the actual lines.

## When to skip

- A change you want **scanned freely** with all notes at once, or a diff/PR review → `visual-code-review` (the static sibling).
- A **graded correctness audit** with ranked findings → `/code-review`.
- Trivial or genuinely linear code: a sentence or an inline snippet beats a whole scroll-lecture. Don't ceremony three obvious lines.
- Sprawling multi-file architecture with no single spine to walk in order: a flow/architecture diagram (`visual-code-review` explain mode) fits better than a line-by-line track.

## Relationship to `visual-code-review`

Same family, opposite reading model. They share the "render the real lines, self-contained HTML, round-trip to chat" DNA but answer different needs:

| | `visual-code-lecture` (this) | `visual-code-review` |
|---|---|---|
| Reading | **Sequential**: one beat at a time | Scan freely, jump anywhere |
| Attention | **Spotlight**: current line lit, rest dimmed | All annotations visible at once |
| Feel | Hand-drawn, paced, a lesson | Clean GitHub-diff reference |
| Best when | Learning a flow in order | Reviewing a change you'll scan |

If the user wants to *be taught a flow*, use this. If they want a *reference they'll scan and jump around*, use `visual-code-review`. When genuinely unsure, ask once.

## Steps

### 1. Gather the real material

Don't paraphrase from memory: the reader has to trust what's on screen.

- A function / logic flow: open the file, read the actual lines you'll walk. Follow the calls if the flow crosses a boundary, but pick **one spine** to narrate; a lecture is linear by nature.
- A diff you want walked as a lesson: `git diff` / `git diff --staged` / `gh pr diff <n>`, then choose the hunk that carries the idea.
- Keep it to the lines that matter. If you leave parts out, say so in the page (the `.skipped` line); silent truncation reads as "this is the whole thing" when it isn't.

### 2. Write the lecture: this is the value

A scroll with empty narration is just dimmed code. The worth is the **script**: the order you reveal things and what you say at each beat.

- **Order by how the logic runs**, not top-to-bottom by accident. Entry → the decision that matters → the consequence.
- **One idea per beat.** If a beat needs two sentences about two different lines, it's two beats. The whole point is one-thing-at-a-time.
- **Pick the line that carries the insight** and mark it: the guard that *is* the rate limit, the early return callers must check, the line where the bug would live. Don't narrate filler lines; let the spotlight skip them.
- Use a **connector** (`data-to`) when the point is a relationship: "this returns false, that returns true; callers must check the value." The page frames **both ends** when their span fits the code panel and arcs a connector between them.
- **When two related lines are too far apart to share one screen, split them into two beats**; this is the settled pattern. Point at one, then the other, and let the notes carry the link ("…but why is the first key the oldest?" → "here's the contract it leans on"). Each end gets full-screen focus, which teaches better than cramming both into one view. (Folding the gap or splitting the panel were considered and rejected: they drift toward the all-at-once reference model that's `visual-code-review`'s job, not this skill's.)
- **Keep the split navigable with `data-see`.** A two-beat split can lose the thread: the reader sees "which signal?" but can't get to it. Add `data-see="9"` (accepts a list, e.g. `"9,40"`) to render a clickable **`↗ jump to L9`** chip in the note; clicking it jumps to the beat that focuses that line. Use it to wire the two halves both ways so the relationship is one click apart, no stretched connector needed. The chip is live only once its card is in focus: on a dimmed card a click just brings that card into focus, so you read the step before you leap from it; and any such jump pins a **`↩ back`** chip to the bottom of the card you land on (labelled by the origin's line, like the `↗` chip), so the leap is never one-way.
- **The off-screen edge marker is also clickable.** If you do write a far `data-to` anyway, the page still degrades gracefully (primary centered, an `↑ L7` marker toward the partner) and that marker now **clicks through** to the partner's beat too. It's a guardrail, not a target: prefer two beats + `data-see`.
- Mark what you're unsure about honestly in the note ("I think this is the backpressure point, worth confirming"). A confident wrong lesson is worse than a hedged one.

**Then check every note for writing quality: this is not optional polish, it's the lesson.** A note the reader has to parse twice has already lost them. Before you ship, re-read each one against:

- **Lead with the point: BLUF, bottom line up front (두괄식).** Open with the takeaway in the first clause, *then* the why. "This line is the entire rate limit: out of tokens, the caller is refused." Not "When `tokens` drops below one, which happens under load, the method returns false, which means…". The reader should get it from the first few words even skimming.
- **Concise.** Cut hedging, throat-clearing, and restating the code in prose. If the line already says `return false`, don't write "it returns false"; say *what that means*. Every word the reader doesn't need is one between them and the point.
- **Clear.** One plain sentence beats a clever one. No jargon the page hasn't earned; if the domain needs a term, the note that introduces it defines it.
- **Elegant.** It should read like a good teacher said it out loud: confident, unhurried, no filler. Vary nothing for its own sake; the rhythm comes from having one tight idea per note.

The fast test: read only the **first line of each note** in sequence. If that alone teaches the flow, the notes are BLUF (두괄식) and tight. If you have to read to the end of each to know what it was about, rewrite the openings.

Run this as a deliberate cold pass before shipping: re-read each note's first line top to bottom as someone who didn't write it. You're anchored on the phrasing you just chose, so buried leads and stray em-dashes are precisely what you skim past.

**Two note shapes: prose by default, summary+bullets when needed.** Most beats are one tight sentence. But when a beat genuinely carries **2–4 parallel sub-points** ("three things happen here," "the caller must do a, b, c"), a summary lead + bullet list reads cleaner and is still BLUF (the lead *is* the bottom line):

```html
<li class="beat" data-lines="41-42" data-mark="box">
  <span class="lead">Past the guard, the request commits in order:</span>
  <ul>
    <li>spend one token (<code>tokens -= 1</code>)</li>
    <li>return <code>true</code> so the caller proceeds</li>
  </ul>
</li>
```

Rules for the list form: the `.lead` is mandatory and must stand alone as the takeaway; bullets must be genuinely **parallel** (not a sentence chopped at the commas); keep it to ~2–4 items; more than that is usually several beats. Don't reach for bullets by default: prose is tighter, and a list of one is just a sentence wearing a costume. Both shapes round-trip correctly: per-note copy and the transcript render the lead then `- point` lines.

### 3. Build one self-contained HTML file

**Start from `templates/lecture.html`.** Copy the **mechanics verbatim**: the embedded **rough.js** bundle and the renderer that drives it (ellipse / box / line / hachure fill + draw-on animation), the scrollytelling layout (sticky code-col + scrolling `.note-step` cards, each badged with its step number, the JS builds from `#beats`), scroll-driven activation, spotlight (dim/spot classes), the rough.js connector across the gutter, ◀ ▶ / dot / click-line / click-a-dimmed-note jumps (with a `↩ back` chip, inside the focused card, that returns from any discontinuous jump), theme/wrap, the Marker ink palette (swatches recolor every mark live), and click-to-copy (the focused card copies, a dimmed one navigates) + copy-transcript. Those are solved; re-deriving them adds bug risk. The **chrome** (the `PALETTE` list of marker inks the reader switches live, with `--mark` the active one; the mark opacity via `.sketch path { stroke-opacity }` (≈0.6) so code reads through; the rough.js `pen` options like `roughness`/`bowing`; the note column width; the focus-band offset; which mark per beat; the GitHub-label tag; the file-head path/meta) is yours to tweak.

Geometry note: the overlay is **`position: fixed` (viewport coordinates)**, and marks use **seeded** rough shapes (`seed: beatIndex`) so they stay glued, not shimmering, as you scroll. The active beat is recomputed from scroll position (the `.note-step` nearest the focus band); the scene redraws with animation on a beat change and re-glues without animation while you scroll within a beat. Author the code as a **function-sized slice** that fits the pinned panel; for long code, pick the slice that carries the lesson (the code-col is sticky, so a panel much taller than the viewport won't pin cleanly).

The hand-drawn look is **rough.js v4.6.6 embedded inline** (the same library Excalidraw is built on: `~27KB`, MIT). It's pasted into a `<script>` block so the page stays **one self-contained file**: it opens on a double-click and survives being copied to another machine. No CDN, no `npm`. That's the deliberate tradeoff vs. linking it: a bigger template file (~50KB) in exchange for zero runtime dependency. The colors are passed to rough.js at draw time (read from the live `--mark` CSS var, so marks re-tint when the reader switches theme or Marker swatch); don't re-add a `stroke`/`fill` rule to `.sketch path` or it'll override rough's per-shape colors.

Save to `/tmp/<project-slug>-visual-code-lecture.html`. Slug = `basename $PWD` lower-cased, non-alphanumeric → `-`, collapsed; fall back to `code` if empty.

**Desktop-only by design.** The page is a `/tmp` artifact opened on the same desktop that runs Claude Code, and the pinned two-column layout (code left, notes right, connector across the gutter) assumes a wide viewport; don't add mobile breakpoints. Revisit only if the workflow ever shares or embeds these pages.

Fill the regions (each is a comment in the template):

1. **Title + subject**: `[data-title]` and `[data-subject]` (the file / function / subsystem).
2. **`#lines`**: the real code, one `<div class="line" data-ln="N">` per row. `data-ln` is the number beats reference (it need not start at 1; use the file's real line numbers).
3. **`#beats`**: one `<li class="beat">` per step. `data-lines` ("41" / "41-44" / "41,47"), `data-mark` (`circle` default / `box` / `underline` / `strike` / `highlight` / `none`), optional `data-to` for a connector, optional `data-see` for clickable cross-link chips (see below), optional `data-tag` for a one-word floating punch. The `<li>` text is the spoken explanation (inline `<code>` allowed).
4. **`.skipped`** (optional): a visible line when you walked only part of it.

Rules for the content:

- **Render the real lines.** Actual code, not a paraphrase: same trust rule as the sibling.
- **Escape code as text.** `<`, `>`, `&` inside `.code` are literal: write `&lt;`, `&gt;`, `&amp;`. One unescaped `<` silently eats the rest of the line.
- **The note card is the canonical text.** The sketch marks + connector say *where*; the note says *what* and is the copy target. Keep each note readable on its own; someone reading only the transcript should still follow the lesson.
- **Mark with meaning, sparingly.** `circle` to point, `box` for a block, `underline`/`strike` for a single line, `highlight` (hachure swipe) for the one line to remember, `connector` for a relationship. Don't mark every beat the same; don't mark filler.
- **Beats reference `data-ln` values**, so they survive even if you show a slice starting at line 200.

### 4. Open in the browser

- macOS: `open <path>` · Linux: `xdg-open <path>` · WSL: `wslview <path>`, else `cmd.exe /c start <path>` · Windows: `start <path>`.
- Detect via `uname` and `$WSL_DISTRO_NAME`.

If the open command fails (headless / SSH / no `xdg-open`), don't retry blindly; print the absolute path and ask the user to open it: *"브라우저 자동 오픈이 안 돼. 이거 직접 열어줘: /tmp/foo-visual-code-lecture.html"*.

### 5. Round-trip, then wait in chat

The walkthrough isn't the end: decisions and takeaways come back here.

- **Click a note card**: the focused card copies that step (with its `L<n>` ref) for pasting back; a dimmed (not-yet-focused) card jumps to it instead, so every off-screen card doubles as a navigation target. Its `↗` chips stay inert until the card is focused, so the click lands you on the step rather than flinging you onward.
- **Click `↩ back`**: a dashed chip pinned to the bottom of the card you *jumped* to (via a clicked card, `↗` chip, dot, line, or `Home`/`End`), labelled by the origin's line (`↩ back to L42`) to match the `↗` chips. Only the most recent jump carries one, and it lives on that single landing card; it never accumulates across jumps or rides along to cards you merely scrolled through. Sequential `◀ ▶` stepping creates none.
- **Click "copy transcript"**: copies the whole lecture as numbered notes under the subject heading; this is the takeaway export.

Say something like *"강의 페이지 띄웠어. 스크롤 내리면서 보면 돼 (←/→ 로 점프도 됨). 짚고 싶은 노트 눌러서 복붙하든가 transcript 통째로 가져가."* and stop. Don't poll the file.

### 6. After: act, then clean up

- Apply what the user decides: fix a flagged line, answer a question raised, or expand a beat.
- Delete the HTML. Keep it only on an explicit ask (`그대로 둬`, `--keep`).

## Design discipline

- **Control attention.** The spotlight is the whole reason to exist: one line lit, the rest dimmed. If a beat lights half the file, it's not a beat.
- **One idea per step.** Two sentences about two lines = two steps.
- **Lead with the point, then trim.** Every note is BLUF (bottom line up front (두괄식), takeaway first) and clear, concise, elegant. Re-read each one before shipping; reading only the first lines in sequence should still teach the flow.
- **Order by the logic, not the layout.** Walk the path the code runs, not top-to-bottom by default.
- **Fidelity over summary.** Render the real lines; a paraphrased lecture is untrustworthy.
- **One file, no build, no CDN.** Inline everything, the sketch renderer included. It has to open on a double-click and survive being copied elsewhere.
- **Always round-trip.** Note-card copy + transcript export, so the lesson leaves the page. A walkthrough you can't carry away is a dead end.
- **Say what you skipped.** If you walked only the hot path, put it in the page.

## Visual craft

The hand-drawn look is a committed visual world, not a default to escape. Tune its personality; don't flatten it into a plain page.

- **The marker inks are the personality.** The `PALETTE` and rough options (roughness, bowing) carry the lecture feel; tune them for the material. Keep the ink set small, and pick colors that read on both backgrounds since `--mark` re-tints live on theme switch.
- **Mark color means "where," not decoration.** One ink is enough per beat; don't spend a second hue where the mark already points.
- **Choose the neutral, don't inherit it.** If you retint the grays, bias them toward the accent; a pure mid-gray reads as unconsidered.
- **Both themes, through the tokens.** The page now first-loads the viewer's OS theme. Style anything you add via the token vars so both themes cover it; never hardcode a color inside one theme.
- **The type is a deliberate voice.** The system/mono stack is the editor the reader lives in; `.hand` carries the lecture tone. Don't swap in a webfont: it breaks the single self-contained file.

## What this is not

- Not a static annotated reference; that's `visual-code-review` (scan-anywhere, all notes at once). This is paced and sequential.
- Not a correctness audit; that's `/code-review`.
- Not a syntax-highlighter or code→HTML converter.
- Not for trivial or linear code; don't build a scroll-lecture where a sentence does.
