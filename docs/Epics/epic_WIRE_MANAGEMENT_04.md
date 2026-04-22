# Epic: WIRE_MANAGEMENT

**Status:** TICKETS
**Owner:** human
**Created:** 2026-04-21
**Last Updated:** 2026-04-22

---

## 1. Purpose

Let users actually connect things. The spike rendered wires as static
samples to prove the visual styles; this epic turns them into
first-class interactive objects — draggable from output port to input
port, typed, compatible or rejected, styled distinctly per ACMN wire
type, and configurable via the property panel.

This epic implements the most Node-RED-like affordance in the
Designer: the wire-drawing interaction that users already find
intuitive from automation tools, now with the added discipline of
type compatibility enforcement.

---

## 2. User Story

As a **solution architect**,
I want to connect an agent's output port to a tool's input port by
dragging between them,
So that I can compose case plan models visually the way I would in
Node-RED, without writing code.

As a **technical business analyst**,
I want the Designer to stop me from connecting incompatible ports and
to show me clearly which wires carry what,
So that I can trust the diagram represents a model that would actually
run.

---

## 3. Scope

### In Scope

- Interactive wire creation via drag from an output port to an input
  port on compatible elements.
- Port type compatibility enforcement. As the user drags a new wire:
  - Compatible target ports are highlighted green.
  - Incompatible target ports are visually rejected (red outline,
    "not allowed" cursor).
  - Dropping on an incompatible target cancels the wire.
- Five distinct ACMN wire types with the visual styles committed by
  the spike, formalised as custom React Flow edge components:
  - **Data wire** — solid line with directional arrow.
  - **Confidence-gated wire** — solid with diamond gate icon.
  - **Escalation wire** — dashed red.
  - **Event wire** — dotted.
  - **Case file wire** — double line.
- Wire-type inference: creating a wire picks a default type based on
  source/target port types (e.g., guardrail "fail" output → escalation
  wire). User can change the type from the property panel.
- Wire selection with highlight and wire-property panel (right side,
  integrating with epic_PROPERTY_PANEL_05).
- Wire deletion via Delete key (on selected wire) or right-click
  context menu.
- Auto-routing: wires route around other elements using React Flow's
  built-in smoothstep / step edges, with configurable offset; user
  can't manually edit the path in v0.1.
- All wire operations are undoable via the command model introduced in
  epic_CANVAS_INTERACTION_03.
- Wire persistence in the CPM JSON file (edge list with ids, source /
  target handle references, wire-type, and properties).
- Wire properties on the right panel:
  - Type (dropdown, five options).
  - Buffering strategy (enum: immediate / batched / coalesced).
  - Transform (optional expression — opens the Monaco-based
    expression editor already added in epic_CASE_VARIABLES_AND_SENTRIES_06).
  - Confidence gate threshold (for confidence-gated wires only).

### Out of Scope

- Manual path editing (dragging wire midpoints to reshape). React
  Flow's built-in routing is sufficient for v0.1.
- Bidirectional wires — ACMN wires are always directional.
- Wire labels displayed on the canvas. Properties viewed in the panel
  only.
- Wire templates or reusable wire presets.
- Wire creation across CPMs.
- Drag-to-break (splicing an element onto an existing wire). Deferred.
- Compatibility matrix is fixed at v0.1's port types — adding new
  types requires a new epic.

---

## 4. Functional Requirements

- **FR-080** — Support creating wires by dragging from an output port
  on one element to an input port on another.
- **FR-081** — Enforce port type compatibility when creating wires,
  preventing connections between incompatible port types and showing
  a visual indicator on incompatible ports during drag.
- **FR-082** — Visually distinguish the five ACMN wire types: data
  wire (solid with arrow), confidence-gated wire (solid with diamond
  gate icon), escalation wire (dashed red), event wire (dotted),
  case file wire (double line).
- **FR-083** — Allow configuring wire properties when a wire is
  selected: wire type, buffering strategy, transform, confidence
  gate threshold.
- **FR-084** — Support deleting wires via Delete key or right-click
  context menu.
- **FR-085** — Automatically route wire paths around elements to
  avoid overlap, using React Flow's built-in routing in v0.1.

---

## 5. Non-Functional Requirements

- **NFR-004** — Maintain 60 FPS canvas interaction during wire
  creation on CPMs with up to 100 elements.
