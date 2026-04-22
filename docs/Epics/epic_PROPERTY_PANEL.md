# Epic: PROPERTY_PANEL

**Status:** NEW
**Owner:** human
**Created:** 2026-04-21
**Last Updated:** 2026-04-21

---

## 1. Purpose

The canvas tells users what's in the model; the property panel tells
them what each element *does*. Without a property panel, the Designer
is a visualiser, not an editor.

This epic builds the right-side context-aware property panel covering
every ACMN element type the Designer supports. It delivers the
tabbed agent configuration (Identity / Model / Tools / Context /
Strategy / Confidence / Ports / Lifecycle / State) and the simpler
flat property editors for tools, guardrails, evaluators, connectors,
stages, milestones, and human tasks. Real-time Zod-backed validation
surfaces errors inline so users catch mistakes before publish.

---

## 2. User Story

As a **solution architect**,
I want a right-side panel that lets me configure every detail of the
element I've selected — without leaving the canvas,
So that I can tune an agent's persona, pick its model, choose its
reasoning strategy, and validate my changes as I type.

As a **technical business analyst**,
I want to make small targeted edits to existing elements (a persona
tweak, a sentry expression, a variable name),
So that I can keep a case plan model current without having to
redesign it.

---

## 3. Scope

### In Scope

- Right-side property panel shell, always present in Design mode,
  collapsible via a chevron to reclaim canvas space.
- Panel content is context-aware: changes as the canvas selection
  changes. With no selection, panel shows CPM-level properties
  (name, version, description, starter domain binding).
- Per-element-type editors:
  - **Agent node** — tabbed interface with 9 tabs:
    - *Identity* — name, persona (Monaco multi-line editor), role,
      owner.
    - *Model* — model selection dropdown, temperature slider, max
      tokens integer input.
    - *Tools* — list of tool nodes wired to this agent with
      enable/disable checkboxes and per-tool invocation policy
      (auto / confirm_first / supervised).
    - *Context* — readable case file items (multi-select),
      writable items (multi-select), thread visibility (enum),
      context scope (enum).
    - *Strategy* — reasoning strategy (react / plan_execute /
      reflect / debate), max turns (integer), budget (currency).
    - *Confidence* — confidence model parameters (compound editor
      specific to the chosen model).
    - *Ports* — named input and output ports with types and
      schemas (add / remove / rename / retype).
    - *Lifecycle* — entry sentry, exit sentry (expression editor
      handles), plan item decorators (checkboxes).
    - *State* — turn retention (enum / integer) and promotion rules
      (list of rule entries).
  - **Tool node** — tool ID, name, description, input schema
    (Monaco JSON editor), output schema, invocation policy.
  - **Guardrail node** — guardrail type (enum), rule definition or
    prompt (Monaco), violation action (enum), port configuration
    (the two outputs labelled pass / fail).
  - **Evaluation node** — evaluator type, criteria list with per-
    criterion weight and threshold, max retries, on_exhausted policy,
    port configuration.
  - **Connector node** — connector type (email / webhook / file
    watch / schedule / database / event / API), type-specific
    connection configuration, filter rules, field mapping, target
    CPM, daily signal limit, active toggle.
  - **Stage** — stage name, cognitive mode (gather / analyse /
    draft / review / decide), entry/exit sentries, decorator
    configuration.
  - **Milestone** — name, criteria type (expression / manual /
    event), criteria expression, revocation condition.
  - **Human task** — task name, assignee or role, referenced case
    variables for form generation, conditional visibility rules,
    decorator configuration.
  - **Domain context panel** — name, version, binding mode
    (reference / copy) with a "Change..." action that opens the
    library picker, browsable read-only summary views of
    vocabulary / schemas / rules / decision tables. Full editing
    moves to epic_DOMAIN_CONTEXT.
  - **Wire** — delegated to epic_WIRE_MANAGEMENT's
    `WireProperties.tsx` panel.
  - **Case plan model** — case name, version label, description,
    domain context binding, case variables button (opens editor
    from epic_CASE_VARIABLES_AND_SENTRIES).
- Real-time validation: every field is schema-validated via Zod as
  the user types. Invalid fields show an inline error with a one-
  sentence explanation.
