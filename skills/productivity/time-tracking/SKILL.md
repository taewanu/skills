---
name: time-tracking
description: Track per-session work time on freelance/personal projects with automatic timestamps, timezone, and category breakdowns. Supports multiple open sessions via switch / pause+resume / concurrent. Use whenever the user wants to start, end, pause, resume, switch, analyze, or invoice a work session, including phrases like "시작", "끝", "일시정지", "재개", "전환", "갈아타", "타임 트래킹 시작", "세션 종료", "이번 주 분석", "분석해줘", "<client> 청구서", "start tracking", "end session", "pause session", "resume", "switch to <project>", "analyze hours", "invoice for X", or simply invoking the skill via /time-tracking. Triggers on any work-session timing intent, even if the user doesn't say "track" or "skill" explicitly.
---

# Time Tracking

Records work sessions to per-project `project_time_tracking.md` files. Designed for solo freelance/personal work where the goal is:

1. **Retrospective analysis**: "How much time did I spend on debugging this month?"
2. **Client invoicing**: generate billable totals using rates from `~/.claude/billing_rates.md`
3. **Zero friction**: auto-capture timestamps, timezone, project; user only supplies what can't be inferred

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

## Asking questions

For any step that picks among a fixed set of choices, use the **AskUserQuestion** tool instead of printing the options as text: so the user selects or presses a number rather than typing the answer. This covers the Session-conflict flow and the Stale-session flow (in `references/start-subflows.md`), the "which session?" pickers in `end` / `pause` / `resume` / `discard`, the `end` category-proposal confirm (그대로 / 수정), and "Mark all as invoiced?".

The lettered blocks in this spec are the option *content*, not a literal prompt: map each letter to one AskUserQuestion option (label = the short choice, description = what it does), keep the order, and put any context the user needs to decide (elapsed time, conflicting sessions) in the question text.

Two carve-outs stay as typed prompts:
- **Free-text input**: the `end` combined prompt (category %, shipped / slipped lines) and any `HH:MM` / date entry can't be enumerated.
- **Destructive `(y/N)` confirmations**: `discard` and the stale (c) "폐기" branch keep the typed `(y/N)` gate; the friction is deliberate for an irreversible delete.

If AskUserQuestion isn't available in the current context, fall back to printing the lettered block and waiting for a typed reply.

## Sub-action: `start`

1. **Capture start time**: run `date -u +"%Y-%m-%dT%H:%M:%SZ"` for UTC ISO, then `date +"%H:%M %Z"` for local display. Read system timezone via `date +%Z` and full TZ name via `readlink /etc/localtime | sed 's|.*/zoneinfo/||'` (macOS/Linux); read it from the system rather than asking the user.

2. **Auto-detect project**:
   - Run `pwd`.
   - Extract project name from last directory segment, Title Case it (`<project-slug>` → "<Project Name>").
   - If user passed a project name explicitly, use that instead.

3. **Resolve tracking file path**:
   - Default: `~/.claude/projects/<encoded-cwd>/memory/project_time_tracking.md`
   - Encoding: `pwd` with `/` replaced by `-`, leading `-` kept. E.g. `/Users/me/projects/example-app` → `-Users-me-projects-example-app`.
   - If `memory/` dir doesn't exist, create it.
   - If tracking file doesn't exist, create it with the header from `templates/tracking_file_header.md`.
   - If the user names a different path (legacy or preference), use it and store the override in the session state.

4. **Check for existing sessions**: read `~/.claude/time-tracking-state.json`.
   - If `sessions` list is empty, proceed to step 5.
   - If a session for the **same project** is already `active`, tell user `이미 진행 중: <project> (Xh Ym)` and stop: one active session per project.
   - If a session for the **same project** is `paused`, offer:
     ```
     <project>이 일시정지 상태야 (누적 Xh Ym, 마지막 멈춤 HH:MM).
       (a) 재개 (resume)
       (b) 새 세션으로 따로 시작 (드물게 — 기존 paused는 그대로 둠)
       (c) 취소
     ```
   - If sessions exist on **different projects**, first **check for staleness**: compute each session's `latest_activity` from its segments (active → latest `segments[-1].start_iso`; paused → latest `segments[-1].end_iso`). A session is stale if `now - latest_activity > 12h`. If at least one stale session is found, follow the Stale-session flow in `references/start-subflows.md` (cleanup, not live switching). Otherwise follow the Session-conflict flow in the same file (both sessions alive). State file mtime is not used: staleness is per-session, so opening a new session doesn't hide another's staleness.

