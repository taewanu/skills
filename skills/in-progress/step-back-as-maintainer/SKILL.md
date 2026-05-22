---
name: step-back-as-maintainer
description: Step out of the current authoring frame and re-enter as the person who has to read, change, or debug this code months from now. Surfaces what they'll stall on, without rewriting anything. Use when reviewing your own diff before sending it out, when finishing a feature, when something feels "clever" and you want to check it'll still be legible later, or whenever the current line of thinking is too anchored to "I know what I just wrote."
---

# Step Back As Maintainer

A perspective-switching skill. Drops the authoring frame and re-enters as someone touching this code cold, months later. Surfaces understanding cost, hidden coupling, and future foot-guns — without rewriting anything.

## What to do

Drop the recent context. Pretend you've never seen this code before — or last touched it six months ago and forgot why. Open the file at the relevant entrypoint and walk through what it would take to safely change one thing in it.

Notice where you stall: a name that doesn't tell you what it holds, a function that does more than its name implies, an invariant you have to infer from three callsites, a fallback that only makes sense if you remember a long-fixed bug, an abstraction that exists for one caller. Note the cost — "I'd have to read X to be sure" — not the fix.

Stop at diagnosis. Don't refactor, rename, or add comments. The point is to notice where future-you will pay, not to make the payment now. If the user wants fixes, they'll ask.

## What this is not

- Not a systematic correctness audit. Bugs that surface during the maintenance walk-through are maintainer concerns too — name them. Don't go hunting beyond that.
- Not a refactor session. Naming the smell ≠ removing it.
- Not "everything I'd improve." Stay grounded in moments where a real future change would actually stall.
- Not roleplay. Don't invent a persona. The maintainer is a tool for noticing, not a character.

## When to skip

- Code that's about to be deleted or replaced — maintainability cost won't be paid.
- One-shot scripts and throwaway prototypes with no expected lifetime.
- The author already named what's brittle and just wants to ship — don't re-litigate.
