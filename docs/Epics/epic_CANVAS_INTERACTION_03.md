# Epic: CANVAS_INTERACTION

**Status:** TICKETS
**Owner:** human
**Created:** 2026-04-21
**Last Updated:** 2026-04-22

---

## 1. Purpose

Turn the spike's "drop-and-drag" playground into a real authoring
surface. Users need to take bigger swings at a case plan model:
reorganise large groups of elements, try an alternative layout and
undo it, and work across multiple case plan models within a single
project.

This epic adds the canvas-interaction features that turn the Designer
from a sketching tool into an editor: undo/redo history, marquee and
Ctrl+click multi-select, copy/paste (within and across CPMs), top-bar
Design/Test/Publish mode tabs, and a project-tree sidebar for
switching between case plan models in the current project.

---

## 2. User Story

As a **solution architect**,
I want to undo mistakes, select and move groups of elements, and
duplicate parts of one case plan model into another,
So that editing feels like a real desktop application — not a
one-shot diagram tool.

As a **technical business analyst**,
I want to see all the case plan models in my project in a sidebar and
switch between them with one click,
So that I can review related cases side by side without re-opening
files.

---

## 3. Scope

### In Scope

- Undo/redo stack of at least 100 operations covering: add element,
  remove element, move element, edit element properties, add wire,
  remove wire, paste.
- Keyboard shortcuts: Ctrl+Z undo, Ctrl+Shift+Z (and Ctrl+Y) redo.
- Multi-select:
  - Marquee selection by click-drag on empty canvas.
  - Additive selection via Ctrl+click on individual elements.
  - Shift+click for range-style continuous selection where it makes
    sense (optional — spike at ticket time).
- Bulk operations on a multi-selection: move (drag any selected
  element moves the whole selection), delete (Delete key),
  copy (Ctrl+C), cut (Ctrl+X).
- Copy/paste of elements (including wires where both endpoints are
  in the clipboard):
  - Within the same CPM (paste at offset from original).
  - Across CPMs in the same project.
  - Pasted elements get new IDs; wire endpoints are re-mapped.
- Top-bar mode tabs: Design / Test / Publish. Only Design is fully
  functional from this epic; Test and Publish route to their
  respective epics' UIs once available (placeholders in this epic).
- Project-tree sidebar (collapsible) listing:
  - Case plan models in the project (names) with the active one
    highlighted.
  - Domain contexts (names; click opens the domain context detail
    view — which is built in epic_DOMAIN_CONTEXT_07).
  - Test scenarios (names; click opens Test mode — which is built in
    epic_TEST_MODE_AND_SIMULATOR_10).
  - New-CPM button at the bottom.
- Clipboard persists across CPM switches within a single session.
  Clipboard is cleared on project close.

### Out of Scope

- System clipboard integration (copy to OS clipboard for pasting
  outside the Designer). v0.1 uses an internal clipboard only.
- Cross-project copy/paste — deferred until later when needed.
- Reordering CPMs in the project tree via drag. Deferred.
- Renaming a CPM from the sidebar (covered by property panel on the
  CPM node, epic_PROPERTY_PANEL_05).
- Canvas annotations, comments, or sticky notes.
- Collaborative selection, cursors, or presence indicators
  (v0.3+ only).
- Test-mode and Publish-mode tab contents — this epic only wires the
  tab UI. Contents are delivered by epic_TEST_MODE_AND_SIMULATOR_10 and
  epic_PUBLISH_MODE_AND_PACKAGING_11.

---

## 4. Functional Requirements

- **FR-008** — Support multiple case plan models per project via a
  project-tree sidebar that lists them and allows one-click
  switching.
- **FR-014** — Support undo/redo for all canvas operations with
  keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z) and an undo stack of
  at least 100 operations.
- **FR-015** — Support multi-select via click+drag marquee and
  Ctrl+click, enabling bulk operations (move, delete, copy).
- **FR-016** — Support copy/paste of selected elements within the
  same case plan model and across case plan models within the same
  project.
- **FR-021** — Support three canvas modes accessible via tabs in the
  top bar: Design, Test, and Publish.
- **FR-022** — In Design mode, all elements are editable (add,
  remove, configure, wire). Test and Publish modes transition to
  their respective epics' UIs.

---

## 5. Non-Functional Requirements

- **NFR-004** — Maintain 60 FPS canvas interaction (pan, zoom, drag)
  on CPMs with up to 100 elements. Applies especially during
  multi-select drag of many elements.
