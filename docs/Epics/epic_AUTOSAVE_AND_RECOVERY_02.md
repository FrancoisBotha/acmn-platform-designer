# Epic: AUTOSAVE_AND_RECOVERY

**Status:** TICKETS
**Owner:** human
**Created:** 2026-04-21
**Last Updated:** 2026-04-22

---

## 1. Purpose

Make saving invisible to the user. Once a project is open, every
keystroke's worth of work is being persisted without the user having
to think about it. Writes are atomic, rolling backups exist, and the
application recovers gracefully from unexpected exit, corrupted files,
or project files from older schema versions.

This epic layers durability onto the project lifecycle delivered in
epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01. The `saveProject()` call
becomes atomic, an auto-save loop debounces disk writes every 30
seconds, three rolling backups per project enable recovery from a bad
write, and a schema-version migration harness enables the Designer to
evolve its file formats over time without breaking existing projects.

---

## 2. User Story

As a **solution architect**,
I want the Designer to save my work automatically as I go and recover
it if the app crashes,
So that a power cut or app crash never costs me more than a few
seconds of editing.

As a **Designer maintainer releasing v0.2+**,
I want existing v0.1 project files to open in the new version via
automatic forward migration,
So that users never have to manually edit their project files when we
evolve the schema.

---

## 3. Scope

### In Scope

- Debounced auto-save: every 30 seconds after the last change, and
  immediately on app quit.
- Manual save (Ctrl+S, File menu) and Save As flush any pending
  auto-save.
- Atomic writes: write to a temp file (`*.tmp`) in the same folder,
  `fsync`, then rename to target. No partial writes visible to other
  tools.
- Rolling backups: before each overwrite, the previous file is
  rotated to `*.bak.1`, `*.bak.2`, `*.bak.3` (oldest dropped).
  Applies to `project.acmn.json` and each `*.cpm.json` /
  `*.domain.json` / `*.test.json`.
- Crash recovery: on startup, the Designer checks for stranded
  `*.tmp` files in the last-opened project folder. If found, offer
  the user a dialog with options to use the tmp file's contents,
  use the last successful save, or open a backup.
- Corrupt-file detection: JSON parse failures and schema-validation
  failures surface a clear error with actionable options (attempt
  recovery, open backup, report bug).
- Schema-version validation: refuse to open project or file whose
  `projectFormat` / `schemaVersion` is newer than the current
  application, with a message directing the user to upgrade the
  Designer.
- Forward migration harness: when opening a file whose version is
  older than the current, run registered migrations sequentially to
  bring it up to current. Preserve the pre-migration file as
  `*.backup`.
- Background operation: auto-save, migration, and backup rotation
  must not block user input. UI remains responsive.

### Out of Scope

- Save-on-every-change (we debounce). The behaviour is intentionally
  "every 30 seconds plus on-quit".
- Git integration or diff-based versioning. Deferred to v0.3+.
- Cloud sync or remote backup. Local-only in v0.1.
- Conflict resolution if two Designer instances edit the same project
  concurrently. v0.1 is single-user; concurrent edit is undefined
  behaviour.
- Backup retention policy configuration. Fixed at three rolling
  backups per file.
- Schema-aware recovery that picks the "best" corruption fix. The
  harness only surfaces options to the user, it doesn't guess.
- Any migration content — this epic delivers the harness and the
  version-1 baseline. Actual migrations are authored as schema
  changes land in later versions.

---

## 4. Functional Requirements

- **FR-017** — Auto-save the current project to disk every 30 seconds
  after the last change, and flush on Save / Save As / app quit.
- **FR-160** — Recover unsaved changes on unexpected exit by
  detecting stranded `*.tmp` files and presenting the user with
  recovery options on next launch before opening the project.
- **FR-161** — Detect corrupt project files (JSON parse failure or
  schema-validation failure) and present a clear error with options
  to report, attempt recovery, or open a backup.
- **FR-162** — Validate imported project files against the expected
  schema version and refuse to open files from incompatible future
  versions, surfacing a clear "please update the application"
  message.
- **FR-163** — Support project files from earlier schema versions by
  applying forward migrations, preserving the original file as a
  `*.backup` sibling.

---

## 5. Non-Functional Requirements

- **NFR-007** — Complete auto-save operations in under 500 ms for
  projects with ≤100 elements, without blocking user input.
