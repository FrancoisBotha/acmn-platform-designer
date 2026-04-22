# ACMN Designer — Architecture

This document specifies the internal architecture of the ACMN Designer Electron application. It describes the process model, module layout, data flow, storage format, and — critically — the **backend contract** that isolates the Designer from the future Execution Engine implementation.

---

## 1. Technology stack

| Concern | Technology | Rationale |
|---|---|---|
| Runtime | Electron 30+ | Cross-platform desktop app with web UI. Mature, large ecosystem. |
| UI framework | React 18 + TypeScript | Industry standard for component-based UIs with strong typing. |
| Canvas | React Flow (xyflow) 12+ | Native React library for node-based UIs. Port-and-wire model matches ACMN. |
| Components | shadcn/ui + Radix | Accessible primitives, copy-in components, Tailwind-based. |
| Styling | Tailwind CSS | Utility-first, consistent with shadcn/ui. |
| State | Zustand | Simple, unopinionated, works well with Electron IPC. |
| Forms | React Hook Form + Zod | Typed forms with schema validation. |
| Expression editor | Monaco Editor (React wrapper) | For sentry expressions, personas, rule bodies. |
| Icons | Lucide React | Consistent icon set. |
| Package manager | pnpm | Fast, disk-efficient, preferred for monorepos if we split later. |
| Build | Vite (renderer) + tsc (main) | Fast DX for renderer, simple for main process. |
| Installer | electron-builder | Produces Windows `.exe`, macOS `.dmg`, Linux `.AppImage` / `.deb`. |
| Testing | Vitest (unit) + Playwright (e2e) | Standard, TypeScript-friendly. |

## 2. Process model

Electron applications run in two kinds of processes. The Designer uses both.

### 2.1 Main process
- One per running Designer instance.
- Node.js runtime. Full OS access: filesystem, dialog boxes, window management, native menus.
- Owns all file I/O. The renderer never touches the disk directly.
- Exposes IPC handlers that the renderer invokes via `contextBridge`-guarded `preload` scripts.

### 2.2 Renderer process
- One per BrowserWindow (one in v0.1).
- Chromium runtime. Runs the React application.
- No direct filesystem access. Calls IPC to request file operations.
- All UI state lives here: canvas, palette, property panel, test console.

### 2.3 IPC boundary (critical)
The main↔renderer boundary is the security model of Electron. It is also the boundary where the Designer's **backend contract** is implemented in v0.1: the renderer calls `window.acmn.publishCasePlanModel(...)`, which hits an IPC handler in the main process, which writes files to disk. In v0.2+, the same IPC handler calls a remote backend instead.

## 3. Module layout

