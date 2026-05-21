# Entry Format Examples

The Skill writes entries in this slim format. Reference for what gets generated.

## Minimal entry

```
### 2026-05-19 (Tue)

- 14:30–16:45 ICT (2.25h) — MyApp | Phase 3 #12
  - tags: tool:claude-code, location:bangkok, billable:none
  - cat: implementation 70, debugging 20, meta 10
  - shipped: PR #14 merged
```

## With slipped and retro

```
- 09:00–12:30 ICT (3.50h) — MyApp | Phase 2 #4 storage bootstrap
  - tags: tool:claude-code, location:bangkok, billable:none
  - cat: implementation 50, decisions 20, infra 15, debugging 10, meta 5
  - shipped: PR #12 opened, awaiting CR; 1 commit `a3f8d21`
  - slipped: tsx CJS issue — workaround applied, root fix deferred
  - retro: reference_tsx_module_resolution.md, feedback_external_side_effects.md
```

## Billable (client work)

```
- 10:00–14:30 ICT (4.50h) — MyClientApp | landing page redesign
  - tags: tool:cursor, location:bangkok, billable:my-client-app
  - cat: implementation 60, design 25, decisions 15
  - shipped: hero section + nav implemented; pushed to staging
```

## After invoicing (invoiced tag added)

```
- 10:00–14:30 ICT (4.50h) — MyClientApp | landing page redesign
  - tags: tool:cursor, location:bangkok, billable:my-client-app, invoiced:2026-05-31-1
  - cat: implementation 60, design 25, decisions 15
  - shipped: hero section + nav implemented; pushed to staging
```

## Date boundary split (22:00 → 02:00 example)

Original session: 2026-05-19 22:00 → 2026-05-20 02:00 (4.00h total)

Becomes two entries:

```
### 2026-05-19 (Tue)

- 22:00–24:00 ICT (2.00h) — MyApp | Phase 3 #15 [date split: part 1/2]
  - tags: tool:claude-code, location:bangkok, billable:none
  - cat: implementation 100
  - shipped: hero animation tween logic

### 2026-05-20 (Wed)

- 00:00–02:00 ICT (2.00h) — MyApp | Phase 3 #15 [date split: part 2/2]
  - tags: tool:claude-code, location:bangkok, billable:none
  - cat: implementation 100
  - shipped: (continued from prev) hero animation tween logic, PR #16 opened
```

Category % and shipped are asked once and applied to the combined session, then duplicated across both parts (with a marker noting the split).
