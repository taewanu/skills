---
name: time-tracking
description: Track per-session work time on freelance/personal projects with automatic timestamps, timezone, and category breakdowns. Use whenever the user wants to start, end, analyze, or invoice a work session — including phrases like "시작", "끝", "타임 트래킹 시작", "세션 종료", "이번 주 분석", "분석해줘", "<client> 청구서", "start tracking", "end session", "analyze hours", "invoice for X", or simply invoking the skill via /time-tracking. Triggers on any work-session timing intent, even if the user doesn't say "track" or "skill" explicitly.
---

# Time Tracking

Records work sessions to per-project `project_time_tracking.md` files. Designed for solo freelance/personal work where the goal is:

1. **Retrospective analysis** — "How much time did I spend on debugging this month?"
2. **Client invoicing** — generate billable totals using rates from `~/.claude/billing_rates.md`
3. **Zero friction** — auto-capture timestamps, timezone, project; user only supplies what can't be inferred

## Invocation

This skill is invoked via the `/time-tracking` slash command, or by natural-language phrases matching the description.

Sub-actions are determined by the user's words:

| Sub-action | User phrases (Korean / English) |
|---|---|
| `start` | "시작", "시작할게", "start", "start tracking", "begin session" |
| `end` | "끝", "종료", "마쳤어", "end", "stop", "wrap up" |
| `status` | "상태", "지금 세션", "status", "what's open" |
| `analyze` | "분석", "이번 주", "this week", "analyze", "breakdown" |
| `invoice` | "<client> 청구", "invoice for <client>", "bill <client>" |

If `/time-tracking` is invoked with no further input, default to `status`. After showing status, list the available sub-actions so the user can pick.

## Sub-action: `start`

1. **Capture start time**: run `date -u +"%Y-%m-%dT%H:%M:%SZ"` for UTC ISO, then `date +"%H:%M %Z"` for local display. Read system timezone via `date +%Z` and full TZ name via `readlink /etc/localtime | sed 's|.*/zoneinfo/||'` (macOS/Linux). Don't ask the user — read it.

2. **Auto-detect project**:
   - Run `pwd`.
   - Extract project name from last directory segment, Title Case it (`sounds-abroad` → "Sounds Abroad").
   - If user passed a project name explicitly (e.g. "start working on Acme"), use that instead.

3. **Resolve tracking file path**:
   - Default: `~/.claude/projects/<encoded-cwd>/memory/project_time_tracking.md`
   - Encoding: `pwd` with `/` replaced by `-`, leading `-` kept. E.g. `/Users/wanu/projects/sounds-abroad` → `-Users-wanu-projects-sounds-abroad`.
   - If `memory/` dir doesn't exist, create it.
   - If tracking file doesn't exist, create it with the header from `templates/tracking_file_header.md`.

4. **Check for unclosed session**: read `~/.claude/time-tracking-state.json`.
   - If `current_session` exists, follow the §"Unclosed session" subflow below.

5. **Read previous slipped** (optional context): from same-project tracking file, find the most recent entry, extract `slipped:` line if present.

6. **Write state file** with start info (see schema in §"State file").

7. **Confirm to user** (concise):
   ```
   14:30 ICT, Sounds Abroad 시작. 이전 slipped: Issue #4. 이어가?
   ```
   If no previous slipped, just: `14:30 ICT, Sounds Abroad 시작.`

### Unclosed session subflow

Show the user:
```
이전 세션이 닫히지 않았어:
  - project: <name>
  - 시작: <start time + TZ>
  - 마지막 활동 추정: <state file mtime> (state 파일 수정 시각 기준 — 부정확할 수 있음)

어떻게 처리할까?
  (a) 추정 시간으로 종료 처리
  (b) 폐기 (잘못 시작했음)
  (c) 수동으로 종료 시간 입력
```

- (a): write entry using mtime as end, mark in shipped field `[end time estimated from state mtime]`, then proceed to new start.
- (b): delete state, proceed to new start.
- (c): prompt for `HH:MM` (assume same date as start unless user says otherwise), write entry, then proceed.

Do NOT offer a "resume" option. Each `/time-tracking start` opens a fresh session for data clarity.

## Sub-action: `end`

1. **Read state**: load `current_session` from state file. If missing, tell user "진행 중인 세션 없어" and stop.

2. **Capture end time**: same as start.

3. **Compute duration**: `(end - start)` in hours, 2 decimal places.

4. **Date boundary check**: if start date ≠ end date, split into multiple entries (one per date, with midnight as the split point). Run the rest of this flow for each split.