```
acmn-designer/
├── package.json
├── electron-builder.yml
├── vite.config.ts
├── tsconfig.json
│
├── src-main/                      # Main process (Node.js)
│   ├── main.ts                    # Entry, BrowserWindow creation
│   ├── ipc/                       # IPC handler registrations
│   │   ├── project.ts             # openProject, saveProject, newProject
│   │   ├── casePlanModel.ts       # CRUD + publishCasePlanModel
│   │   ├── domainContext.ts       # CRUD + libraryList
│   │   ├── testScenario.ts        # CRUD
│   │   └── dialog.ts              # Native open/save dialogs
│   ├── backend/                   # Backend implementations
│   │   ├── contract.ts            # Contract interface (shared type)
│   │   ├── localBackend.ts        # v0.1: filesystem implementation
│   │   └── remoteBackend.ts       # v0.2+: HTTP/gRPC implementation (stub)
│   ├── storage/                   # Filesystem operations
│   │   ├── projectStore.ts        # Read/write project manifest + child files
│   │   └── acmnPackager.ts        # Pack/unpack .acmn archives
│   └── preload.ts                 # contextBridge-exposed API
│
├── src-renderer/                  # Renderer process (Browser)
│   ├── main.tsx                   # React entry point
│   ├── App.tsx                    # Root component, routing
│   ├── contracts/                 # Shared TypeScript interfaces
│   │   ├── backend.ts             # BackendContract (mirrors main-side)
│   │   ├── casePlanModel.ts       # CasePlanModel, PlanItem, Wire types
│   │   ├── domainContext.ts       # DomainContext types
│   │   └── project.ts             # Project, ProjectManifest types
│   ├── features/
│   │   ├── welcome/               # Welcome screen (recent projects)
│   │   ├── newProject/            # New project wizard
│   │   ├── canvas/                # Main design canvas
│   │   │   ├── CanvasView.tsx
│   │   │   ├── nodes/             # Custom React Flow node components
│   │   │   │   ├── AgentNode.tsx
│   │   │   │   ├── ToolNode.tsx
│   │   │   │   ├── GuardrailNode.tsx
│   │   │   │   ├── EvaluatorNode.tsx
│   │   │   │   ├── HandoffNode.tsx
│   │   │   │   ├── HumanTaskNode.tsx
│   │   │   │   ├── StageNode.tsx
│   │   │   │   ├── MilestoneNode.tsx
│   │   │   │   ├── ConnectorNode.tsx
│   │   │   │   └── CasePlanModelNode.tsx
│   │   │   ├── edges/             # Custom React Flow edge components
│   │   │   │   ├── DataWire.tsx
│   │   │   │   ├── EscalationWire.tsx
│   │   │   │   └── ...
│   │   │   └── panels/
│   │   │       ├── Palette.tsx    # Left palette
│   │   │       ├── Minimap.tsx
│   │   │       └── StatusBar.tsx
│   │   ├── propertyPanel/         # Right-side property panel
│   │   │   ├── PropertyPanel.tsx  # Router for element type
│   │   │   ├── AgentProperties.tsx
│   │   │   ├── ToolProperties.tsx
│   │   │   ├── ConnectorProperties.tsx
│   │   │   ├── StageProperties.tsx
│   │   │   ├── MilestoneProperties.tsx
│   │   │   └── ...
│   │   ├── domainContext/         # Domain context browser and editor
│   │   │   ├── DomainContextLibrary.tsx
│   │   │   ├── DomainContextEditor.tsx
│   │   │   ├── VocabularyEditor.tsx
│   │   │   ├── SchemaEditor.tsx
│   │   │   ├── RuleEditor.tsx
│   │   │   └── DecisionTableEditor.tsx
│   │   ├── caseVariables/         # Case variable editor
│   │   ├── test/                  # Test mode
│   │   │   ├── TestMode.tsx
│   │   │   ├── SignalInjector.tsx
│   │   │   ├── Console.tsx        # Log/trace panel
│   │   │   └── StateWatcher.tsx   # Case variables + milestones
│   │   ├── publish/               # Publish mode
│   │   │   ├── PublishDialog.tsx
│   │   │   ├── PreflightChecks.tsx
│   │   │   └── ReleaseNotes.tsx
│   │   └── settings/              # App settings
│   ├── state/                     # Zustand stores
│   │   ├── projectStore.ts        # Current project, dirty flag, autosave
│   │   ├── canvasStore.ts         # Canvas state, selection, undo/redo
│   │   ├── paletteStore.ts
│   │   └── testStore.ts           # Test mode state
│   ├── hooks/                     # Shared hooks
│   ├── lib/
│   │   ├── backendClient.ts       # Calls window.acmn.* (IPC wrapper)
│   │   ├── validation.ts          # Zod schemas for pre-flight checks
│   │   └── acmnSpec.ts            # Constants from the ACMN standard
│   └── ui/                        # shadcn-generated primitives
│
├── tests/
│   ├── unit/                      # Vitest unit tests
│   └── e2e/                       # Playwright end-to-end tests
│
└── resources/                     # Icons, installer assets
```

## 4. Backend contract (v0.1 mock → v0.2+ real)

This is the **single most important design decision** in the Designer. Every call the Designer wants to make to the rest of the platform goes through this contract. In v0.1 the contract is implemented by local file operations. In v0.2+ it is implemented by REST/gRPC calls to the Communication Engine.

### 4.1 Contract interface

```ts
// src-main/backend/contract.ts
// Shared with src-renderer/contracts/backend.ts

export interface BackendContract {

  // ==== Authentication (no-op in v0.1) ====
  authenticate(credentials?: Credentials): Promise<AuthResult>;
  getCurrentUser(): Promise<User | null>;

  // ==== Project management ====
  newProject(params: NewProjectParams): Promise<Project>;
  openProject(path: string): Promise<Project>;
  saveProject(project: Project): Promise<void>;
  getRecentProjects(): Promise<RecentProject[]>;

  // ==== Case plan models ====
  listCasePlanModels(projectId: string): Promise<CasePlanModelSummary[]>;
  getCasePlanModel(projectId: string, id: string): Promise<CasePlanModel>;
  saveCasePlanModel(projectId: string, cpm: CasePlanModel): Promise<void>;
  deleteCasePlanModel(projectId: string, id: string): Promise<void>;
  validateCasePlanModel(cpm: CasePlanModel): Promise<ValidationResult>;
  publishCasePlanModel(params: PublishParams): Promise<PublishResult>;

  // ==== Domain contexts ====
  listDomainContextLibrary(): Promise<DomainContextSummary[]>;
  getDomainContext(id: string, version?: string): Promise<DomainContext>;
  createDomainContext(dc: DomainContext): Promise<void>;
  forkDomainContext(sourceId: string, sourceVersion: string): Promise<DomainContext>;
  saveDomainContext(dc: DomainContext): Promise<void>;
  publishDomainContext(dc: DomainContext): Promise<void>;  // v0.2+
  installDomainContextPackage(packageId: string, version?: string): Promise<void>;  // v0.2+

  // ==== Test mode (fully local in v0.1 via Logic Engine stub) ====
  runTestScenario(params: TestScenarioParams): Promise<TestRunId>;
  getTestRunEvents(runId: TestRunId): AsyncIterable<TestEvent>;
  cancelTestRun(runId: TestRunId): Promise<void>;

  // ==== Test scenarios (stored in project) ====
  listTestScenarios(projectId: string): Promise<TestScenario[]>;
  saveTestScenario(projectId: string, ts: TestScenario): Promise<void>;
  deleteTestScenario(projectId: string, id: string): Promise<void>;
}
```

