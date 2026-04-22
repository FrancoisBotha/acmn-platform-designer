# Epic: SPIKE1_FOUNDATION — Designer PoC (App Shell + ACMN Element Rendering)

**Status:** TICKETS
**Owner:** human
**Created:** 2026-04-21
**Last Updated:** 2026-04-21

---

## 1. Purpose

Prove the viability of the ACMN Designer's technical foundations by
building a minimal Electron application that launches on Windows, renders
an empty React Flow canvas inside a shadcn/ui shell, and supports
drag-and-drop of every ACMN element type from the palette to the canvas
with correct visual notation.

This spike answers three go/no-go questions before the v0.1 epics are
committed to:

- Can React Flow faithfully render every ACMN element (typed ports on
  agents, stages as containers, milestones as diamonds, the attached
  domain context panel, connectors, five wire visual styles)?
- Does the Electron + React + shadcn/ui + Tailwind + React Flow stack
  integrate cleanly, or are there surprises (IPC, styling conflicts,
  build complexity)?
- Can we confidently estimate the full v0.1 build, or does the spike
  reveal unknowns that inflate the estimate?

The spike is the bridge between design documents (PRD, Architecture,
FRs, NFRs) and executable sprint planning. Without it, the v0.1 build
has significant unknown-unknowns in the canvas layer.

---

## 2. User Story

As a **solution architect** (end-user, future),
I want the Designer's foundational shell to open an infinite canvas
with a palette of every ACMN element type I can drag onto it,
So that I can see, ahead of the full v0.1 build, that the tool will be
able to faithfully represent the case plan models I need to author.

As an **engineering lead** (stakeholder),
I want a time-boxed spike that exercises the chosen stack end-to-end,
So that I can commit to a realistic v0.1 estimate and catch integration
problems before they compound into sprint delays.

---

## 3. Scope

### In Scope

- Electron 30+ application shell (main + renderer processes) that
  launches on Windows 10/11.
- React 18 + TypeScript (strict mode) renderer, bundled with Vite.
- Three-column layout: left palette, centre infinite canvas, right
  (empty) property panel placeholder.
- React Flow 12+ canvas with dot grid, minimap, pan, zoom.
- Palette containing a draggable entry for every ACMN element type:
  agent, tool, guardrail, handoff, evaluator, connector (7 built-in
  types), human task, process task, case plan model, stage, milestone,
  sentry (entry + exit), discretionary variant, domain context panel.
- Drag-and-drop from palette to canvas creates elements at drop
  position with unique internal IDs.
- Custom React Flow node components for every ACMN element type with
  correct visual notation (shape, colour, ports as `<Handle>`).
- Five hardcoded wire samples on the canvas covering all ACMN wire
  visual styles (data, confidence-gated, escalation, event, case file).
- Static domain context badge attached to the top edge of any dropped
  case plan model, showing hardcoded "Insurance Claims v3.2" sample
  data and binding-mode icon.
- Basic element interaction: click-select, drag-to-move,
  Delete-to-remove.
- `BackendContract` TypeScript interface file as a stub (no
  implementation), confirming the contract layer is planned.
- `electron-builder` Windows `.exe` installer (unsigned acceptable for
  the spike).
- Element gallery screenshot and written spike report.

### Out of Scope

- Interactive wire creation (drag from output port to input port). Wires
  appear only as hardcoded samples in this spike.
- Property panel — selecting an element does nothing beyond the visual
  selection highlight. Covered by epic_PROPERTY_PANEL_05.
- Case variables editor. Covered by epic_CASE_VARIABLES_AND_SENTRIES_06.
- Domain context editor and library beyond the static badge. Covered
  by epic_DOMAIN_CONTEXT_07.
- Project persistence, auto-save, open/save dialogs. Canvas state is
  in-memory only; closing the app loses work. Covered by
  epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01 and
  epic_AUTOSAVE_AND_RECOVERY_02.
- Undo/redo, multi-select marquee, copy/paste, canvas mode tabs.
  Covered by epic_CANVAS_INTERACTION_03.