- **NFR-005** — Maintain ≥ 30 FPS wire rendering on CPMs with up to
  300 elements and 1000 wires (the NFR-081 capacity limit).
- **NFR-081** — Support individual CPMs containing up to 500 plan
  items and 1000 wires without degradation of canvas interaction.

---

## 6. UI/UX Notes

- **Ports.** Output ports on the right of nodes, input ports on the
  left. Rendered as small circles that grow slightly on hover to
  invite interaction.
- **Wire-drawing interaction.** Click and hold on an output port,
  drag toward a target. A ghost wire follows the cursor with the
  currently-inferred wire type's visual style. On valid hover, the
  target port turns green; on invalid hover, red with "not allowed"
  cursor. Release over valid target completes; release elsewhere
  cancels.
- **Wire-type inference.** Baseline table (subject to refinement):
  - Agent output → Tool input / Agent input → data wire.
  - Guardrail "fail" output → anywhere → escalation wire.
  - Evaluator "feedback" output → loop back → data wire.
  - Evaluator "escalation" output → escalation wire.
  - Connector output → event wire.
  - Case plan model boundary ↔ stage → case file wire.
  - Any wire whose source has a confidence threshold configured →
    confidence-gated wire.
- **Wire selection.** Click on a wire thickens it and shows a subtle
  glow. Multi-select extends to wires (marquee on canvas also picks
  up wires crossed by the rectangle).
- **Context menu on wire.** Right-click reveals: Delete, Change
  type → submenu, Edit transform..., Properties (opens property
  panel).

---

## 7. Data Model Impact

- **CPM JSON schema — edges section.** Persisted structure per edge:
  - `id` (string)
  - `source` (node id) + `sourceHandle` (port id)
  - `target` (node id) + `targetHandle` (port id)
  - `wireType` (`data` | `confidence_gated` | `escalation` | `event` |
    `case_file`)
  - `buffering` (`immediate` | `batched` | `coalesced`, default
    `immediate`)
  - `transform` (optional string — expression)
  - `confidenceThreshold` (optional number, only for
    `confidence_gated`)
- **Schema version bump.** If CPM schema was at v1 after
  epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01 without edges, this
  epic bumps it to v2 adding the edges array. Migration harness from
  epic_AUTOSAVE_AND_RECOVERY_02 applies a no-op migration that inserts
  an empty `edges: []` when missing.

---

## 8. Integration Impact

- **React Flow custom edges.** Five edge component files under
  `src-renderer/features/canvas/edges/`, registered in the
  `edgeTypes` prop on the canvas.
- **Port registry.** Each node type exposes its ports with their
  type metadata to `canvasStore` so compatibility can be checked
  without reading the node component.
- **Command model.** New commands: `AddWireCommand`,
  `RemoveWireCommand`, `UpdateWireCommand`. Plugged into the
  undo/redo system from epic_CANVAS_INTERACTION_03.
- **Property panel.** New `WireProperties.tsx` panel, wired into the
  router in epic_PROPERTY_PANEL_05.
- **LocalBackend save / load.** CPM file reader and writer handle
  the new edges section. No new IPC channels.

---

## 9. Acceptance Criteria

- [ ] Dragging from an agent's output port to a tool's input port
  creates a data wire.
- [ ] During a drag, incompatible target ports show red and the
  cursor indicates "not allowed".
- [ ] Dropping on an incompatible port cancels the wire — no edge is
  created.
- [ ] All five wire types render with visually distinct styles
  matching the spike's samples and the ACMN standard.
- [ ] Selecting a wire opens the wire properties panel with the
  wire type, buffering strategy, transform field, and (when
  applicable) confidence gate threshold.
- [ ] Changing the wire type in the property panel updates the
  canvas rendering immediately.
- [ ] Deleting a wire via Delete key or context menu removes it from
  the canvas and the persisted CPM file.
- [ ] Undo restores a deleted wire; redo removes it again.
- [ ] Wires auto-route around other elements; visual result matches
  React Flow's smoothstep behaviour.
- [ ] Saving and reopening a project preserves all wires, their
  types, and their properties.
- [ ] A CPM with 500 elements and 1000 wires pans and zooms at
  ≥ 30 FPS on the reference workstation.

---

## 10. Risks & Unknowns

