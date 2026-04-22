# Epic: PUBLISH_MODE_AND_PACKAGING

**Status:** NEW
**Owner:** human
**Created:** 2026-04-21
**Last Updated:** 2026-04-21

---

## 1. Purpose

Take a finished case plan model, prove it's publish-ready, and
package it into a portable artefact. In v0.1 the artefact is a local
`.acmn` zip in the project's `dist/` folder. In v0.2+ the same
artefact will deploy to a live Execution Engine — because the build-
artefact contract is already in place, we won't need to rewrite the
UI when that lands.

This is the epic that makes the Designer feel finished: pre-flight
checks confirm every agent has a model, every port is connected,
every sentry references a real variable, and at least one test has
passed. Version bump, release notes, migration policy, export —
the full publishing ritual.

---

## 2. User Story

As a **solution architect**,
I want to click "Publish", see a checklist of pre-flight validations
pass, bump the version, write release notes, and produce a
packaged artefact,
So that I have confidence the case plan model is complete and can be
handed off to the Execution Engine (or, in v0.1, shared with a
colleague as a file).

As a **release manager** (future role),
I want published packages to be versioned and kept in the project's
`dist/` folder,
So that we have a local history of every release and can roll back
by re-publishing a prior version.

---

## 3. Scope

### In Scope

- **Publish dialog** — modal opened via the Publish tab in the top
  bar. Sections:
  - Pre-flight checklist (live-running as the dialog opens).
  - Version picker (current version, radio for
    major / minor / patch, pre-computed next version display).
  - Release notes (multi-line text).
  - Existing-case migration policy: continue on old / migrate to
    new (default: continue on old, with explanation).
  - "Publish" button (disabled until pre-flight passes).
  - "Cancel" button.
- **Pre-flight validation** — runs on dialog open and surfaces each
  check as pass / fail / warning. Checks:
  1. All required ports are connected (no dangling input ports).
  2. All agent nodes have a model configured.
  3. All connector nodes have valid connection configuration.
  4. All case variables are defined (referenced but missing → fail).
  5. All sentry expressions reference existing variables.
  6. The domain context is bound (not missing).
  7. At least one test run has passed for this CPM.
  8. All tool nodes have input and output schemas.
  9. All guardrails / evaluators have configured rules / criteria.
  Each failed check is clickable → jumps canvas to the offending
  element and opens its property panel.
- **Semantic versioning.** Version stored as `"major.minor.patch"`.
  Bump radios compute the next version (patch: 2.1.3 → 2.1.4; minor:
  → 2.2.0; major: → 3.0.0). User can override manually in an
  advanced field.
- **Release notes** — free-form multi-line. Stored on the published
  artefact for display in future release history UI.
- **Migration policy field** — two options:
  - *Continue on old version (recommended)*: existing running cases
    stay on the version they started with.
  - *Migrate to new version*: existing cases migrate at next safe
    point. Shows a warning that this is a v0.2+ runtime concern;
    the policy is stored but takes effect when the Execution
    Engine exists.
- **Packaging (`.acmn`)** — a standard zip archive containing:
  - `manifest.json` — package metadata (CPM id, name, version,
    publish time, author, release notes, migration policy).
  - `case-plan-model.json` — the CPM being published.
  - `domain-contexts/` — every domain context referenced by the
    CPM, resolved at publish time (applies whether the CPM uses
    reference or copy binding — the package is always self-
    contained).
  - `tests/` — (optional) last-passed test scenarios copied in for
    traceability.
- **Output location.** `<project>/dist/<cpm-name>-v<version>.acmn`.
  Overwrite of same version requires confirmation.
- **Progress UI.** Steps: "Validating → Packaging → Writing". Each
  step shows a spinner and resolves to ✓ or ✗. Errors reported
  with actionable messages.
- **Local version history.** After publish, the dialog shows a list
  of prior publishes in `dist/` with version, timestamp, size, and
  a "Show in folder" action.
- **v0.2+ deploy call stubbed.** `publishCasePlanModel` in
  `LocalBackend` always writes to disk. `RemoteBackend`'s
  implementation (v0.2+) will additionally POST to the
  Communication Engine.
