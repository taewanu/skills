---
name: time-tracking
description: Track per-session work time on freelance/personal projects with automatic timestamps, timezone, and category breakdowns. Supports multiple open sessions via switch / pause+resume / concurrent. Use whenever the user wants to start, end, pause, resume, switch, analyze, or invoice a work session — including phrases like "시작", "끝", "일시정지", "재개", "전환", "갈아타", "타임 트래킹 시작", "세션 종료", "이번 주 분석", "분석해줘", "<client> 청구서", "start tracking", "end session", "pause session", "resume", "switch to <project>", "analyze hours", "invoice for X", or simply invoking the skill via /time-tracking. Triggers on any work-session timing intent, even if the user doesn't say "track" or "skill" explicitly.
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
| `pause` | "일시정지", "잠깐 멈춰", "pause" |
| `resume` | "재개", "다시 시작", "resume" |
| `switch` | "전환", "갈아타", "switch", "switch to" |
| `discard` | "폐기", "버려", "지워", "discard", "drop" |
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

4. **Check for existing sessions**: read `~/.claude/time-tracking-state.json`.
   - If `sessions` list is empty, proceed to step 5.
   - If a session for the **same project** is already `active`, tell user `이미 진행 중: <project> (Xh Ym)` and stop. Do not silently open a duplicate.
   - If a session for the **same project** is `paused`, offer:
     ```
     <project>이 일시정지 상태야 (누적 Xh Ym, 마지막 멈춤 HH:MM).
       (a) 재개 (resume)
       (b) 새 세션으로 따로 시작 (드물게 — 기존 paused는 그대로 둠)
       (c) 취소
     ```
   - If sessions exist on **different projects**, first **check for staleness**: any session whose last open segment started >12h ago AND whose state file mtime is also >12h ago is treated as abandoned. If at least one stale session is found, route to the §"Stale-session subflow" (which handles cleanup, not live switching). Otherwise route to the §"Session conflict subflow" (which assumes both sessions are alive).

5. **Read previous slipped** (optional context): from same-project tracking file, find the most recent entry, extract `slipped:` line if present.

6. **Write state file**: append a new session object to the `sessions` list (see schema in §"State file"). Don't overwrite existing entries — the list can hold multiple.

7. **Confirm to user** (concise):
   ```
   <HH:MM> <TZ>, <project> 시작. 이전 slipped: <one line>. 이어가?
   ```
   If no previous slipped, drop that clause. If other sessions are still active or paused, add one line: `진행 중인 다른 세션: <other-project> (<HH:MM>–, Xh Ym).`

### Session conflict subflow

Triggered from `start` when one or more sessions on a different project are already in state (active or paused). All `<...>` below are placeholders the skill fills at runtime.

Show:
```
진행 중:
  - <existing-project>: <HH:MM> <TZ> (Xh Ym) [active|paused]

<new-project> 시작 — 어떻게 처리할까?
  (a) 전환 (switch)   — <existing-project> 마감하고 <new-project> 시작
  (b) 일시정지 (pause) — <existing-project> 멈추고 <new-project> 시작. 나중에 resume.
  (c) 동시 (concurrent) — 둘 다 진행
  (d) 취소
```

- **(a) switch**: run the §"Switch shortcut mode" of `end` on the existing session — ask only for `shipped` (one line). Other fields filled as `TBD` for later edit. Then proceed with the new `start`.
- **(b) pause**: run the §"Sub-action: pause" flow for the existing session (no questions — pure state change). Then proceed with the new `start`.
- **(c) concurrent**: leave existing sessions untouched. Append the new session to the active list. Proceed with the new `start`. **Heads up**: project auto-detection still uses current `pwd`. If the user is still cd'd into the existing project's directory, they must pass the new project name explicitly (`start <new-project>`) or cd first — otherwise the new "concurrent" session will write into the old project's tracking file.
- **(d) cancel**: abort the new start. Existing sessions unchanged.

If multiple sessions are already in state:
- List all of them grouped by status (active first, then paused), each with its current elapsed time.
- Ask the user how to resolve each one individually, OR offer "전부 같은 선택?" to apply one choice to all.
- Choices apply only where they make sense: (a) switch and (b) pause act on `active` sessions only — `paused` ones are left untouched unless explicitly named in a follow-up.

### Stale-session subflow

Triggered from `start` when one or more existing sessions look abandoned (last segment started >12h ago AND state file mtime >12h ago). Don't show the live conflict choices — they assume the user is mid-flow on the old session, which they're not. Instead:

