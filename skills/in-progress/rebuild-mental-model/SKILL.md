---
name: rebuild-mental-model
description: "Surface, test, and replace the user's mental model of something they half-know, using Just JavaScript's method: the user commits a prediction before every reveal, diagnostic cases expose where the old model breaks, and the rebuilt model is sourced and drawn as a step-through HTML page. Any domain, including beliefs about people or groups. Use when the user suspects their understanding is wrong, fuzzy, or borrowed: '내가 잘못 알고 있는 것 같아', '제대로 이해한 건지 모르겠어', '감으로만 알아', '멘탈 모델', '편견 아닐까', 'rebuild my mental model', 'I kind of know X', 'I think I misunderstand X', 'why does X actually work'."
---

# Rebuild Mental Model

Replace a half-right model in the user's head with one that predicts correctly. The target is the hidden model that produced the user's answer, not the facts, so every step has the user show their model before you show yours.

The method comes from Dan Abramov's *Just JavaScript* and carries beyond code: a mental model is the set of pieces, rules, and pictures someone reasons with, whether the topic is closures, inflation, or a belief about a group of people.

## Leading words

- **Commit:** the user's prediction plus their reasoning, written before you reveal anything. The reasoning matters more than the answer: ask them to narrate each step, including where they guessed.
- **Old model:** the model a commit implies, named in the user's own terms: its pieces, its rules, its picture.
- **Diagnostic case:** a small, concrete scenario where the old model and the correct one predict different outcomes. A case both models get right teaches nothing.
- **Sourced / inferred:** every factual claim in the rebuilt model is sourced (cite it) or labeled inference.
- **Grammar:** one notation per session. Each kind of thing gets one shape, each relation one line style. A new concept adds a shape or a wire, never a new style.

## Pacing

One case per turn: pose it, end the turn, wait for the commit. Reveal a case's outcome right after its commit; hold explanations and sources until step 5. A wrong commit is the most useful data the session produces: name precisely where it diverged, with curiosity rather than judgment.

The walkthrough page is the one exception: it carries two commits in a single turn.

**Escape hatch:** when the user says "just explain it" ("그냥 설명해줘"), finish in one turn. Answer any open case yourself, give step 5 in chat, build the page with no `ask` and no distractors, skip step 6, and send the step 7 recap. Step 2 research still runs first if it hasn't.

## Steps

### 1. Elicit the claim

Get the user's current belief as a claim that could turn out wrong ("`b = a` links the two variables", "heavier things fall faster", "people from X are Y").

- The message already states a claim: restate it as one falsifiable sentence, then run step 2 and pose the first case in the same turn.
- A bare topic: ask for their best guess at how it works.
- No guess at all: show a small concrete case and ask what it does. That commit is the claim.

### 2. Research before probing

Look the topic up before writing any case: docs, WebSearch, primary sources or reviews for empirical claims. A diagnostic case needs a known correct answer, and the rebuilt model stands on sources.

Done when every claim you plan to teach has a source, or is marked inference with the reason no source settles it. When sources disagree or evidence is thin, that disagreement is a finding: report it in step 5 instead of picking a side.

### 3. Probe and map

Pose one diagnostic case and ask for a commit. End the turn.

On the commit, reveal the outcome, reflect the old model back (pieces, rules, picture), and ask where it came from. End the turn. Typical origins: a simplified explanation that traded accuracy for ease, an analogy carried over from another domain, a few vivid cases, a name taken at face value, hearsay, an inference never checked. The origin picks the move for step 4 (see the move library).

A commit counts as correct only when the right answer comes from reasoning that follows the correct rules; a right answer reached by the old model is still a wrong model. After two correct commits on diagnostic cases, tell the user their model holds here and go to step 7 with the old model as the rebuilt one, without a page.

### 4. Break it with a contradiction

Present the case or evidence the old model can't explain (often the step-3 outcome itself, when it surprised them), and ask the user to account for it before you do. A contradiction marks a gap in the model; when the user files it as "just a quirk", send them back to it.

Done when the user names the rule the old model lacked, or after two tries; step 5 then supplies it.

### 5. Install the rebuilt model

Lay it out in chat, in this order:

1. **Level:** the level of explanation where claims can be checked against evidence. Set aside lower-level or neighboring-domain intuitions by name; they can sit on top later.
2. **Pieces and picture:** the minimal set of concepts and one picture that carries them. Say why this picture, and what it will explain later that the old one couldn't.
3. **Rules:** explicit steps, so a new case is answered by following the rules instead of guessing.
4. **Sources:** a citation per factual claim; inference labeled.
5. **Provisional:** what the model simplifies and where it will need to grow.

