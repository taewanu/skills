---
name: step-back-as-user
description: Step out of the current solution frame and re-enter from the user's side. Two modes, (1) **friction**: become the end user and walk a specific moment, noticing where they stall; (2) **reference**: anchored to a specific moment, surface how 2–3 well-known products solve it and the tradeoff each took. Use when the user asks to "think from the user's perspective", wants a fresh angle on a flow or screen, is reviewing for friction, is stuck on how to handle a UX moment ("how do others do this"), or whenever the current line of thinking has gotten too internal and risks losing sight of who it's for.
---

# Step Back As User

A perspective-switching skill. Drops the implementation frame and re-enters from the user's side: either by becoming the user, or by looking at how others have shipped the same moment for them.

Same anchor in both modes: one specific moment, not the whole product.

## Pick a mode

- **Friction**: reviewing something that already exists in your head or in code, and you want to feel where the user will stall. Default when the user asks for a fresh angle on a flow, screen, or feature, or names something they're about to ship.
- **Reference**: about to design a moment and you want to see how others handle it before committing. Default when the user is stuck on a UX call, asks "how do others do this," or names a pattern (sign-in, empty state, multi-select, undo) without a clear direction yet.

If unclear, ask once.

## Friction mode

Drop the current solution. Identify who actually uses this, one line: role, context, what they're trying to get done. Then walk through what they see, touch, and feel at the relevant moment. Surface what's unclear, missing, frustrating, or wrong for them, not for the system.

One concrete user at a time. If the user is already obvious from context, skip naming them and go straight to the experience.

## Reference mode

Name the moment narrowly first (sign-in, empty state, multi-select, undo, permission prompt copy, onboarding step 2), not the whole product. Then pull up 2–3 products that actually face the *same* moment (not the most famous; the most structurally similar) and walk through how each one handles it.

For each: what's on the screen, what the user does, and the tradeoff that choice took. E.g. on empty state, Linear: single CTA ("Create your first issue"), one click, trades discoverability for focus. Notion: row of template chips, picks a template type, trades focus for discoverability. Then say which one fits the current context, and why.

If you can't find 2–3 real peers, say so. "No one solves this the same way" is information, not a gap to fill with name-drops. Don't pad with products that share a category but not the moment.

## Stop at diagnosis

Don't redesign, rewrite, or build a spec. Friction mode names where the user stalls; reference mode lays out how others solved it and the tradeoffs. If the user wants fixes or a direction, they'll ask.

## What this is not

- Not a UX audit. One moment, real friction or real peers: not a sweep.
- Not a redesign session. Surfacing problems or options ≠ choosing one and building it.
- Not "what could go wrong" brainstorming. Stay grounded in a specific user or a specific peer's actual product.
- Not roleplay or name-dropping. The user and the references are tools for noticing, not characters or trophies.

## When to skip

- The user already named the friction or already picked a reference: go act on it, don't re-discover.
- Purely internal work (build tooling, refactors with no UX surface): there's no user moment to step into.
- The moment is genuinely novel and no peer exists: reference mode won't help; switch to friction or drop the skill.
- Exploratory brainstorming where a critical pass would derail momentum.
