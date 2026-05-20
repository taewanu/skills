# time-tracking Skill

Claude Code Skill for solo freelance/personal time tracking. Auto-captures timestamps, timezone, and project. Categorizes work for retrospective analysis and client invoicing.

## Invocation

Single slash command, sub-action by natural language:

```
/time-tracking            ← shows status (default)
/time-tracking start
/time-tracking end
/time-tracking analyze this-week
/time-tracking invoice acme-corp 2026-05
/time-tracking status
```

Natural-language triggers also work without the slash: "시작", "끝", "이번 주 분석", etc.

## Install

Recommended (agents/ source of truth, symlinked to claude):

```bash
unzip time-tracking-bundle.zip
cd time-tracking-bundle

mkdir -p ~/.agents/skills ~/.claude/skills
mv time-tracking ~/.agents/skills/
ln -s "$HOME/.agents/skills/time-tracking" ~/.claude/skills/time-tracking

# Verify
ls -la ~/.claude/skills/time-tracking
```

Or simple copy:

```bash
mkdir -p ~/.claude/skills
cp -r time-tracking ~/.claude/skills/
```

Restart Claude Code so the new skill is picked up.

## (Optional) Billing rates

Only needed for invoicing:

```bash
cp ~/.claude/skills/time-tracking/templates/billing_rates.md ~/.claude/billing_rates.md
# Edit with your real clients and rates
```

## Sub-actions

| Sub-action | What it does |
|---|---|
| `start` | Open a new session, auto-capture time/TZ/project. If another session is open, prompts to switch / pause / run concurrent / cancel. |
| `end [project]` | Close a session and write entry. Asks which one if multiple are active. |
| `pause [project]` | Suspend a session without writing an entry. Accumulates time across resumes. |
| `resume [project]` | Re-open a paused session. |
| `switch <project>` | Shortcut: close current with minimal questions, start new. |
| `discard [project]` | Drop a session without writing an entry (for accidental starts or forgotten sessions where the time is lost). |
| `end <project> --at <time>` | Close a session with a manually-set end time (for "I quit at 17:00 yesterday"). |
| `status` | Show all open and paused sessions, with a ⚠️ flag on stale ones (default if no sub-action). |
| `analyze [period]` | Breakdown by category/project/tool/location. |
| `invoice <client> [period]` | Generate invoice draft. |

## Period syntax (for analyze/invoice)

`today` · `this-week` · `last-week` · `this-month` · `last-month` · `2026-05` · `2026-05-01..2026-05-15`

Defaults: `analyze` → `this-week`, `invoice` → `this-month`.

## Categories (fixed, 8)

`planning` · `design` · `decisions` · `implementation` · `debugging` · `infra` · `meta` · `other`

See `time-tracking/references/category_guide.md` for the decision tree.

## File locations after install

| Path | Purpose | Created by |
|---|---|---|
| `~/.claude/skills/time-tracking/` | Skill (symlink to agents/) | you |
| `~/.claude/billing_rates.md` | Client rates (optional) | you |
| `~/.claude/time-tracking-state.json` | Open session state | Skill |
| `~/.claude/projects/*/memory/project_time_tracking.md` | Per-project entries | Skill |

## Notes

- Claude Code only — relies on filesystem + bash.
- Multiple sessions can run at once (switch, pause+resume, or fully concurrent — chosen at runtime when `start` hits an open session).
- Legacy verbose entries (pre-Skill) parsed compatibly. New entries write in slim format.
- State file shape changed (`current_session` → `sessions[]`); old shape is auto-migrated on first read.
- Restart Claude Code after install.