Then build the walkthrough page (below), send it, and end the turn.

### 6. Vary and verify

The page's `ask` and its distractor pick are the first two commits here. Continue in chat, one commit per turn, chosen from:

- **Near-duplicate:** the same case with one detail changed and the opposite outcome.
- **Reverse:** given an outcome, what produced it? The user enumerates every cause the model allows, then rules some out.
- **Real check:** something the user runs or reads themselves: a console line, a measurement, a source, a counterexample search.

A wrong commit is a new contradiction: return to step 4 with it. If the rules change as a result, rebuild the page with the next `-vN` suffix.

Done when the user has predicted two cases in a row correctly by applying the rules, or asks to stop.

### 7. Contain and recap

Name the exceptions and why they are exceptions, what is out of scope, and what is still unknown. Then send the recap block:

```markdown
## Mental model: <topic>
**Old model:** <one sentence> (origin: <where it came from>)
**Rebuilt model:** <one sentence>
**Rules:**
1. <rule>
**Exceptions:** <exception, and why>
**Sources:** <source per claim>
**Inferred, not verified:** <claims without a source>
**Open questions:** <what's still unknown>
```

Write the recap in the language the user's instructions set for written notes; otherwise in the conversation's language.

## Move library

Consult when choosing cases in steps 3, 4, and 6. Pick the move that targets the old model's origin.

| Move | Use when | Shape |
|---|---|---|
| Split fused concepts | the model treats two things as one | a case where they come apart: variable vs. value, gravity vs. air resistance, a label vs. the people it names |
| Name vs. mechanism | the model leans on a name | where the name misleads: `NaN` is a number; a group label vs. what members actually do |
| Answer vs. ownership | an observed behavior is read as an inner property | the same behavior produced from outside: an inherited property, the situation rather than the disposition |
| Enumerate causes | one cause gets the blame | every mechanism the model allows, then the evidence that rules each out |
| Base rate first | vivid cases stand in for a population | the base rate and the denominator before any anecdote |
| Contain the exception | a real exception gets ignored or generalized | label it, give its origin, show the core rule holding elsewhere |
| Conditions over verdicts | "X is good" or "X is bad" | what, where, when, at what cost |
| Untestable stories | no evidence could tell two stories apart | say so, pick the simplest, label it a convention |

## Beliefs about people and groups

Same method, higher evidence bar. Treat the belief as an empirical claim and cite data with its population, measure, and effect size. Keep four things separate: what the label denotes, the base rate, the variation within the group, and the causes behind any observed difference. Push back when the reasoning rests on an anecdote, a label, or a single source.

When the evidence can't settle the population claim, run the cases on how the belief formed instead (which instances get noticed and remembered, the missing denominator, a label standing in for a mechanism) and report the claim itself as open. The goal is an accurate model, which may confirm part of the original belief: report what the evidence shows either way.

## The walkthrough page

Start from `templates/walkthrough.html`. Copy the `<style>` and the rendering `<script>` verbatim; author only the JSON spec, whose shape and limits the template header documents. Write the spec's text in the conversation's language.

- **Case:** a near-duplicate of the step-4 case whose outcome hasn't been shown, so the page's `ask` is a real prediction.
- **Grammar:** declare `kinds` and `wires` once; both panels and every distractor draw with them. The grammar draws relations: put numbers and quantities in the `case` lines and step text.
- **Old panel:** the user's old model from step 3 applied to this case, in their terms, drawn as faithfully as the new one.
- **Steps:** one case line per step. `hot` lists what that line touches in both panels. Use `exit` for anything replaced, so it stays on screen faded and the reader sees what stayed and what changed.
- **Ask:** on the step just before the panels' outcomes diverge.
- **Distractors:** they answer `distractorAsk`, a further one-detail variant of the case. Draw 3 or 4 pictures, each encoding one specific misconception, with the old model's answer always among them.

Save to `/tmp/<topic-slug>-rebuild-mental-model.html` (topic kebab-cased); a rebuild in the same session takes the next `-v2`, `-v3` suffix, because macOS `open` focuses an already-open tab without reloading it. Open it with `open` (macOS), `xdg-open` (Linux), or `wslview` (WSL).

Tell the user to step through, write their prediction in the page, pick a distractor, and paste "Copy for chat" back here. Treat the pasted prediction and reasons as commits.

## When to skip

- The user wants a fact or a how-to, not their understanding checked: answer directly.
- The question is a strategy or business frame to invert: that's break-the-frame.
- The question is an engineering decision to pressure-test: that's edge-case-challenger.
