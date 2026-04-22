# Epic: BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE

**Status:** TICKETS
**Owner:** human
**Created:** 2026-04-21
**Last Updated:** 2026-04-21

---

## 1. Purpose

Turn the spike's in-memory prototype into a file-backed, contract-isolated
application. This epic introduces the **single most important
architectural boundary** in the Designer — the `BackendContract`
interface — and implements it once as `LocalBackend` (v0.1). Every
subsequent epic that needs to read or write project data flows through
this contract.

On top of the contract, this epic delivers the project lifecycle the
user sees: a welcome screen, a new-project wizard, opening an existing
project, saving, saving-as, closing, and a recent-projects list. It
also establishes the project folder structure on disk
(`project.acmn.json`, `case-plan-models/`, `domain-contexts/`,
`test-scenarios/`, `assets/`, `dist/`).

Without this epic the Designer cannot keep any user's work across
restarts. With it, every later epic gets a persistence primitive it
can extend.

---

## 2. User Story

As a **solution architect**,
I want to create new Designer projects, open existing ones from disk,
and save my work,
So that my case plan model designs survive closing the application and
I can return to them later.

As a **Designer maintainer**,
I want all persistence calls to go through a typed `BackendContract`
interface implemented by `LocalBackend` in v0.1,
So that v0.2's `RemoteBackend` can be swapped in without touching any
UI code.

---

## 3. Scope

### In Scope

- `BackendContract` TypeScript interface covering project, case plan
  model, domain context, test scenario, and publish operations (as
  defined in Architecture.md §4.1). This epic implements the project
  surface; later epics fill in their sections.
- `LocalBackend` class implementing all project-lifecycle methods
  (`newProject`, `openProject`, `saveProject`, `getRecentProjects`,
  plus no-op `authenticate` and `getCurrentUser`).
- IPC handler registrations on the main side (`src-main/ipc/project.ts`,
  `src-main/ipc/dialog.ts`).
- `preload.ts` exposes a typed, minimal `window.acmn.*` API via
  `contextBridge`.
- Backend selection at startup (env var or settings file) with
  `LocalBackend` as the v0.1 default and `RemoteBackend` as a stubbed
  class that throws "not yet implemented".
- Welcome screen: recent projects list (name, path, last-modified),
  "New project" and "Open project" buttons.
- New-project wizard (modal): project name, parent folder (native
  folder picker), optional description, optional starter template.
  Validates the target folder is empty or offers to overwrite.
- Open-project flow: native folder picker → validate
  `project.acmn.json` exists → load → route to canvas.
- Save action (Ctrl+S and File menu equivalent) and Save As action
  (to a different folder, preserving the original unchanged).
- Close-project flow: returns to welcome screen, prompts to save if
  dirty.
- Title bar and top-bar breadcrumb showing project name, active case
  plan model path, and a "— modified" marker when the project is
  dirty.
- Recent-projects persistence in the OS-standard user data directory
  (e.g., `%APPDATA%\ACMN Designer\recent.json` on Windows).
- Project folder structure is created on new-project (manifest plus
  all sub-directories including empty `assets/` and `dist/`).
- Path-traversal validation on every user-provided path before any
  filesystem operation.
- Multi-case-plan-model support: a project can contain multiple
  `*.cpm.json` files, listed in the project manifest. The Designer
  opens the first CPM by default; switching between CPMs is covered
  by epic_CANVAS_INTERACTION_03.

### Out of Scope

- Auto-save, atomic writes, rolling backups, crash recovery, corrupt
  file handling, and schema migrations. Covered by
  epic_AUTOSAVE_AND_RECOVERY_02.
- Project-tree sidebar for switching between case plan models.
  Covered by epic_CANVAS_INTERACTION_03.
- Publish output (`.acmn` packaging to `dist/`). Covered by
  epic_PUBLISH_MODE_AND_PACKAGING_11.
- Domain context files, test scenario files — this epic creates their
  folders but the CRUD is delivered in epic_DOMAIN_CONTEXT_07 and
  epic_TEST_MODE_AND_SIMULATOR_10.
- Import/export of standalone CPM or domain-context JSON files.
  Covered by epic_IMPORT_EXPORT_INTERCHANGE_09.
- Remote backend implementation (v0.2+).
- Authentication against an identity provider (v0.2+).

---

## 4. Functional Requirements

