# Spike 1 Report — ACMN Platform Designer Foundation

**Date:** 2026-04-22
**Epic:** SPIKE1_FOUNDATION
**Tickets:** SPK1-001 through SPK1-008

---

## 1. What Worked

- **Electron + Vite + React** bootstrapped quickly with `vite-plugin-electron`. Hot-reload for the renderer works well; the main process restarts automatically via the preload `onstart` hook.
- **React Flow (@xyflow/react)** proved an excellent fit for a node-and-wire canvas. Custom node components slot in cleanly, edge rendering is fully controllable via `BaseEdge` + `EdgeLabelRenderer`, and built-in features (pan, zoom, minimap, controls, delete-key handling) work out of the box.
- **Tailwind CSS** enabled rapid, consistent node styling without a component-library dependency. All 34 element types share a visual language through common Tailwind utility patterns.
- **Custom edge component (AcmnWireEdge)** with a style lookup table handled all five ACMN wire types in a single component — data, confidence-gated, escalation, event, and case-file — with distinct colours, dash patterns, markers, and animation.
- **Container nodes (Case Plan Model, Stage)** using React Flow's `parentId` + `extent: 'parent'` delivered CMMN-style containment with child-node confinement on first attempt.
- **Domain context badge** as an absolutely-positioned child inside the Case Plan Model node moves with the node during pan/zoom without coordinate synchronisation — simple and effective.
- **Drag-from-palette** to canvas works reliably. The `onDrop` handler resolves container parentage, connector sub-types, and node type mapping.

## 2. What Was Harder Than Expected

- **Container node drop detection** required reverse-iteration of the node array and fallback dimension logic (measured vs default). Nested containers (Stage inside Case Plan Model) need careful ordering and hit-testing to avoid mis-assignment.
- **Post-drop reparenting** is not supported by React Flow out of the box. Moving a node into a container after its initial drop requires a custom `onNodeDragStop` handler with boundary collision detection — this will need dedicated implementation in v0.1.
- **Sentry node sizing** — entry/exit sentries are 32×32px diamonds, much smaller than other nodes. Handles and labels at this scale require special styling to remain readable and clickable.
- **SVG marker deduplication** — each AcmnWireEdge instance renders its own `<defs><marker>` block. While the browser deduplicates by marker `id`, this is technically wasteful at scale and could be hoisted to a shared `<defs>` block.
- **electron-builder integration** — `vite-plugin-electron` handles the dev-mode build pipeline, but the production distribution build (`electron-builder`) requires separate configuration and has its own output structure expectations.
- **`extent: 'parent'` is too restrictive** — child nodes cannot be dragged out of containers at all, which may conflict with CMMN semantics where items can be moved between stages. A custom extent callback will be needed.

## 3. Stack Choices — Confirmed or Questioned

| Choice | Status | Notes |
|--------|--------|-------|
| Electron 33 | ✅ Confirmed | Mature, well-supported for desktop apps. Context isolation + sandbox enabled. |
| Vite 6 + vite-plugin-electron | ✅ Confirmed | Fast dev cycle, clean build output. |
| React 18 | ✅ Confirmed | Stable, large ecosystem, good fit with React Flow. |
| React Flow (@xyflow/react) 12 | ✅ Confirmed | Best-in-class for graph canvas UIs. Custom nodes/edges are straightforward. |
| Tailwind CSS 3 | ✅ Confirmed | Rapid styling, consistent design tokens, no runtime overhead. |
| Zustand 5 | ✅ Confirmed | Minimal store for canvas state; will scale as features grow. |
| TypeScript 5.9 | ✅ Confirmed | Type safety across renderer and main process. |
| electron-builder 25 | ✅ Confirmed | NSIS installer output; unsigned builds sufficient for internal distribution. |
| nanoid | ✅ Confirmed | Lightweight ID generation for nodes/edges. |
| Lucide React | ✅ Confirmed | Clean icon set covering all ACMN element types. |

No stack choices are questioned at this time. The selected stack is lean and each dependency earns its place.

## 4. Per-Element Fidelity Rating

### Plan Items (7)
| Element | Fidelity | Notes |
|---------|----------|-------|
| Goal | 🟢 | Correct colour, icon, label. |
| Objective | 🟢 | Correct colour, icon, label. |
| Milestone | 🟢 | Correct colour, icon, label. |
| Deliverable | 🟢 | Correct colour, icon, label. |
| Work Package | 🟢 | Correct colour, icon, label. |
| Decision | 🟢 | Correct colour, icon, label. |
| Risk | 🟢 | Correct colour, icon, label. |

### Agent Plan Items (7)
| Element | Fidelity | Notes |
|---------|----------|-------|
| Agent | 🟢 | Correct colour, icon, label, handle positions. |
| Tool | 🟢 | Correct colour, icon, label, handle positions. |
| Guardrail | 🟢 | Correct colour, icon, label, handle positions. |
| Evaluator | 🟢 | Correct colour, icon, label, handle positions. |
| Handoff | 🟢 | Correct colour, icon, label, handle positions. |
| Human Task | 🟢 | Correct colour, icon, label, handle positions. |
| Process Task | 🟢 | Correct colour, icon, label, handle positions. |

