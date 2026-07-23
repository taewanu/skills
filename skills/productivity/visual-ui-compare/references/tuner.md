# Tuner (continuous & motion variables)

Reached from step 1 when the decision is a continuous or motion choice, not a discrete set. A continuous or motion choice can't be frozen into a grid of cells: there's no discrete set to lay out, just a range to feel. So build a **tuner** instead: one live preview, a panel of controls wired to CSS variables, and a copy-back of the chosen values. (This is the general HTML pattern pointed at a UI decision: interactive controls when text can't express the choice, always ending in an export. It isn't a separate product.)

**Start from `templates/interactive.html`.** Copy the mechanics verbatim: control→CSS-variable wiring, `localStorage` persistence, play/replay (re-triggers the animation with a reflow), and the "Copy these values" JS. Those are solved; what you decide is the chrome and *which* controls to expose.

Collect tokens the same way as the grid (the skill's "Collect tokens from the current project" step); the preview should use the project's real colors/easings, and copy **both** themes since the theme toggle ships here too. Save to `/tmp/<project-slug>-visual-ui-compare-interactive.html` and open it with the skill's "Open in the browser" commands.

The template ships a working **example** (a pop animation tuned by duration / easing / scale) so the wiring is visible; replace it with the real element, and keep only the controls the decision actually needs (asked for duration + easing? delete the scale control too). Fill the regions:

1. **Preview**: the element under test (button, card, sheet), inside `#preview`, driven by the CSS variables the controls set. Real content, project tokens. Declare each tunable variable's default on `#preview`.
2. **Controls**: one per variable. Each carries `data-var="--your-css-var"`, plus `data-unit="ms"`/`"px"` on numeric sliders (omit on selects: a unit appended to a `cubic-bezier(...)` string corrupts it), and a sibling `<span data-readout="--your-css-var">` for the live value. The JS keys entirely off these three attributes. Use a range slider for numerics (duration, size, radius, blur, opacity) and a select for discrete presets (easing functions).
3. **Trigger**: Play / Replay re-runs the motion by toggling `.run` on `#preview` and letting a `@keyframes` animation restart. So author the motion as a `.run`-gated keyframe animation that *consumes* your variables, not a bare `transition`, or Play won't replay.

**Three things move together for each variable**: the control (`data-var`), the variable's default on `#preview`, and the keyframe/style that consumes it. Add or drop all three together: a control with no consumer does nothing, and a consumer with no control silently falls back to its default.

Tuner discipline:

- **Mark the starting point.** Pre-set controls to the current shipping values and label that baseline. Without an anchor, "is this better?" has nothing to be better *than*.
- **One concept at a time, still.** A duration slider + an easing select describe one motion, fine. A dozen unrelated knobs is a control panel, not a decision. Expose only the variables the choice actually turns on.
- **The live value is the label.** Show each control's current value, and make "Copy these values" emit the full set as `--var: value;` pairs (with the theme/viewport it was tuned in) so you can read the result off and patch tokens/CSS.

When the user is done, they hit **Copy these values** and paste back, or just say what felt right. Then patch the tokens/CSS and delete the page, the same as the grid ("After the user picks").
