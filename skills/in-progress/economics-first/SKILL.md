---
name: economics-first
description: "Ground a technical choice in its economic implication before making it: name what the choice moves (conversion, revenue, retention, cost, risk, time to market), trace back from that to the options, and let the trace pick. Use when choosing between technical or UI options whose difference reaches customers, revenue, or cost, including when the easier-to-build option is about to win by default; or when the user asks for the economic angle ('경제적 영향', '비즈니스 관점에서', 'business impact', 'what does this cost us')."
---

# Economics First

Great engineers think through the economic implications first and trace back from them to ground every small decision they make.

## The check

Run it while the options are still open. When invoked by name with no choice in view, ask once which choice to check.

1. **Options.** Name the choice and its options in one line.
2. **Implication first.** Name the economic quantity the choice moves: conversion, revenue, retention, support load, infrastructure cost, engineering time, time to market, or risk (downtime, data loss, compliance). Take the one with the largest estimated effect; a runner-up that favors another option becomes the cost accepted in step 4.
3. **Trace back.** Ask what that implication needs here, then what that needs, until the answer is a property only one option has. Each link is something a customer, a system, or a teammate does ("visitors who arrive convinced reach Buy without scrolling"), not a quality ("better UX").
4. **Choice.** Take the option the trace lands on. Name the cost accepted and the signal that would reopen the choice.

Done when the choice is grounded: the chain runs from the implication to the chosen option, every link is an action, and the accepted cost and reopen signal are named.

Show the check before the edit that carries the choice, so the user can challenge the implication. Then act on the choice, or stop at the check when the user only asked which option is better:

```
Options: Buy button above or below the reviews
Implication first: checkout conversion; most visitors never scroll past the fold
Trace back: conversion needs visitors who arrive convinced to reach Buy without
  scrolling, which needs Buy above the reviews
Choice: Buy above the reviews
Cost accepted: reviews get less exposure; revisit if returns rise
```

## Grounding rules

- **Numbers:** quote real figures when the conversation, codebase, or analytics have them; otherwise give direction and rough magnitude, labeled an estimate, with any assumption it rests on.
- **Engineering time:** "easier to build" enters the trace as engineering time with its consequence (ships a week sooner), and wins only when that consequence outweighs the rest.
- **No reachable implication:** when engineering time is the only quantity with a direction and rough size you can name, decide on engineering grounds. Say "no economic difference" in one line only if the user asked for the check.
- **Settled choices:** run the trace as if the choice were open; it confirms the choice or reopens it. When it reopens a choice the user made, show the trace and let them decide before building or writing on it.
- **Several choices in a row:** check them together, before building.
- **Explaining later:** a PR body, commit, or interview answer about the decision leads with the implication from the trace.

## When to skip

- Internal-only choices (naming, formatting, refactors with no behavior change): nothing economic sits downstream.
- The user already grounded the choice in its implication: act on it.
- Explaining a metric change that already happened: that is debugging. Run the check on the fix that follows.