### CMMN Elements (6)
| Element | Fidelity | Notes |
|---------|----------|-------|
| Case Plan Model | 🟢 | Container with title bar, child containment, domain badge. |
| Stage | 🟢 | Dashed-border container with title bar, nests inside CPM. |
| Milestone (CMMN) | 🟢 | Correct colour, diamond-style icon. |
| Sentry (Entry) | 🟡 | Functional but very small (32×32). Label/handle sizing needs refinement. |
| Sentry (Exit) | 🟡 | Same as Entry — functional but needs styling polish at small scale. |
| Discretionary Item | 🟢 | Dashed border distinguishes it from required items. |

### Structure (6)
| Element | Fidelity | Notes |
|---------|----------|-------|
| Component | 🟢 | Correct colour, icon, label. |
| Layer | 🟢 | Container with title bar rendering. |
| Service | 🟢 | Correct colour, icon, label. |
| Interface | 🟢 | Correct colour, icon, label. |
| Module | 🟢 | Correct colour, icon, label. |
| Boundary | 🟢 | Dashed-border container rendering. |

### Connectors (7)
| Element | Fidelity | Notes |
|---------|----------|-------|
| Email | 🟢 | Correct icon (Mail), sub-type badge overlay. |
| Webhook | 🟢 | Correct icon (Webhook), sub-type badge overlay. |
| File Watch | 🟢 | Correct icon (FileSearch), sub-type badge overlay. |
| Schedule | 🟢 | Correct icon (Clock), sub-type badge overlay. |
| Database | 🟢 | Correct icon (Database), sub-type badge overlay. |
| Event | 🟢 | Correct icon (Zap), sub-type badge overlay. |
| API | 🟢 | Correct icon (Globe), sub-type badge overlay. |

### Domain (1)
| Element | Fidelity | Notes |
|---------|----------|-------|
| Domain Context | 🟢 | Badge rendering on CPM node; standalone container shape. |

### Wire Styles (5)
| Wire Type | Fidelity | Notes |
|-----------|----------|-------|
| Data | 🟢 | Solid blue, 2px, arrowhead marker. |
| Confidence-Gated | 🟢 | Dashed amber, 2px, arrowhead marker. |
| Escalation | 🟢 | Solid red, 3px, animated marching ants, arrowhead marker. |
| Event | 🟢 | Dotted green, 2px, arrowhead marker. |
| Case File | 🟢 | Dash-dot slate, 2px, arrowhead marker. |

**Summary:** 32 🟢 / 2 🟡 / 0 🔴

## 5. Estimate Impact on v0.1

The spike confirms that the core rendering pipeline — nodes, containers, wires, palette, canvas interaction — is solid. The v0.1 effort can focus on:

- **IPC bridge and file persistence** (BackendContract implementation): 2–3 tickets
- **Sentry node refinement**: 1 ticket (small)
- **Post-drop reparenting**: 1 ticket (medium — custom drag-stop handler)
- **Interactive connection creation**: 1 ticket (controlled `onConnect` with wire-type picker)
- **Properties panel**: 1–2 tickets (read node data, edit labels/metadata)
- **Undo/redo**: 1 ticket (Zustand middleware or manual history stack)
- **Document serialisation**: 1 ticket (JSON export/import matching AcmnDocument shape)

The spike has de-risked the hardest visual rendering work. No v0.1 estimate blocker was discovered.

## 6. Recommendations

1. **Implement BackendContract via Electron IPC** — the stub interface is defined in `src-renderer/contracts/backend.ts`. The main process should implement handlers for file save/load/export, exposed through the preload bridge.
2. **Replace `extent: 'parent'` with a custom extent callback** to support dragging nodes out of containers and between containers (CMMN reparenting).
3. **Hoist SVG marker definitions** to a shared `<defs>` block to reduce DOM duplication at scale.
4. **Add Zustand persistence middleware** for auto-save and undo/redo.
5. **Consider react-flow `elevateOnSelect`** to fix z-ordering issues when nodes overlap.
6. **Sentry nodes need dedicated styling** for the 32×32 scale — possibly a circular shape with tooltip labels instead of inline text.
7. **Wire-type picker modal** for `onConnect` — when connection creation is enabled, prompt the user to choose a wire type before creating the edge.

---

## 7. Follow-on Ticket List for v0.1

| # | Title | Scope | Est. |
|---|-------|-------|------|
| 1 | Implement BackendContract IPC bridge (main process handlers + preload exposure) | Backend | M |
| 2 | File save/load with native OS dialogs (showSaveDialog, showOpenDialog) | Backend | M |
| 3 | Document serialisation — JSON import/export matching AcmnDocument schema | Full-stack | M |
| 4 | Properties panel — display and edit selected node data | Frontend | M |
| 5 | Sentry node visual refinement (circular shape, tooltip labels, larger hit area) | Frontend | S |
| 6 | Post-drop reparenting via onNodeDragStop handler | Frontend | M |
| 7 | Interactive connection creation with wire-type picker | Frontend | M |
| 8 | Undo/redo stack (Zustand history middleware) | Frontend | M |
| 9 | PNG/SVG export via main process | Backend | S |
| 10 | Hoist SVG marker defs to shared block | Frontend | S |
| 11 | Auto-save with dirty-state indicator | Full-stack | S |
| 12 | Application menu bar (File, Edit, View, Help) | Backend | M |

**S** = Small (1–2 hrs) · **M** = Medium (2–4 hrs)