- **FR-001** — Launch as a Windows desktop application (inherited from
  epic_SPIKE1_FOUNDATION_00; enforced here as an acceptance condition
  for the welcome screen to appear).
- **FR-002** — Present a welcome screen on launch when no project is
  open, with "New project" and "Open project" actions.
- **FR-003** — Display a list of recent projects on the welcome
  screen: project name, file path, last-modified timestamp.
- **FR-004** — Provide a new-project wizard capturing project name,
  location on disk, optional description, optional starter template.
- **FR-005** — Create the project folder structure on new-project
  save: `project.acmn.json`, `case-plan-models/`, `domain-contexts/`,
  `test-scenarios/`, `assets/`, `dist/`.
- **FR-006** — Open an existing project via a native folder dialog,
  validating the target contains a `project.acmn.json` manifest.
- **FR-007** — Display the current project name and active case plan
  model relative path in the top-bar breadcrumb.
- **FR-008** — Support multiple case plan models per project
  (manifest-level support; UI for switching comes via
  epic_CANVAS_INTERACTION_03).
- **FR-009** — Support closing a project, returning to the welcome
  screen, with a save prompt when unsaved changes exist.
- **FR-018** — Provide a manual save action via Ctrl+S and File →
  Save menu.
- **FR-019** — Support Save As to a different project folder,
  preserving the current project unchanged.
- **FR-020** — Indicate unsaved changes in the title bar and top-bar
  breadcrumb with a "modified" marker.
- **FR-140** — Implement a `BackendContract` TypeScript interface
  covering every call between the Designer UI and the future
  Execution Engine / Communication Engine.
- **FR-141** — Provide a `LocalBackend` implementation of
  `BackendContract` in v0.1, for the project-lifecycle methods
  implemented here. Other methods are implemented by their respective
  epics but all resolve against the same `LocalBackend` instance.
- **FR-143** — Select the backend implementation at startup based on
  configuration (env var `ACMN_BACKEND=local|remote` or settings
  file), without requiring changes to UI code.
- **FR-144** — Expose the backend contract to the renderer exclusively
  via Electron IPC, using `contextBridge` with a typed, minimal API
  surface. The renderer shall not have direct access to `ipcRenderer`
  or Node.js APIs.

---

## 5. Non-Functional Requirements

- **NFR-002** — Open a typical project (≤5 CPMs, ≤50 total elements)
  in under 2 seconds from click to editable canvas.
- **NFR-003** — Open a large project (≤20 CPMs, ≤500 total elements)
  in under 5 seconds.
- **NFR-030** — Run with `nodeIntegration: false`,
  `contextIsolation: true`, and `sandbox: true` on all BrowserWindows.
- **NFR-031** — Expose IPC from main to renderer only via
  `contextBridge` with a minimal, typed API surface. No direct
  `ipcRenderer` access from the renderer.
- **NFR-032** — Set a Content Security Policy header of
  `default-src 'self'` on the renderer.
- **NFR-033** — Do not load remote code at runtime. All app code ships
  in the installer.
- **NFR-034** — Validate all file paths received from user dialogs
  against path-traversal attacks before performing filesystem
  operations.
- **NFR-060** — Architect with a clearly separated `BackendContract`
  interface, enabling the backend implementation to be swapped between
  `LocalBackend` (v0.1) and `RemoteBackend` (v0.2+) without changes
  to UI code.
- **NFR-061** — Code written entirely in TypeScript with strict mode
  enabled. Zero `any` types outside of IPC serialisation boundaries.
- **NFR-090** — Operate fully offline — the welcome screen, new
  project, open project, and save must all work without any network
  connection.
- **NFR-102** — Store all user data locally in the user's chosen
  project folders and the OS-standard user data directory.

---

## 6. UI/UX Notes

- **Welcome screen.** Centred two-column layout. Left column: "Start"
  section with large "New project" and "Open project" buttons.
  Right column: "Recent" section listing up to 10 recent projects.
  Empty-state for right column when no recent projects. Matches
  `docs/Mockups/01-welcome.png` and `06-new-project.png`.
- **New-project wizard.** Single-step modal with fields: name,
  location (with Browse button → native folder picker), description
  (optional, multi-line), starter template (dropdown — Empty / Simple
  Case / Insurance Claim Template in v0.1, but v0.1 may ship with
  only "Empty"). "Create" button is disabled until name and location
  are valid.
- **Open-project.** Native folder picker only. If the selected folder
  lacks `project.acmn.json`, show inline error with "Choose another
  folder" and "Cancel" options.
