---
name: sketch-to-diagram
description: Turn a photo of a hand-drawn concept diagram (architecture flow, boxes/arrows, coverage brackets, annotations) into a clean, self-contained HTML diagram in a fixed hand-drawn house style, and optionally an editable Excalidraw scene. Keeps the sketch's structure and fixes its presentation rather than tracing it faithfully. Use when the user photographs a whiteboard/notebook sketch and wants it digitized ("이 손그림 다이어그램 깔끔하게", "스케치 사진 html로", "화이트보드 정리해줘", "그린 거 디지털로", "digitize this sketch", "turn my whiteboard photo into a diagram", "clean up this hand-drawn diagram", "render this sketch as html") for CONCEPT diagrams, not UI wireframes (those go to v0/Figma).
---

# Sketch to Diagram

Take a photo of a hand-drawn concept diagram and produce a clean diagram in a fixed house style: a self-contained HTML page now, an editable Excalidraw scene later. The point is not a faithful tracing. A sketch carries the right *structure* but crude *presentation* (overlapping brackets, gap-anchored spans, missing labels, the occasional wrong coverage). This skill keeps the structure and fixes the presentation, by running a short workflow whose critic looks at the rendered result and sends it back for one or more refine passes.

Claude can already one-shot an image into HTML. That alone is not worth a skill. Two things make this one earn its place, and both are load-bearing:

1. **A closed visual feedback loop.** A render is screenshotted, an independent agent *views* the screenshot against the original sketch, flags lost or wrong information and unclear layout, and a refine pass applies the fixes. One-shot rendering cannot critique its own output; this can.
2. **A locked house style.** The aesthetic lives in a fixed template, not in each agent's improvisation. Left free, every render reinvents colors, background, and title treatment and the result drifts ugly. Pinning the style is what keeps the output consistently legible.

## The core idea: separate structure from style

This is the design rule the whole skill hangs on.

- **Structure is the agent's job.** Parse the sketch into an intermediate representation (IR): nodes, edges, coverage spans, labels. Lay it out: align to a grid, snap span endpoints to node edges, resolve overlaps. The critic improves structure and clarity.
- **Style is fixed, never improvised.** Background, palette, the hand-drawn SVG filter, fonts, sizes, title policy, bracket-label placement all come verbatim from `templates/house-style.html`. The agent fills coordinates and text into that shell; it does not author CSS or pick colors.

A prototype that let agents choose the style produced a correct-but-uglier diagram (a heavy title, a busy dotted background, primary red/blue, a rougher filter) than a hand-curated render of the same content. The split is the fix: critique drives *correctness*, the template guarantees *prettiness*.

## When to use

- The user photographs a hand-drawn or whiteboard **concept diagram** (flows, boxes and arrows, coverage brackets, annotations) and wants it digitized cleanly.
- Any of the trigger phrases in the description.

## When to skip

- **UI wireframes / screen layouts.** That space is owned by tldraw Make Real, Vercel v0, Figma Make. Point the user there; do not reinvent it.
- **A trivial sketch** (two boxes and an arrow). Render it in one pass; do not spin up the full loop.
- The user wants a **correctness audit** of the system the diagram depicts. That is a different job.

## Pipeline (a fresh agent per stage)

The skill drives a background `Workflow`. Each stage is a fresh agent with a single responsibility; clean context per stage is what makes the critique honest.

```
0. prep      HEIC/photo -> PNG (deterministic: sips)
1. EXTRACT   vision agent VIEWS the photo (Read renders images) -> IR (schema-validated):
             nodes / edges / spans{label,value,covers[],note}
2. LAYOUT    IR -> clean coordinates: align to grid, snap span ends to node edges,
             de-overlap, choose nesting order
3. RENDER    fill IR + layout into templates/house-style.html (style copied VERBATIM)
             -> self-contained HTML, then Chrome-headless screenshot to PNG
4. CRITIQUE  fresh vision agent VIEWS the screenshot against the original photo + IR
             -> structured findings (kind / detail / fix)
5. REFINE    apply findings -> re-render -> re-shoot, loop until the critic reports
             clear, or a round cap is hit
```

Optionally close with a small judge panel: 2-3 independent critics vote on clarity before shipping.

Screenshot command (verified on macOS, Chrome present):

```
'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' --headless=new \
  --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
  --window-size=1000,480 --screenshot=<png> 'file://<html>'
```

The render and critique agents have Read (views images), Write, and Bash, so no external vision API is needed.

## Scale to the input

The full five-stage loop on a four-box doodle is overkill. Match the depth to the sketch:

- **Simple** (a handful of nodes, no overlap): one render pass, skip the critique loop.
- **Complex** (many nodes, nested spans, dense annotation) or **a still-unclear critique**: run the loop, capping refine rounds (2-3) so it terminates.

State the chosen depth so a heavy run on a simple sketch is a visible choice, not a silent default.

## What the critic may and may not change

The faithfulness invariant, and the boundary the prototype exposed.

- **May**: fix layout (overlap, gap-anchored spans, alignment), legibility (label size, contrast), and presentation. Add units and a one-line "what does this layer do" note when the meaning is unambiguous from the sketch.
- **May not**: invent structure or semantics absent from the sketch. The IR is the source of truth; the critic improves how it reads, not what it says.
- **External truth only on request.** The critic judges *faithfulness to the sketch plus internal clarity*. It does not "correct" the diagram against domain facts it was not given. If the user supplies context (what the system actually does), semantic enrichment is in scope; otherwise the sketch stands as drawn, even where the user later realizes it was wrong. A prototype that was fed the ground-truth meaning silently corrected a coverage error: useful, but only because the truth was provided. Without it, flag the ambiguity, do not resolve it.

## House style (the locked template)

`templates/house-style.html` is the fixed aesthetic, and the agent copies its `<style>` block and the SVG `feTurbulence` filter verbatim:

- Warm paper background with faint ruled lines (not dots).
- Hand-drawn wobble from an inline SVG displacement filter, no external JS or CDN.
- Font stack `'Caveat','Marker Felt','Comic Sans MS',cursive`, with Caveat embedded as a base64 woff2 (SIL OFL 1.1) so the hand-drawn look needs no network; the system fonts only stand in if the embed fails to load. Label text is never run through the filter, so it stays crisp.
- Muted two-tone palette for coverage layers (teal outer, amber inner), not primary red/blue.
- No oversized title; a tight composition; bracket spans snap to node edges.

If a sketch needs a shape the template lacks, add it, then fold the addition back into the template so the next run inherits it rather than re-improvising.

## Open / not yet built

- **Editable Excalidraw output.** A nice-to-have extension, not a prerequisite: the skill already earns its place on the critic loop and the locked house style (above), and shipping clean HTML is useful on its own, so it stays valuable even if this is never built. If built, emit an Excalidraw scene (via the Excalidraw MCP) alongside the HTML so the user can keep editing. Not yet implemented.
- **Generalize the prototype.** The proof-of-concept hardcoded paths and fed the critic domain truth. Productionizing means: arbitrary image input, the scale-to-input branch, and a critic prompted on faithfulness rather than external truth.
- **Round-trip affordances.** Match the `visual-*` family: click-to-copy, open-in-browser per platform.

## What this is not

- Not a UI-wireframe-to-code tool (tldraw Make Real / v0 / Figma own that).
- Not a faithful tracer; it improves presentation, within the faithfulness invariant.
- Not a correctness audit of the depicted system.