### 4.2 v0.1 LocalBackend implementation

- `authenticate()` — no-op. Returns a synthetic local user identity.
- `openProject()` — reads `<path>/project.acmn.json`, loads referenced `case-plan-models/*.cpm.json`, `domain-contexts/*.domain.json`, `test-scenarios/*.test.json`. Returns assembled `Project`.
- `saveCasePlanModel()` — writes JSON file atomically (write to `.tmp`, rename).
- `publishCasePlanModel()` — packages the case plan model + all referenced domain contexts into a single `.acmn` zip archive at a user-chosen path (or a default `dist/` folder within the project). No remote call.
- `runTestScenario()` — spawns an in-process simulator that replays the case plan model locally. Agent turns call the Logic Engine directly (or, if not running, use a deterministic mock that echoes configured responses from the test scenario).

### 4.3 v0.2+ RemoteBackend implementation

The same `BackendContract` interface implemented against REST endpoints on the Communication Engine. Authentication uses JWT obtained via OAuth/SSO. All project data is still local on disk — the Designer remains file-first — but `publishCasePlanModel` now deploys to the live Execution Engine, `listDomainContextLibrary` fetches from a remote registry, and `runTestScenario` can optionally use the live Logic Engine instead of the in-process simulator.

### 4.4 Dependency injection

At main-process startup, the Designer inspects configuration (env var or settings file) to decide which backend to instantiate:

```ts
// src-main/main.ts
const backend: BackendContract = config.backend === 'remote'
  ? new RemoteBackend(config.apiUrl)
  : new LocalBackend();

registerIpcHandlers(backend);
```

The renderer never knows which backend is in use. It always calls `window.acmn.*`.

## 5. Data format on disk

### 5.1 Project folder

```
insurance-claims-onboarding/
├── project.acmn.json              # Project manifest (see below)
├── case-plan-models/
│   └── standard-onboarding.cpm.json
├── domain-contexts/
│   └── insurance-claims.domain.json
├── test-scenarios/
│   └── new-starter-email.test.json
├── assets/                        # Icons, attachments
└── dist/                          # Published .acmn packages
    └── standard-onboarding-v2.2.0.acmn
```

### 5.2 Project manifest (`project.acmn.json`)

```json
{
  "acmnVersion": "1.0",
  "projectFormat": "1",
  "id": "prj_01HN...",
  "name": "Insurance Claims Onboarding",
  "description": "Case plan model for processing incoming insurance claims...",
  "created": "2026-04-21T10:15:00Z",
  "modified": "2026-04-21T14:22:18Z",
  "author": "Francois",
  "casePlanModels": [
    { "id": "cpm_01HP...", "file": "case-plan-models/standard-onboarding.cpm.json" }
  ],
  "domainContexts": [
    { "id": "dc_01HQ...", "file": "domain-contexts/insurance-claims.domain.json" }
  ]
}
```

### 5.3 Case plan model (`*.cpm.json`)

Follows the ACMN standard's case plan model schema (Section 5 of the standard): case plan model, plan items (agent nodes, tool nodes, guardrails, evaluators, handoffs, human tasks), wires, stages, milestones, sentries, case variables, connectors, and the bound domain context reference (by id + version + bindingMode).

### 5.4 Domain context (`*.domain.json`)

Follows the ACMN standard's domain context schema (Section 9): vocabulary, entity schemas, value object schemas, domain rules, decision models, optional domain events and tool catalogue. Includes origin metadata for copied contexts.

### 5.5 Published `.acmn` package

Standard zip archive containing `manifest.json` (package metadata), `case-plan-model.json` (the model), and `domain-contexts/` (all referenced contexts bundled, for offline portability).

