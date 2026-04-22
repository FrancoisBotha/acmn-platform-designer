# Spike 1 — Designer PoC: App Shell + ACMN Element Rendering

**Spike owner:** Francois
**Timebox:** 5 working days
**Status:** Proposed
**Related documents:** [PRD.md](../PRD.md), [Architecture.md](../Architecture.md), [ProjectArchitecture.md](../ProjectArchitecture.md), [reference/ACMN-Standard-v1.0.11.md](../reference/ACMN-Standard-v1.0.11.md)

---

## 1. Objective

Prove the viability of the Designer's technical foundations by building a minimal Electron application that:

1. Launches as a Windows desktop app.
2. Renders an empty React Flow canvas inside a shadcn/ui shell.
3. Displays a palette of every ACMN element type defined in the standard.
4. Supports drag-and-drop from the palette onto the canvas for every element type.
5. Renders each dropped element with its correct visual notation (shape, colour, ports shown — no port wiring yet).

This spike answers three questions before we commit to the full Designer build:

- **Can React Flow faithfully render every ACMN element** (agents with typed ports, stages as containers, milestones as diamonds, the domain context attached panel, connectors, wires as distinct visual types)?
- **Does the Electron + React + shadcn/ui + Tailwind + React Flow stack work together cleanly**, or are there integration surprises (IPC, styling conflicts, build complexity)?
- **Can we position ourselves to build the full Designer** in the estimated effort, or does the spike reveal unknowns that would inflate the estimate?

## 2. Out of scope for this spike

To keep the timebox tight, the spike deliberately excludes:

- Wire creation (drag from output port to input port). Elements appear on the canvas but cannot yet be connected.
- Property panel. Selecting an element does nothing beyond visual selection highlight.
- Case variables editor.
- Domain context editor. The domain context panel renders as a static header with hardcoded sample data.
- Project persistence. The canvas state lives in memory only; closing the app loses work.
- Test mode and Publish mode.
- Validation, auto-save, undo/redo.
- Backend contract implementation beyond a stub interface file.
- macOS and Linux builds.

Everything excluded is already covered in FunctionalRequirements.md for the full v0.1 build. The spike is about proving the *foundation* is sound, not about shipping a usable product.

## 3. Acceptance criteria

The spike is complete when all of the following are true:

1. The application launches on Windows 10/11 via `pnpm start` (dev) and produces a packaged `.exe` installer via `pnpm build`.
2. The window opens with a three-column layout: palette on the left, infinite canvas in the centre, (empty) property panel on the right.
3. The canvas displays a dot grid background, supports pan (space+drag or middle-mouse) and zoom (scroll wheel), and shows a minimap in the bottom-right.
4. The palette contains a draggable entry for every ACMN element listed in Section 4.1 below.
5. Dragging any palette entry onto the canvas creates an element of that type at the drop position, with correct visual notation per the ACMN standard.
6. Multiple elements of the same type can be dropped. Each gets a unique internal ID.
7. Elements can be selected (click), moved (drag), and deleted (Delete key).
8. The domain context panel renders attached to the top edge of any dropped case plan model element, showing hardcoded "Insurance Claims v3.2" sample data and a link-icon binding indicator.
9. A screenshot of the running app demonstrates all element types rendered on a single canvas in a realistic arrangement.
10. A written spike report captures the findings, surprises, and recommendations for the full build.

## 4. ACMN elements to render

All elements come from the ACMN Standard v1.0.11 ([reference file](../reference/ACMN-Standard-v1.0.11.md)). For each, Section 12 of the standard is the normative source for visual notation.

### 4.1 Plan items