- Inline help tooltips for every field (NFR-045).
- Debounced commit to `canvasStore` (500 ms after last keystroke) so
  undo/redo gets one entry per "edit", not per keystroke. Coalesces
  with the command model from epic_CANVAS_INTERACTION.
- Panel width adjustable by a drag handle. Width persists across
  sessions in user settings.

### Out of Scope

- Case variables editor — lives in epic_CASE_VARIABLES_AND_SENTRIES
  and is launched from the CPM property panel.
- Sentry expression editor — lives in epic_CASE_VARIABLES_AND_SENTRIES
  (with Monaco-based syntax highlighting + autocomplete) and is
  embedded here as a reusable component.
- Full domain context editing (vocabulary / schemas / rules /
  decision tables). The property panel surfaces a read-only summary;
  inline editing lives in epic_DOMAIN_CONTEXT.
- Real-time validation *rules* that span multiple elements (pre-
  flight validation). Those are in
  epic_PUBLISH_MODE_AND_PACKAGING's pre-flight checks.
- Multi-element selection editing — with a multi-selection in the
  canvas, the panel shows a count and a "select a single element to
  edit" hint. Bulk property editing is not in v0.1.
- Extensibility / custom property types. All forms are closed-set
  in v0.1.

---

## 4. Functional Requirements

- **FR-040** — Display a right-side property panel showing the
  configuration of the currently selected element.
- **FR-041** — For an agent node, show tabs for Identity, Model,
  Tools, Context, Strategy, Confidence, Ports, Lifecycle, State.
- **FR-042** — Identity tab for agent nodes allows configuration of
  name, persona, role, and owner.
- **FR-043** — Model tab allows configuration of model selection,
  temperature, and max tokens.
- **FR-044** — Tools tab displays all tool nodes wired to the agent
  with enable/disable checkboxes and per-tool invocation policy
  (auto, confirm_first, supervised).
- **FR-045** — Context tab allows configuration of readable case
  file items, writable case file items, thread visibility, and
  context scope.
- **FR-046** — Strategy tab allows configuration of reasoning
  strategy (react, plan_execute, reflect, debate), max turns, and
  budget.
- **FR-047** — Confidence tab allows configuration of the confidence
  model parameters.
- **FR-048** — Ports tab allows configuration of named input and
  output ports with types and schemas.
- **FR-049** — Lifecycle tab allows configuration of entry and exit
  sentries, and plan item decorators.
- **FR-050** — State tab allows configuration of turn retention and
  promotion rules.
- **FR-051** — For a tool node, property panel displays tool ID,
  name, description, input schema, output schema, and invocation
  policy.
- **FR-052** — For a guardrail node, property panel displays
  guardrail type, rule definition or prompt, violation action, and
  port configuration.
- **FR-053** — For an evaluation node, property panel displays
  evaluator type, criteria list with weights and thresholds, max
  retries, on_exhausted policy, and port configuration.
- **FR-054** — For a connector node, property panel displays
  connector type, connection configuration (type-specific), filter
  rules, field mapping, target case plan model, daily signal limit,
  and active toggle.
- **FR-055** — For a stage, property panel displays stage name,
  cognitive mode, entry/exit sentries, and decorator configuration.
- **FR-056** — For a milestone, property panel displays milestone
  name, criteria type, criteria expression, and revocation
  condition.
- **FR-057** — For a human task, property panel displays task name,
  assignee/role, referenced case variables for form generation,
  conditional visibility rules, and decorator configuration.
- **FR-058** — For the domain context panel, property panel displays
  domain name, version, binding mode, and browsable views of
  vocabulary, schemas, rules, and decision tables (read-only
  summary here; editing in epic_DOMAIN_CONTEXT).
- **FR-059** — Validate all inputs in real time and show inline
  errors for invalid configurations.
- **FR-060** — Support closing (collapsing) the property panel to
  give the canvas more space.

---

## 5. Non-Functional Requirements

- **NFR-006** — Respond to property panel input with under 50 ms
  latency (keystroke to rendered validation result).
- **NFR-045** — Provide inline help tooltips for all property panel
  fields, explaining the purpose and expected format.