- **Cancellation** — user can cancel during packaging; partial
  `.tmp` output cleaned up.

### Out of Scope

- Actually deploying to a remote Execution Engine (v0.2+; the
  contract is defined here).
- Rolling back a published `.acmn` version (just re-publishing an
  older state is the v0.1 workflow).
- Signing / verifying `.acmn` package authenticity
  cryptographically. Future integrity story.
- Publishing multiple CPMs as a bundle. v0.1 is one CPM per
  publish.
- Diffing two published versions. Deferred.
- CI / CD integration.
- Customisable pre-flight rules.

---

## 4. Functional Requirements

- **FR-021** — Three canvas modes via top tabs (already delivered
  by epic_CANVAS_INTERACTION); this epic wires the Publish tab to
  a dedicated Publish view.
- **FR-024** — In Publish mode, display a publish dialog with
  pre-flight validation checks and deployment details.
- **FR-110** — In Publish mode, display a modal dialog with
  pre-flight validation checks.
- **FR-111** — Pre-flight checks verify: all required ports
  connected, all agent nodes have a model configured, all
  connector nodes have valid configuration, all case variables
  defined, all sentry expressions reference valid variables, the
  domain context is fully bound, at least one test run has
  passed.
- **FR-112** — Publish dialog allows specifying a semantic version
  bump (major / minor / patch) with the resulting version
  pre-computed and displayed.
- **FR-113** — Publish dialog allows entering optional release
  notes in a multi-line text field.
- **FR-114** — Publish dialog allows choosing how existing running
  cases handle the version change: continue on old version
  (default, recommended) or migrate to new version.
- **FR-115** — In v0.1, the publish action packages the CPM and
  all referenced domain contexts into a single `.acmn` archive
  file, written to the project's `dist/` folder.
- **FR-116** — In v0.2+, the publish action deploys the package to
  the Execution Engine via the Communication Engine REST API.
  (Contract-only in v0.1; the stub `RemoteBackend` surfaces this.)
- **FR-117** — Display publish progress (validating, packaging,
  deploying) and report success or failure with actionable error
  messages.
- **FR-118** — Maintain a local version history of published CPMs
  in the project's `dist/` folder, retaining all previously
  published `.acmn` files.

---

## 5. Non-Functional Requirements

- **NFR-008** — Complete publish (pre-flight validation +
  packaging) in under 5 seconds for CPMs with ≤50 elements on the
  reference workstation.
- **NFR-121** — Indicate background activity (progress bar) during
  publish operations, which typically exceed 500 ms.
- **NFR-122** — Support graceful cancellation of publish without
  corrupting project state.
- **NFR-054** — Atomic writes for the `.acmn` output (temp file +
  rename) so a cancelled publish leaves no half-written package.

---

## 6. UI/UX Notes

- **Publish tab.** Switching to Publish mode shows a centred view:
  "Publish case plan model" header, version indicator, CTA button
  "Open publish dialog". Design and Test are de-emphasised while
  in Publish mode (no state overlays, palette hidden).
- **Dialog layout** — vertical sections in a modal roughly 720 px
  wide:
  1. Pre-flight (top): list with ✓ / ✗ / ⚠ per check. Failed
     checks expand into actionable links.
  2. Version (middle): current version, bump radios, next-version
     preview in monospace.
  3. Release notes (middle): resizable textarea.
  4. Migration policy (middle): two radio cards with the
     explanation above.
  5. Footer: "Cancel", "Publish" (primary, disabled until pre-
     flight passes).
- **Progress state.** When "Publish" is clicked, sections collapse
  into a progress view with three steps. Errors render as an
  alert with "Retry" and "Cancel" buttons.
- **Version history panel.** After successful publish, or from a
  "Previously published" link, show a table of prior publishes
  with version, timestamp, size, "Show in folder".
- **Error surfacing.** Failed pre-flight check rows are clickable
  → jumps to the offending element on the canvas, opens its
  property panel, and highlights the invalid field.
- **Success toast.** "Published standard-onboarding v2.2.0 →
  dist/standard-onboarding-v2.2.0.acmn".
