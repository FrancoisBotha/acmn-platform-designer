# SPK1-006: Wire Rendering Approach Observations

Reference: ACMN Standard v1.0.11 §12 — Wire Visual Styles

## Chosen Approach

Custom edge component (`AcmnWireEdge`) registered as a single `acmn-wire`
edge type in React Flow. Wire visual style is determined by a `wireType`
discriminator stored in the edge's `data` property, which indexes into a
style lookup table (`acmnWireStyles`).

### Why Custom Edge Components Over Built-in Edges

React Flow provides built-in edge types (`default`, `straight`, `step`,
`smoothstep`) that accept a `style` prop for basic CSS customisation.
However, the ACMN wire specification requires:

- Per-type SVG arrow markers with matching stroke colours
- Labelled mid-point badges with wire-type names
- Distinct dash patterns (solid, dashed, dotted, dash-dot)
- Animated flow indication for escalation wires

Built-in edges support `style` and `animated` but do not allow custom
markers, mid-point label rendering, or per-edge dash arrays without
overriding the edge entirely. A single custom edge component that
delegates to `BaseEdge` + `EdgeLabelRenderer` gives full control while
reusing React Flow's path geometry (`getBezierPath`).

### Wire Styles Implemented

| Wire Type          | Colour   | Stroke | Dash Pattern    | Animated |
|--------------------|----------|--------|-----------------|----------|
| Data               | #3b82f6  | 2 px   | solid           | no       |
| Confidence-Gated   | #f59e0b  | 2 px   | 8 4 (dashed)    | no       |
| Escalation         | #ef4444  | 3 px   | solid           | yes      |
| Event              | #22c55e  | 2 px   | 3 3 (dotted)    | no       |
| Case File          | #64748b  | 2 px   | 12 4 3 4 (dash-dot) | no   |

All wires render open arrowhead markers at the target end. Marker colour
matches the wire's stroke colour and is defined as a per-type SVG
`<marker>` element.

### onConnect Disabled

The `onConnect` prop is omitted from the `<ReactFlow>` component entirely.
Without an `onConnect` handler, React Flow does not allow users to
interactively drag new connections between handles. The connection line
does not appear and no new edges are created on handle interaction. This
satisfies FR-SPK-011.

### Edge Deletion on Node Removal

React Flow automatically removes edges whose source or target node is
deleted. No additional code is needed; this is standard framework
behaviour confirmed during the spike.

## Trade-offs and Observations

1. **Single component vs five components**: A single `AcmnWireEdge` with a
   style lookup is simpler to maintain than five separate edge components.
   The trade-off is that all wire rendering logic is coupled in one file.
   For the current five types this is acceptable; if wire types grow
   beyond ~10 with significantly different rendering (e.g. orthogonal
   routing), splitting into per-type components may be warranted.

2. **SVG marker deduplication**: Each edge instance currently renders its
   own `<defs><marker>` block. React Flow renders edges in a shared SVG
   layer, so duplicate marker definitions with the same `id` are
   harmless — the browser deduplicates by id. A future optimisation could
   hoist markers to a single `<defs>` block at the SVG root.

3. **Animated class**: The escalation wire uses React Flow's built-in
   `.animated` CSS class on the edge path, which produces a marching-ants
   stroke-dashoffset animation. This is the simplest animation approach
   but limits customisation. Future work may substitute a custom CSS
   animation for directional flow indication.