| # | Element | Shape | Distinguishing features |
|---|---------|-------|------------------------|
| 1 | **Agent node** | Rounded rectangle | Input/output ports as circles on edges. Subtitle shows reasoning strategy. Accent colour (purple). |
| 2 | **Tool node** | Rounded rectangle | One input port (parameters), one output port (result). Distinct colour (green). Subtitle shows source (MCP/REST/local). |
| 3 | **Guardrail node** | Rounded rectangle | One input port, two output ports (pass/fail). Pass = green, fail = red. |
| 4 | **Handoff node** | Rounded rectangle | One input port (source state), one output port (context bundle). Distinct colour (pink). |
| 5 | **Evaluation node** | Rounded rectangle | Four ports: input, approved, feedback (loops back), escalation. Distinct colour (cyan). |
| 6 | **Connector node** | Rounded rectangle with type icon | Output port only. Type icons: envelope (email), lightning bolt (webhook), folder (file watch), clock (schedule), database cylinder (database), broadcast (event), API symbol (API). |
| 7 | **Human task** | Rounded rectangle with person icon | CMMN visual convention preserved. Distinct colour (orange). |
| 8 | **Process task** *(CMMN inherited)* | Rounded rectangle with gear icon | CMMN visual convention preserved. |

### 4.2 Structural elements

| # | Element | Shape | Distinguishing features |
|---|---------|-------|------------------------|
| 9 | **Case plan model** | Large rounded rectangle | Container element. Case name at top. Outermost boundary. |
| 10 | **Stage** | Rounded rectangle container | Contains child plan items. Name bar at top. Cognitive mode badge top-right (gather/analyse/draft/review/decide). Dashed border when discretionary. |
| 11 | **Milestone** | Diamond | Fill colour indicates state: neutral (available), green (achieved), red (revoked). |
| 12 | **Sentry (entry)** | Small diamond | Rendered on left edge of guarded element. Filled when satisfied. |
| 13 | **Sentry (exit)** | Small diamond | Rendered on right edge of guarded element. Filled when satisfied. |
| 14 | **Discretionary item** | Same as base element + dashed border | CMMN visual convention. Applies to any plan item. Rendered as a variant. |

### 4.3 Companion elements

| # | Element | Shape | Distinguishing features |
|---|---------|-------|------------------------|
| 15 | **Domain context panel** | Rounded panel | Attached to top edge of case plan model. Shows name, version, binding mode icon (🔗 link = reference, 🍴 fork = copy), summary counts. Not a plan item — a decoration. |

### 4.4 Wires (rendered but not interactive)

Wires are not created by the user in this spike (no wire-drawing interaction), but the canvas should include one hardcoded example of each wire type to verify rendering fidelity. These can be placed as pre-seeded elements on the canvas for the screenshot deliverable.

| # | Wire type | Visual style |
|---|-----------|--------------|
| 16 | **Data wire** | Solid line with directional arrow |
| 17 | **Confidence-gated wire** | Solid line with diamond gate icon |
| 18 | **Escalation wire** | Dashed red line |
| 19 | **Event wire** | Dotted line |
| 20 | **Case file wire** | Double line |

**Total:** 15 distinct draggable palette entries (items 1–15), plus 5 hardcoded wire samples (items 16–20) to demonstrate wire rendering.

## 5. Technical approach

### 5.1 Stack

Per the Architecture.md document, this spike commits to the planned stack:

- **Electron 30+** (main process: Node.js; renderer: Chromium)
- **React 18** + **TypeScript** (strict mode)
- **Vite** for renderer bundling, **tsc** for main process
- **React Flow 12+** (`@xyflow/react`) for the canvas
- **shadcn/ui** + **Radix** for UI primitives
- **Tailwind CSS** for styling
- **Zustand** for renderer state
- **Lucide React** for icons
- **pnpm** for package management
- **electron-builder** for packaging

No new technology choices are introduced by the spike. If any of these prove problematic during the spike, that is itself a finding worth reporting.

### 5.2 Project layout

Match the structure defined in Architecture.md Section 3, but implement only the minimum files needed for the spike scope:

```
acmn-designer/
├── package.json
├── electron-builder.yml
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
│
├── src-main/
│   ├── main.ts               # BrowserWindow creation, load URL, dev tools
│   └── preload.ts            # contextBridge (minimal — no backend calls yet)
│
├── src-renderer/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Three-column layout
│   ├── features/
│   │   ├── canvas/
│   │   │   ├── CanvasView.tsx
│   │   │   ├── nodes/        # One file per ACMN element type
│   │   │   │   ├── AgentNode.tsx
│   │   │   │   ├── ToolNode.tsx
│   │   │   │   ├── GuardrailNode.tsx
│   │   │   │   ├── HandoffNode.tsx
│   │   │   │   ├── EvaluatorNode.tsx
│   │   │   │   ├── ConnectorNode.tsx
│   │   │   │   ├── HumanTaskNode.tsx
│   │   │   │   ├── ProcessTaskNode.tsx
│   │   │   │   ├── CasePlanModelNode.tsx
│   │   │   │   ├── StageNode.tsx
│   │   │   │   └── MilestoneNode.tsx
│   │   │   ├── edges/        # Static styling for the five wire types
│   │   │   │   ├── DataWire.tsx
│   │   │   │   ├── ConfidenceGatedWire.tsx
│   │   │   │   ├── EscalationWire.tsx
│   │   │   │   ├── EventWire.tsx
│   │   │   │   └── CaseFileWire.tsx
│   │   │   └── panels/
│   │   │       ├── Palette.tsx
│   │   │       ├── Minimap.tsx
│   │   │       └── PropertyPanelStub.tsx
│   │   └── domainContext/
│   │       └── DomainContextBadge.tsx
│   ├── state/
│   │   └── canvasStore.ts    # Zustand: elements, selection, add/remove/move
│   ├── lib/
│   │   └── acmnElementTypes.ts  # Enum + registry of all ACMN element types
│   └── ui/                   # shadcn-generated primitives as needed
│
└── resources/
    └── icon.ico              # Placeholder app icon
```

### 5.3 Key implementation notes

**Custom React Flow nodes.** React Flow supports custom node components via the `nodeTypes` prop. Each ACMN element type becomes a React component that receives `data` props and renders its visual form. Ports are `<Handle>` components positioned with CSS.

**Stage containment.** React Flow supports parent-child node relationships via the `parentNode` property. When an element is dropped inside a Stage, set its `parentNode` to the stage's ID. Extent can be constrained with `extent: 'parent'`.

**Domain context panel.** Implemented as a non-React-Flow overlay. When a Case Plan Model node is rendered, the DomainContextBadge component renders above it using absolute positioning relative to the node's position. This avoids trying to model it as a React Flow node (it has no ports, doesn't participate in the graph).

**Palette drag-drop.** Native HTML5 drag-and-drop: `draggable` items in the palette set a `dataTransfer` payload with the element type. The React Flow canvas has `onDrop` and `onDragOver` handlers that create the node at the correct canvas coordinates using `screenToFlowPosition`.

**Styling.** Use Tailwind classes matching the mockups' colour palette (defined in the mockup `_shared.js` helper): accent purple for agents, green for tools, red for guardrails, cyan for evaluators, orange for human tasks, amber for stages and milestones, pink for handoffs.

**No wire creation.** Disable the `onConnect` callback on React Flow. The five hardcoded wire samples are added to the initial state of `canvasStore`.

### 5.4 Backend contract stub

Create `src-renderer/contracts/backend.ts` with the `BackendContract` interface from Architecture.md Section 4.1, but do not implement it in this spike. The file's presence confirms that the contract layer is planned and the renderer knows not to call it directly. All spike-time state is local Zustand.

## 6. Deliverables

Produced by the end of the spike timebox:

1. **Working repository.** A `acmn-designer` git repo with all source code, runnable locally via `pnpm install && pnpm dev` on Windows.
2. **Windows installer.** A signed-or-unsigned `.exe` built via `pnpm build`, installable on a clean Windows 11 machine.
3. **Element gallery screenshot.** A single screenshot of the running app with every ACMN element rendered on a canvas in a realistic arrangement, and the five wire types visible.
4. **Spike report (`Spike1-Report.md`).** A written document covering:
   - What worked as expected.
   - What was harder than anticipated.
   - Technology choices confirmed or questioned.
   - Rendering fidelity achieved per element (rated 🟢 good / 🟡 acceptable / 🔴 needs rework).
   - Estimate impact: does the spike suggest the full v0.1 estimate is accurate, too low, or too high?
   - Recommendations for the full build (changes to architecture, libraries, or approach).
