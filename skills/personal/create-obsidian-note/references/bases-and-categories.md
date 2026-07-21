# Bases and categories

This file is the mechanism: how Bases relate to folders, what each shared property means, and how to add to or build a category. Every concrete label it refers to (property display names, view names, the wording of the confidence scale) is the vault's own vocabulary and lives in `vault-map.md` under "Base house style". Read both; author from the template there.

## How Bases work

A Base is a saved view, not storage. It filters notes by a frontmatter property and renders them as a table. The consequence that trips people up: **a note appears in a Base because of its `categories` property, not its folder.** A concept note lives in `References/` (it exists outside the user) yet shows in its Category's table through `categories: "[[<category>]]"`.

That is why "put it in `References/` and link the category" is the whole move. The folder answers who authored it; the `categories` property answers which view it belongs to. They are independent.

A Category hub note is tiny. It only embeds the Base:

```markdown
---
tags:
  - categories
---
One sentence describing the collection.

![[<category>.base]]
```

The `.base` file itself lives in `Templates/Bases/<category>.base`.

## Adding a concept to an existing category

Create one note per concept in `References/`, with this frontmatter. The tracked categories and their sub-types are listed in `vault-map.md`.

```yaml
---
created: 2026-07-20               # today, YYYY-MM-DD
categories:
  - "[[<tracked category>]]"
type:
  - "[[<sub-type within that category>]]"
aliases:
  - "<the term in the user's other study language>"
  - "<synonyms and abbreviations>"
standard: true                    # false only for the user's own coinage
source: <where it came from>      # a site name, or the on-the-job marker in vault-map.md
confidence: 1                     # lowest rung of the scale in vault-map.md
url: https://...                  # source link if any
---

Body: summarize in the user's own words. Never paste a paid source's prose.
```

Then link related concepts in the body with `[[other concept]]`, liberally, even to notes not yet written.

### The shared properties

Four properties carry meaning across every category. Reuse them rather than inventing a per-category equivalent, so one Base grammar works everywhere.

- **`categories`**: which collection the note belongs to. Drives the Base filter.
- **`type`**: a sub-type within that collection. Drives the grouping and the clickable sub-type view.
- **`standard`**: whether the title is established industry vocabulary or the user's own coinage. Drives the term column. Omitting it leaves that column blank, which reads as "not yet judged" rather than "standard", so set it explicitly on every concept note.
- **`confidence`**: a 1-to-3 study tracker, where 1 is the lowest rung. Drives the study view.

### The standard-term convention

- **Title with the established term in the interview language.** Other-language names and synonyms go in `aliases` so every form resolves to one note. Study happens in one language and interviews in another, so the note has to answer to both; `vault-map.md` names which is which.
- **Verify the term is real vocabulary before titling with it.** A plausible-but-wrong name freezes a misunderstanding. "fail-silent" is a *good* fault-tolerance property (correct output or none), the opposite of the silent-data-loss bug it nearly labeled. WebSearch when unsure.
- **A genuine coinage is fine, but mark it.** Set `standard: false` and say so in the body, and since the user authored it, consider `Notes/` over `References/`. Do not pass a coinage off as established vocabulary.

### confidence

Start every new concept at the lowest rung. It is honest, and it makes the study view list real work. Concepts the user already understands from on-the-job experience start at the top rung. Raising the number as they learn shrinks the study list, so an empty view means nothing left to learn. Do not pre-fill top rungs.

## Building a new category

When a cluster of concepts has no home, build four pieces.

1. **Concept notes** in `References/`, all sharing `categories: "[[<new category>]]"`.

2. **The Base** at `Templates/Bases/<new category>.base`. Copy the house-style template in `vault-map.md` verbatim and substitute only the category name in the filter. Its view and formula names are what the rest of this skill assumes exist; renaming them breaks the session-note embed and the sub-type stubs below.

3. **The hub** at `Categories/<new category>.md`, the tiny embed shown above.

4. **Sub-type stubs** in `References/`, one per `type:` value, so the sub-type view is clickable. Mirror the existing `Parks.md`: a stub whose body embeds the parent Base's `this`-filtered view.

```markdown
---
tags:
  - <category-slug>/types
icon: shield-alert
color: red
---

## <a heading naming the items>

![[<new category>.base#<the sub-type view>]]
```

### Property-name caution

Keep frontmatter property *names* ASCII (`source`, `confidence`, `type`). The vault's other properties are all ASCII, and Base expressions on non-ASCII identifiers are unverified. Display names (via `displayName`) and values may be in any language.

## Verifying a Base

A `.base` file is YAML. Parse it after writing; a malformed filter fails silently as an empty table. If Python's `yaml` module is absent, `ruby -ryaml -e 'YAML.load_file(ARGV[0])'` works. Confirm that every `formula.X` used in a view is defined in `formulas`, and that `groupBy` and `sort` reference real properties.

## The missing second stage

kepano's method compiles fragments upward: daily thoughts reviewed every few days, then monthly, then yearly. This vault has the capture stage but no periodic compaction. When it fits, suggest a weekly pass that reads recent session logs and promotes the worthwhile fragments into concept notes or interview stories. That is what makes the structure pay off instead of just growing.