5. **Read previous slipped** (optional context): from same-project tracking file, find the most recent entry, extract `slipped:` line if present.

6. **Write state file**: append a new session object to the `sessions` list (see schema in §"State file"). Don't overwrite existing entries: the list can hold multiple.

7. **Confirm to user** (concise):
   ```
   <HH:MM> <TZ>, <project> 시작. 이전 slipped: <one line>. 이어가?
   ```
   If no previous slipped, drop that clause. If other sessions are still active or paused, add one line: `진행 중인 다른 세션: <other-project> (<HH:MM>–, Xh Ym).`

## Sub-action: `end [project] [--at <time>]`

1. **Read state**: load `sessions` from state file. Pick the target session:
   - If user passed a project name (e.g. "end <project>" / "<project> 끝"), match by project name (case-insensitive).
   - Else if exactly one `active` session exists, use it.
   - Else if multiple active sessions exist, list them and ask: `어느 세션 끝낼까? (a) <project-A> (b) <project-B> ...`.
   - Else if no sessions at all, tell user `진행 중인 세션 없어` and stop.

2. **Capture end time**: same as start. If the user passed `--at <time>` (or natural-language equivalents like "어제 17:00" / "at 5pm"), parse to ISO using the session's TZ. Must be ≥ the last segment's start_iso: otherwise error and ask again. Show the parsed result back to the user before writing: `종료 시각: 2026-05-19 17:00 ICT, 맞아?`

3. **Compute duration**: sum of `(segment.end - segment.start)` for each segment in the session, with the final open segment's end set to the capture time. Hours, 2 decimal places. If the session was ever paused (more than one segment), also compute the paused gap = `(end of session window) - (sum of segments)`, formatted as `Xh Ym` for the entry note (not decimal hours: the gap is auxiliary info, not billable time).

4. **Date boundary check**: if the session's first start date ≠ end date, split into multiple entries (one per date, with midnight as the split point). Run the rest of this flow for each split. For multi-segment sessions, attribute each segment to its own date first, then merge same-date segments.

5. **Propose the category split; ask the rest** (one combined prompt). Estimate the category % yourself from the session's actual work (the conversation, files touched, commands run): keys from the 8 allowed, sum ~100, 5–10 unit granularity. Present it as a decided proposal and ask only whether to adjust it. The other fields stay open questions.
   ```
   16:45 ICT, 2.25h.

   카테고리 (제안): infra 30, decisions 25, meta 20, debugging 15, other 10
   이대로 갈까? 바꿀 거 있으면 말해줘.

   Shipped (한 줄)?
   Slipped (있으면)?
   Retro memory 파일명 (있으면)?
   Billable client (없으면 'none')?
   ```

   Write the entry only once the categories are explicitly confirmed. Gate the proposal through **AskUserQuestion** (그대로 / 수정): on 그대로, keep it; on 수정, take the new split. If the reply is ambiguous, ask once more (`카테고리 이대로 갈까?`) before writing, rather than assuming acceptance.

6. **Validate categories**: keys must be from the 8 allowed (`planning`, `design`, `decisions`, `implementation`, `debugging`, `infra`, `meta`, `other`). Sum should be ~100 (allow 95–105). If invalid, ask again.

7. **Build entry** using the format in `references/entry-format.md`.

8. **Append to tracking file**:
   - Find the `### YYYY-MM-DD` header for the entry's date.
   - If header doesn't exist, create it in chronological order (newest at top under `## Entries`).
   - Append the entry under that date header.

9. **Update state file**: remove this session from the `sessions` list (other sessions, if any, untouched).

10. **Show user the written entry** for confirmation.

### Switch shortcut mode

Triggered by the Session-conflict flow picking (a), or by the user invoking `switch <new-project>` directly (see §"Sub-action: switch").

Behaves like `end` but with a minimal prompt: only `shipped` is asked. Other fields are filled as placeholders for later manual edit:

- `cat`: `TBD` (no key/pct pairs)
- `slipped`: omitted
- `retro`: omitted
- `billable`: `TBD`