- **NFR-005** — Maintain at least 30 FPS canvas interaction on CPMs
  with up to 300 elements.
- **NFR-040** — Provide keyboard shortcuts for all frequent
  operations following OS-standard conventions (Ctrl+Z, Ctrl+Shift+Z,
  Ctrl+C/V, Delete).

---

## 6. UI/UX Notes

- **Mode tabs.** Three pill-style tabs in the top bar: Design (left),
  Test (middle), Publish (right). Active tab highlighted. Switching
  to Test or Publish in this epic navigates to a placeholder route
  rendered by the respective epics (or a "not yet implemented"
  state in the interim).
- **Project tree.** Left sidebar between the palette and the canvas.
  Collapsible via a chevron on its header. Sections:
  - *Case Plan Models* — list with selection highlight; click to
    switch active CPM; "+ New" button at the bottom of the section.
  - *Domain Contexts* — list; click opens detail view
    (epic_DOMAIN_CONTEXT_07).
  - *Test Scenarios* — list; click opens in Test mode
    (epic_TEST_MODE_AND_SIMULATOR_10).
- **Undo/redo affordance.** Edit menu entries "Undo" and "Redo" plus
  small chevron buttons in the top bar near the breadcrumb. Disabled
  state when stacks are empty.
- **Marquee selection.** Click-drag on empty canvas draws a dashed
  blue rectangle. Releasing selects elements intersecting the
  rectangle.
- **Multi-select highlight.** Selected elements show React Flow's
  default selection outline. A selection count badge ("3 selected")
  appears in the top-right while multi-selected.
- **Paste position.** On first paste of a new clipboard, place
  centred at the current viewport centre. Subsequent pastes of the
  same clipboard offset by 16px to avoid exact overlap.
- **Cross-CPM paste.** If the source CPM references a case variable
  that does not exist in the destination, show a non-blocking warning
  (epic_CASE_VARIABLES_AND_SENTRIES_06's validator surfaces details
  later).
- **Switch-CPM with dirty selection.** Clears selection on switch;
  clipboard is preserved.

---

## 7. Data Model Impact

- **No on-disk schema changes.** Undo/redo state is in-memory only
  and does not persist across sessions.
- **In-memory only:**
  - `canvasStore.undoStack` / `redoStack`: bounded 100-entry ring
    buffers of serialized diff records.
  - `canvasStore.clipboard`: current internal clipboard (node +
    edge subgraph).
- **ID re-mapping.** Pasting creates new UUIDs for every element.
  Wires whose endpoints reference elements not in the clipboard are
  dropped silently.

---

## 8. Integration Impact

- **canvasStore (Zustand).** Adds `undo`, `redo`, `pushCommand`,
  `clipboard`, `copy`, `paste`, `cut`, `selection`.
- **Command model.** Every mutation goes through a typed command
  (e.g., `AddElementCommand`, `MoveElementsCommand`) with `apply`
  and `undo` methods. All editing call sites — from this epic
  onward — push commands rather than mutating state directly.
- **projectStore.** Exposes the list of CPMs in the current project
  for the sidebar; knows which CPM is active.
- **Routing.** Add `/test` and `/test/:scenarioId` and `/publish`
  route placeholders — wired to tab state.
- **No new dependencies.** Uses React Flow's `useReactFlow` hook for
  selection APIs and `immer` (may already be in deps) for
  reducer-style undo/redo; if not, introduce `immer` in this epic.

---

## 9. Acceptance Criteria

- [ ] Ctrl+Z undoes the last canvas operation; Ctrl+Shift+Z / Ctrl+Y
  redoes it. The stack holds at least 100 operations.
- [ ] Marquee selection selects all elements intersecting the drawn
  rectangle.
- [ ] Ctrl+click toggles an element's membership in the current
  selection.
- [ ] Dragging any selected element moves the entire selection by
  the same offset.
- [ ] Delete removes all selected elements; undo restores them.
- [ ] Copy (Ctrl+C) + paste (Ctrl+V) within the same CPM creates
  duplicates with new IDs, offset from originals.
- [ ] Copy in CPM A, switch to CPM B, paste — duplicates land in
  CPM B.
- [ ] Wires between two selected endpoints are copied along with the
  elements; wires with an endpoint outside the selection are
  dropped.
- [ ] Top-bar Design / Test / Publish tabs switch modes. Design is
  fully functional; Test and Publish show their placeholders.
- [ ] Project-tree sidebar lists all CPMs in the project. Clicking a
  CPM makes it the active canvas. The active CPM is visually
  highlighted.