- **Compatibility matrix complexity.** Getting the full matrix right
  for every port type combination may take iteration — the ACMN
  standard only fully defines the visual notation, not all type
  constraints. Recommendation: start with a permissive default
  (allow connection between same types or marked "any") and tighten
  as specific violations are discovered during testing.
- **Default wire-type inference.** The table above is a starting
  point; expect refinement once real cases are designed. Keep the
  inference in one module so it can be updated cheaply.
- **Performance on dense graphs.** 1000 wires is at the NFR limit.
  If React Flow's rendering struggles, consider virtualising
  off-screen edges.
- **Confidence-gated wire UX.** The confidence threshold applies to
  the upstream source — showing it on the wire property panel may
  confuse. Consider adding a hint tooltip; full UX decision in ticket.
- **Open question — what happens to wires when an endpoint element
  is deleted?** Cascade-delete is the simplest behaviour and matches
  user expectation; undo restores both. Documented here; confirmed
  in the relevant ticket.

---

## 11. Dependencies

- **Upstream:**
  - epic_SPIKE1_FOUNDATION_00 (nodes with `<Handle>` ports, wire
    visual samples).
  - epic_CANVAS_INTERACTION_03 (command model for undo/redo, multi-
    select including wires).
  - epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01 (CPM file read/write).
- **Downstream:**
  - epic_PROPERTY_PANEL_05 hosts the `WireProperties.tsx` panel.
  - epic_CASE_VARIABLES_AND_SENTRIES_06 provides the expression editor
    used for the wire's `transform` field.
  - epic_TEST_MODE_AND_SIMULATOR_10 relies on wires to route signals
    through the simulator; wire type and buffering strategy are
    consumed here.

---

## 12. References

- **prd:** `docs/Product Requirements Document/PRD.md` (§6.5 wire
  management)
- **architecture:** `docs/Architecture/Architecture.md` (§3 edges/
  module layout; §8 validation including wire-compatibility check)
- **acmn standard:** `docs/References/ACMN-Standard-v1.0.11.md`
  (§12 visual notation for wires)
- **functional requirements:** `docs/Functional Requirements/FunctionalRequirements.md`
- **non-functional requirements:** `docs/Non-Functional Requirements/NonFunctionalRequirements.md`
- **mockups:** `docs/Mockups/02-canvas-editing.png`

---

## 13. Implementation Notes

**Complexity:** M

**Suggested ticket breakdown (6 tickets):**

1. **WIR-01** — Port-type metadata on every node type. Port
   registry in `canvasStore` plus a `canConnect(source, target)`
   compatibility function. Unit tests for every permitted and
   rejected combination.
2. **WIR-02** — Interactive wire creation: enable React Flow
   `onConnect`, implement `isValidConnection` using the
   compatibility function, visual hover states (green / red),
   cancel on invalid drop.
3. **WIR-03** — Five custom edge components (data, confidence-
   gated, escalation, event, case file) registered as
   `edgeTypes`. Type inference function at wire creation time.
4. **WIR-04** — Wire commands (`AddWireCommand`,
   `RemoveWireCommand`, `UpdateWireCommand`) integrated with the
   undo/redo system. Cascade-delete of wires when endpoint
   elements are removed.
5. **WIR-05** — Wire property panel (`WireProperties.tsx`)
   covering type dropdown, buffering strategy, transform field
   (using the expression editor), confidence-gate threshold
   (conditional). Right-click context menu on wires.
6. **WIR-06** — CPM file schema bump: add `edges[]` array to the
   `.cpm.json` format, migration from v1 to v2, LocalBackend
   load/save handling.

**Scaffolding files touched:**

- `src-renderer/lib/acmnElementTypes.ts` — port type metadata
  additions.
- `src-renderer/features/canvas/edges/*.tsx` — five new components.
- `src-renderer/features/canvas/CanvasView.tsx` — register
  `edgeTypes`, enable `onConnect`, wire `isValidConnection`.
- `src-renderer/state/canvasStore.ts` — new wire commands.
- `src-renderer/features/propertyPanel/WireProperties.tsx` — new
  (registered in epic_PROPERTY_PANEL_05's router).
- `src-main/storage/migrations.ts` — register v1 → v2 CPM
  migration.

**Chain constraint:** WIR-01 must land before WIR-02 (compatibility
check needs port metadata). WIR-06 must not merge before
epic_AUTOSAVE_AND_RECOVERY_02's migration harness is available.

**Estimated total effort:** 3–4 days.