- Test mode and Publish mode. Covered by their dedicated epics.
- `BackendContract` implementation (the stub interface file is
  included but nothing calls into it). Covered by
  epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01.
- macOS and Linux builds (deferred to v0.2+).
- Code-signed installer — unsigned `.exe` is acceptable here. Covered
  by epic_WINDOWS_INSTALLER_AND_DISTRIBUTION_12.
- Logging, settings dialog, native application menu, command palette.
  Covered by epic_APP_CHROME_AND_SETTINGS_08.

---

## 4. Functional Requirements

1. **FR-SPK-001** — The application shall launch as a Windows desktop
   app via `pnpm dev` (development) and produce a packaged `.exe`
   installer via `pnpm build`.
2. **FR-SPK-002** — The main window shall present a three-column
   layout: palette (left), infinite canvas (centre), empty property
   panel placeholder (right).
3. **FR-SPK-003** — The canvas shall render a dot grid background,
   support pan (space+drag or middle-mouse), zoom (scroll wheel), and
   display a minimap in the bottom-right corner.
4. **FR-SPK-004** — The palette shall contain a draggable entry for
   every ACMN element type listed in §4.1 of this epic (15 distinct
   entries).
5. **FR-SPK-005** — Dragging any palette entry onto the canvas shall
   create a node of that type at the drop position with a unique
   internal ID, rendered with the correct visual notation per the ACMN
   Standard v1.0.11 §12.
6. **FR-SPK-006** — Multiple instances of the same element type shall
   be droppable onto the canvas, each receiving a unique ID.
7. **FR-SPK-007** — Canvas elements shall be click-selectable (with a
   visual selection highlight), draggable to reposition, and deletable
   via the Delete key.
8. **FR-SPK-008** — A dropped case plan model element shall display a
   domain context badge attached to its top edge, showing hardcoded
   "Insurance Claims v3.2" sample data and a binding-mode icon (🔗
   link for reference).
9. **FR-SPK-009** — The canvas shall include, on initial load, five
   hardcoded wire samples demonstrating each ACMN wire type: data
   wire, confidence-gated wire, escalation wire, event wire, case file
   wire — each with the standard's distinct visual style.
10. **FR-SPK-010** — The application shall ship a `BackendContract`
    TypeScript interface file at
    `src-renderer/contracts/backend.ts` that declares the contract
    defined in Architecture.md §4.1, without any implementation.
11. **FR-SPK-011** — The application shall not enable React Flow's
    `onConnect` callback — interactive wire creation shall be
    explicitly disabled for this spike.

### 4.1 ACMN elements required in the palette

Per ACMN Standard v1.0.11 §12 (normative source for visual notation).

**Plan items (7):** agent node, tool node, guardrail node, handoff
node, evaluation node, connector node (with 7 sub-type icons: email,
webhook, file watch, schedule, database, event, API), human task,
process task.

**Structural elements (6):** case plan model, stage (with containment
support via React Flow `parentNode`), milestone, sentry (entry),
sentry (exit), discretionary-item variant (dashed border).

**Companion (1):** domain context panel (rendered as an overlay above
the case plan model, not as a React Flow node).

**Wire samples (5, hardcoded):** data, confidence-gated, escalation,
event, case file.

---

## 5. Non-Functional Requirements

1. **NFR-SPK-001** — The application shall run with
   `nodeIntegration: false`, `contextIsolation: true`, and
   `sandbox: true` on the BrowserWindow, even though no IPC calls are
   yet exercised.
2. **NFR-SPK-002** — All renderer code shall be written in TypeScript
   with strict mode enabled.
3. **NFR-SPK-003** — The spike shall use only the technology choices
   committed to in Architecture.md §1. No new libraries or frameworks
   shall be introduced in the spike; any pressure to do so is itself a
   finding for the spike report.
4. **NFR-SPK-004** — Dependencies shall be pinned in `package.json`
   (no caret ranges for direct dependencies) to guarantee reproducible
   builds.
5. **NFR-SPK-005** — The spike is time-boxed to 5 working days. If a
   single element type is disproportionately difficult, it shall be
   documented as a finding and the spike moves on — the value is broad
   coverage, not depth.

---