- **NFR-050** — Project files (`project.acmn.json`, `.cpm.json`,
  `.domain.json`) are human-readable JSON with 2-space indentation
  for diff-ability and version-control compatibility.
- **NFR-051** — All project files include a schema version field
  enabling forward-compatible parsing.
- **NFR-052** — Provide a forward-migration path when loading project
  files from earlier schema versions, preserving the original file
  as `*.backup`.
- **NFR-053** — Refuse to open project files from schema versions
  newer than the current application, with a clear message directing
  the user to update.
- **NFR-054** — Write project files atomically (temp file + rename)
  to prevent corruption on unexpected exit.
- **NFR-055** — Maintain a rolling backup of the last three auto-saves
  per file, enabling recovery from a corrupted save.
- **NFR-120** — UI remains responsive during auto-save via async IPC
  and non-blocking main-process operations.

---

## 6. UI/UX Notes

- **Save indicator.** Title bar shows "saved just now" briefly after
  each successful auto-save (optional, subtle — spike into UX during
  implementation and defer if noisy).
- **Modified marker.** Already added in
  epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01; this epic keeps it in
  sync with the auto-save loop (clears after each successful save).
- **Recovery dialog on startup** (when stranded `*.tmp` detected):
  headline "Unsaved changes detected from last session" with three
  options:
  - **Restore unsaved changes** (uses the tmp file)
  - **Open last saved version** (discards tmp)
  - **Open a backup** (opens a picker showing `.bak.1/2/3`)
- **Corrupt file dialog**: "The file `standard-onboarding.cpm.json`
  could not be read" with three options: Report bug (copies error to
  clipboard), Open a backup, Cancel.
- **Future-version dialog**: "This project was saved by a newer
  version of ACMN Designer (format v3). Please update the
  application." with a link to the download page.
- **Migration applied toast**: "Project migrated from format v1 to
  v2. A backup was saved to `project.acmn.json.backup`."
- **No spinner** for auto-save — it must not interrupt the user. If
  auto-save takes longer than 500 ms, epic_APP_CHROME_AND_SETTINGS_08's
  background-activity indicator is surfaced.

---

## 7. Data Model Impact

- **New field on every file**: `schemaVersion: "1"` (string, semver or
  integer — confirm at ticket time). For `project.acmn.json`, this is
  the existing `projectFormat` field.
- **New sibling files** on disk:
  - `*.bak.1`, `*.bak.2`, `*.bak.3` — rolling backups per project
    file. Plain copies of the previous successful save.
  - `*.backup` — single pre-migration snapshot, kept once per
    migration (overwritten on subsequent migrations).
  - `*.tmp` — transient during atomic writes; should not persist
    under normal operation.
- **Migration registry** (code, not data): a TypeScript map from
  `(fileKind, fromVersion)` → migration function returning
  `toVersion` payload. Populated lazily as schema evolves; v0.1 ships
  with an empty registry and the harness that reads it.

---

## 8. Integration Impact

- **LocalBackend extension.** `saveProject` and each file-write method
  are wrapped with atomic-write + backup-rotation helpers.
