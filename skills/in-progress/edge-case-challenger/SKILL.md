---
name: edge-case-challenger
description: "Challenge a working assumption or a settled decision that nobody re-questions, by running a fixed set of probes against the ONE decision, not by free-associating about what could break. Attacks the axis that was never verified, the cost some other decision quietly absorbed, and the load level where the model stops fitting. Sibling of step-back-as-maintainer (re-enter as a future code reader) and break-the-frame (invert a strategy); this one re-enters an engineering decision that already works and asks what it stopped anyone from asking. Use when something has worked long enough to feel settled and the user wants it pressure-tested: '여태 이렇게 해왔는데', '이 가정 맞나', '전제를 다시 보자', '엣지 케이스', '스케일업하면?', '이거 언젠가 터지지 않나', 'pressure-test this assumption', 'what breaks at scale', 'challenge this decision', 'is this premise still true', 'stress this at 10x', or when a decision passed review on one axis and no one checked the others."
---

# Edge Case Challenger

A pressure-test skill for a decision that already works. It surfaces the question a working solution stopped anyone from asking, by running a fixed set of probes against that one decision.

The value is DISCIPLINE, not paranoia. "What could go wrong?" free-associated gives a generic risk list. Taking each probe and forcing it onto the specific decision, including the probes that indict a choice the user is proud of, gives failure modes bolted to their reality.

Two named mechanics are why a working decision resists challenge, and the skill exists to defeat both:

- **Einstellung effect** (Luchins 1942; Bilalić/McLeod/Gobet, *Cognition* 2008): a solution that works blocks the search for a question about it. In the chess study, experts who had found one move *reported* they were looking for a better one, but their eyes never left the features of the move they already had. The lesson that shapes this skill: self-report is worthless. Asking the user "did you reconsider?" gets a yes while nothing actually moves. Only a concrete probe moves attention.
- **Path dependence / absorbed cost:** an early decision makes some quantity part of the terrain, then a *second* decision removes the pain of that quantity, so nothing ever forces a re-look. The pain, not the wrongness, is what would have triggered review; kill the pain and a questionable premise lives untouched for months.

