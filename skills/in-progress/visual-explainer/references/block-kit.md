# Block kit

The section blocks the explainer builds from. `templates/page.html` ships one worked instance of each, marked with a `TYPE:` comment; reach here for which block fits which shape (from step 1) and the classes each uses. Replace the placeholder content and delete the block types a page doesn't need.

- **contrast:** `.grid2` of `.pane` cards (`.warn` / `.bad` / `.ok` accent), each with a `.tag`, `h3`, body, and a `.why` line; pair with a `.callout` for the gotcha ("don't conflate…"). Use for two problems people conflate.
- **timeline:** `.timeline` with `.track` rows; wrap the in-window events in `.win`, and mark the decisive event `.ev.hit-ok` (inside) or `.ev.hit-bad` (outside). Use for timing / ordering.
- **flow:** `.flow` of `.node` boxes joined by `.arrow`; mark the broken one `.node.dead`, healthy ones `.node.ok`; put a fixed twin in a second `.card` beside it. Use for a path with a dead node.
- **table / decision:** `table.cmp`; verdict cells are `.chip.ok` / `.chip.bad` / `.chip.rec` (the recommendation). Add `data-decision` when it's a fork the reader must choose, which switches on the per-row pick buttons. Use for a fork between options.
- **callout:** `.callout` (a gotcha, red), `.callout.good` (a resolution, green), `.callout.unverified` (an honest hedge, amber). Reach for `.unverified` the moment a claim rests on something you didn't check; delete it once you do.
- **coverage:** the `.coverage` line near the foot, naming what you deliberately left out of scope or couldn't verify. Delete it only once you genuinely covered everything.
- **prose:** a plain `.card` of text for "why now," background, etc.
- **glossary:** `dl.glossary` of `dt`/`dd` pairs. Use for a phenomenon with jargon.