5. **Follow-on ticket suggestions.** A bulleted list of candidate tickets for the full v0.1 epic, derived from lessons learned in the spike.

## 7. Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| React Flow cannot cleanly render the domain context panel attached to the case plan model's top edge | Medium | Medium | Spike acceptance includes this explicitly. If infeasible, document an alternative (e.g., render as a separate layer above React Flow canvas). |
| Stage containment semantics (drag in/out of a stage) work poorly with React Flow's parentNode model | Medium | Medium | Document the behaviour observed. Full v0.1 may need custom containment logic on top of React Flow. |
| shadcn/ui + Tailwind integration with Electron + Vite has rough edges | Low | Low | The combination is well-trodden. Many open-source examples exist. |
| Electron + React Flow performance is poor with many nodes | Low | Low | The spike only targets rendering, not performance. Performance is measured in the full v0.1 against NFR-004 and NFR-005. |
| Visual notation for less common elements (handoff, evaluator, domain context panel) has no clear prior art and needs iteration | High | High | Timebox spent on visual polish. Acceptable state is "matches the notation mockups at roughly the same fidelity as the published figures in the standard." Deeper polish is deferred. |
| Timebox slips | Medium | Medium | Scope is already narrow. If a single element type is proving disproportionately difficult, document it as a finding and move on. The spike's value comes from broad coverage, not depth. |

## 8. What the spike will enable

Once the spike is complete and the report is written, we will:

1. **Create the epic** "Designer v0.1 — Single-User Local Release" in the issue tracker. The spike's findings feed directly into the epic description.
2. **Break down the epic into tickets** along these axes:
   - Infrastructure tickets (project setup, CI, installer)
   - Canvas and palette tickets (per-element-type polish, wire drawing, selection, undo/redo)
   - Property panel tickets (one per element type's property groups)
   - Storage tickets (project format, LocalBackend implementation, autosave)
   - Domain context tickets (library, editor, binding)
   - Test mode tickets (simulator, console, scenario management)
   - Publish mode tickets (pre-flight checks, packaging, version management)
   - Cross-cutting tickets (keyboard shortcuts, accessibility, i18n, telemetry)
3. **Estimate each ticket** with the spike's findings informing the effort (e.g., if the spike revealed that stage containment is harder than expected, the relevant stage-related tickets are sized up).
4. **Sequence the tickets** into sprints, with infrastructure first, then canvas polish, then property panel, then storage, then domain context, then test mode, then publish mode.

The spike is the bridge between the design documents (PRD, Architecture, FRs, NFRs) and executable sprint planning. Without it, we are committing to a build with significant unknown-unknowns in the canvas layer.

## 9. Schedule

| Day | Focus |
|-----|-------|
| 1 | Project setup: Electron + Vite + React + TypeScript + Tailwind + shadcn/ui + React Flow. App launches with empty three-column layout. |
| 2 | Palette and drag-drop. Simple plan items (Agent, Tool, Guardrail, Evaluator, Handoff, Human task, Process task) render as custom nodes with correct shapes, colours, and ports. |
| 3 | Structural elements. Case plan model, Stage (with containment), Milestone, Sentry decorators, Discretionary variant. |
| 4 | Connector nodes (all 7 built-in types with icons). Domain context panel. Wire samples (5 hardcoded). Canvas controls (pan, zoom, minimap, selection, delete). |
| 5 | Polish, packaging (`pnpm build` → Windows installer), element gallery screenshot, spike report. |

## 10. Definition of Done

- [ ] All 15 ACMN palette items can be dragged and dropped onto the canvas.
- [ ] All 5 wire types are visible (as hardcoded samples) on the canvas with distinct visual styles.
- [ ] The app builds to a Windows installer that runs on a clean Windows 11 VM.
- [ ] A reference screenshot is included in the repo at `docs/element-gallery.png`.
- [ ] `Spike1-Report.md` is committed to the repo covering all report sections.
- [ ] Follow-on tickets are listed in the report with rough t-shirt sizes.
- [ ] The spike repo is tagged `spike1-complete` and its state is frozen (further work continues in the `v0.1-epic` branch).
