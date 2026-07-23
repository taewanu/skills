# Start subflows

The two conditional flows `start` routes into when a session already exists (see `start` step 4). A common start with no existing session never reaches here. All `<...>` are placeholders the skill fills at runtime.

## Session-conflict flow

Triggered from `start` when one or more sessions on a **different project** are already in state (active or paused).

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

- **(a) switch**: run the Switch shortcut mode of `end` on the existing session: ask only for `shipped` (one line). Other fields filled as `TBD` for later edit. Then proceed with the new `start`.
- **(b) pause**: run the `pause` sub-action for the existing session (no questions: pure state change). Then proceed with the new `start`.
- **(c) concurrent**: leave existing sessions untouched. Append the new session to the active list. Proceed with the new `start`. **Heads up**: project auto-detection still uses current `pwd`. If the user is still cd'd into the existing project's directory, they must pass the new project name explicitly (`start <new-project>`) or cd first: otherwise the new "concurrent" session will write into the old project's tracking file.
- **(d) cancel**: abort the new start. Existing sessions unchanged.

If multiple sessions are already in state:
- List all of them grouped by status (active first, then paused), each with its current elapsed time.
- Ask the user how to resolve each one individually, OR offer "전부 같은 선택?" to apply one choice to all.
- Choices apply only where they make sense: (a) switch and (b) pause act on `active` sessions only: `paused` ones are left untouched unless explicitly named in a follow-up.

## Stale-session flow

Triggered from `start` when one or more existing sessions look abandoned (latest segment activity >12h old, per step 4's staleness rule). Show the cleanup menu below, not the live conflict choices: those assume the user is mid-flow on the old session, which they're not.

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

- **(a) estimate**: run the `end` sub-action on the existing session with end time = state file mtime. Use the **switch shortcut mode** prompt (shipped only, others `TBD`) but additionally add `- needs-edit: end-time (estimated from state mtime)` to the entry so the user can grep for and correct it later. Then proceed with the new `start`.
- **(b) manual**: prompt for an `HH:MM` (assume same date as the session's start unless user qualifies with "어제"/"yesterday" or an explicit date). Run the `end` sub-action with that time. Same switch-shortcut prompt for the other fields.
- **(c) discard**: same y/N gate as the standalone `discard` sub-action: show `<existing-project> 폐기? 시작 <HH:MM> <TZ>, 누적 Xh Ym. (y/N)` first. On `y`, drop the session from state without writing any entry and confirm `<existing-project> 폐기됨.` On `N`, fall back to the stale menu. Then proceed with the new `start`.
- **(d) actually alive**: fall through to the Session-conflict flow above with its normal choices.

If multiple stale sessions exist, ask per-session, OR offer "전부 폐기" / "전부 mtime으로 종료" shortcuts.