- **NFR-041** — Meet WCAG 2.1 Level AA for the property panel,
  including keyboard navigation across tabs and form fields.

---

## 6. UI/UX Notes

- **Panel shell.** Right side, fixed width by default (400 px), with
  a drag handle on the left edge to resize. Chevron button at the
  top collapses to a 32 px rail showing only the chevron (to re-
  expand).
- **Header.** Shows the selected element's icon and name with an
  inline editable name field. Below, a badge shows the element
  type.
- **Tabs (agent node only).** Horizontal segmented control along the
  top of the form body. Active tab highlighted. Overflow behaviour:
  horizontal scroll if panel is narrower than all 9 tabs at once
  (rare; fits at default width).
- **Form layout.** Label above field, help tooltip (ⓘ icon) next to
  the label. Validation errors render in red beneath the field with
  a one-sentence message.
- **Monaco editors.** Used for persona, schemas, sentry/rule
  expressions. Height auto-fits (min 4 lines, max 12) with an
  "Expand" button opening a modal for heavier editing.
- **Empty state.** With nothing selected, show CPM-level properties
  as described above. Never blank.
- **Multi-selection state.** "3 elements selected. Select a single
  element to edit properties."
- **Mockup reference.** `docs/Mockups/03-property-panel.png`.

---

## 7. Data Model Impact

- **No new disk schema.** This epic surfaces fields already declared
  in the CPM / element schemas established by
  epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE and extended by
  epic_WIRE_MANAGEMENT.
- **Zod schemas.** One Zod schema per element type in
  `src-renderer/lib/validation.ts`. These become the canonical shape
  for each element type and are re-used by preflight (epic 10) and
  import validation (epic 11).
- **User setting.** `propertyPanelWidth` stored in the user settings
  file (epic_APP_CHROME_AND_SETTINGS surfaces the settings dialog;
  this epic just writes/reads the key).

---

## 8. Integration Impact

- **Routing layer.** `PropertyPanel.tsx` is a router that picks the
  right editor based on selection. New file:
  `src-renderer/features/propertyPanel/PropertyPanel.tsx`.
- **One editor component per element type** under
  `src-renderer/features/propertyPanel/`.
- **Zod + React Hook Form.** Introduce (if not already present)
  `react-hook-form` and `@hookform/resolvers/zod`. These may be
  introduced now or pre-introduced by this epic.
- **Monaco Editor.** Introduce `@monaco-editor/react`. Lazy-loaded
  to keep initial bundle small.
- **Command model.** Property edits push an `UpdateElementCommand`
  (with a 500 ms debounce) to the undo/redo stack from
  epic_CANVAS_INTERACTION.
- **No IPC changes.**

---

## 9. Acceptance Criteria

- [ ] Selecting any element on the canvas opens the correct property
  editor in the right panel.
- [ ] Selecting an agent node shows nine tabs (Identity, Model,
  Tools, Context, Strategy, Confidence, Ports, Lifecycle, State)
  with the listed fields in each.
- [ ] Every field has an inline help tooltip.
- [ ] Typing an invalid value (e.g., negative max tokens, duplicate
  port name) shows an inline error within 50 ms.
- [ ] Changes commit to the canvas within 500 ms of the last
  keystroke and produce exactly one undo-stack entry per
  "edit session".
- [ ] Pressing Ctrl+Z after editing a field reverts the change; the
  property panel updates to reflect the reverted value.
- [ ] Collapsing the panel via the chevron shows only a 32 px rail
  and gives the canvas the reclaimed width. Re-expanding restores
  the prior width.
- [ ] Panel width is preserved across app restarts.
- [ ] With no canvas selection, the panel shows CPM-level
  properties. With a multi-selection, the panel shows the
  count + hint message.
- [ ] Keyboard navigation works — Tab moves across form fields, the
  segmented tabs are navigable with left/right arrow keys when
  focused.
- [ ] Property-panel interaction meets WCAG AA colour-contrast
  checks.

---

## 10. Risks & Unknowns

- **Breadth over depth.** 12+ editors are a lot of forms. Scope must
  favour "every element has something" over "every element has a
  perfect UX". Ticket sizing keeps complex per-element UX (e.g., the
  Confidence tab's compound editor) small and revisitable.
