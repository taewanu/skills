Skills live under `skills/<bucket>/<skill-name>/`:

- `engineering/`: daily code and product work
- `productivity/`: daily non-code workflow tools
- `personal/`: tied to one person's own setup, never promoted
- `in-progress/`: drafts not yet ready to ship
- `deprecated/`: no longer used

Every skill in `engineering/` and `productivity/` must have a reference in the top-level `README.md` and an entry in `.claude-plugin/plugin.json`'s `skills` array; the plugin ships exactly that promoted set. Skills in `personal/`, `in-progress/`, and `deprecated/` appear in neither.

A `personal/` skill is one whose value depends on knowing a specific person's setup, so generalizing it away would stop it working. Keep the mechanics generic anyway and isolate the concrete values (paths, names, per-install configuration) in a single reference file the skill reads, so pointing it at a different setup means rewriting that one file.

Each skill entry in the top-level `README.md` must link the skill name to its `SKILL.md`.

`plugin.json` deliberately carries no `version`, so Claude Code versions the plugin by commit SHA and installed users get every push. `claude plugin validate .` warns about the missing field; that warning is the intended state. Adding a version would mean no user sees a change until the field is bumped by hand.

A skill's `description` is the only part loaded into context every turn, and it is truncated at 1,536 characters. Keep it under ~700: enough for the trigger phrases (Korean and English) that drive auto-invocation, with the mechanics and rationale in the body instead.

Run `scripts/link-skills.sh` to symlink every skill into `~/.claude/skills` and `~/.agents/skills`. Re-run it after adding, removing, or renaming a skill.

Skills that generate an HTML page should end with an export/action button (copy as JSON / prompt / markdown / values) that round-trips the user's interaction back into pasteable text, whenever the page involves interaction or a decision, so the user stays in the loop.
