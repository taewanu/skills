---
name: step-back-as-maintainer
description: Step out of the current frame and re-enter cold. Two modes — (1) **code**: drop the authoring frame and walk the diff/file as someone touching it months later; (2) **session**: drop the chain of reasoning in this chat and walk back into the problem as someone who just joined. Surfaces understanding cost, hidden coupling, and unstated assumptions without rewriting anything. Use when reviewing your own diff before sending it out, when finishing a feature, when something feels "clever" and you want to check it'll still be legible later, when a discussion has run long enough that you're anchored on assumptions you stopped questioning, or whenever current thinking is too tied to "I know what I just wrote/said."
---

# Step Back As Maintainer

A perspective-switching skill. Drops the current frame and re-enters cold to surface understanding cost, hidden coupling, and unstated assumptions — without rewriting anything.

Same mechanic in both modes: pretend you just walked in, walk the path forward, notice where you stall.

## Pick a mode

- **Code** — artifact under review is a diff, file, or piece of the codebase. Default when the user just finished writing/changing code, asks "is this fine to send out," or names a file/PR.
- **Session** — artifact under review is the current discussion: a debate, a design call being made live, a chain of reasoning that's gotten long. Default when the user has been thinking out loud for a while, when a plan or decision is forming in chat, or when the user gestures at the thread itself ("이 흐름", "이 논의", "stepping back from this").

If unclear, ask once.

## Code mode

Pretend you've never seen this code before — or last touched it six months ago and forgot why. Open the file at the relevant entrypoint and walk through what it would take to safely change one thing in it.

Notice where you stall: a name that doesn't tell you what it holds, a function that does more than its name implies, an invariant you have to infer from three callsites, a fallback that only makes sense if you remember a long-fixed bug, an abstraction that exists for one caller. Note the cost — "I'd have to read X to be sure" — not the fix.

## Session mode

Pretend you just joined this conversation. Read the user's original request and the current state of the thread. Walk forward as if you don't remember the intermediate turns.

Notice where the reasoning is carrying weight that was never explicitly placed:

- an assumption that stopped being questioned somewhere along the way
- a constraint accepted three turns ago that may not actually hold
- a user message reinterpreted in transit — does the current direction still answer what they originally asked?
- scope drift — what was the question, and what are we now solving?
- a framing that only makes sense if you remember how we got here

Note the gap — "we're acting like X is decided but I can't point to where" — not the fix.

## Stop at diagnosis

Don't refactor, rename, rewrite, or restart the conversation. The point is to notice where future-you (or someone reading cold) will pay, not to make the payment now. If the user wants fixes or a course correction, they'll ask.

## What this is not

- Not a systematic correctness audit. Bugs or inconsistencies that surface during the walk are fair game — name them. Don't hunt beyond that.
- Not a refactor session or a do-over of the discussion. Naming the smell ≠ removing it.
- Not "everything I'd improve." Stay grounded in moments where a real next step would actually stall.
- Not roleplay. Don't invent a persona. The maintainer is a tool for noticing, not a character.

## When to skip

- Code about to be deleted or replaced — maintainability cost won't be paid.
- One-shot scripts, throwaway prototypes with no expected lifetime.
- Short, clean discussions with nothing to step back from.
- The author/user already named what's brittle or off-track and just wants to ship — don't re-litigate.