- [ ] "+ New CPM" creates a new CPM in the project (via
  `LocalBackend`), opens it, and makes it active.
- [ ] The sidebar lists domain contexts and test scenarios as
  read-only entries. Clicking them no-ops in this epic but does not
  throw (will be wired by their respective epics).
- [ ] Canvas drag + zoom + pan maintain ≥ 60 FPS with 100 elements
  and ≥ 30 FPS with 300 elements (measured on the reference
  workstation).

---

## 10. Risks & Unknowns

- **Undo granularity.** Every keystroke in a property panel should
  NOT generate a new undo entry — this would exhaust the stack
  immediately. Plan: property edits are coalesced within a 500 ms
  debounce window before pushing a command. Detail settles in
  epic_PROPERTY_PANEL_05; this epic's interface must support it.
- **Stage containment and undo.** Moving an element into/out of a
  stage changes `parentNode` — the command needs to capture both
  position and parent to undo cleanly.
- **Clipboard scope.** Session-only (not OS clipboard). Documented,
  simple, and keeps the scope small.
- **Open question — multi-level undo in test/publish mode.** Should
  switching modes preserve the undo stack? Default: Yes. Undo in
  Test mode is disabled; stack is preserved for return to Design.
- **Performance pitfall.** Naïve command history cloning the entire
  state on every change will break NFR-004 on 300-element CPMs. Use
  structural-sharing diffs (`immer` patches) instead of full
  snapshots.

---

## 11. Dependencies

- **Upstream:** epic_SPIKE1_FOUNDATION_00 (canvas, node rendering,
  basic selection), epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01
  (multi-CPM project model).
- **Downstream:**
  - epic_PROPERTY_PANEL_05 integrates with the command model for
    undo-able property edits.
  - epic_WIRE_MANAGEMENT_04 integrates with the command model for
    undo-able wire operations.
  - epic_TEST_MODE_AND_SIMULATOR_10 and
    epic_PUBLISH_MODE_AND_PACKAGING_11 wire content into the tabs
    placeholders introduced here.

---

## 12. References

- **prd:** `docs/Product Requirements Document/PRD.md` (§6.2 canvas)
- **architecture:** `docs/Architecture/Architecture.md` (§6.2
  canvasStore)
- **functional requirements:** `docs/Functional Requirements/FunctionalRequirements.md`
- **non-functional requirements:** `docs/Non-Functional Requirements/NonFunctionalRequirements.md`
- **mockups:** `docs/Mockups/02-canvas-editing.png`

---

## 13. Implementation Notes

**Complexity:** M

**Suggested ticket breakdown (5 tickets):**

1. **CIN-01** — Command-pattern refactor of `canvasStore`: typed
   commands for add / remove / move / update with `apply` and
   `undo`. Replace existing direct mutations. Ring-buffer stacks
   with a 100-entry limit. Keyboard shortcuts Ctrl+Z /
   Ctrl+Shift+Z / Ctrl+Y.
2. **CIN-02** — Multi-select: marquee rectangle, Ctrl+click
   toggling, bulk move (drag any selected moves all),
   bulk delete. Selection count badge.
3. **CIN-03** — Internal clipboard: copy / cut / paste with ID
   re-mapping, wire handling, within-CPM and across-CPM paste.
   Paste-offset behaviour on repeat.
4. **CIN-04** — Top-bar mode tabs: Design / Test / Publish.
   Routing and tab state. Design fully functional, Test and Publish
   route to placeholder panels.
5. **CIN-05** — Project-tree sidebar: collapsible, lists CPMs,
   domain contexts, test scenarios. Active CPM highlight; click to
   switch. "+ New CPM" creates and opens a new CPM via
   `LocalBackend`.

**Scaffolding files touched:**

- `src-renderer/state/canvasStore.ts` — restructured to command
  model.
- `src-renderer/features/canvas/CanvasView.tsx` — hook up marquee,
  clipboard, keyboard shortcuts.
- `src-renderer/App.tsx` — mode tabs + routing.
- `src-renderer/features/canvas/panels/ProjectTree.tsx` — new.
- `src-renderer/state/projectStore.ts` — add `activeCpmId`,
  `setActiveCpm`, `createCpm`.

**Chain constraint:** CIN-01 must merge first — every later ticket
relies on the command model. CIN-02/03/04/05 can largely overlap
once CIN-01 is in.

**Estimated total effort:** 3 days.
