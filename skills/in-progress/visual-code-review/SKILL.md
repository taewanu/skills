---
name: visual-code-review
description: Render a diff, PR, or slice of code as a single self-contained HTML page — the real diff with inline margin annotations, a flow/architecture diagram, the key snippets explained, risks and gotchas, open questions — then open it in the browser so the change reads by eye instead of scrolling a terminal diff or a wall of markdown. Copy-back buttons round-trip decisions to chat. Two modes — **review** (a change/diff/PR) and **explain** (existing code or a subsystem). Use whenever the user wants a change or codebase made legible visually — "이 diff 설명해줘", "PR 리뷰 보기 좋게 만들어줘", "이 코드 흐름 그림으로", "아키텍처 html로 설명", "walk me through this PR", "explain this diff/PR as html", "visualize this change", "help me understand this module", "render the diff with annotations", "make an html explainer for this code" — or any time you're about to dump a long diff or multi-paragraph code explanation as plain markdown and a navigable HTML artifact would land better. NOT a syntax-highlighter or code-to-markup converter, and NOT a graded correctness audit — that's `/code-review`; this renders understanding and can lay those findings over the diff. When the change is big or unfamiliar, prefer building the page over explaining in prose.
---

# Visual Code Review

Turn a code change — or a slice of an unfamiliar codebase — into a single self-contained HTML page that puts the **real code next to your analysis**: the diff with annotations in the margin, a flow diagram, the snippets that matter, gotchas, open questions. Open it in the browser, let the change read by eye, and round-trip the review back to chat.

A terminal diff and a markdown write-up both linearize: you scroll the lines in one place and read the explanation somewhere else, holding the mapping in your head. HTML collapses that — the note sits in the margin of the exact hunk it's about, the flow is a diagram instead of a paragraph, severity is a color you skim. You stay in the loop because the artifact is built to be *read*, and its copy buttons feed your decisions straight back here.

## Pick a mode

- **Review** — there's a change to look at: working-tree diff, staged diff, a commit range, or a PR. Default when the user just finished work, says "review / walk me through this PR / diff," or names a branch or PR. The page centers on the rendered diff with inline annotations.
- **Explain** — there's no diff; the subject is existing code: a function, a module, a subsystem, an architecture. Default when the user asks "how does X work," "explain this code," "make me an explainer." The page centers on a flow/architecture diagram plus annotated key snippets.

Same engine, same self-contained shell — the mode picks which regions you fill. If genuinely unclear, ask once.

## When to use

- Any of the phrases in the description, or any multi-file diff / 2+-paragraph code explanation you're about to render as flat markdown.
- **Proactively**: when a change is big or in territory the user doesn't know well (the article's "streaming / backpressure" case), offer the page instead of a wall of diff — a navigable artifact is far more likely to actually get read.

## When to skip

- Tiny diffs — a few lines in one file. The terminal or an inline snippet is faster; don't ceremony it.
- The user wants a **graded correctness audit** with ranked findings — that's `/code-review`. (You can then point this skill at its findings to render them visually.)
- The answer is genuinely short and linear — a one-paragraph reply doesn't need a page.

## Relationship to `/code-review`

Different jobs, and they compose. `/code-review` **judges** — it hunts bugs and grades them by severity. This skill **renders understanding** — it makes a change or a codebase legible. Run `/code-review`, then hand its findings to this skill to lay them over the actual diff with margin notes and color.

On its own, this skill surfaces concerns as honest **questions / notes**, not graded verdicts. The line in practice: a `watch` or `risk` note is a *pointer* — "look here, and here's why" — that a human confirms in seconds. The moment you're trying to enumerate *every* defect and rank them, you've crossed into `/code-review`'s job; stop and suggest it rather than turning the page into a half-finished audit.

## Steps

### 1. Gather the real material

Don't paraphrase from memory — render what's actually there.

- **Review mode**: working tree → `git diff`; staged → `git diff --staged`; range → `git diff <base>...<head>`; PR → `gh pr diff <n>` (and `gh pr view <n>` for title/description). If the user names no PR or branch, resolve from the current branch (`gh pr view --json number,title,url`); if there's no PR, fall back to the working-tree (or staged) diff. Ask only when it's genuinely ambiguous which change they mean.
- **Explain mode**: open the entry points and follow the calls to find the data/control flow. Use `Explore`/grep for breadth before you read deeply.

If the diff or subject is large, pick the handful of files/hunks that carry the change and **state in the page what you left out** — silent truncation reads as "I covered everything" when you didn't.

### 2. Analyze — this is the value

A diff with empty margins is just a diff. The point is *your reading of it*. Produce the content the page will carry:

- **Review**: a one-line summary of what the change does; per-hunk notes (what it does, why, what to watch); risks and gotchas; open questions; a sketch of the control/data flow when it's non-trivial.
- **Explain**: the flow (who calls what, what data moves through); the 3–4 snippets that actually matter, annotated; the gotchas a newcomer hits; a short glossary if the domain has jargon.

