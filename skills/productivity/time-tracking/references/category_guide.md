# Category Guide

Each session is split across the 8 categories by approximate percentage (5–10% buckets, sum ~100). This file is the reference for ambiguous cases.

## The 8 categories

| Key | What it covers |
|---|---|
| `planning` | **What** to build or **whether** to build it. Concept, scope, roadmap, feature priority, competitive research, differentiation analysis, viability assessment. |
| `design` | UI/UX decisions. Mockups, wireframes, design system, color/typography, interaction details. |
| `decisions` | **How** to build it (technical). Architecture, library selection, technical tradeoffs. No code written. |
| `implementation` | Writing production code. The thing actually ships. |
| `debugging` | Tracking down unintended problems. Bug hunts, error resolution, regression fixes. |
| `infra` | Setup, config, tooling. CI/CD, deployment, env vars, build pipelines, linters, dev environment. |
| `meta` | Work about work. Docs, README, skills, memory files, retros. |
| `other` | Fallback. Use sparingly — if you use this >10% regularly, consider whether a new category is needed. |

## Decision tree

When classifying a chunk of session time:

```
1. Did production code get written or modified?
   YES → implementation
         (even if research/learning happened alongside, the deliverable is code)
   NO → continue

2. Was the work tracking down an unintended bug/error/regression?
   YES → debugging
   NO → continue

3. Was the primary output a decision (not code, not design)?
   - About WHAT to build or whether? → planning
   - About HOW to build it (technical)? → decisions
   - About UI/UX or visual? → design

4. Was it environment/tooling work?
   - CI/CD, deployment, build config, dev env? → infra

5. Was it work about the work itself?
   - Writing docs, memory files, skills, retros, README? → meta

6. None of the above?
   → other (and consider whether the category set should grow)
```

## Worked examples

### From Sounds Abroad history

| Activity | Category | Why |
|---|---|---|
| "Strategy C 확정 (Apple Music RSS + iTunes preview)" | `decisions` | How to solve the music data problem |
| "40개국 선정" | `planning` | What to include in v1 scope |
| "B2C 리뷰 요약 viability 분석 → 접음" | `planning` | Whether to build at all |
| "react-three-fiber로 globe 구현" | `implementation` | Code shipped |
| "globe rotation 버그 추적" | `debugging` | Unintended problem |
| "Vercel env var 설정" | `infra` | Environment config |
| "GitHub Actions cron 시간 결정" | `decisions` | Technical how |
| "PR template 작성" | `meta` (or `infra`?) | Doc for the workflow |
| "feedback_fix_warnings_inline.md memory 작성" | `meta` | Work about work |
| "Skill 작성" | `meta` | Tooling for the tool |
| "Issue #4 sub-issues로 분해" | `planning` | What to ship next |

### Edge cases

**"Learning react-three-fiber while building"**: counts as `implementation`. Learning is a side effect of doing.

**"Code review reply"**: 
- If response was reasoned argument (no code change) → `decisions`
- If response was a commit fixing the comment → `implementation`
- Split if both happened

**"Pair programming on architecture"**: If outcome was a decision and no code → `decisions`. If code shipped → `implementation` (decisions folded in).

**"Writing tests"**: `implementation` (test code is production code).

**"Investigating which library to use"**: `decisions`.

**"Refactoring"**: `implementation` if code changes. `decisions` if just analysis without changes.

**"Setting up a new tool / Skill from scratch"**: `meta` (it's tooling about the work). Even if code is involved.

**"Reading docs"**: usually folded into whatever the docs are FOR. Reading React docs while implementing? → `implementation`. Reading docs to decide between libraries? → `decisions`.

## How to be approximate

- Round to 5 or 10. Don't agonize between 22% and 23%.
- Sum should land 95–105. The Skill normalizes within that range.
- A session with two distinct phases (e.g., 30 min planning, then 90 min coding) → roughly `planning 25, implementation 75`.
- If a category is <5%, fold it into the closest larger one.

## When to revisit the category set

If `other` consistently >10%, or if you notice yourself wanting to invent a new category mid-classification, that's signal. v1 deliberately uses 8 to keep analysis tractable; v2 might split or merge based on real usage.
