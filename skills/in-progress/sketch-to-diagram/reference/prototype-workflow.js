export const meta = {
  name: 'sketch-to-diagram-poc',
  description: 'Prototype: hand-drawn concept sketch -> structured IR -> house-style HTML, screenshot, independent critique, one refine round',
  phases: [
    { title: 'Extract', detail: 'vision agent reads the sketch into a structured IR' },
    { title: 'Render', detail: 'IR -> self-contained hand-drawn HTML, then Chrome-headless screenshot' },
    { title: 'Critique', detail: 'fresh vision agent compares render vs original + intent' },
    { title: 'Refine', detail: 'apply findings -> improved HTML + screenshot' },
  ],
}

const SKETCH = '/tmp/sketch.png'
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const shoot = (html, png) =>
  `'${CHROME}' --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 --window-size=1000,480 --screenshot='${png}' 'file://${html}'`

const IR_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    nodes: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, label: { type: 'string' } }, required: ['id', 'label'] } },
    edges: { type: 'array', items: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' } }, required: ['from', 'to'] } },
    spans: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, covers: { type: 'array', items: { type: 'string' } }, note: { type: 'string' } }, required: ['label', 'covers'] } },
  },
  required: ['nodes', 'edges', 'spans'],
}

const CRIT_SCHEMA = {
  type: 'object',
  properties: {
    overall_clarity: { type: 'string' },
    findings: { type: 'array', items: { type: 'object', properties: {
      kind: { type: 'string' }, detail: { type: 'string' }, fix: { type: 'string' },
    }, required: ['kind', 'detail', 'fix'] } },
  },
  required: ['findings'],
}

const REFINE_SCHEMA = {
  type: 'object',
  properties: {
    changes: { type: 'array', items: { type: 'string' } },
    html_path: { type: 'string' },
    shot_path: { type: 'string' },
  },
  required: ['changes', 'html_path', 'shot_path'],
}

phase('Extract')
const ir = await agent(
  `You are the EXTRACT stage of a sketch-to-diagram pipeline. Use the Read tool to VIEW the hand-drawn sketch image at ${SKETCH} (Read renders images visually). It is a concept diagram on notebook paper. Extract its structure FAITHFULLY into the schema:
- nodes: each labelled box, with a lowercase-slug id derived from the label.
- edges: each arrow as {from,to} by node id, in drawn direction.
- spans: each bracket that covers a range of nodes — its label text, any number/value written with it, the list of node ids it visually covers, and a short note of meaning if legible.
Do NOT invent anything not drawn. Return only the structured object.`,
  { label: 'extract', phase: 'Extract', schema: IR_SCHEMA, agentType: 'general-purpose' }
)
if (!ir) return { error: 'extract failed' }
log(`IR: ${ir.nodes.length} nodes, ${ir.edges.length} edges, ${ir.spans.length} spans`)

phase('Render')
const irJson = JSON.stringify(ir)
const v1 = await agent(
  `You are the RENDER stage. Produce a SINGLE self-contained HTML file at /tmp/sketch-v1.html that renders this diagram (IR below) in a clean hand-drawn style:
- horizontal flow of rounded node boxes connected by arrows (drawn direction);
- coverage brackets BENEATH the chain, each spanning exactly from the LEFT edge of its first covered node to the RIGHT edge of its last covered node, labelled with its label + value, each tinted a distinct soft colour; nest deeper spans lower.
Hand-drawn feel via an inline SVG <filter> using feTurbulence + feDisplacementMap (NO external JS/CDN). Font stack 'Caveat','Marker Felt','Comic Sans MS',cursive (text NOT filtered, must stay legible). Warm paper background.
Then screenshot it by running this exact Bash command: ${shoot('/tmp/sketch-v1.html', '/tmp/shot-v1.png')}
Verify /tmp/shot-v1.png exists (use Read or sips to confirm) and return html_path=/tmp/sketch-v1.html, shot_path=/tmp/shot-v1.png plus a one-line changes note. IR: ${irJson}`,
  { label: 'render-v1', phase: 'Render', schema: REFINE_SCHEMA, agentType: 'general-purpose' }
)
if (!v1) return { error: 'render failed', ir }

phase('Critique')
const crit = await agent(
  `You are the CRITIQUE stage — an INDEPENDENT reviewer who did NOT render this. Use Read to VIEW both images: the original sketch ${SKETCH} and the rendered output /tmp/shot-v1.png.
Ground truth of what the diagram means (NOTE: this POC fed the critic external truth; the productionized skill judges faithfulness to the sketch instead, see SKILL.md): a worker call chain stepA -> stepB -> stepC -> remote call. stepB WRAPS the per-item dispatch (stepC) in a long watchdog that fails a hung step over to the next tick (broad backstop). stepC arms its OWN short stall timeout around the remote call so a stalled transfer self-aborts cleanly. So the long span should cover stepC..remote call (NOT stepB, the wrapper), and the short span covers the remote op nested inside.
Judge ONLY clarity of information delivery. Flag: wrong/ambiguous bracket coverage, overlap that hides nesting, illegible or lost labels, and missing "what does each layer DO" info. Give a concrete fix per finding. No invented praise. IR: ${irJson}`,
  { label: 'critique', phase: 'Critique', schema: CRIT_SCHEMA, agentType: 'general-purpose' }
)
if (!crit) return { error: 'critique failed', ir, v1 }
log(`critique: ${crit.findings.length} findings`)

phase('Refine')
const v2 = await agent(
  `You are the REFINE stage. Read the current HTML /tmp/sketch-v1.html (as text), the IR, and the critique findings (JSON below). Produce an IMPROVED self-contained HTML at /tmp/sketch-v2.html that addresses EVERY actionable finding while PRESERVING the diagram's information (do not invent content beyond the IR + the documented meaning in the findings). Same hand-drawn aesthetic + constraints as v1. In particular: make bracket coverage semantically correct, resolve overlap so nesting reads clearly, and add a short one-line effect note per coverage layer.
Then screenshot by running exactly: ${shoot('/tmp/sketch-v2.html', '/tmp/shot-v2.png')}
Confirm /tmp/shot-v2.png exists and return changes[], html_path=/tmp/sketch-v2.html, shot_path=/tmp/shot-v2.png.
FINDINGS: ${JSON.stringify(crit.findings)}
IR: ${irJson}`,
  { label: 'refine-v2', phase: 'Refine', schema: REFINE_SCHEMA, agentType: 'general-purpose' }
)
if (!v2) return { error: 'refine failed', ir, crit, v1 }

return { ir, critique: crit, v1, v2 }