5. **Ask user for the parts that can't be inferred** (one combined prompt):
   ```
   16:45 ICT, 2.25h.

   카테고리 % (총 100, 5–10 단위)? 직전 같은 project 분포 참고:
     infra 30, decisions 25, meta 20, memory 10, other 15

   Shipped (한 줄)?
   Slipped (있으면)?
   Retro memory 파일명 (있으면)?
   Billable client (없으면 'none')?
   ```

   Show previous-session category distribution as reference, not as suggestion.

6. **Validate categories**: keys must be from the 8 allowed (`planning`, `design`, `decisions`, `implementation`, `debugging`, `infra`, `meta`, `other`). Sum should be ~100 (allow 95–105). If invalid, ask again.

7. **Build entry** using the format in §"Entry format" below.

8. **Append to tracking file**:
   - Find the `### YYYY-MM-DD` header for the entry's date.
   - If header doesn't exist, create it in chronological order (newest at top under `## Entries`).
   - Append the entry under that date header.

9. **Clear state file**: remove `current_session`.

10. **Show user the written entry** for confirmation.

## Sub-action: `status`

1. Read state file.
2. If empty/missing: respond
   ```
   진행 중인 세션 없어. 어떤 작업을 할지 알려줘:
     - start    — 세션 시작
     - end      — 세션 종료
     - analyze  — 시간 분석
     - invoice  — 청구서 생성
   ```
3. If present, show:
   ```
   진행 중: Sounds Abroad
     시작: 14:30 ICT (2h 15m 경과)
     기록 파일: ~/.claude/projects/.../project_time_tracking.md
   ```

## Sub-action: `analyze [period]`

1. **Resolve period** to start/end dates. Default `this-week`.

2. **Glob tracking files**: `~/.claude/projects/*/memory/project_time_tracking.md`.

3. **Parse entries** from all files. Support both formats:
   - **Slim** (current): `- HH:MM–HH:MM <TZ> (X.XXh) — <Project> | <Phase>`
   - **Legacy verbose**: `- Window: HH:MM–HH:MM <TZ> (~X.Xh)` with separate fields below

4. **Filter** by date range.

5. **Aggregate**:
   - Total hours
   - By project (hours, %)
   - By category (hours, %, weighted by entry duration × category %)
   - By tool (claude-code, claude-web, etc.)
   - By location

6. **Output** (plain text, no chart):
   ```
   Analysis — this-week (2026-05-13..2026-05-19)

   Total: 18.5h across 7 sessions

   By project:
     - Sounds Abroad: 14.2h (76.8%)
     - Canada Job Tracker: 4.3h (23.2%)

   By category:
     - implementation: 7.4h (40%)
     - decisions: 3.7h (20%)
     - debugging: 2.8h (15%)
     ...

   By tool:
     - Claude Code: 16.1h
     - Claude.ai web: 2.4h

   By location:
     - Bangkok: 14.2h
     - Korea: 4.3h
   ```

## Sub-action: `invoice <client> [period]`

1. **Read** `~/.claude/billing_rates.md`. If missing, tell user to create it (show template).

2. **Find rate** for `<client>` in the Active section. If not found, list available clients.

3. **Resolve period**, default `this-month`.

4. **Glob and parse** entries (same as analyze).

5. **Filter**: entries with `billable:<client>` tag AND no `invoiced:` tag.

6. **Compute**: total hours × rate.

7. **Output**:
   ```
   Invoice draft — acme-corp — 2026-05-01..2026-05-31
   Rate: 80 USD/h

   Total: 23.45h × 80 USD/h = 1,876.00 USD

   Entries (5):
     - 2026-05-03 (Sun) 10:00–14:30 ICT (4.50h) — Acme | landing page
     - 2026-05-05 (Tue) 09:00–13:00 ICT (4.00h) — Acme | checkout flow
     ...

   Category breakdown:
     - implementation: 15.3h (65%)
     - design: 4.7h (20%)
     - debugging: 2.3h (10%)
     - meta: 1.2h (5%)

   Mark all as invoiced? (y/N)
   ```

8. **If user confirms**, add `invoiced:<YYYY-MM-DD-N>` tag to each entry's `tags:` line (where N is an incrementing counter). The id is auto-generated, format `<today>-<counter>`.

## Period syntax

`today`, `this-week`, `last-week`, `this-month`, `last-month`, `2026-05`, `2026-05-01..2026-05-15`.

Defaults: `analyze` → `this-week`, `invoice` → `this-month`.

## Entry format

```
- HH:MM–HH:MM <TZ> (X.XXh) — <Project> | <Phase or Task>
  - tags: tool:<tool>, location:<loc>, billable:<client-or-none>
  - cat: <key> <pct>, <key> <pct>, ...
  - shipped: <one line>
  - slipped: <one line>          # omit if empty
  - retro: <file>, <file>        # omit if empty
```