Entry is still written and the session is removed from state, but the entry includes a trailing sub-bullet: `- needs-edit: cat, billable` so the user can grep for incomplete entries later. The switch confirmation tells the user which entry to edit, e.g. `<HH:MM> <TZ>, <project> 마감 (draft: categories/billable 나중에 편집).`

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

1. Read state. Pick target session (same rules as `end` step 1, but only `active` sessions are eligible: if all are paused, say so and stop).
2. Capture pause time (same `date` calls as `start`).
3. Close the open segment: set its `end_iso` to the pause time.
4. Set the session's `status` to `paused`.
5. Confirm: `<HH:MM> <TZ>, <project> 일시정지 (누적 Xh Ym).`

No questions are asked: this is a pure state change. Categories, shipped, etc. are deferred to `end`.

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

Shortcut for "close the current session quickly and start a new one." Equivalent to picking (a) in the Session-conflict flow.

1. If no session is active, behaves like `start <new-project>`.
2. If exactly one active session exists, run §"Switch shortcut mode" of `end` on it, then `start` the new project.
3. If multiple active sessions exist, ask which one to switch from (or whether to close all). Then proceed.

If the user just says `switch` with no project name, prompt for one. Don't infer from cwd here: `switch` is an explicit intent.

## Sub-action: `discard [project]`

Drops a session from state without writing any tracking-file entry. For when the user realizes a session was opened by accident or was forgotten and the time is lost beyond recovering.

1. Read state. Pick target (same rules as `end`: explicit project name, else single session, else list and ask).
2. **Confirm before destroying** (this is unrecoverable): `<project> 폐기? 시작 <HH:MM> <TZ>, 누적 Xh Ym. (y/N)`
3. On `y`, remove the session from the `sessions` list. Confirm: `<project> 폐기됨.`
4. On `N` or anything else, abort.

Unlike `end`, `discard` writes nothing to the tracking file: the session's time is forgotten on purpose.

## Sub-action: `analyze [period]`

1. **Resolve period** to start/end dates. Default `this-week`.

2. **Glob tracking files**: `~/.claude/projects/*/memory/project_time_tracking.md`.

3. **Parse entries** from all files, both formats, per `references/entry-format.md`.

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
     - <Project A>: 14.2h (76.8%)
     - <Project B>: 4.3h (23.2%)

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
   Invoice draft — my-client-app — 2026-05-01..2026-05-31
   Rate: 80 USD/h

   Total: 23.45h × 80 USD/h = 1,876.00 USD

   Entries (5):
     - 2026-05-03 (Sun) 10:00–14:30 ICT (4.50h) — MyClientApp | landing page
     - 2026-05-05 (Tue) 09:00–13:00 ICT (4.00h) — MyClientApp | checkout flow
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

## Categories (fixed, 8)