Mark what you're unsure about as a **question**, not a finding. Honesty is what makes the artifact trustworthy — a confident wrong annotation is worse than none.

### 3. Build one self-contained HTML file

**Start from `templates/page.html`.** Copy the **mechanics verbatim** — theme toggle + `localStorage`, the file/section nav, the diff-line rendering, the annotation/severity note styles, and the copy-back JS (with `execCommand` fallback). Those are solved; re-deriving them just adds bug risk.

The **chrome** (colors, spacing, which sections appear, diagram style) is yours to tweak for the material. If the content needs something the template lacks — a sequence diagram, a state machine, a before/after toggle, a small perf table — **add it**; the template is a starting point, not the final form. If you make the same addition twice across invocations, fold it back into the template so it stops going stale.

Save to `/tmp/<project-slug>-visual-code-review.html`. Slug = `basename $PWD` lower-cased, non-alphanumeric → `-`, collapsed; fall back to `code` if empty.

Fill the regions (each is a comment in the template):

1. **Header** — title, one-line summary, and a context line (branch / PR / range, or the subsystem name).
2. **Nav** — one entry per file (review) or per section (explain).
3. **Content** — the rendered diff hunks with anchored annotations (review), or the sections + diagram + annotated snippets (explain).
4. **Diagram slot** — inline SVG/HTML for the flow, when a picture beats prose.
5. **Gotchas / open questions** block — also where a `skipped: …` coverage line lives when you didn't render everything.

Rules for the content:

- **Render the real lines.** Show the actual diff text / actual code, not a paraphrase — the user has to be able to trust what's on screen. Keep `+`/`-`/context coloring and line numbers.
- **Escape code as text.** `<`, `>`, `&` inside diff/snippet content are literal text in HTML — write them `&lt;`, `&gt;`, `&amp;`. A single unescaped `<` silently swallows the rest of the line, quietly destroying the fidelity you just promised.
- **Anchor every annotation.** A note lives next to the hunk or line it's about (a margin callout under the hunk), never as a detached essay at the bottom. Spatial proximity is the entire reason to be in HTML here.
- **Color by meaning, sparingly.** add/remove tint for the diff; a small set of note kinds — `info` / `watch` / `risk` / `question` — as left-border colors. Don't rainbow it; the color has to mean something at a glance.
- **Diagram only when it earns it.** A 4-box flow as SVG beats three sentences. A trivial linear flow doesn't need a picture — don't decorate.

### 4. Open in the browser

- macOS: `open <path>` · Linux: `xdg-open <path>` · WSL: `wslview <path>`, else `cmd.exe /c start <path>` · Windows: `start <path>`.
- Detect via `uname` and `$WSL_DISTRO_NAME`.

If the open command fails (headless server, SSH, missing `xdg-open`), don't retry blindly — print the absolute path and ask the user to open it: *"브라우저 자동 오픈이 안 돼. 이거 직접 열어줘: /tmp/foo-visual-code-review.html"*.

### 5. Round-trip, then wait in chat

The artifact isn't the end — the decisions have to come back here. The template's copy buttons emit Claude-actionable markdown:

- **Copy notes as markdown** — assembles every annotation, grouped by its `data-group` (with its kind icon and inline line ref), into a markdown digest. In review mode set each note's `data-group` to its file path → it reads as a PR review comment; in explain mode set it to the section/concept → it reads as a takeaways list. The group label should match what's on screen (the file path / the section title).
- **Copy summary** — the header summary line.
- **Click any note** — copies that single concern/question.

Say something like *"리뷰 페이지 띄웠어. 코멘트로 복붙하든가, 고칠 거 골라서 말해줘."* and stop. Don't poll the file.

### 6. After: act, then clean up

- Apply what the user decides — fix the flagged lines, answer the questions, or post to the PR (`gh pr comment`, or a review) if they ask.
- Delete the HTML. Keep it only on an explicit ask (`그대로 둬`, `--keep`).

## Design discipline

- **Fidelity over summary.** A paraphrased diff is untrustworthy — the user can't tell what actually changed. Render the lines.
- **Proximity is the point.** The note beside the hunk beats a notes section at the bottom. If you're writing a long detached analysis, you've lost the reason to be in HTML — move it into the margin or cut it.
- **One file, no build.** Inline all CSS/JS/SVG. It has to open on a double-click and survive being copied to someone else's machine — no CDN, no `npm`, no external highlighter.
- **Always round-trip.** Every page ends with copy-back buttons. An explainer you can't feed back into chat is a dead end; the loop is the whole point.
- **Say what you skipped.** Bounded coverage (top-N files, skipped a generated file) gets a visible line in the page, not silence.

## What this is not

- Not a correctness audit — that's `/code-review`. This renders understanding (and can render those findings over the diff).
- Not a syntax-highlighter or code→HTML converter.
- Not for tiny diffs or short linear answers — don't build a page where a sentence does.
