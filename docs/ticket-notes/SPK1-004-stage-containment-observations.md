# SPK1-004: Stage Containment Behaviour Observations

Reference: SPK1-008 spike report consumption

## Overview

This document records observed behaviour of React Flow's `parentNode` /
`parentId` containment mechanism as implemented for stage and case-plan-model
container nodes in SPK1-004.

## Drop Detection (parent candidate resolution)

When a node is dropped onto the canvas, the `onDrop` handler in `App.tsx`
iterates the existing node list (in reverse render order) to find the
top-most container node whose bounds enclose the drop point.

- **Hit-test**: compares the drop position (`screenToFlowPosition`) against
  each container node's position + measured (or default) dimensions.
- **Container types checked**: `stage` and `case-plan-model` (defined in
  `containerNodeTypes` set).
- **Non-container exclusion**: if the dropped element is itself a container
  type, it is not assigned a parent — prevents nesting stages inside stages
  during the initial drop.

## parentId Assignment

When a valid parent candidate is found:

1. `newNode.parentId` is set to the container node's `id`.
2. `newNode.extent` is set to `'parent'`, which constrains the child node's
   drag movement to remain within the parent's bounding box.
3. `newNode.position` is recalculated as a **relative offset** from the
   parent's top-left corner (`dropPosition - parentPosition`).

## extent='parent' Constraint

React Flow's built-in `extent: 'parent'` behaviour:

- Child nodes cannot be dragged outside the parent's rendered bounds.
- If the parent is resized smaller than the child's position, the child may
  visually overflow but snaps back on the next drag interaction.
- The child's position coordinates are always relative to the parent's
  origin (0, 0 = parent top-left).

## Observed Edge Cases and Limitations

1. **Post-drop reparenting not implemented**: nodes dropped outside a
   container and later dragged into one are NOT automatically reparented.
   React Flow does not natively reassign `parentId` on drag-end.
   → SPK1-008 should evaluate whether `onNodeDragStop` reparenting is
   needed and how to implement it.

2. **Nested containers**: the current logic prevents a container from being
   assigned as a child of another container during drop, but does not
   prevent manual parentId assignment via other means. Nesting stages inside
   case-plan-models is a valid CMMN pattern that may need explicit support.

3. **Dimension source**: hit-testing uses `node.measured.width/height` when
   available (after first React Flow render), falling back to
   `defaultWidth/defaultHeight` from the element type registry. On the
   initial drop before measurement, the fallback dimensions are used.

4. **Z-ordering**: reverse iteration finds the top-most (last-rendered)
   container. If containers overlap, the one rendered last wins. This
   matches visual stacking expectations.

5. **Removing from parent**: there is currently no mechanism to "un-parent"
   a child node by dragging it outside the container bounds — the
   `extent: 'parent'` constraint prevents this.

## Recommendations for SPK1-008

- Evaluate drag-end reparenting (`onNodeDragStop` handler) for moving nodes
  between containers or out of containers.
- Consider whether `extent: 'parent'` is too restrictive and whether a
  custom extent callback would better serve the CMMN containment model.
- Test performance with deeply nested containment (case-plan-model → stage →
  child nodes) at scale.