```
⚠️ <existing-project> 세션이 안 닫혀있어:
  - 시작: <원래 시작 시각 + 날짜>
  - state 파일 마지막 수정: <state mtime + 날짜> (Xh 전)

어떻게 처리할까?
  (a) <state mtime>로 종료 처리 (추정 — 정확하진 않음)
  (b) 종료 시간 직접 입력 (예: "어제 17:00")
  (c) 폐기 — entry 안 쓰고 그냥 버림
  (d) 살아있는 세션이었어 → 일반 switch/pause/concurrent 메뉴
```

- **(a) estimate**: run §"Sub-action: end" on the existing session with end time = state file mtime. Use the **switch shortcut mode** prompt (shipped only, others `TBD`) but additionally add `- needs-edit: end-time (estimated from state mtime)` to the entry so the user can grep for and correct it later. Then proceed with the new `start`.
- **(b) manual**: prompt for an `HH:MM` (assume same date as the session's start unless user qualifies with "어제"/"yesterday" or an explicit date). Run §"Sub-action: end" with that time. Same switch-shortcut prompt for the other fields.
- **(c) discard**: drop the session from state without writing any entry. Confirm: `<existing-project> 폐기 (entry 안 씀).` Then proceed with the new `start`.
- **(d) actually alive**: fall through to the §"Session conflict subflow" with its normal choices.

If multiple stale sessions exist, ask per-session, OR offer "전부 폐기" / "전부 mtime으로 종료" shortcuts.

## Sub-action: `end [project] [--at <time>]`

1. **Read state**: load `sessions` from state file. Pick the target session:
   - If user passed a project name (e.g. "end <project>" / "<project> 끝"), match by project name (case-insensitive).
   - Else if exactly one `active` session exists, use it.
   - Else if multiple active sessions exist, list them and ask: `어느 세션 끝낼까? (a) <project-A> (b) <project-B> ...`.
   - Else if no sessions at all, tell user `진행 중인 세션 없어` and stop.

2. **Capture end time**: same as start. If the user passed `--at <time>` (or natural-language equivalents like "어제 17:00" / "at 5pm"), parse to ISO using the session's TZ. Must be ≥ the last segment's start_iso — otherwise error and ask again. Show the parsed result back to the user before writing: `종료 시각: 2026-05-19 17:00 ICT — 맞아?`

3. **Compute duration**: sum of `(segment.end - segment.start)` for each segment in the session, with the final open segment's end set to the capture time. Hours, 2 decimal places. If the session was ever paused (more than one segment), also compute the paused gap = `(end of session window) - (sum of segments)`, formatted as `Xh Ym` for the entry note (not decimal hours — the gap is auxiliary info, not billable time).

4. **Date boundary check**: if the session's first start date ≠ end date, split into multiple entries (one per date, with midnight as the split point). Run the rest of this flow for each split. For multi-segment sessions, attribute each segment to its own date first, then merge same-date segments.

5. **Ask user for the parts that can't be inferred** (one combined prompt):
   ```
   16:45 ICT, 2.25h.

   카테고리 % (총 100, 5–10 단위)? 직전 같은 project 분포 참고:
     infra 30, decisions 25, meta 20, debugging 15, other 10

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

9. **Update state file**: remove this session from the `sessions` list (other sessions, if any, untouched).

10. **Show user the written entry** for confirmation.

### Switch shortcut mode

Triggered by the §"Session conflict subflow" picking (a), or by the user invoking `switch <new-project>` directly (see §"Sub-action: switch").

Behaves like `end` but with a minimal prompt — only `shipped` is asked. Other fields are filled as placeholders for later manual edit:

- `cat`: `TBD` (no key/pct pairs)
- `slipped`: omitted
- `retro`: omitted
- `billable`: `TBD`

Entry is still written and the session is removed from state, but the entry includes a trailing sub-bullet: `- needs-edit: cat, billable` so the user can grep for incomplete entries later. The switch confirmation tells the user which entry to edit, e.g. `<HH:MM> <TZ>, <project> 마감 (draft — categories/billable 나중에 편집).`

## Sub-action: `status`

1. Read state file.
2. If `sessions` list is empty: respond
   ```
   진행 중인 세션 없어. 어떤 작업을 할지 알려줘:
     - start    — 세션 시작
     - resume   — 일시정지된 세션 재개
     - analyze  — 시간 분석
     - invoice  — 청구서 생성
   ```
3. Else, show each session grouped by status. Within each group, sort by the session's `start_iso` ascending so sessions appear in the order they were opened.
   ```
   진행 중 (N):
     - <project>: <HH:MM> <TZ> (Xh Ym 경과) [active]
       기록 파일: <path>
     - <project>: <HH:MM> <TZ> (Xh Ym 경과) [active]
       기록 파일: <path>

   일시정지 (M):
     - <project>: <HH:MM>–<HH:MM> <TZ> (Xh Ym 누적, 마지막 멈춤 HH:MM)
       기록 파일: <path>
   ```
   Omit the `일시정지` block if no paused sessions; omit the `진행 중` block if all are paused. If any session is stale (criteria from `start` step 4), flag it with `⚠️ Xh 전부터 안 닫힘` after the elapsed time so the user sees it without running `start`.

## Sub-action: `pause [project]`

1. Read state. Pick target session (same rules as `end` step 1, but only `active` sessions are eligible — if all are paused, say so and stop).
2. Capture pause time (same `date` calls as `start`).
3. Close the open segment: set its `end_iso` to the pause time.
4. Set the session's `status` to `paused`.
5. Confirm: `<HH:MM> <TZ>, <project> 일시정지 (누적 Xh Ym).`

No questions are asked — this is a pure state change. Categories, shipped, etc. are deferred to `end`.

## Sub-action: `resume [project]`

1. Read state. Find target session:
   - If user passed a project name, match against `paused` sessions.
   - Else if exactly one `paused` session exists, use it.
   - Else if multiple, list and ask.
   - Else if none, tell user `일시정지된 세션 없어` and stop.
2. Capture resume time.
3. Append a new open segment: `{start_iso: <now>, end_iso: null}`.
4. Set the session's `status` to `active`.
5. Confirm: `<HH:MM> <TZ>, <project> 재개 (누적 Xh Ym).`

Note: `resume` does **not** pause any other currently-active session. If the user wants a strict swap, they should `pause <other>` first, then `resume <this>`.

## Sub-action: `switch <new-project>`

Shortcut for "close the current session quickly and start a new one." Equivalent to picking (a) in the §"Session conflict subflow".

1. If no session is active, behaves like `start <new-project>`.
2. If exactly one active session exists, run §"Switch shortcut mode" of `end` on it, then `start` the new project.
3. If multiple active sessions exist, ask which one to switch from (or whether to close all). Then proceed.

If the user just says `switch` with no project name, prompt for one. Don't infer from cwd here — `switch` is an explicit intent.

## Sub-action: `discard [project]`

Drops a session from state without writing any tracking-file entry. For when the user realizes a session was opened by accident or was forgotten and the time is lost beyond recovering.

1. Read state. Pick target (same rules as `end` — explicit project name, else single session, else list and ask).
2. **Confirm before destroying** (this is unrecoverable): `<project> 폐기? 시작 <HH:MM> <TZ>, 누적 Xh Ym. (y/N)`
3. On `y`, remove the session from the `sessions` list. Confirm: `<project> 폐기됨.`
4. On `N` or anything else, abort.

Unlike `end`, `discard` writes nothing to the tracking file — the session's time is forgotten on purpose.

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
  - needs-edit: <field>, <field> # omit if entry is complete (added by switch shortcut)
```

Indent: 2 spaces for sub-bullets. No blank lines between sub-bullets.

**Pause/resume sessions**: the window on the first line stays `<first-segment-start>–<last-segment-end>` for human readability, but the `(X.XXh)` duration is the sum of segments (excluding paused gaps). If a session was paused at any point, append a `paused Yh Ym` note inside the parens: `(2.30h, paused 1h 15m)`. Parsers should accept both `(X.XXh)` and `(X.XXh, paused …)`.

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
  "sessions": [
    {
      "id": "<project-slug>-<YYYYMMDD>-<HHMM>",
      "project": "<display name>",
      "start_iso": "2026-05-19T14:30:00+07:00",
      "tz_display": "ICT",
      "tz_full": "Asia/Bangkok",
      "location": "Bangkok",
      "tool": "Claude Code",
      "tracking_file": "/Users/wanu/.claude/projects/.../memory/project_time_tracking.md",
      "previous_slipped": "<one line, from last entry in tracking file>",
      "status": "active",
      "segments": [
        {"start_iso": "2026-05-19T14:30:00+07:00", "end_iso": null}
      ]
    }
  ]
}
```

The `sessions` list can hold multiple entries. Each session is independent — it has its own segments, status (`active` or `paused`), and tracking file.

**Segments**: a session is a list of `{start_iso, end_iso}` segments. The currently-open segment has `end_iso: null`. Pausing closes the open segment (set `end_iso` to now) and flips `status` to `paused`. Resuming appends a new `{start_iso: now, end_iso: null}` and flips `status` back to `active`. Duration = sum of `(end - start)` across all segments, with `null` end treated as "now" for live computation.

**id**: stable identifier for the session, used to disambiguate when multiple sessions share a project name (rare but possible after a switch-then-restart, or after the paused-same-project (b) "새 세션으로 따로 시작" branch). Format: `<project-slug>-<YYYYMMDD>-<HHMM>` from the first segment's start. When `end`, `pause`, `resume`, or `discard` is invoked with only a project name and two sessions share it, list both by `id` (annotated with start time) and ask which.

**Location inference**: if `tz_full` is `Asia/Bangkok` → "Bangkok", `Asia/Seoul` → "Korea", `America/Vancouver` → "Vancouver", else use the TZ name. User can override mid-session by saying "I'm in <place>".

**Migration from v1 single-session shape**: if the state file has a top-level `current_session` object (old format), read it once, wrap it as `{sessions: [<old-object-with-status:active-and-single-segment>]}`, and rewrite. Don't fail on the legacy shape.

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
- categories (as `{key: pct}` map; `TBD` means unset — exclude from category aggregation but still count toward total hours)
- tool / location / billable (from tags or legacy fields; `TBD` billable means unset — exclude from any client filter)
- paused gap (optional, parsed from `(X.XXh, paused Yh Ym)` — informational only, doesn't affect totals)
- `needs-edit:` sub-bullet (informational; `analyze` should append a footnote like `Note: N draft entries need editing (cat or billable TBD)` so the user remembers to come back)

Both legacy and slim entries can coexist in the same file. New entries always written in slim format.

## Tone and behavior

- **Don't fabricate numbers**. Category % must come from the user. Never guess silently.
- **Don't overstate**. Confirmations are dry: `<HH:MM> <TZ>, <project> 시작.` not "🚀 시작합니다!"
- **Show inferred values**. When auto-detecting project from cwd or splitting across date boundary, show the user what was inferred and let them override.
- **Korean or English**: match the user's language for confirmations. Default Korean for Wanu.
- **Never show fake slash commands**. The only real slash invocation is `/time-tracking`. Sub-actions (`start`, `end`, `pause`, `resume`, `switch`, `discard`, `status`, `analyze`, `invoice`) are natural-language words, not slash commands. Don't tell the user to type "/tt-start" or similar — those don't exist.
- **One-line confirmations for state changes**. `pause`, `resume`, `discard`, `switch` write nothing to the tracking file (except `switch`'s draft entry). Confirmations stay to one line, matching the dryness of `start`/`end`: e.g. `<HH:MM> <TZ>, <project> 일시정지 (누적 Xh Ym).`
- **Confirm before destructive action**. `discard` and the stale-session (c) "폐기" branch destroy time data permanently. Always show a `(y/N)` prompt with the time about to be lost — never act on first invocation.
- **Don't hardcode project or client names in prompts**. Use `<project>`, `<client>`, `<HH:MM>` placeholders. The names get filled at runtime from state — putting a real name like "Sounds Abroad" or "Acme" into the spec's prompt text makes it read like it's wired for one user.

## Edge cases

- **System clock changed mid-session**: trust the captured ISO timestamps. Don't recompute from "now".
- **Session crosses DST**: compute duration from ISO timestamps (which carry offset), not wall-clock HH:MM.
- **Tracking file manually edited**: re-parse on every read. No caching.
- **`billing_rates.md` has a client in "Archived"**: still resolvable for historical invoices but warn user.
- **Category sum 95–105**: accept and normalize internally. <95 or >105: ask user to fix.
- **Very short session (<5 min)**: still record. User decides if it's meaningful.
- **Pause spans midnight**: when an open segment crosses midnight, the date-boundary split in `end` step 4 still applies to each individual segment. A session with segments `[09:00–13:00 day-N, 22:00–01:30 day-N+1]` produces three entries: full day-N (12:00 chunk + 22:00–24:00), and 00:00–01:30 on day-N+1. The paused gap (13:00–22:00) is just ignored — it belongs to no day.
- **Forgotten / abandoned session**: handled by the §"Stale-session subflow" of `start`, and visible via the staleness flag in `status`. The user can also invoke `discard <project>` or `end <project> --at <time>` directly without going through `start`.
- **Concurrent sessions overlapping in wall time**: deliberately allowed — the spec records the literal segments and `analyze` sums them straight. If you billed 2h to client A and 2h to client B in the same 13:00–15:00 window, total comes out as 4h. See §"What this Skill does NOT do" for the analyze-side caveat.

## What this Skill does NOT do

- Idle detection / auto-pause (pause is explicit only)
- Charts / visualizations
- Sync with external trackers (Toggl, Harvest)
- Pomodoro / notifications
- Migrating legacy entries to slim format (kept as-is, parsed compatibly)
- Auto-recovery of forgotten sessions — stale sessions (>12h) are flagged in `status` and on next `start`, but never silently closed; user picks the resolution
- Overlap deduplication in `analyze` — two concurrent sessions in the same wall-clock window are both summed into the total. Future: surface a `Note: Xh of overlap across N concurrent sessions` line under the total so the user notices.
