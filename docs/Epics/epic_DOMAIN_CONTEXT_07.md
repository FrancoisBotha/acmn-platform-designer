# Epic: DOMAIN_CONTEXT

**Status:** TICKETS
**Owner:** human
**Created:** 2026-04-21
**Last Updated:** 2026-04-23

---

## 1. Purpose

Replace the spike's hardcoded "Insurance Claims v3.2" badge with the
real domain context system: a library of domain contexts in three
tiers (published / installed / personal), binding modes that control
whether the case plan model inherits updates automatically or pins a
local copy, and full editors for vocabulary, schemas, rules, and
decision tables.

This is the mechanism by which domain experts' work enters the
Designer. Without it, every case plan model would have to redefine
its vocabulary and rules from scratch.

---

## 2. User Story

As a **solution architect**,
I want to pick an existing domain context from the library and bind
it to my case plan model — choosing whether to reference it live or
fork a local copy,
So that my case inherits the domain's vocabulary, schemas, rules,
and decision tables without re-entering them.

As a **domain expert**,
I want to create and edit domain contexts — vocabulary, schemas,
rules, decision tables — as a first-class activity in the Designer,
So that my work is authored once and consumed by every case plan
model that binds to it.

---

## 3. Scope

### In Scope

- **Domain context panel on canvas** — replaces the spike's static
  badge. Renders as an overlay attached to the top edge of the CPM
  element, showing:
  - Domain name and version.
  - Binding mode icon (🔗 reference / 🍴 copy).
  - Summary counts (terms, schemas, rules, decision tables).
  - Package provenance badge when installed from a registry.
- **Click-through to detail view.** Clicking the panel opens a
  dedicated detail view (modal or right-panel full-height) with four
  tabs: Vocabulary, Schemas, Rules, Decision Tables. Read-only in
  reference mode, editable in copy mode.
- **Domain context library screen.** Accessible from the project
  tree sidebar or a dedicated entry in the native menu. Three tiers:
  - *Published* — organisational contexts (v0.1 stub: loads from a
    local folder seeded at install time or from a settings-
    configured path).
  - *Installed* — packages installed from a registry
    (v0.2+ fully functional; v0.1 can render the empty tier).
  - *Personal* — the user's own local contexts (stored in the user
    data directory).
- **Binding modes.**
  - *Reference* — CPM holds `{ id, version }`. Opening the CPM
    resolves the referenced context at load time. Updates to the
    source propagate.
  - *Copy* — CPM forks the context into its `domain-contexts/`
    folder, including origin metadata `{ sourceId, sourceVersion,
    forkedAt }`. Independent from source thereafter.
- **Applying a domain context.** Drag from library onto a CPM, or
  use a "Change domain context" action in the CPM property panel.
  Presents a binding-mode chooser with an explanation of the
  implications.