## 6. UI/UX Notes

- **Layout.** Three columns — palette fixed-width on the left, canvas
  fills the centre, property panel placeholder fixed-width on the
  right. Match the mockups in `docs/Mockups/`.
- **Palette.** Categorised sections (Plan Items, Structure, Connectors,
  Domain). Each entry is a small card with icon, label, and native
  HTML5 `draggable` attribute.
- **Canvas.** Dot grid background; minimap bottom-right; zoom controls
  (if any) bottom-right-adjacent.
- **Node visual language.** Tailwind classes matching the mockup
  palette — agents purple, tools green, guardrails red, evaluators
  cyan, human tasks orange, stages and milestones amber, handoffs
  pink.
- **Domain context badge.** Rendered as an absolutely-positioned
  overlay above the case plan model node, not as a React Flow node
  (no ports, not part of the graph). Shows domain name, version,
  binding-mode icon, summary counts.
- **Selection highlight.** React Flow's default selection outline is
  sufficient; no custom highlight required.

---

## 7. Data Model Impact

- No persisted data model. All canvas state lives in memory in the
  Zustand `canvasStore`.
- The `BackendContract` interface is introduced as a stub file. No
  data types it references are instantiated at runtime in the spike.
- The ACMN element type registry (`src-renderer/lib/acmnElementTypes.ts`)
  enumerates all palette items and their default visual properties.

---

## 8. Integration Impact

- **New dependencies** (all per Architecture.md §1): `electron`,
  `electron-builder`, `react`, `react-dom`, `@xyflow/react`, `zustand`,
  `tailwindcss`, `shadcn-ui` primitives, `lucide-react`, `vite`,
  `typescript`.
- **Repository structure.** Establishes the `src-main/`, `src-renderer/`,
  `resources/` module layout defined in Architecture.md §3. Later
  epics build into this structure without restructuring.
- **No IPC traffic** beyond the default Electron preload bootstrapping.
  `contextBridge` is configured but exposes nothing functional.
- **No external services.** Fully offline.

---

## 9. Acceptance Criteria

- [ ] The application launches on Windows 10/11 via `pnpm dev`.
- [ ] `pnpm build` produces a `.exe` installer that runs on a clean
  Windows 11 VM.
- [ ] The window opens with the three-column layout (palette, canvas,
  property panel placeholder).
- [ ] The canvas shows a dot grid, supports pan and zoom, and displays
  a minimap.
- [ ] The palette contains a draggable entry for every ACMN element
  listed in §4.1.
- [ ] Every palette entry, when dragged to the canvas, creates an
  element with correct visual notation per the ACMN standard.
- [ ] Multiple elements of the same type can be dropped, each with a
  unique internal ID.
- [ ] Elements can be selected, moved, and deleted.
- [ ] A dropped case plan model shows the hardcoded domain context
  badge on its top edge.
- [ ] The canvas displays all five wire visual styles via hardcoded
  samples.
- [ ] `src-renderer/contracts/backend.ts` exists with the
  `BackendContract` interface declared (no implementation).
- [ ] `docs/element-gallery.png` exists showing every element type on
  a single canvas.
- [ ] `Spike1-Report.md` is committed covering: what worked, what was
  harder than expected, stack choices confirmed/questioned, per-element
  fidelity rating (🟢 / 🟡 / 🔴), estimate impact on v0.1, and
  recommendations.
- [ ] A follow-on ticket list for v0.1 is included in the report.
- [ ] The spike repo is tagged `spike1-complete` at the end.

---

## 10. Risks & Unknowns

- **Domain context panel rendering.** Whether it works as a React Flow
  overlay or needs a separate layer above the canvas is the core
  question. Acceptance requires attempting the overlay approach;
  documenting an alternative is an acceptable outcome.
- **Stage containment.** React Flow's `parentNode` model may not cover
  the full drag-in/drag-out UX that the full Designer will need.
  Document observed behaviour — full v0.1 may need custom containment
  logic.
- **Visual fidelity for less common elements.** Handoff, evaluator,
  and domain context panel have limited prior art. The spike accepts
  "matches the standard's figures at roughly the same fidelity";
  further polish is deferred.
