---
name: create-obsidian-note
description: >-
  Capture notes into the user's personal Obsidian vault the way its conventions require,
  and work with its Bases and Categories. Use this WHENEVER the user
  wants to save, record, or capture something into their Obsidian vault, add a note, jot
  down an insight or a concept that came up mid-work, log a learning, or create or edit a
  Base or Category there, even if they never say "Obsidian", as long as the intent is
  clearly to persist something into their personal notes. Use it too when they ask where a
  note should go or how the vault is organized. A kepano-style vault with hard folder rules
  and frontmatter-driven Bases, so writing a note the naive way produces broken links and
  orphaned notes.
---

# Create Obsidian note

A kepano-style vault's structure is not obvious, and getting it wrong produces broken links or notes that never surface in the right view. Follow these rules so you write it right the first time instead of rediscovering them.

**Read `references/vault-map.md` before touching anything.** It is this skill's configuration: the vault path and how to access it, the folder table, the filename and date conventions, and which categories are tracked. Everything below is written against a generic kepano vault and resolves its concrete values from that file.

## One question decides the folder: who wrote it

kepano's rule: *"If a note is in the root, I know it's something I wrote, or relates directly to me. References is where I write about things that exist outside my world."*

So ask: **did the user author this idea, or does it exist independently in the world?**

- The user's own thoughts, journal, project logs, an insight they had, go to `Notes/` (the root).
- A standard concept, term, book, person, or place goes to `References/`.
- A capture never goes in `Categories/`. That folder holds hub notes only, one per collection, written when you build a category rather than when you capture.

"N+1 problem" lives in `References/` because it exists in the world. The user's coined observation "conservative retreat is not verification" lives in `Notes/` because they made it up.

## What kind of capture is this

**A quick thought, today's work, a dated entry.** One note in `Notes/`, named by the timestamp-plus-title convention in `references/vault-map.md`. A bare timestamp is unfindable later.

**A reusable concept in a tracked collection** (a software design concept, an interview-prep item). This is the high-value case. It becomes a `References/` note linked into a Category so it accumulates and appears in that Category's Base. Read `references/bases-and-categories.md` for the frontmatter, the standard-term convention, and how to build a new category.

**Several concepts from one session.** Write the dated session log in `Notes/`, then split each *reusable* concept into its own `References/` note linked to a category. Have the session note embed the category Base's newest-first view (`![[<category>.base#<that view>]]`, named in `references/vault-map.md`) so it reads in one place. Do not paste concept bodies into the session note; that ballooned an earlier note to 280 lines, and the Base embed keeps it to a screen.

## Conventions that keep the vault coherent

- **Concept titles use the standard English term**, with Korean and synonyms in `aliases`, so both resolve to one note. Verify a term is real industry vocabulary before titling a note with it; `references/bases-and-categories.md` covers why and what to do with a coinage.
- **Link profusely**, including to notes that do not exist yet. Unresolved `[[links]]` are breadcrumbs, not errors. An unresolved link from a typo or a rename is a real defect. The difference is intent.
- **Reuse property names across categories** (`source`, `confidence`, `standard`, `type`) so one Base grammar works everywhere. Do not invent a per-category property when an existing one fits.

## After writing, verify

Both failure modes here are silent, so check rather than assume.

1. **Broken links.** Scan the notes you touched for `[[links]]` whose target is not an existing filename or alias. Pre-existing unresolved links in older notes are fine; ones you just created are bugs.
2. **Base YAML.** Parse any `.base` file you wrote before trusting it; a malformed filter shows an empty table with no error. `references/bases-and-categories.md` lists what to check.

**Never damage vault-origin files.** For a bulk edit, select by *ownership* (notes you created this session, matched by their category link), never by a shared *property* like a tag. The vault's original kepano files carry those tags, and a property-based selector strips them too. This is not hypothetical: an earlier tag-based sweep stripped `0🌲` from a kepano template. If Obsidian is running, a filesystem rename will not update backlinks, so rename in-app or tell the user the links need a look.

## What not to capture

Practice problems, someone else's article, and a paid product's prose are not authored notes. A clipped article belongs in `Clippings/` (kepano's folder for others' writing). A practice question is something to *solve*: the note is the user's answer, not the prompt. Summarize and attribute rather than copy.