- **Save prompt on close.** Three buttons: "Save", "Discard",
  "Cancel". Default focus: Save.
- **Title bar.** `ACMN Designer — <Project Name> · <cpm/path>`; append
  ` — modified` when dirty.
- **Keyboard.** Ctrl+S for save; Ctrl+Shift+S for save-as; Ctrl+N for
  new; Ctrl+O for open. (Registered in epic_APP_CHROME_AND_SETTINGS_08's
  native menu; bindings used here.)
- **Error states.** "Folder is not a valid ACMN project", "Project
  already exists at this location — overwrite?", "Could not write to
  location (permission denied)" — all in plain language with a
  suggested next action.

---

## 7. Data Model Impact

- **New file:** `project.acmn.json` (manifest) per Architecture.md
  §5.2. Schema:
  - `acmnVersion`, `projectFormat`, `id`, `name`, `description`,
    `created`, `modified`, `author`.
  - `casePlanModels[]` — `{ id, file }` entries.
  - `domainContexts[]` — `{ id, file }` entries.
- **Directory structure on disk** per Architecture.md §5.1:
  `case-plan-models/`, `domain-contexts/`, `test-scenarios/`,
  `assets/`, `dist/`.
- **New file in user data dir:** `recent.json` storing up to 10
  recent projects with path, name, last-modified timestamp.
- **Schema version field.** Manifests include a `projectFormat`
  field (initially `"1"`) — infrastructure for
  epic_AUTOSAVE_AND_RECOVERY_02's forward-migration story.

---

## 8. Integration Impact

- **IPC contract.** New IPC channels: `project:new`, `project:open`,
  `project:save`, `project:saveAs`, `project:close`, `project:listRecent`,
  `dialog:openFolder`, `dialog:saveFolder`.
- **Preload.** `window.acmn.project.*` and `window.acmn.dialog.*`
  added to the `contextBridge`-exposed API.
- **Startup sequencing.** `src-main/main.ts` instantiates the backend
  via a factory before registering IPC handlers.
- **New dependencies.** None new beyond the spike's stack. All file
  I/O uses Node.js's `fs/promises`.
- **Renderer state.** New `projectStore` Zustand store
  (`src-renderer/state/projectStore.ts`) holding current project,
  dirty flag, and actions.
- **No changes to external services.**

---

## 9. Acceptance Criteria

- [ ] Launching the app with no open project shows the welcome screen.
- [ ] The welcome screen lists recent projects (populated after the
  first new/open) and provides "New project" and "Open project"
  actions.
- [ ] The new-project wizard creates a folder on disk containing
  `project.acmn.json` and the four sub-directories
  (`case-plan-models/`, `domain-contexts/`, `test-scenarios/`,
  `assets/`, `dist/`).
- [ ] Opening an existing project folder loads the manifest and routes
  to the canvas with the first CPM (or a blank state if none).
- [ ] Ctrl+S saves the project to disk.
- [ ] Save As writes to a different folder without modifying the
  original.
- [ ] The title bar shows the project name and a "— modified" marker
  when there are unsaved changes.
- [ ] Closing a dirty project prompts to save; cancelling keeps the
  project open.
- [ ] The `BackendContract` interface is defined in
  `src-main/backend/contract.ts` and re-exported to the renderer in
  `src-renderer/contracts/backend.ts`.
- [ ] `LocalBackend` implements the project-lifecycle methods against
  the filesystem.
- [ ] `RemoteBackend` exists as a stub class whose methods throw "not
  yet implemented" when selected.
- [ ] Path-traversal checks reject inputs containing `..` segments or
  absolute paths outside the user-selected base.
- [ ] BrowserWindow is configured with `nodeIntegration: false`,
  `contextIsolation: true`, `sandbox: true`, and CSP header
  `default-src 'self'`.
- [ ] Renderer code has no references to `ipcRenderer`, `require`, or
  Node.js APIs.
- [ ] A typical project (≤50 elements) opens in ≤2s on the reference
  workstation.

---

## 10. Risks & Unknowns

- **Starter templates.** Scope is vague. Recommendation: ship with
  only "Empty" in v0.1 and defer richer templates. This epic codifies
  the placeholder but implementation can be reduced to a single
  option if time is tight.
- **Recent-projects handling when a folder has moved.** If a recent
  entry no longer points to a valid manifest, surface a clear error
  and offer to remove the entry. Needs UX decision — default here is
  inline error + "Remove from list" button.
