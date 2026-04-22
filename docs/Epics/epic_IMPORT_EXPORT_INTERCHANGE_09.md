# Epic: IMPORT_EXPORT_INTERCHANGE

**Status:** NEW
**Owner:** human
**Created:** 2026-04-21
**Last Updated:** 2026-04-21

---

## 1. Purpose

Let users move case plan models and domain contexts between
projects, between workstations, or into tools outside the Designer.
The published `.acmn` package (epic_PUBLISH_MODE_AND_PACKAGING_11) is
a release artefact; this epic is about the everyday "send me your
draft" / "copy this domain context into another project" exchange.

Import/export makes it possible to start a case plan model in one
project, hand it to a colleague via file attachment, and drop it
into their project without drag-and-drop through the UI. It also
gives domain experts a way to export a domain context they maintain
in project A so a solution architect can pull it into project B.

---

## 2. User Story

As a **solution architect**,
I want to export a single case plan model as a standalone JSON file
and import it into a different project,
So that I can share drafts with colleagues without publishing or
sharing the whole project folder.

As a **domain expert**,
I want to export a domain context as JSON and import it into another
Designer project,
So that my domain work is portable across projects before the v0.2
registry exists.

---

## 3. Scope

### In Scope

- **Export CPM.** File → Export → Case Plan Model menu action.
  Exports the currently-active CPM as a standalone
  `*.cpm.json` file to a user-chosen location. Includes inline
  variables, sentries, and wires. Does **not** inline the
  referenced domain context — only the `domainContextBinding:
  { id, version, mode }` reference.
- **Import CPM.** File → Import → Case Plan Model menu action.
  Prompts for a `.cpm.json` file, validates against the current
  application's CPM schema, and imports into the current project.
  - Conflict handling: if a CPM with the same `id` already exists,
    prompt the user: overwrite, rename, or cancel.
  - Domain context binding: if the imported CPM references a
    domain context the current project has, keep the reference;
    otherwise warn the user and import with the reference dangling
    (epic_DOMAIN_CONTEXT_07 will surface it).
  - ACMN schema validation: refuses files from future schema
    versions; applies forward migration for older (via the
    existing harness).
- **Export domain context.** File → Export → Domain Context menu
  action. User picks a domain context from a dropdown (personal
  tier of the current user, plus any contexts already in the
  project). Writes a standalone `*.domain.json` file.
- **Import domain context.** File → Import → Domain Context menu
  action. Prompts for a `.domain.json`, validates, and imports
  into the current project's `domain-contexts/` folder. If a
  conflict with an existing id exists, prompt to overwrite,
  rename, or cancel.
- **Native dialogs.** OS-native save and open dialogs for file
  picking.
- **Validation layer.** Imports run the same Zod schemas used
  elsewhere (property panel + pre-flight) so broken files never
  land in the project.
- **Progress feedback.** For larger files, show a brief
  progress indicator; imports are typically fast enough not to
  need it but errors must surface cleanly.

### Out of Scope

- Drag-and-drop of external files onto the Designer window as an
  import trigger. v0.1 uses menu-driven import only. Drag-drop
  can come later.
- Exporting multiple CPMs or multiple domain contexts in a single
  action (batch export). Deferred.
- ACMN-format interoperability with other tools (third-party
  authoring tools). The Designer's JSON is canonical ACMN, but
  specific interop testing is v0.2+.
- Import / export of test scenarios. Test scenarios are project-
  local by design; revisit if real need emerges.
- Import / export of published `.acmn` packages — those are
  release artefacts (produced in
  epic_PUBLISH_MODE_AND_PACKAGING_11) and are not a workflow for
  day-to-day authoring.
- Auto-merge when a conflicting CPM is imported. User chooses
  overwrite or rename.

---

## 4. Functional Requirements

- **FR-120** — Support exporting a case plan model as a standalone
  JSON file for interchange with other tools.
- **FR-121** — Support importing a case plan model from a JSON
  file, with validation against the current domain context and
  ACMN schema.
- **FR-122** — Support exporting a domain context as a standalone
  JSON package.
- **FR-123** — Support importing a domain context from a JSON
  file.

---

## 5. Non-Functional Requirements

- **NFR-034** — Validate all file paths from user dialogs against
  path traversal before writing.
- **NFR-054** — Atomic writes for export so a cancelled write
  leaves no partial file.
- **NFR-053** — Refuse to import CPMs / domain contexts from
  schema versions newer than the current application, with a
  clear message.
- **NFR-052** — Apply forward migration to older imports,
  preserving the original file (the original stays on the user's
  disk untouched — nothing is written back to the source).

---

## 6. UI/UX Notes

- **Menu location.** Under File → Export and File → Import, with
  submenu items "Case Plan Model..." and "Domain Context...".
  Native menu lives in epic_APP_CHROME_AND_SETTINGS_08; this epic
  registers its entries.
- **Export flow.**
  1. User clicks File → Export → Case Plan Model.
  2. If multiple CPMs in project, a picker first
     (defaults to active CPM).
  3. Native save dialog opens with default filename
     `<cpm-name>.cpm.json`.
  4. On save, a success toast "Exported to <path>".
- **Import flow.**
  1. User clicks File → Import → Case Plan Model.
  2. Native open dialog restricted to `.cpm.json`.
  3. Validation + migration on the in-memory payload (original
     file on disk is untouched).
  4. Conflict dialog if id exists in the project:
     - "A case plan model with this ID already exists." Options:
       *Replace*, *Keep both (rename import)*, *Cancel*.
  5. Success toast: "Imported <name> (v2.2.0)".
- **Error states.** Plain-language errors:
  - "This file is not a valid Case Plan Model" (Zod validation
    failure).
  - "This file was saved by a newer version of ACMN Designer.
    Please update the application." (future schema version).
  - "Cannot write to the selected location (permission
    denied)." (OS permission error).
