# Entry format

The single source of truth for what a tracking-file entry looks like, how `end` writes one, and how `analyze` / `invoice` read one. New entries are always written in the slim format; both formats coexist in the same file and both parse.

## Slim format (written by `end`)

```
- HH:MM–HH:MM <TZ> (X.XXh) — <Project> | <Phase or Task>
  - tags: tool:<tool>, location:<loc>, billable:<client-or-none>
  - cat: <key> <pct>, <key> <pct>, ...
  - shipped: <one line>
  - slipped: <one line>          # omit if empty
  - retro: <file>, <file>        # omit if empty
  - needs-edit: <field>, <field> # omit if entry is complete (added by switch shortcut)
```

Indent sub-bullets 2 spaces. No blank lines between them.

**Pause/resume sessions**: the first-line window stays `<first-segment-start>–<last-segment-end>` for readability, but `(X.XXh)` is the sum of segments (paused gaps excluded). When a session was paused at any point, append a `paused Yh Ym` note inside the parens: `(2.30h, paused 1h 15m)`. Parsers accept both `(X.XXh)` and `(X.XXh, paused …)`.

## Legacy verbose format (pre-Skill entries, read-only)

```
- Window: HH:MM–HH:MM <TZ> (~X.Xh)
- Location: ...
- Tool: ...
- Categories: cat A%, cat B%, ...
- Shipped: ...
```

## Extraction (for `analyze` / `invoice`)

From either format, pull:

- **duration** (hours)
- **date**: from the parent `### YYYY-MM-DD` header
- **categories**: as a `{key: pct}` map; `TBD` means unset, so exclude it from category aggregation while still counting the entry's hours toward the total
- **tool / location / billable**: from tags or legacy fields; `TBD` billable means unset, so exclude it from any client filter
- **paused gap** (optional): parsed from `(X.XXh, paused Yh Ym)`; informational only, never affects totals
- **needs-edit** sub-bullet: informational; `analyze` appends a footnote like `Note: N draft entries need editing (cat or billable TBD)` so the user comes back to fix them