- **Mockup reference.** `docs/Mockups/05-publish-dialog.png`.

---

## 7. Data Model Impact

- **CPM schema addition.** `version: "major.minor.patch"` field;
  default `"0.1.0"` on new CPMs. If absent on older files, the
  migration harness (epic_AUTOSAVE_AND_RECOVERY) fills it with
  `"0.1.0"`.
- **CPM schema addition.** `publishedVersions[]` — optional, local
  history entries `{ version, timestamp, releaseNotes,
  migrationPolicy, filePath }`. Written on successful publish.
- **`.acmn` package manifest** — new file format:
  ```json
  {
    "packageFormat": "1",
    "cpmId": "cpm_01HP...",
    "cpmName": "standard-onboarding",
    "version": "2.2.0",
    "publishedAt": "2026-04-21T14:22:18Z",
    "author": "Francois",
    "releaseNotes": "...",
    "migrationPolicy": "continue_on_old" | "migrate_to_new",
    "domainContexts": [ { "id", "version", "file" } ]
  }
  ```
- **New validation** — Zod-backed `validateCasePlanModel` in the
  main process implementing every pre-flight rule; reuses Zod
  schemas from epic_PROPERTY_PANEL and
  epic_CASE_VARIABLES_AND_SENTRIES. Returns
  `ValidationResult { errors[], warnings[] }`.

---

## 8. Integration Impact

- **LocalBackend extension.** `validateCasePlanModel`,
  `publishCasePlanModel`. `publishCasePlanModel` packages via a
  new `src-main/storage/acmnPackager.ts`.
- **IPC additions.** `cpm:validate`, `cpm:publish` with progress
  events.
- **Progress events over IPC.** Same event-stream pattern as test
  mode's `AsyncIterable` — publish reports `validating`,
  `packaging`, `writing`, `done`, or `failed` with details.
- **New zip dependency.** `jszip` (MIT licensed, permissive) for
  creating the `.acmn` archive.
- **`RemoteBackend` stub.** `publishCasePlanModel` throws
  "not yet implemented" when remote is selected; the contract
  accepts the same `PublishParams` for v0.2+ parity.
- **Test run dependency.** Pre-flight reads `lastRun.result` from
  `.test.json` files (epic_TEST_MODE_AND_SIMULATOR) to check "at
  least one test passed".

---

## 9. Acceptance Criteria

- [ ] Switching to Publish mode shows the publish view and
  dialog entrypoint.
- [ ] Opening the dialog runs pre-flight; all nine checks are
  listed with their status.
- [ ] A failing check can be clicked to navigate to the
  offending element with its property panel open.
- [ ] Publish is disabled until all checks pass.
- [ ] Version bump radios pre-compute the next version
  correctly (patch / minor / major).
- [ ] Release notes persist into the package manifest.
- [ ] Migration policy is recorded (policy takes effect when
  the Execution Engine exists in v0.2+).
- [ ] Clicking Publish writes a `.acmn` file to
  `dist/<cpm-name>-v<version>.acmn` atomically.
- [ ] The `.acmn` archive contains `manifest.json`,
  `case-plan-model.json`, and `domain-contexts/` with every
  referenced context bundled (reference-mode contexts are
  resolved at publish time and included).
- [ ] Over-writing an existing version prompts for confirmation.
- [ ] Cancel during packaging leaves no partial file behind.
- [ ] Publish completes in under 5 seconds for a 50-element CPM.
- [ ] Version history panel shows all prior publishes in `dist/`
  with "Show in folder" functioning.
- [ ] Zero-test CPMs fail pre-flight with a "No passing test
  runs yet — run a test first" actionable error.
- [ ] `window.acmn.cpm.publish` on `RemoteBackend` throws the
  documented "not yet implemented" error and the UI surfaces
  it appropriately when that backend is selected via config.

---

## 10. Risks & Unknowns

- **Pre-flight coverage vs user frustration.** Strict pre-flight
  catches mistakes but can be annoying mid-design. Ensure checks
  only run at publish time, not constantly. Users still see
  inline errors from epic_PROPERTY_PANEL during design.