- **Replace-binding confirmation.** If the CPM already has a bound
  domain context, prompt the user ("This will replace the existing
  domain context. References in sentries to the previous vocabulary
  may become invalid.").
- **Fork action.** "Fork to personal" on any non-personal context
  creates a personal copy with origin metadata, opens it in the
  editor.
- **Create new from scratch.** "New domain context" button in the
  personal tier opens a blank context in the editor.
- **Editors (for copy-mode / personal contexts).**
  - *Vocabulary editor* — table of terms (name, description,
    synonyms, related terms).
  - *Schema editor* — JSON schema editor (Monaco JSON language)
    with "Add entity schema" / "Add value object schema" actions.
  - *Rule editor* — Monaco-based (with the ACMN expression grammar
    from epic_CASE_VARIABLES_AND_SENTRIES_06 or a rule-specific DSL
    — pick in ticket).
  - *Decision table editor* — table UI with input columns, output
    columns, and rule rows. Add/remove/reorder columns and rows.
- **Provenance display.** Detail view shows origin metadata for
  forked contexts ("Forked from Insurance Claims v3.2 on 2026-03-
  15") and package provenance for installed contexts.

### Out of Scope

- Publishing a personal context to an organisational registry.
  v0.2+ only.
- Installing packages from a remote registry. v0.1 can surface the
  tier; `installDomainContextPackage` throws "not yet implemented".
- Automatic sentry-rewrite when binding changes invalidate
  references. v0.1 surfaces errors; user edits manually.
- Versioning of personal contexts — only a single "current" version
  is tracked in v0.1.
- Decision table execution (runtime). Simulator supports simple
  table evaluation (via epic_TEST_MODE_AND_SIMULATOR_10), but rich
  execution semantics are the Execution Engine's job.
- Import/export of individual domain contexts as standalone files.
  Covered by epic_IMPORT_EXPORT_INTERCHANGE_09.

---

## 4. Functional Requirements

- **FR-090** — Render the domain context as a panel attached to the
  top edge of the case plan model boundary, showing domain name,
  version, binding mode icon, and summary counts.
- **FR-091** — Clicking the domain context panel opens a detail view
  for browsing vocabulary, schemas, rules, and decision tables.
- **FR-092** — For copy-mode domain contexts, the detail view allows
  inline editing of vocabulary terms, schemas, rules, and decision
  tables.
- **FR-093** — For reference-mode domain contexts, the detail view
  is read-only with a clear indicator.
- **FR-094** — Display a domain context library with three tiers:
  published (organisational), installed (from package registries),
  personal (user copies).
- **FR-095** — Allow the user to fork (copy) an existing domain
  context, creating an independent copy that records its origin for
  traceability.
- **FR-096** — Allow creating a new domain context from scratch,
  with editors for vocabulary, schemas, rules, and decision tables.
- **FR-097** — Support dragging a domain context from the library
  onto a case plan model to apply or replace its binding, with a
  confirmation dialog on replace.
- **FR-098** — Support binding mode selection (reference or copy)
  when a domain context is applied, with a clear explanation of
  the implications of each mode.
- **FR-099** — Display package provenance on the domain context
  panel for contexts installed from a registry.

---

## 5. Non-Functional Requirements

- **NFR-082** — Handle domain contexts containing up to 200
  vocabulary terms, 50 schemas, 30 rules, and 20 decision tables
  without performance degradation.
- **NFR-045** — Inline help tooltips on every editor field (term
  description, schema, rule condition, decision table inputs).

---

## 6. UI/UX Notes

- **Panel on canvas.** Rounded panel above the CPM's top edge.
  Domain name on left, version badge next to it, binding-mode icon
  on the right. Summary counts below as small chips ("32 terms,
  8 schemas, 12 rules, 4 tables"). Hover shows a tooltip with the
  full domain description. Click opens the detail view.
- **Detail view.** A full-screen overlay (or right-panel at maximum
  width) with a left nav listing Vocabulary / Schemas / Rules /
  Decision Tables, and the matching editor on the right. Header
  shows domain name, version, binding mode, origin. "Close" button
  top-right returns to the canvas. In reference mode, every editor
  shows a "Read-only — reference binding" banner.
- **Library screen.** Three-column tab/accordion layout — Published,
  Installed, Personal. Each entry shows name, version, short
  description, term/schema/rule/table counts. "Fork" and "Apply"
  actions on every entry (Apply disabled for Published / Installed
  if no CPM is open).
- **Binding mode chooser.** Modal with two radio cards side-by-side:
  - "Reference (recommended)" — "You'll inherit updates to the
    source domain context automatically. You can't edit the
    context from this case."
  - "Copy (advanced)" — "A private copy is saved in this project.
    You can edit it freely. You won't receive updates."
- **Fork action on a non-personal context.** "Fork to Personal"
  button — creates a copy in the personal tier with origin
  metadata.
- **Provenance badge.** Small icon on the canvas panel indicating
  "Installed from org-registry" or "Forked from ..." with a hover
  tooltip showing full origin details.

---

## 7. Data Model Impact

- **Domain context file** (`*.domain.json`) schema per Architecture.md
  §5.4 and the ACMN Standard §9:
  ```json
  {
    "schemaVersion": "1",
    "id": "dc_01HQ...",
    "name": "Insurance Claims",
    "version": "3.2.0",
    "description": "...",
    "vocabulary": [ { "term", "description", "synonyms"? } ],
    "entitySchemas": [ { "name", "jsonSchema" } ],
    "valueObjectSchemas": [ { "name", "jsonSchema" } ],
    "rules": [ { "id", "name", "condition", "action", "description"? } ],
    "decisionTables": [
      {
        "id", "name",
        "inputs": [ { "name", "type" } ],
        "outputs": [ { "name", "type" } ],
        "rows": [ { "inputs": [...], "outputs": [...] } ]
      }
    ],
    "origin": {
      "sourceId"?: "...",
      "sourceVersion"?: "...",
      "forkedAt"?: "..."
    },
    "provenance": {
      "packageId"?: "...",
      "packageVersion"?: "..."
    }
  }
  ```
- **CPM schema** — already declares `domainContextBinding:
  { id, version, mode: "reference" | "copy" }` as established by
  epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01. This epic makes it
  live.
- **Personal library location** — OS-standard user data directory,
  e.g. `%APPDATA%\ACMN Designer\domain-contexts-personal\`.
- **Published library location** — local folder configurable via
  settings (default: `%APPDATA%\ACMN Designer\domain-contexts-
  published\`). v0.1 treats this as a plain folder the user or
  their org seeds manually.

---

## 8. Integration Impact

- **LocalBackend extension.** New methods implemented:
  `listDomainContextLibrary`, `getDomainContext`,
  `createDomainContext`, `forkDomainContext`, `saveDomainContext`.
  `publishDomainContext` and `installDomainContextPackage` throw
  "not yet implemented" (v0.2+).
- **IPC additions.** `domainContext:list`, `domainContext:get`,
  `domainContext:create`, `domainContext:fork`, `domainContext:save`.
- **Renderer state.** New `domainContextStore` (Zustand) for the
  library cache and the currently-opened context in the detail
  view.
- **Property panel.** Upgrade the read-only domain-context panel
  from epic_PROPERTY_PANEL_05: in copy mode, editors become writable;
  in reference mode, they remain read-only with a banner.
- **Project tree sidebar.** The "Domain Contexts" section (already
  present from epic_CANVAS_INTERACTION_03) now has click handlers that
  open the detail view.
- **Monaco JSON language.** Already imported for schemas — reused
  here for entity + value object schema editing.

---

## 9. Acceptance Criteria

- [ ] A CPM bound to a domain context shows the domain panel on the
  canvas with name, version, binding icon, and summary counts.
- [ ] Clicking the panel opens the detail view with four tabs.
- [ ] In reference mode, all editors are read-only and a banner
  says so.
- [ ] In copy mode, all editors allow inline editing; changes save
  to the CPM project's `domain-contexts/<name>.domain.json`.
- [ ] The library screen lists all three tiers. Empty-state rendered
  for tiers with no contexts.
- [ ] Published-tier contexts loaded from the configured published
  folder appear in the library.
- [ ] Dragging a context from the library onto a CPM (or clicking
  "Apply") shows the binding-mode chooser, and on confirmation the
  CPM's binding updates.
- [ ] Replacing a bound context shows a warning and, on confirm,
  updates the binding. Sentry expressions that now reference
  missing vocabulary surface errors via
  epic_CASE_VARIABLES_AND_SENTRIES_06's validator.
- [ ] "Fork to Personal" on a non-personal context creates a
  personal copy with `origin.sourceId` / `origin.sourceVersion` /
  `origin.forkedAt` populated, and opens the copy in the editor.
- [ ] "New domain context" creates a blank personal context and
  opens the editor.
- [ ] Vocabulary, schema, rule, and decision-table editors CRUD
  their data types correctly and round-trip through save/reopen.
- [ ] Package provenance badge and hover tooltip render on installed
  contexts (synthetic data acceptable — real install is v0.2+).
- [ ] 200 terms, 50 schemas, 30 rules, and 20 decision tables in
  one context render without user-visible lag (NFR-082).

---

## 10. Risks & Unknowns

- **Rule DSL vs expression grammar.** Rules may need a richer DSL
  than sentries. Options: (a) reuse the ACMN expression grammar
  from epic_CASE_VARIABLES_AND_SENTRIES_06 (simpler); (b) introduce a
  domain-specific rule DSL (richer but more work). Recommendation
  for v0.1: reuse the expression grammar and document the
  limitations.
- **Library lookup performance.** Scanning a folder full of
  `.domain.json` files on every library open is cheap for small
  libraries but may need caching. Start simple; profile before
  optimising.
- **Reference-binding version drift.** If the source domain context
  is edited after a CPM references it, the CPM can become invalid.
  v0.1 surfaces errors on open; does not attempt auto-migration.
- **Decision table UX for large tables.** At 20 tables × many rows
  per table, the table UI must be usable. Virtualised rendering
  may be needed for big tables.
- **Open question — where is the "published" folder?** For v0.1 the
  user configures the path. For v0.2+ it's a server endpoint. The
  UX should abstract over this so the user just sees "Published".

---

## 11. Dependencies

- **Upstream:**
  - epic_SPIKE1_FOUNDATION_00 (static domain badge — replaced here).
  - epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01 (domain-contexts
    folder structure; baseline contract stubs).
  - epic_AUTOSAVE_AND_RECOVERY_02 (atomic writes + migration harness
    for `.domain.json`).
  - epic_CANVAS_INTERACTION_03 (sidebar entries; command model for
    undoable context edits).
  - epic_PROPERTY_PANEL_05 (domain context panel scaffolding).
  - epic_CASE_VARIABLES_AND_SENTRIES_06 (expression grammar reused in
    rules).
- **Downstream:**
  - epic_TEST_MODE_AND_SIMULATOR_10 loads domain context at run-time
    and exposes vocabulary + decision tables to the simulator.
  - epic_PUBLISH_MODE_AND_PACKAGING_11 bundles the bound context into
    the `.acmn` package (for copy and reference modes, the
    resolved context is included).
  - epic_IMPORT_EXPORT_INTERCHANGE_09 imports / exports single
    `.domain.json` files.

---

## 12. References

- **prd:** `docs/Product Requirements Document/PRD.md` (§6.6 domain
  context)
- **architecture:** `docs/Architecture/Architecture.md` (§3
  `domainContext/` feature module, §4 contract methods, §5.4 file
  format)
- **acmn standard:** `docs/References/ACMN-Standard-v1.0.11.md`
  (§9 domain context schema)
- **functional requirements:** `docs/Functional Requirements/FunctionalRequirements.md`
- **non-functional requirements:** `docs/Non-Functional Requirements/NonFunctionalRequirements.md`
- **mockups:** `docs/Mockups/02-canvas-editing.png` (domain panel
  visual reference)

---

## 13. Implementation Notes

**Complexity:** L

**Suggested ticket breakdown (7 tickets):**

1. **DOM-01** — Domain context file schema + Zod validation +
   `.domain.json` atomic read/write. LocalBackend
   `listDomainContextLibrary`, `getDomainContext`, `createDomainContext`,
   `saveDomainContext`, `forkDomainContext`. IPC exposure via
   `window.acmn.domainContext.*`.
2. **DOM-02** — Canvas domain panel overlay upgrade: dynamic data
   from the bound context, summary counts, binding-mode icon,
   provenance badge.
3. **DOM-03** — Library screen: three-tier UI, seeded published-
   folder scanning, personal-folder scanning, Apply + Fork
   actions.
4. **DOM-04** — Binding-mode chooser modal; replace-binding
   confirmation; drag-from-library-onto-CPM action.
5. **DOM-05** — Detail view shell with four tabs (Vocabulary /
   Schemas / Rules / Decision Tables) + mode-aware read-only
   banner.
6. **DOM-06** — Vocabulary editor and schema editor (JSON Monaco).
7. **DOM-07** — Rule editor (expression grammar) and decision-
   table editor (table UI with virtualisation).

**Scaffolding files touched:**

- `src-main/backend/localBackend.ts` — domain context methods.
- `src-main/ipc/domainContext.ts` — new file with all IPC handlers.
- `src-main/preload.ts` — expose `window.acmn.domainContext.*`.
- `src-renderer/contracts/backend.ts` — already covers the
  methods; no new interface surface.
- `src-renderer/state/domainContextStore.ts` — new.
- `src-renderer/features/domainContext/*` — library screen,
  detail view, all editors.
- `src-renderer/features/propertyPanel/DomainContextProperties.tsx`
  — upgrade from read-only summary to live navigator.

**Chain constraint:** DOM-01 first. DOM-02/03/04 can overlap.
DOM-05 depends on DOM-01 + DOM-02. DOM-06 and DOM-07 depend on
DOM-05.

**Estimated total effort:** 5 days.
