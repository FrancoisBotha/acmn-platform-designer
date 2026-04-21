# SPK1-005: Domain Context Badge Overlay Approach Observations

Reference: SPK1-008 spike report consumption

## Overview

This document records the chosen rendering approach for the domain context
badge overlay on case plan model nodes, as implemented in SPK1-005, and the
trade-offs observed. This informs SPK1-008 when the badge needs to be
data-driven and support multiple binding modes.

## Chosen Approach: Absolute-Positioned Child Inside the Node Component

The domain context badge (`DomainContextBadge.tsx`) is rendered as an
absolutely-positioned `<div>` child inside the `CasePlanModelNode` React
component. It is **not** a React Flow node, not part of the graph, and has
no ports.

```
CasePlanModelNode (relative positioning context)
└── DomainContextBadge (absolute, centred, -top-9, pointer-events-none)
└── Handle (target)
└── Title bar
└── Content area
└── Handle (source)
```

Key implementation details:

- The `CasePlanModelNode` wrapper `<div>` has `className="relative ..."`,
  establishing the positioning context.
- `DomainContextBadge` uses `absolute left-1/2 -translate-x-1/2 -top-9` to
  centre itself above the top edge of the case plan model.
- `pointer-events-none` and `select-none` ensure the badge cannot be
  clicked, selected, or interacted with — it is purely decorative.
- `z-10` keeps the badge above sibling content within the node.

## Alternatives Considered

### React Flow Overlay Layer

React Flow provides an `<Panel>` component and overlay mechanisms that
render content in a fixed position relative to the viewport, not relative
to individual nodes. This was rejected because:

- The badge must move with the case plan model node during pan, zoom, and
  drag — viewport-fixed positioning would require manual coordinate
  tracking.
- Multiple case plan models on the canvas would each need their own badge,
  which is awkward to manage as viewport overlays.

### Separate DOM Layer Above the Canvas

A separate absolutely-positioned DOM layer rendered above the React Flow
canvas `<div>` could host badges with coordinates synchronised to node
positions. This was rejected because:

- Coordinate synchronisation between React Flow's internal transform
  (pan/zoom) and an external DOM layer is complex and error-prone.
- It introduces a second rendering context that must stay in sync on every
  frame during zoom/pan animations.

## Trade-offs of the Chosen Approach

### Advantages

1. **Automatic movement**: the badge moves with the node during drag, pan,
   and zoom without any additional logic — it is part of the node's DOM
   subtree.
2. **Simplicity**: no coordinate synchronisation, no extra state, no
   additional rendering layer. The badge is a stateless React component.
3. **Per-node scoping**: each case plan model instance renders its own badge
   automatically. Multiple case plan models each get their own badge with
   no extra management.
4. **No graph pollution**: the badge has no handles, no ID in the React Flow
   node array, and cannot be selected or connected to.

### Limitations

1. **Parent overflow clipping**: if the case plan model node or an ancestor
   has `overflow: hidden`, the badge (which extends above the node's top
   edge via negative top offset) could be clipped. Currently the node uses
   `rounded-lg` without explicit overflow control, so this is not an issue,
   but future styling changes must preserve this.
2. **No independent z-index layer control**: the badge's z-index is scoped
   within the React Flow node layer. It cannot float above other nodes that
   render later in the DOM order. If two case plan models overlap, the
   badge of the one rendered first may appear behind the body of the one
   rendered second.
3. **Badge interaction**: `pointer-events-none` means the badge currently
   cannot host interactive elements (buttons, dropdowns). SPK1-008 may need
   to make the badge interactive for binding-mode switching, which would
   require removing `pointer-events-none` and handling click events
   carefully to avoid interfering with node selection.

## Recommendations for SPK1-008

- **Keep the inline approach** as the default. It is simple and covers the
  core requirement of a per-node, non-graph overlay that moves with the
  node.
- **For interactive badges**: remove `pointer-events-none`, add
  `noDragHandle` or `stopPropagation` on badge click events to prevent
  node drag from activating.
- **For data-driven content**: pass badge data (domain name, version,
  binding mode) through the node's `data` prop and read it in
  `DomainContextBadge` via props. The current component accepts no props
  and renders hardcoded data — this is the first thing to change.
- **For multiple binding modes**: the 🔗 icon (reference mode) is currently
  hardcoded. Extend the badge to accept a `bindingMode` prop and render
  the appropriate icon (🔗 reference, 📎 embedded, etc.).
- **Z-index stacking**: if badge visibility behind overlapping nodes proves
  problematic, consider setting `zIndex` on the React Flow node object
  for case plan models, or explore React Flow's `elevateOnSelect` option.