- **IPC additions.** `project:recover` (returns recovery options
  found on startup), `project:applyRecovery` (user's choice).
- **projectStore (Zustand)** gains an `autoSaveEnabled`,
  `autoSaveInterval`, and `lastSavedAt` state, plus a debounce
  timer tied to dirty-flag transitions.
- **New main-process module**: `src-main/storage/atomicWrite.ts` with
  a single entry point used by every write in the Designer.
- **New main-process module**: `src-main/storage/migrations.ts` with
  the migration registry and `migrate(fromVersion, toVersion,
  payload)` function.
- **No new external dependencies.** Uses Node's `fs/promises` and a
  small debounce utility (either bespoke or Lodash).

---

## 9. Acceptance Criteria

- [ ] Editing a project without pressing Ctrl+S results in the
  project being saved to disk within 30 seconds.
- [ ] Killing the app mid-edit (force-quit) leaves at most one tmp
  file and no partially-written `*.cpm.json`.
- [ ] Re-launching after a force-quit shows the recovery dialog when
  a tmp file exists, offering "restore unsaved / open last saved /
  open backup".
- [ ] After three successful saves, three `.bak.N` siblings exist.
  The fourth save drops `.bak.3` and renames the chain forward.
- [ ] Opening a manifest whose `projectFormat` is newer than the
  current app version surfaces the "please update" message and does
  not load the project.
- [ ] Opening a manifest whose `projectFormat` is older runs the
  migration harness (even if empty for v0.1), writes a `.backup`
  sibling, and loads the project successfully.
- [ ] Corrupt JSON in any project file surfaces the corrupt-file
  dialog without crashing the app.
- [ ] Auto-save for a 100-element project completes in under 500 ms on
  the reference workstation and does not block typing or canvas
  interaction.
- [ ] Manual save (Ctrl+S) flushes any pending debounced auto-save
  and clears the modified marker.
- [ ] All writes use the atomic tmp-file + rename pattern — confirmed
  by inspecting main-process code paths.

---

## 10. Risks & Unknowns

- **Migration registry being empty in v0.1.** This is intentional —
  the harness exists to support future migrations. Acceptance tests
  exercise the harness with a synthetic v0 → v1 migration in tests
  only.
- **Windows file-locking during rename.** Windows may fail rename if
  another process holds the target file open. Mitigation: retry
  once with exponential backoff before surfacing an error.
- **Auto-save vs long-running operations.** If auto-save fires during
  publish or test execution, it should queue rather than cancel the
  long-running operation. Needs careful state machine — document in
  ticket.
- **Recovery dialog on normal quit.** The main process must
  distinguish "quit cleanly" (delete tmp files) from "crashed"
  (leave tmp files). Electron's `before-quit` hook handles the
  clean case; crash leaves tmps naturally.
- **Open question — should `.backup` files accumulate?** Current
  proposal is one `.backup` overwritten per migration. Revisit if
  real-world migrations chain (v1 → v2 → v3 in a single open).

---

## 11. Dependencies

- **Upstream:** epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01 (defines
  the `BackendContract` interface and the baseline save flow this
  epic hardens).
- **Downstream:** every later epic that reads/writes project files
  inherits atomic writes and migration support for free.

---

## 12. References

- **prd:** `docs/Product Requirements Document/PRD.md` (§6.1
  auto-save; §11 file format stability open question)
- **architecture:** `docs/Architecture/Architecture.md` (§7 auto-save
  strategy; §8 validation)
- **functional requirements:** `docs/Functional Requirements/FunctionalRequirements.md`
- **non-functional requirements:** `docs/Non-Functional Requirements/NonFunctionalRequirements.md`

---

## 13. Implementation Notes

**Complexity:** M

**Suggested ticket breakdown (5 tickets):**

1. **ASR-01** — `atomicWrite` helper in main process (tmp +
   `fsync` + rename with Windows retry). Replace all direct
   `fs.writeFile` calls in `LocalBackend` with it.
2. **ASR-02** — Rolling-backup rotation: per-file `*.bak.1/2/3`
   chain maintained by `atomicWrite`. Covered by unit tests against
   synthetic file trees.
3. **ASR-03** — Renderer auto-save loop: debounced 30s timer tied to
   the dirty flag in `projectStore`. Immediate flush on Ctrl+S,
   Save As, and `before-quit`. "Last saved at" indicator wiring.
4. **ASR-04** — Crash-recovery detection: scan last-opened project
   folder for stranded `*.tmp` files on startup. Recovery dialog UI
   with three options. IPC handlers `project:recover` and
   `project:applyRecovery`.
5. **ASR-05** — Schema-version validation + migration harness:
   `schemaVersion` checks on open, forward-migration registry,
   `*.backup` sibling on migrate, future-version refusal dialog,
   corrupt-file dialog. Includes one synthetic test migration to
   exercise the harness.

**Scaffolding files touched:**

- `src-main/backend/localBackend.ts` — every write path replaced
  with `atomicWrite`.
- `src-main/storage/atomicWrite.ts` — new.
- `src-main/storage/migrations.ts` — new.
- `src-main/ipc/project.ts` — add `recover` / `applyRecovery`.
- `src-renderer/state/projectStore.ts` — add auto-save state +
  debounce.
- `src-renderer/App.tsx` — wire recovery dialog on startup.

**Chain constraint:** ASR-01 must merge first; ASR-02 depends on it;
ASR-03 can overlap; ASR-04 and ASR-05 serialise because both edit
`project.ts` IPC registrations.

**Estimated total effort:** 3 days.
