Skills live under `skills/<bucket>/<skill-name>/`:

- `engineering/` — daily code and product work
- `productivity/` — daily non-code workflow tools
- `in-progress/` — drafts not yet ready to ship
- `deprecated/` — no longer used

Every skill in `engineering/` and `productivity/` must have a reference in the top-level `README.md`.

Each skill entry in the top-level `README.md` must link the skill name to its `SKILL.md`.

Skills that generate an HTML page should end with an export/action button (copy as JSON / prompt / markdown / values) that round-trips the user's interaction back into pasteable text — whenever the page involves interaction or a decision, so the user stays in the loop.