`planning`, `design`, `decisions`, `implementation`, `debugging`, `infra`, `meta`, `other`. What each covers and a decision tree for ambiguous cases: `references/category_guide.md`.

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
      "tracking_file": "/Users/me/.claude/projects/.../memory/project_time_tracking.md",
      "previous_slipped": "<one line, from last entry in tracking file>",
      "status": "active",
      "segments": [
        {"start_iso": "2026-05-19T14:30:00+07:00", "end_iso": null}
      ]
    }
  ]
}
```

The `sessions` list can hold multiple entries. Each session is independent: it has its own segments, status (`active` or `paused`), and tracking file.

**Staleness derivation**: there is no stored `last_touched` field. Compute it on demand from segments: active session: latest `segments[-1].start_iso`; paused session: latest `segments[-1].end_iso`. Every meaningful mutation already writes a segment (start opens segment 0, pause closes the open one, resume appends a new open one), so the segment timestamps capture the same information without duplication.

**Segments**: a session is a list of `{start_iso, end_iso}` segments. The currently-open segment has `end_iso: null`. Pausing closes the open segment (set `end_iso` to now) and flips `status` to `paused`. Resuming appends a new `{start_iso: now, end_iso: null}` and flips `status` back to `active`. Duration = sum of `(end - start)` across all segments, with `null` end treated as "now" for live computation.

**id**: stable identifier for the session, used to disambiguate when multiple sessions share a project name (rare but possible after a switch-then-restart, or after the paused-same-project (b) "새 세션으로 따로 시작" branch). Format: `<project-slug>-<YYYYMMDD>-<HHMM>` from the first segment's start. When `end`, `pause`, `resume`, or `discard` is invoked with only a project name and two sessions share it, list both by `id` (annotated with start time) and ask which.

**Location inference**: if `tz_full` is `Asia/Bangkok` → "Bangkok", `Asia/Seoul` → "Korea", `America/Vancouver` → "Vancouver", else use the TZ name. User can override mid-session by saying "I'm in <place>".

**Migration from v1 single-session shape**: if the state file has a top-level `current_session` object (old format), read it once, wrap it as `{sessions: [<old-object-with-status:active-and-single-segment>]}`, and rewrite. Don't fail on the legacy shape.

## Billable rates file

Path: `~/.claude/billing_rates.md` (user-created; Skill reads only).

Template: `templates/billing_rates.example.md`.

## Tone and behavior

- **Category % is proposed, then confirmed**. Estimate the split from the session's actual work, present it as a proposal, and proceed on the user's OK; apply their adjustment only if they want one.
- **Keep confirmations dry**. `<HH:MM> <TZ>, <project> 시작.`, not "🚀 시작합니다!"
- **Show inferred values**. When auto-detecting project from cwd or splitting across a date boundary, show the user what was inferred and let them override.
- **Match the user's language** for confirmations (Korean or English).
- **Only `/time-tracking` is a slash command**. The sub-actions (`start`, `end`, `pause`, `resume`, `switch`, `discard`, `status`, `analyze`, `invoice`) are natural-language words.
- **One-line confirmations for state changes**. `pause`, `resume`, `discard`, `switch` write nothing to the tracking file (except `switch`'s draft entry). Confirmations stay to one line, matching the dryness of `start`/`end`: e.g. `<HH:MM> <TZ>, <project> 일시정지 (누적 Xh Ym).`
- **Confirm before destructive action**. `discard` and the stale-session (c) "폐기" branch destroy time data permanently: always show a `(y/N)` prompt with the time about to be lost, and act only on an explicit `y`.
- **Use `<project>` / `<client>` / `<HH:MM>` placeholders** in prompts; the names fill at runtime from state.

## Edge cases

- **System clock changed mid-session**: trust the captured ISO timestamps. Don't recompute from "now".
- **Session crosses DST**: compute duration from ISO timestamps (which carry offset), not wall-clock HH:MM.
- **Tracking file manually edited**: re-parse on every read. No caching.
- **`billing_rates.md` has a client in "Archived"**: still resolvable for historical invoices but warn user.
- **Category sum 95–105**: accept and normalize internally. <95 or >105: ask user to fix.
- **Very short session (<5 min)**: still record. User decides if it's meaningful.
- **Pause spans midnight**: when an open segment crosses midnight, the date-boundary split in `end` step 4 still applies to each individual segment. A session with segments `[09:00–13:00 day-N, 22:00–01:30 day-N+1]` produces three entries: full day-N (12:00 chunk + 22:00–24:00), and 00:00–01:30 on day-N+1. The paused gap (13:00–22:00) is just ignored: it belongs to no day.
- **Forgotten / abandoned session**: handled by the Stale-session flow of `start`, and visible via the staleness flag in `status`. The user can also invoke `discard <project>` or `end <project> --at <time>` directly without going through `start`.
- **Concurrent sessions overlapping in wall time**: deliberately allowed: the spec records the literal segments and `analyze` sums them straight. If you billed 2h to client A and 2h to client B in the same 13:00–15:00 window, total comes out as 4h. See §"What this Skill does NOT do" for the analyze-side caveat.

## What this Skill does NOT do

- Idle detection / auto-pause (pause is explicit only)
- Charts / visualizations
- Sync with external trackers (Toggl, Harvest)
- Pomodoro / notifications
- Migrating legacy entries to slim format (kept as-is, parsed compatibly)
- Auto-recovery of forgotten sessions: stale sessions (>12h) are flagged in `status` and on next `start`, but never silently closed; user picks the resolution
- Overlap deduplication in `analyze`: two concurrent sessions in the same wall-clock window are both summed into the total. Future: surface a `Note: Xh of overlap across N concurrent sessions` line under the total so the user notices.