Sibling skills: step-back-as-maintainer (re-enter code as its future reader) and break-the-frame (invert a strategy's hidden premise). This one re-enters a settled engineering decision and asks what its own success hid.

## Step 0: load the decision before probing (gate)

A bare "is this okay?" or "review my approach" is cold. You are ready only when you can state the decision as a claim with a load-bearing quantity or assumption in it. Before probing, confirm you have:

- **The decision, as one claim:** "one request per track", "we cache for 60s", "this job runs nightly", "the source can only return one id at a time". Name the quantity or the assumed limit inside it.
- **Where the claim came from:** the doc line, the recon note, the ADR, the "we've always done it this way". Note its date.
- **What made it feel settled:** it passed a review? it's been running for months? a benchmark blessed it? Name the axis it was blessed on (accuracy, correctness, latency); that axis is exactly the one that now masks the others.
- **The scale it runs at now, and any scale it's about to run at:** the second number is where most of these break.

If the conversation already established these, proceed. If cold, ask for them in one batched message and stop there: run zero probes. Never probe a blank claim: you'll produce a generic risk list, the failure mode.

## The probe library

Apply at least 5. Aim every probe at the QUANTITY or the ASSUMED LIMIT inside the decision, not at the code around it. A probe aimed at "is the function correct" produces a correctness nit; a probe aimed at "why is this quantity one" produces a real challenge. Pick the probes that bite; each one that bites becomes a finding.

1. **Probe the ceiling (MANDATORY at least once):** the decision assumes a limit ("one per request", "max 100", "singular id"). Was that limit ever *measured*, or read once from a doc and assumed? The memory rule covers the other direction, a claim that a source *can't* do X needing a real probe. This is the mirror: a claim that a source can *only* do X, or must be done one-at-a-time, needs the same probe. Go try `?id=a,b,c`.
2. **Absorbed cost:** what cost is painless right now only because a *different* decision grew the budget or the timeout to swallow it? That cost is invisible, not gone. Name what would resurface it.
3. **10x load (MANDATORY at least once):** put 10x, or the real upcoming scale, through the same model. Where does it stop fitting? A number that fits nowhere (a 68-hour job that fits neither a timeout nor a day) is the tell that forces the first honest re-look. This is the single most productive probe; it's the "thinks in edge cases at scale" habit made into a step.
4. **Which axis passed:** the decision was verified on ONE axis (accuracy, correctness, latency). A pass on that axis stamps the whole decision "settled" and stops anyone asking the *other* axes. Name the axis it passed, then name the axes nobody checked, and run 10x on those.
5. **Anchor trace:** trace the number driving the decision to its source and the source's date. Was the premise that made it true still true today? Anchors set at one scale silently misprice the next.
6. **Signal absence:** if this decision were already wrong, what would tell you? Walk the actual alerting/timeout/monitoring path. If the honest answer is "nothing" (it fits inside an unlimited budget, it lands under the timeout), that silence IS the finding. A wrong-but-quiet premise is the one that survives longest.
7. **Force the eye, not the re-think:** never accept "I already thought about that." Per the chess study, the reported reconsideration doesn't move attention. Convert every "I'm confident it's fine" into one concrete probe the user runs now (a curl, a count, a scaled dry-run). The probe moves the eye; the re-think doesn't.

## Output contract

- Open with one framing line: this pressure-tests a decision that currently works; a finding is not proof it's broken, it's a question its success buried.
- 5 to 7 numbered findings. Each finding carries:
  - a punchy title (the buried question),
  - the probe made CONCRETE against their decision (one or two sentences),
  - the blast radius: what actually breaks, at what scale, and how loud (silent-for-months vs. immediate),
  - one line of "why it stayed buried": which mechanic hid it (passed on axis X / cost absorbed by decision Y / fits under the current limit).
- At least one finding must attack a choice the user is proud of or has run for a long time, and assert its very success is what kept the question closed.
- Close by killing the debate: for the one or two findings that bite hardest, give the exact probe to run right now (the curl, the count, the 10x dry-run), not "you should test this" but the actual command or query. Then your honest bet on which one is real.

## One worked finding (illustrative: derive your own from THEIR decision; do not reuse this domain or number)

Probe: ceiling + 10x, aimed at a batch job that fetches one record per API call.

- **"One call per record" was never a limit, just an untested default.**
- Concrete: the recon note recommended the lookup endpoint and verified it on *accuracy* (25/25 vs 24/25). It never asked how many ids one call accepts, so the whole cost model assumed one-call-per-record. At today's volume that's an 80-minute job; the incoming feature multiplies the record count 60x, which is a 68-hour job that fits neither the timeout nor a day.
- Blast radius: silent until the new feature ships, then the job simply never completes: no error, just a run that outlives its window.
- Why it stayed buried: the accuracy pass stamped the endpoint "settled", and an unlimited-minutes decision made the 80-minute job painless, so nothing forced anyone to ask "how many ids per call?" The answer, once probed, was 150+.

## Guardrails / failure modes

- **Generic = failure.** Self-test every finding: strip the specific quantity and reread it. If it still reads fine ("this might not scale", "consider edge cases", "add error handling"), you anchored to the probe, not the decision. Rewrite until the user's specific number or assumption is load-bearing in the sentence, or cut it.
- **"Could be a problem" without a scale = failure.** Every finding names the load level where it bites and how loud. A risk with no threshold is a worry, not a finding.
- **Accepting the re-think = failure.** If a finding resolves to "user says they already considered it", it isn't resolved. Replace it with the concrete probe. The eye doesn't move on a re-think.
- **Shape over volume.** 5 to 7 findings that each name a real threshold beat a checklist of 20 hypotheticals.

## What this is not

- Not a correctness audit. It does not hunt for bugs in the code as written; that's `/code-review`. It challenges the assumption the code was built on.
- Not a plan. It opens buried questions; it doesn't pick one and fix it. Once a finding lands and its probe confirms it, hand off to your usual planning step.
- Not a rewrite pitch. A finding can be real and still not worth acting on yet; naming the threshold lets the user decide.

## When to skip

- The decision is genuinely new and unverified: it doesn't need de-burying, it needs first review (`/code-review`) or a walk-through (visual-code-lecture).
- The user wants the code read as written, not the premise challenged: that's step-back-as-maintainer or `/code-review`.
- The question is a strategy or business-model frame, not an engineering quantity: that's break-the-frame.