- **Timebox pressure.** If any element proves disproportionately hard,
  record it and continue. Broad coverage beats depth for this spike.
- **Open question — stage UX.** Is stage-as-container usable, or does
  it need custom React Flow behaviour in v0.1? The spike surfaces the
  answer.
- **Open question — wire rendering.** Can all five visual styles be
  rendered with React Flow's built-in edge components plus light
  customisation, or do any need full custom edge components?

---

## 11. Dependencies

- **External documents:** PRD.md, Architecture.md, ProjectArchitecture.md,
  ACMN Standard v1.0.11, Spike1.md.
- **No upstream epic dependencies** — this is the first epic and the
  foundation for all v0.1 work.
- **Downstream consumers:** every v0.1 epic builds on the shell,
  canvas, and element rendering produced here.

---

## 12. References

- **prd:** `docs/Product Requirements Document/PRD.md`
- **architecture:** `docs/Architecture/Architecture.md`
- **spike spec:** `docs/References/Spike1.md` (source of this epic)
- **acmn standard:** `docs/References/ACMN-Standard-v1.0.11.md`
- **mockups:** `docs/Mockups/01-welcome.png`, `02-canvas-editing.png`,
  `03-property-panel.png`
- **functional requirements:** `docs/Functional Requirements/FunctionalRequirements.md`
- **non-functional requirements:** `docs/Non-Functional Requirements/NonFunctionalRequirements.md`

---

## 13. Implementation Notes

**Complexity:** L (large — broad breadth, many element types)

**Suggested ticket breakdown (5-day timebox, roughly per Spike1.md §9):**

1. **SPK-01** — Project scaffolding: Electron + Vite + React + TS +
   Tailwind + shadcn/ui + React Flow. Three-column layout with empty
   canvas. (Day 1)
2. **SPK-02** — Palette shell + element-type registry + drag-and-drop
   plumbing (palette → canvas via HTML5 DnD and
   `screenToFlowPosition`). (Day 2 morning)
3. **SPK-03** — Plan-item node components: agent, tool, guardrail,
   evaluator, handoff, human task, process task. Shapes, colours,
   ports as `<Handle>` components. (Day 2)
4. **SPK-04** — Structural element node components: case plan model
   (container), stage (container with `parentNode`), milestone
   (diamond), sentry entry/exit (small diamonds), discretionary
   variant (dashed border). (Day 3)
5. **SPK-05** — Connector node with 7 sub-type icons; domain context
   badge overlay on case plan model. (Day 4 morning)
6. **SPK-06** — Five hardcoded wire samples covering all ACMN wire
   visual styles. Disable `onConnect`. (Day 4 afternoon)
7. **SPK-07** — Canvas controls and interaction polish: pan, zoom,
   minimap, click-select, drag-move, Delete-to-remove. (Day 4
   afternoon)
8. **SPK-08** — `BackendContract` stub interface file. Windows
   installer via `electron-builder` (unsigned). Element-gallery
   screenshot. Spike report with findings and v0.1 follow-on tickets.
   Tag `spike1-complete`. (Day 5)

**Estimated total effort:** 5 working days (time-boxed).

**Scaffolding files introduced (downstream tickets must be aware):**

- `package.json`, `pnpm-lock.yaml` — dependency manifest. All later
  epics add deps here.
- `electron-builder.yml` — packaging config. Epic 13 extends.
- `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts` — build and
  styling. Rare touches from later epics.
- `src-main/main.ts` — BrowserWindow creation. Epics 02, 09 add IPC
  handler registration here.
- `src-main/preload.ts` — `contextBridge` surface. Epics 02+ extend.
- `src-renderer/App.tsx` — root component. Most epics add routes or
  overlays here.
- `src-renderer/state/canvasStore.ts` — Zustand canvas state. Epic 04
  adds undo/redo and selection; Epic 05 adds wire state; Epic 09 adds
  test state overlays.
- `src-renderer/contracts/backend.ts` — stub interface. Epic 02
  implements it.
- `src-renderer/lib/acmnElementTypes.ts` — element registry. Later
  epics extend with validation and default property values.