- **Domain context bundling.** Reference-mode contexts are
  resolved at publish time. If the source context changes between
  publishes, the package captures the then-current version —
  document this behaviour clearly.
- **Large CPM packaging performance.** 500-element CPMs with many
  domain contexts may be slow to package. The 5-second NFR targets
  ≤50 elements; measure larger cases and document observed
  timings.
- **Version conflict.** If the user decrements a version number
  manually, warn but don't block — some workflows require re-
  publishing as an older version for hot-fix purposes.
- **Migration policy semantics.** In v0.1 the field is recorded
  but no runtime acts on it. UX should make this clear
  ("This takes effect when your CPM runs on the Execution
  Engine").
- **Open question — should the Designer publish on behalf of
  multiple CPMs in one action?** v0.1 is one CPM per publish to
  keep the flow simple.

---

## 11. Dependencies

- **Upstream:**
  - epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE (LocalBackend +
    `dist/` folder).
  - epic_AUTOSAVE_AND_RECOVERY (atomic writes; dependency on
    migration harness for CPM version field).
  - epic_CANVAS_INTERACTION (Publish tab placeholder).
  - epic_PROPERTY_PANEL (Zod schemas reused by pre-flight).
  - epic_CASE_VARIABLES_AND_SENTRIES (sentry expression
    reference-check).
  - epic_DOMAIN_CONTEXT (domain context resolution for bundling).
  - epic_TEST_MODE_AND_SIMULATOR (reads `lastRun.result`).
  - epic_WIRE_MANAGEMENT (port-connected check).
- **Downstream:**
  - v0.2+ `RemoteBackend` plugs into the same
    `publishCasePlanModel` contract without UI changes.

---

## 12. References

- **prd:** `docs/Product Requirements Document/PRD.md` (§6.8
  publish mode)
- **architecture:** `docs/Architecture/Architecture.md` (§4
  publishCasePlanModel; §5.5 `.acmn` package; §8.2 pre-flight
  validation)
- **functional requirements:** `docs/Functional Requirements/FunctionalRequirements.md`
- **non-functional requirements:** `docs/Non-Functional Requirements/NonFunctionalRequirements.md`
- **mockups:** `docs/Mockups/05-publish-dialog.png`

---

## 13. Implementation Notes

**Complexity:** L

**Suggested ticket breakdown (6 tickets):**

1. **PMP-01** — Pre-flight validator
   (`LocalBackend.validateCasePlanModel`): implements the nine
   check rules using existing Zod schemas. Returns
   `ValidationResult` with element references. Unit-tested
   against synthetic CPMs.
2. **PMP-02** — `acmnPackager` module: `jszip`-based zip writer
   producing `manifest.json` + `case-plan-model.json` +
   `domain-contexts/`. Atomic write to `dist/`.
3. **PMP-03** — Publish dialog UI: pre-flight checklist, version
   picker, release notes, migration policy. Failed-check → jump-
   to-element navigation.
4. **PMP-04** — Progress streaming from publish over IPC; progress
   UI in the dialog; cancellation with cleanup.
5. **PMP-05** — Version history panel: scans `dist/`, lists
   published packages, "Show in folder" action. Version-conflict
   overwrite confirmation.
6. **PMP-06** — CPM schema: add `version` + `publishedVersions[]`
   fields; migration; default values.

**Scaffolding files touched:**

- `src-main/backend/localBackend.ts` — validate + publish methods.
- `src-main/storage/acmnPackager.ts` — new.
- `src-main/ipc/casePlanModel.ts` — add validate + publish
  handlers.
- `src-renderer/features/publish/*` — new folder
  (`PublishDialog.tsx`, `PreflightChecks.tsx`,
  `ReleaseNotes.tsx`, `VersionHistory.tsx`).
- `src-main/storage/migrations.ts` — CPM version-field migration.
- `package.json` — add `jszip` dependency (pinned).

**Chain constraint:** PMP-06 (schema migration) first. PMP-01 and
PMP-02 can overlap. PMP-03/04/05 UI tickets land after.

**Estimated total effort:** 4 days.