- **Save As semantics with open cross-CPM wires.** Save As copies the
  entire project folder. Needs to handle `assets/` copying and
  regenerate `id` fields. Sized-for here; actual file copy is
  straightforward.
- **Open question — manifest migration.** Schema version 1 is
  established here; the migration harness lands in
  epic_AUTOSAVE_AND_RECOVERY_02. This epic must not introduce any
  dependencies on future schema fields.

---

## 11. Dependencies

- **Upstream:** epic_SPIKE1_FOUNDATION_00 (shell, canvas, palette,
  element rendering, stub contract file).
- **Downstream (consumers):**
  - epic_AUTOSAVE_AND_RECOVERY_02 extends save with atomic writes,
    backups, and migrations.
  - epic_CANVAS_INTERACTION_03 adds the project-tree sidebar for
    switching between multiple CPMs.
  - epic_DOMAIN_CONTEXT_07, epic_TEST_MODE_AND_SIMULATOR_10,
    epic_PUBLISH_MODE_AND_PACKAGING_11, epic_IMPORT_EXPORT_INTERCHANGE_09
    all extend `LocalBackend` with their own methods.
- **External:** Node.js `fs/promises` (bundled with Electron).

---

## 12. References

- **prd:** `docs/Product Requirements Document/PRD.md`
- **architecture:** `docs/Architecture/Architecture.md` (§3 module
  layout, §4 backend contract, §5 data format on disk, §6.1 project
  store)
- **functional requirements:** `docs/Functional Requirements/FunctionalRequirements.md`
- **non-functional requirements:** `docs/Non-Functional Requirements/NonFunctionalRequirements.md`
- **mockups:** `docs/Mockups/01-welcome.png`, `06-new-project.png`

---

## 13. Implementation Notes

**Complexity:** M

**Suggested ticket breakdown (6 tickets):**

1. **BLC-01** — Define `BackendContract` interface with full method
   set from Architecture.md §4.1. Create the parallel renderer-side
   re-export. Stub `RemoteBackend` throws-not-implemented class. Add
   backend-selection factory in `src-main/main.ts`.
2. **BLC-02** — Implement `LocalBackend` project-lifecycle methods:
   `newProject`, `openProject`, `saveProject`, `getRecentProjects`,
   `authenticate` (no-op), `getCurrentUser` (synthetic). Filesystem
   layout per Architecture.md §5.1. Path-traversal validation.
3. **BLC-03** — Register IPC handlers
   (`src-main/ipc/project.ts`, `src-main/ipc/dialog.ts`) and expose
   the `window.acmn.*` surface in `preload.ts`. Verify
   `contextIsolation`, `sandbox`, and CSP settings on BrowserWindow.
4. **BLC-04** — Renderer: `projectStore` Zustand store, welcome
   screen (recent projects + action buttons), new-project wizard
   modal, open-project flow via native folder dialog.
5. **BLC-05** — Renderer: save (Ctrl+S), save-as, close-project with
   dirty-check prompt. Title bar + breadcrumb with modified marker.
6. **BLC-06** — Recent-projects persistence (`%APPDATA%/ACMN
   Designer/recent.json`), trimmed to 10 entries, deduplicated by
   path.

**Scaffolding files touched:**

- `src-main/main.ts` — add IPC handler registration and backend
  factory.
- `src-main/preload.ts` — expose new `window.acmn.*` methods.
- `src-main/backend/contract.ts` — new.
- `src-main/backend/localBackend.ts` — new.
- `src-main/backend/remoteBackend.ts` — new (stub).
- `src-main/ipc/project.ts` — new.
- `src-main/ipc/dialog.ts` — new.
- `src-main/storage/projectStore.ts` — new (filesystem).
- `src-renderer/contracts/backend.ts` — flesh out (was stub in spike).
- `src-renderer/state/projectStore.ts` — new (Zustand).
- `src-renderer/App.tsx` — route between welcome screen and canvas.
- `src-renderer/features/welcome/` — new folder.
- `src-renderer/features/newProject/` — new folder.

**Chain constraint:** BLC-01 must merge first (every other ticket
imports from `backend/contract.ts`). BLC-02 and BLC-03 then serialise
because both add to `src-main/main.ts`. BLC-04, BLC-05, BLC-06 can
then overlap.

**Estimated total effort:** 3–4 days of focused work.
