# Vault map

This is the skill's configuration file: everything specific to one install lives here, and the rest of the skill is written against a generic kepano-style vault. Pointing the skill at a different vault means rewriting this file only. The conventions the skill enforces (folder roles, filenames, Bases, categories) are the same either way.

## Path and access

The active vault is **`wanu-obsidian-main`**, an iCloud-synced folder:

```
/Users/wanu/Library/Mobile Documents/iCloud~md~obsidian/Documents/wanu-obsidian-main
```

Always quote the path. It contains spaces, and `iCloud~md~obsidian` encodes the bundle id `md.obsidian` in iCloud's container scheme. To confirm the current path rather than trusting this file, read the vault registry at `/Users/wanu/Library/Application Support/obsidian/obsidian.json`.

Two sibling vaults share that Documents folder: `kepano-obsidian-main` (the upstream fork source, a useful reference for conventions) and `journal-vault`. Do not write to either.

### macOS Full Disk Access

The iCloud path is gated by macOS TCC. If reads fail with `Operation not permitted` even with the sandbox disabled, the host terminal app (whichever app runs the session, such as Warp, iTerm, or VS Code) needs Full Disk Access under System Settings, Privacy & Security, Full Disk Access, followed by a full quit and relaunch of that app. TCC judges by the top-level app bundle, not the `claude` binary, and grants are per-app. This is one-time setup; once done, reads just work.

## Folders

kepano-style layout. The role matters, not the exact location: `Notes/` and `Categories/` are folders here but would sit in the root in kepano's own vault.

| Folder | Holds | Rule |
| --- | --- | --- |
| `Notes/` | Things the user wrote: journal, essays, project logs, evergreen notes, dated captures | In the root means "I wrote it, or it relates to me" |
| `References/` | Things outside the user: books, movies, people, places, standard concepts and terms | Named by the title itself (`Book title.md`) |
| `Categories/` | Hub notes only: `tags: [categories]` plus a single Base embed, no prose | One per collection (Books, Movies, 소프트웨어 설계 개념, 면접 준비) |
| `Clippings/` | Things other people wrote | Not authored by the user |
| `Daily/` | `YYYY-MM-DD.md` link targets, usually empty-bodied | Admin, hidden from nav |
| `Templates/` | Note templates, and `Templates/Bases/*.base` where Base definitions live | Admin |
| `Attachments/` | Images, audio, PDFs | Admin |

## Filenames

- **Quick capture or dated note:** `YYYY-MM-DD HHmm` plus a title. The unique-note hotkey creates the timestamp prefix; append a descriptive title so it stays findable. Example: `2026-07-20 1203 Sounds Abroad 학습 로그`.
- **Reference or concept note:** the term itself, e.g. `N+1 problem.md`, `CARL 프레임워크.md`.
- Dates everywhere are `YYYY-MM-DD`.

## Renames

Obsidian updates backlinks on rename only when the rename happens inside the app. A filesystem `mv` while Obsidian is running leaves backlinks pointing at the old name. Rename in-app, or rename on disk only after confirming no inbound links exist, and say so.

## Tracked categories

These work as accumulating knowledge bases with a `confidence` study-tracker. A concept note names one of them in `categories` and one of its sub-types in `type`. To add to them or build a new one, see `bases-and-categories.md`.

- **소프트웨어 설계 개념:** software design concepts (failure handling, data pipelines, transport and loading, observability, decision-making). Standard industry terms plus concepts learned on the job. Sub-types include 핵심 개념, 핵심 기술, 장애 처리, 데이터 파이프라인.
- **면접 준비:** interview prep (frameworks like RADIO and CARL, evaluation rubrics, question themes, pitfalls), sourced from hellointerview and greatfrontend.

Study happens in Korean, interviews in English: concept notes are titled with the standard English term and carry the Korean name in `aliases`. `source: 실무` marks a concept learned on the job rather than from a site.

## Base house style

Every category Base in this vault uses the same vocabulary, so one grammar reads across all of them. `bases-and-categories.md` explains what these mean; this is what they are called here.

| Role | Name in this vault |
| --- | --- |
| Confidence scale | `1 모름`, `2 설명 가능`, `3 가르칠 수 있음` |
| Standard-vs-coinage labels | `표준`, `내 표현` |
| Study view (confidence below the top) | `공부할 것` |
| Grouped-by-sub-type view | `분류별` |
| Newest-first view (session notes embed this) | `최근 추가` |
| Sub-type view (`this`-filtered, for stubs) | `분류` |
| Sub-type stub heading | `## 항목` |
| Coinage callout wording | `표준 용어가 아님` |

Copy this template verbatim for a new category, substituting only the category name in the filter:

```yaml
filters:
  and:
    - note.categories.contains(link("<new category>"))
    - '!file.name.contains("Template")'
formulas:
  수준: 'if(confidence == 1, "1 모름", if(confidence == 2, "2 설명 가능", "3 가르칠 수 있음"))'
  용어구분: 'if(standard, "표준", "내 표현")'
properties:
  file.name:
    displayName: 개념
  note.type:
    displayName: 분류
  note.source:
    displayName: 출처
  formula.수준:
    displayName: 확신도
  formula.용어구분:
    displayName: 용어
  note.created:
    displayName: 추가일
views:
  - type: table
    name: 공부할 것
    filters:
      and:
        - 'confidence < 3'
    order: [file.name, type, formula.수준]
    groupBy:
      property: type
      direction: ASC
  - type: table
    name: 분류별
    order: [file.name, formula.수준, source, formula.용어구분]
    groupBy:
      property: type
      direction: ASC
  - type: table
    name: 최근 추가
    order: [file.name, type, formula.수준, created]
    sort:
      - property: created
        direction: DESC
  - type: table
    name: 분류
    filters:
      and:
        - list(type).contains(this)
    order: [file.name, formula.수준, source]
```
