# Skills

Personal Claude Code skills I use for freelance and product engineering work.

## Install

As a Claude Code plugin, inside Claude Code:

```
/plugin marketplace add taewanu/skills
/plugin install taewanu-skills@taewanu
```

The plugin ships the Engineering and Productivity skills below and follows `main`, so every push reaches installed users.

To work on the skills instead, clone the repo and run `scripts/link-skills.sh`. It symlinks every skill (including `in-progress/`) into `~/.claude/skills` and `~/.agents/skills`, so an edit here is live immediately and `git pull` is the whole update story.

## Engineering

Skills for code and product work.

* **[step-back-as-user](skills/engineering/step-back-as-user/SKILL.md)** — Step out of the solution frame and re-enter from the user's side. Two modes: **friction** (become the user, find where they stall) and **reference** (study how 2–3 peers solve the same moment and the tradeoffs they took). Stops before redesigning.

## Productivity

General workflow tools, not code-specific.

* **[time-tracking](skills/productivity/time-tracking/SKILL.md)** — Track work sessions inside Claude Code. Auto-captured start/end time and project, one prompt for category split and shipped notes, appended as plain markdown for retrospective analysis or client invoicing.
* **[visual-ui-compare](skills/productivity/visual-ui-compare/SKILL.md)** — Turn a visual decision into a self-contained HTML page and open it in the browser: a side-by-side grid of variants with identical content, or a live preview with sliders when the choice is motion or a continuous range. Decide by eye, then patch the pick back into the code. Reach for it instead of an AskUserQuestion with 2+ visual options.