Indent: 2 spaces for sub-bullets. No blank lines between sub-bullets.

## Categories (fixed, 8)

| Key | When |
|---|---|
| `planning` | Concept, scope, roadmap, feature priority, competitive research, differentiation |
| `design` | UI/UX, mockups, design system, color/typography |
| `decisions` | Architecture, library selection, technical tradeoffs (no code written) |
| `implementation` | Writing production code |
| `debugging` | Tracking down unintended problems |
| `infra` | CI/CD, deployment, env config, build tooling |
| `meta` | Docs, skills, memory files, retros, README |
| `other` | Fallback (use sparingly) |

See `references/category_guide.md` for decision tree on ambiguous cases.

## State file

Path: `~/.claude/time-tracking-state.json`

```json
{
  "current_session": {
    "project": "Sounds Abroad",
    "start_iso": "2026-05-19T14:30:00+07:00",
    "tz_display": "ICT",
    "tz_full": "Asia/Bangkok",
    "location": "Bangkok",
    "tool": "Claude Code",
    "tracking_file": "/Users/wanu/.claude/projects/-Users-wanu-projects-sounds-abroad/memory/project_time_tracking.md",
    "previous_slipped": "Issue #4 Blob bootstrap"
  }
}
```

Only one `current_session` at a time. No concurrent project tracking in v1.

**Location inference**: if `tz_full` is `Asia/Bangkok` → "Bangkok", `Asia/Seoul` → "Korea", `America/Vancouver` → "Vancouver", else use the TZ name. User can override mid-session by saying "I'm in <place>".

## Billable rates file

Path: `~/.claude/billing_rates.md` (user-created; Skill reads only).

Template: `templates/billing_rates.md`.

## Tracking file location

Per-project: `~/.claude/projects/<encoded-cwd>/memory/project_time_tracking.md`.

Encoding: replace `/` with `-` in absolute pwd. E.g. `/Users/wanu/projects/sounds-abroad` → `-Users-wanu-projects-sounds-abroad`.

If a project's tracking file lives elsewhere (legacy or user preference), user can specify it when starting (e.g. "start, tracking file at <path>"). Override stored in state for the session.

## Parsing rules for existing entries

When analyzing or invoicing, parse both formats from the same file:

**Slim format** (preferred):
```
- HH:MM–HH:MM <TZ> (X.XXh) — <Project> | <Phase>
  - tags: ...
  - cat: ...
```

**Legacy verbose** (Sounds Abroad pre-Skill entries):
```
- Window: HH:MM–HH:MM <TZ> (~X.Xh)
- Location: ...
- Tool: ...
- Categories: cat A%, cat B%, ...
- Shipped: ...
```

Extract:
- duration (hours)
- date (from parent `### YYYY-MM-DD` header)
- categories (as `{key: pct}` map)
- tool / location / billable (from tags or legacy fields)

Both legacy and slim entries can coexist in the same file. New entries always written in slim format.

## Tone and behavior

- **Don't fabricate numbers**. Category % must come from the user. Never guess silently.
- **Don't overstate**. Confirmations are dry: "14:30 ICT, Sounds Abroad 시작." not "🚀 시작합니다!"
- **Show inferred values**. When auto-detecting project from cwd or splitting across date boundary, show the user what was inferred and let them override.
- **Korean or English**: match the user's language for confirmations. Default Korean for Wanu.
- **Never show fake slash commands**. The only real slash invocation is `/time-tracking`. Sub-actions (`start`, `end`, `status`, `analyze`, `invoice`) are natural-language words, not slash commands. Don't tell the user to type "/tt-start" or similar — those don't exist.

## Edge cases

- **System clock changed mid-session**: trust the captured ISO timestamps. Don't recompute from "now".
- **Session crosses DST**: compute duration from ISO timestamps (which carry offset), not wall-clock HH:MM.
- **Tracking file manually edited**: re-parse on every read. No caching.
- **`billing_rates.md` has a client in "Archived"**: still resolvable for historical invoices but warn user.
- **Category sum 95–105**: accept and normalize internally. <95 or >105: ask user to fix.
- **Very short session (<5 min)**: still record. User decides if it's meaningful.

## What this Skill does NOT do (v1)

- Idle detection / auto-pause
- Concurrent multi-project sessions
- Resume of unclosed sessions (deliberate — fresh start each invocation)
- Charts / visualizations
- Sync with external trackers (Toggl, Harvest)
- Pomodoro / notifications
- Migrating legacy entries to slim format (kept as-is, parsed compatibly)