- **Monaco bundle size.** Monaco is ~2 MB. Lazy-load via dynamic
  import on first use, and document that first-edit of an
  expression has a small load delay.
- **Confidence model parameters.** The exact parameters are model-
  specific and still evolving in the ACMN standard. Reserve a
  flexible key/value form in v0.1; tighten later.
- **Port editor on agent nodes.** Adding/removing ports has
  cascading effects on existing wires. Delete wires whose port no
  longer exists; confirm in a dialog before removing a port that
  has connected wires.
- **Real-time validation performance.** At 50 ms latency the
  validation must be efficient — Zod is fast, but combined with
  debounced updates and React Hook Form overhead, watch the render
  path carefully.
- **Open question — panel-to-canvas highlighting.** Should focusing
  a wired-tool row in the Tools tab highlight the tool on the
  canvas? Proposed yes (subtle pulse). Confirm in ticket.

---

## 11. Dependencies

- **Upstream:**
  - epic_SPIKE1_FOUNDATION (element rendering; selection model).
  - epic_CANVAS_INTERACTION (command model for undoable edits).
  - epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE (CPM data in place).
- **Downstream:**
  - epic_CASE_VARIABLES_AND_SENTRIES supplies the sentry expression
    editor and the case variables editor (launched from here).
  - epic_DOMAIN_CONTEXT upgrades the read-only summary views to
    fully editable in copy mode.
  - epic_WIRE_MANAGEMENT supplies the wire properties editor.
  - epic_TEST_MODE_AND_SIMULATOR's state overlays read the same
    element schemas this epic validates.
  - epic_PUBLISH_MODE_AND_PACKAGING reuses the Zod schemas for
    pre-flight.

---

## 12. References

- **prd:** `docs/Product Requirements Document/PRD.md` (§6.4
  property panel)
- **architecture:** `docs/Architecture/Architecture.md` (§3 property
  panel modules, §8 validation)
- **functional requirements:** `docs/Functional Requirements/FunctionalRequirements.md`
- **non-functional requirements:** `docs/Non-Functional Requirements/NonFunctionalRequirements.md`
- **mockups:** `docs/Mockups/03-property-panel.png`,
  `02-canvas-editing.png`

---

## 13. Implementation Notes

**Complexity:** L

**Suggested ticket breakdown (8 tickets):**

1. **PRP-01** — Panel shell, routing by selection, collapsible with
   persisted width. Empty-state (CPM properties) + multi-select
   hint. Register `react-hook-form` + `zod` if not already.
2. **PRP-02** — Agent node property panel: nine tabs with the
   fields in FR-042..FR-050. Uses Monaco for persona + sentry
   fields.
3. **PRP-03** — Tool, guardrail, evaluator property panels (three
   related compact editors).
4. **PRP-04** — Connector property panel with type-specific
   connection sub-forms for all 7 built-in connector types.
5. **PRP-05** — Stage, milestone, human task property panels.
6. **PRP-06** — Domain context panel (read-only summary browse of
   vocabulary / schemas / rules / decision tables). Editing
   deferred to epic_DOMAIN_CONTEXT.
7. **PRP-07** — Real-time Zod validation with inline errors.
   50 ms latency budget measurement. Debounced commit (500 ms) to
   canvasStore as an `UpdateElementCommand`.
8. **PRP-08** — Help tooltip system (ⓘ icon with hover/focus
   tooltip) applied to every field. Accessibility pass on
   keyboard nav and WCAG AA contrast.

**Scaffolding files touched:**

- `src-renderer/features/propertyPanel/PropertyPanel.tsx` — new
  router.
- One new file per element editor under
  `src-renderer/features/propertyPanel/*Properties.tsx`.
- `src-renderer/lib/validation.ts` — one Zod schema per element
  type.
- `src-renderer/state/canvasStore.ts` — new
  `UpdateElementCommand` plus a debounce wrapper for property
  edits.

**Chain constraint:** PRP-01 must land first; PRP-02..PRP-06 can
overlap (different files); PRP-07 touches every editor and should
land after at least two editors exist; PRP-08 is cross-cutting
polish.

**Estimated total effort:** 5–6 days.