## 6. State management

### 6.1 projectStore (Zustand)
- `project`: currently open `Project | null`
- `dirty`: boolean (changes pending save)
- `autoSaveEnabled`: boolean
- `autoSaveInterval`: number (ms)
- Actions: `openProject`, `closeProject`, `markDirty`, `save`

### 6.2 canvasStore (Zustand)
- `selectedElements`: element IDs
- `viewport`: React Flow viewport
- `undoStack`, `redoStack`: command history
- Actions: `addElement`, `removeElement`, `updateElement`, `addWire`, `undo`, `redo`

### 6.3 paletteStore
- `availableConnectors`: connector catalogue
- `domainContextLibrary`: available domain contexts
- Fetched from backend on app start and when user clicks Refresh.

### 6.4 testStore
- `activeRun`: current test run metadata
- `events`: ordered event stream from the simulator
- `caseState`: live case variables + milestone states

## 7. Auto-save strategy

- Debounced every 30 seconds after the last change.
- Immediate save on `Ctrl+S`.
- Save on app quit (prompt if the app crashed mid-save).
- Atomic writes via temporary file + rename.
- The `dirty` flag reflects whether unsaved changes exist; title bar shows `— modified` when dirty.

## 8. Validation

Two layers of validation:

### 8.1 Inline validation (renderer)
- Zod schemas in `src-renderer/lib/validation.ts` validate property panel inputs in real time.
- React Hook Form integrates Zod for typed forms.
- Wire compatibility checked in React Flow's `isValidConnection` callback before wire creation.

### 8.2 Pre-flight validation (main, on publish)
- Implemented in the backend contract's `validateCasePlanModel()`.
- Runs the full set of checks from the Publish dialog's pre-flight panel.
- Returns a `ValidationResult` with errors and warnings, each with element references for the UI to highlight.

## 9. Test simulator (v0.1)

The simulator is a local, in-process implementation of the Execution Engine's core semantics, sufficient for testing case plan models during design.

- Implements case lifecycle, stage lifecycle, sentry evaluation, milestone achievement, wire delivery, and event bus in TypeScript.
- Agent turns call out to the Logic Engine if it's running locally, or use deterministic mock responses defined in the test scenario.
- Events stream to the renderer via an async iterable over IPC (preloaded with `contextBridge`).
- The simulator's implementation lives in `src-main/simulator/`. It shares type definitions with the renderer but runs in the main process for filesystem access to test fixtures.

The simulator is not a full Execution Engine — it omits persistence, distributed event delivery, and multi-case concurrency. These are not needed for design-time testing.

## 10. Security

- `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true` on all BrowserWindows.
- Preload script exposes a minimal, typed API via `contextBridge`. No direct `ipcRenderer` access in the renderer.
- CSP header set to `default-src 'self'`.
- File paths from user dialogs are validated against path traversal.
- No remote code loading. All app code ships in the installer.

## 11. Build and distribution

### Windows (priority for v0.1)
- `electron-builder --win nsis` produces a signed `.exe` installer.
- Code-signing certificate required before public release (EV certificate preferred for SmartScreen reputation).
- Auto-update via `electron-updater` against a GitHub Releases channel in v0.2+.

### macOS (v0.2+)
- `.dmg` built with `electron-builder --mac dmg`.
- Apple Developer ID signing + notarisation required.

### Linux (v0.2+)
- `.AppImage` (universal) and `.deb` (Debian/Ubuntu).

## 12. Testing strategy

- **Unit tests.** Vitest for pure TypeScript logic: validation, storage parsers, state reducers.
- **Integration tests.** Vitest + mocked IPC for renderer/main boundary.
- **End-to-end tests.** Playwright driving the packaged Electron app. Covers: new project → design a case → test → publish. Runs in CI on Windows.
- **Visual regression.** Percy or Chromatic for canvas rendering (v0.2+).

## 13. Observability

- Log files written to the OS-standard user data directory (`%APPDATA%/ACMN Designer/logs/` on Windows).
- Configurable log level (default: info, verbose on debug flag).
- Optional opt-in anonymous telemetry (Sentry) for crash reporting from v0.2+.

## 14. References

- `PRD.md` — product requirements.
- `ProjectArchitecture.md` — where Designer fits in the overall platform.
- `FunctionalRequirements.md` — functional requirements (Sub-System: Designer).
- `NonFunctionalRequirements.md` — non-functional requirements.
- ACMN Standard v1.0 Working Draft.
- React Flow: https://reactflow.dev
- Electron: https://www.electronjs.org
- shadcn/ui: https://ui.shadcn.com