- **Rename prompt.** When user chooses "Keep both", prompt for
  new name; validate uniqueness.

---

## 7. Data Model Impact

- **No new file formats.** Exports are the existing `.cpm.json`
  and `.domain.json` formats untouched — the same files
  `LocalBackend` writes into a project folder.
- **No schema changes.**
- **Rename on import.** When user renames, the imported file
  gets a new `id` (UUID) and the name is updated; internal
  references (e.g., sentries, human task form fields) don't
  need updating because they reference by name within the same
  CPM.

---

## 8. Integration Impact

- **LocalBackend extension.** New methods:
  `exportCasePlanModel(projectId, cpmId, targetPath)`,
  `importCasePlanModel(projectId, sourcePath, conflictPolicy)`,
  `exportDomainContext(dcId, targetPath)`,
  `importDomainContext(projectId, sourcePath, conflictPolicy)`.
- **IPC additions.** `cpm:export`, `cpm:import`,
  `domainContext:export`, `domainContext:import`.
- **Native dialogs.** Reuses `src-main/ipc/dialog.ts` from
  epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01. Filter on
  `.cpm.json` and `.domain.json` extensions.
- **Validation.** Reuses Zod schemas from
  epic_PROPERTY_PANEL_05 and epic_DOMAIN_CONTEXT_07. Migration reuses
  the harness from epic_AUTOSAVE_AND_RECOVERY_02.
- **Menu wiring.** Native application menu entries registered in
  epic_APP_CHROME_AND_SETTINGS_08 call these IPC handlers.
- **No new dependencies.**

---

## 9. Acceptance Criteria

- [ ] File → Export → Case Plan Model writes the active CPM to a
  user-chosen location as a valid `.cpm.json` file.
- [ ] File → Import → Case Plan Model imports a valid
  `.cpm.json` into the current project.
- [ ] Imports from an older schema version trigger the migration
  harness (or are refused for future versions).
- [ ] Importing a CPM whose id already exists prompts with
  Replace / Keep both / Cancel options; all three behave
  correctly.
- [ ] Domain context export writes a valid `.domain.json`.
- [ ] Domain context import validates, migrates if needed, and
  handles id conflicts with the same three-option prompt.
- [ ] Invalid files (malformed JSON, missing required fields)
  produce plain-language error messages without crashing the
  app.
- [ ] Exported files round-trip losslessly back through import
  (export A, import into project B → identical content).
- [ ] Path validation prevents traversal-style export paths.
- [ ] Export and import operations are atomic (no partial
  writes).

---

## 10. Risks & Unknowns

- **Domain context references on CPM import.** If the imported
  CPM references a domain context the destination project
  doesn't have, the domain panel on canvas will render in a
  "missing" state. Acceptable; user follows up by importing the
  domain context or picking a different one.
- **Validation strictness.** Too-strict validation may refuse
  slightly-non-conformant files that users hand-edited. Too-lax
  validation lets corruption in. Recommendation: be strict on
  required fields, tolerant on extra fields.
- **Rename semantics.** Renaming on import requires choosing a
  unique project-local name. Keep this simple — append "
  (imported)" and let the user rename via property panel.
- **OS-specific file-association.** Double-clicking a `.cpm.json`
  file in Windows Explorer launching the Designer is tempting
  but out of scope for v0.1 (would require installer work in
  epic_WINDOWS_INSTALLER_AND_DISTRIBUTION_12).
- **Open question — should export inline the bound domain
  context for portability?** Proposed: no — keep export lean
  (binding reference only). Users who want a self-contained
  artefact should publish (`.acmn` package).

---

## 11. Dependencies

- **Upstream:**
  - epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01 (dialog helpers,
    LocalBackend).
  - epic_AUTOSAVE_AND_RECOVERY_02 (schema migration harness,
    atomic writes).
  - epic_PROPERTY_PANEL_05 (Zod schemas for CPM validation).
  - epic_DOMAIN_CONTEXT_07 (domain context Zod schema; file
    handling).
  - epic_APP_CHROME_AND_SETTINGS_08 (native menu entries).
- **Downstream:** none — this is terminal functionality.

---

## 12. References

- **prd:** `docs/Product Requirements Document/PRD.md` (implicit
  from §6 — share / interchange use cases)
- **architecture:** `docs/Architecture/Architecture.md` (§5 data
  format on disk; §8 validation)
- **functional requirements:** `docs/Functional Requirements/FunctionalRequirements.md`
- **non-functional requirements:** `docs/Non-Functional Requirements/NonFunctionalRequirements.md`

---

## 13. Implementation Notes

**Complexity:** S

**Suggested ticket breakdown (3 tickets):**

1. **IEI-01** — CPM export + import: LocalBackend methods, IPC
   handlers, validation + migration, conflict handling UI
   (Replace / Keep both / Cancel + rename prompt).
2. **IEI-02** — Domain context export + import: same pattern
   for `.domain.json`.
3. **IEI-03** — Menu integration: File → Export / Import entries
   wired into the native menu from
   epic_APP_CHROME_AND_SETTINGS_08. Success toasts + error
   dialogs for all failure modes.

**Scaffolding files touched:**

- `src-main/backend/localBackend.ts` — add import/export methods.
- `src-main/ipc/casePlanModel.ts` — add export/import handlers.
- `src-main/ipc/domainContext.ts` — add export/import handlers.
- `src-main/preload.ts` — expose handlers to renderer.
- `src-renderer/contracts/backend.ts` — add interface methods.
- `src-renderer/features/` — small conflict-resolution modals.

**Chain constraint:** IEI-01 and IEI-02 can overlap. IEI-03
depends on both.

**Estimated total effort:** 1–2 days.
