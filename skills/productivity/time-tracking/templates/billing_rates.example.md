# Billing Rates

Per-client hourly rates. Used by `/time-tracking invoice` to compute billable totals.

Place this file at `~/.claude/billing_rates.md`. Skill reads, never writes.

## Active

- my-client-app: 80 USD/h
- foo-studio: 100000 KRW/h
- bar-inc: 90 CAD/h

## Archived

- old-client: 70 USD/h (until 2025-12)

---

## Format rules

- One client per line under `## Active` or `## Archived`.
- Format: `- <slug>: <amount> <currency>/h`
- Slug must match `billable:<slug>` tag used in entries. Lowercase, dashes for spaces.
- Currency is a 3-letter ISO code (USD, KRW, CAD, EUR, JPY, THB, etc.).
- Archived clients are still resolvable for historical invoices but will trigger a warning.

## Adding a new client

1. Add a line under `## Active`.
2. Start tagging relevant entries with `billable:<slug>`.
3. Run `/time-tracking invoice <slug>` to test.
