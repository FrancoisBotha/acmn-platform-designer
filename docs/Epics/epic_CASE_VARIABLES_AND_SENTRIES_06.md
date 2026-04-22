# Epic: CASE_VARIABLES_AND_SENTRIES

**Status:** TICKETS
**Owner:** human
**Created:** 2026-04-21
**Last Updated:** 2026-04-22

---

## 1. Purpose

ACMN is a case-oriented standard, and cases need state. This epic
delivers the two closely-related primitives that let the Designer
express that state: **case variables** (the typed values a case
carries through its life) and **sentry expressions** (the guard
conditions that reference those variables to control stage and plan-
item lifecycle).

Without case variables, human tasks have no form fields and agents
have no shared memory. Without sentry expressions, stages and plan
items have no entry or exit semantics. These two editors together
unlock the real expressive power of the Designer.

---

## 2. User Story

As a **solution architect**,
I want to define the typed variables my case carries (claim amount,
incident date, customer tier) and use them in sentry expressions
that gate stage transitions,
So that the case plan model expresses real business logic, not just a
visual flow.

As a **technical business analyst**,
I want a sentry expression editor with autocomplete for variable
names and operators,
So that I can tweak the gating logic without remembering exact
variable names or expression syntax.

---

## 3. Scope

### In Scope

- **Case variables editor.**
  - Launched from the CPM property panel as a modal dialog (or a
    dedicated tab in the CPM properties panel — pick in ticket).
  - Table of variables with columns: name, type, default value,
    required, label, readOnly, enum values (for enum type).
  - CRUD operations: add, edit, delete, re-order.
  - The eight ACMN variable types: `string`, `integer`, `float`,
    `boolean`, `date`, `datetime`, `enum`, `currency`.
  - Uniqueness enforcement on variable names within a CPM (duplicate
    names rejected inline).
  - Type-appropriate default value inputs (e.g., date picker for
    `date`, enum values textarea for `enum`, currency symbol picker
    for `currency`).
  - All edits funnel through the command model from
    epic_CANVAS_INTERACTION_03 for undoable operations.
- **Sentry expression editor** (reusable component, not a standalone
  screen).
  - Monaco-backed single-line and multi-line modes.
  - Syntax highlighting for the ACMN expression grammar (variables
    in one colour, operators in another, literals in a third).
  - Autocomplete for:
    - Case variable names (from the current CPM).
    - Operators (`==`, `!=`, `<`, `<=`, `>`, `>=`, `&&`, `||`,
      `!`, `+`, `-`, `*`, `/`, `contains`, `in`, etc. — full list
      from ACMN standard).
    - Functions (`now()`, `today()`, `age()`, etc.).
  - Parse + validate: shows inline error squiggles when the
    expression is syntactically invalid or references undefined
    variables.
  - Embedded in the property panel wherever a sentry expression is
    required:
    - Stage entry/exit sentries (epic_PROPERTY_PANEL_05).
    - Plan item entry/exit sentries (epic_PROPERTY_PANEL_05).
    - Milestone criteria (epic_PROPERTY_PANEL_05).
    - Milestone revocation condition.
    - Human task conditional visibility rules.
    - Wire transform expressions (epic_WIRE_MANAGEMENT_04).
- **Variable references surface** in the human task property panel.
  When a human task is selected, its property panel exposes a "Form
  fields" section listing case variables that can be bound to form
  inputs. Adding a variable reference is a pick-from-list operation,
  not free-form typing.
- **ACMN expression grammar definition** — a single source of truth
  in `src-renderer/lib/expressionGrammar.ts` that the expression
  editor, validator, and test-mode simulator (epic 9) all read.

### Out of Scope

- Evaluating expressions at runtime. Evaluation happens in the test
  simulator (epic_TEST_MODE_AND_SIMULATOR_10) and the future Execution
  Engine. This epic delivers the grammar definition and the editor;
  evaluation is elsewhere.
- Complex form-builder UI for human tasks (layout, conditional
  sections beyond simple visibility rules). v0.1 delivers a basic
  list-of-fields mapping; richer form builders are v0.2+.
- Expression type-inference with full static type checking (e.g.,
  flagging `"hello" + 5`). v0.1 does syntactic validation and
  reference checking only.
- Case variable scopes beyond CPM-level. All variables are CPM-scoped
  in v0.1.
- Computed (derived) variables.
- Imported variable bundles / shared libraries.

---

## 4. Functional Requirements

- **FR-070** — Provide a case variables editor accessible from the
  case plan model properties.
- **FR-071** — The case variables editor allows creating, editing,
  and deleting variables with name, type, default value, required
  flag, label, readOnly flag, and enum values.
- **FR-072** — Support the eight variable types defined in the ACMN
  standard: string, integer, float, boolean, date, datetime, enum,
  currency.
- **FR-073** — Validate variable names for uniqueness within the
  case plan model and reject duplicates.
- **FR-074** — Display available case variables in the property
  panel when a human task is selected, allowing variables to be
  referenced for form generation.
- **FR-075** — Provide a sentry expression editor with syntax
  highlighting and autocomplete for case variable names and
  operators.

---

## 5. Non-Functional Requirements

- **NFR-006** — Respond to property panel input (including the
  expression editor) with under 50 ms latency from keystroke to
  rendered validation result.
- **NFR-045** — Inline help tooltips on every variable-editor field
  and on the expression editor itself ("Use variable names from
  your case, plus operators like == and >.").

---

## 6. UI/UX Notes

- **Variables editor** — modal dialog titled "Case Variables",
  width ~ 800 px, table layout:
  - Columns: Name, Type, Default, Required, Label, Read only, Enum
    values (visible only for rows where Type = enum), Actions
    (pencil / trash).
  - "+ Add variable" button below the table.
  - Row-level validation: duplicate name highlights the row red
    with an inline error.
  - Footer: "Cancel" and "Save" buttons. "Save" is disabled while
    any row is invalid.
- **Sentry expression editor** — Monaco editor embedded inline in
  the property panel. Height auto-fits (1 line by default, expands
  as the user types line breaks for multi-line rules).
  - Autocomplete popup shows variable names at the top (prefixed
    with a small icon indicating type), then operators, then
    functions.
  - Error squiggle under unresolved variable names or syntax
    errors; hover shows the error message.
  - "Open in modal" button (expand icon) opens a larger Monaco
    editor in a modal for complex expressions.
- **Human task variable references** — a "Form fields" section in
  the human task property panel shows a list of referenced
  variables. Each entry: variable name (dropdown picker), label
  override (optional), display order. "+ Add field" appends a new
  reference.

---

## 7. Data Model Impact

- **CPM JSON schema — variables section.**
  ```json
  "variables": [
    {
      "name": "claimAmount",
      "type": "currency",
      "default": { "currency": "AUD", "amount": 0 },
      "required": true,
      "label": "Claim amount",
      "readOnly": false
    },
    {
      "name": "claimTier",
      "type": "enum",
      "default": "standard",
      "required": true,
      "label": "Claim tier",
      "readOnly": false,
      "enumValues": ["standard", "premium", "urgent"]
    }
  ]
  ```
- **CPM schema version bump** if needed (migration via
  epic_AUTOSAVE_AND_RECOVERY_02's harness).
- **No new files.** Everything lives in the existing `.cpm.json`.
- **Expression grammar** is code, not data, but is versioned with
  the application and surfaced to the user via documentation in
  epic_APP_CHROME_AND_SETTINGS_08's help menu.

---

## 8. Integration Impact

- **Reusable component**
  `src-renderer/features/propertyPanel/SentryExpressionEditor.tsx`
  consumed by:
  - Stage property panel
  - Plan item property panels
  - Milestone property panel
  - Human task property panel
  - Wire property panel
- **Reusable component** `src-renderer/features/caseVariables/
  CaseVariablesEditor.tsx` mounted as a modal.
- **Expression grammar module**
  `src-renderer/lib/expressionGrammar.ts` — tokens, keywords,
  functions, parse, validate-against-variables.
- **Zod schema extension.** CPM-level Zod schema gains a `variables`
  array; element-level schemas that reference variables (human
  task form fields, sentries) reference the variables array for
  validation.
- **Monaco language registration.** A custom Monaco language named
  `acmn-expr` is registered on first editor use.

---

## 9. Acceptance Criteria

- [ ] A "Case variables" button in the CPM property panel opens
  the variables editor modal.
- [ ] The variables editor supports creating all eight ACMN variable
  types, each with an appropriate default-value input.
- [ ] Attempting to create a second variable with an existing name
  shows an inline error and disables Save.
- [ ] Deleting a variable that is referenced by a sentry or human
  task surfaces a warning ("Used in N places") but allows deletion;
  downstream references become invalid and show errors.
- [ ] Editing a variable's type triggers a confirmation ("This may
  invalidate sentry expressions") if the variable is already
  referenced.
- [ ] The sentry expression editor provides autocomplete for
  variables and operators within 50 ms.
- [ ] Syntax errors and unresolved variable references render as
  inline error squiggles with hover tooltips explaining the error.
- [ ] Valid expressions persist into the relevant JSON fields of
  the CPM file on save.
- [ ] Opening a saved project restores variables and sentry
  expressions exactly as written.
- [ ] Human task property panel shows a "Form fields" section
  listing referenced case variables. Adding/removing a reference
  produces exactly one undoable command.
- [ ] Every change in the variables editor is undoable via Ctrl+Z.

---

## 10. Risks & Unknowns

- **Expression grammar completeness.** The ACMN v1.0.11 spec gives
  the basics; the Designer may surface gaps. Plan: start with a
  minimal grammar covering the common cases the mockups exercise,
  and extend as gaps are found. Document the grammar next to the
  code.
- **Autocomplete performance.** Monaco + a custom language + live
  variable resolution must not slow typing. Profile against the
  50 ms latency NFR; fall back to simpler tokenisation if needed.
- **Variable-rename refactoring.** If a user renames `claimAmount`
  to `claim_amount`, every referencing sentry and human task field
  should update. v0.1 surfaces a "Find references" dialog on
  rename, requiring the user to confirm. Full auto-rename is v0.2+.
- **Type changes breaking expressions.** Changing a variable from
  `string` to `integer` may silently break expressions. v0.1
  warns but doesn't block.
- **Open question — should sentry expressions support case-file
  references** (not just case variables)? Per ACMN standard yes,
  but v0.1 scope is case variables only. Revisit in v0.2.
- **Currency default value UX.** ACMN allows a currency code
  (ISO 4217) and an amount. Provide a sensible default (user's
  locale) but let them pick.

---

## 11. Dependencies

- **Upstream:**
  - epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01 (CPM file on disk).
  - epic_CANVAS_INTERACTION_03 (command model for undoable variable
    edits).
  - epic_PROPERTY_PANEL_05 (right panel in which sentry editor is
    embedded; CPM property panel hosts the "Case variables"
    button).
- **Downstream:**
  - epic_WIRE_MANAGEMENT_04 embeds the sentry expression editor for
    the wire `transform` field.
  - epic_DOMAIN_CONTEXT_07 rules may reuse the grammar (TBD — rules
    may have their own DSL).
  - epic_TEST_MODE_AND_SIMULATOR_10 evaluates expressions at runtime
    in the simulator.
  - epic_PUBLISH_MODE_AND_PACKAGING_11's pre-flight validates all
    sentry expressions reference existing variables.

---

## 12. References

- **prd:** `docs/Product Requirements Document/PRD.md` (§6.4 case
  variable editor, §6.5 sentry properties)
- **architecture:** `docs/Architecture/Architecture.md` (§3
  caseVariables feature module, §1 Monaco Editor in the stack)
- **acmn standard:** `docs/References/ACMN-Standard-v1.0.11.md`
  (case variables, sentry expressions, operators)
- **functional requirements:** `docs/Functional Requirements/FunctionalRequirements.md`
- **non-functional requirements:** `docs/Non-Functional Requirements/NonFunctionalRequirements.md`

---

## 13. Implementation Notes

**Complexity:** M

**Suggested ticket breakdown (5 tickets):**

1. **CVS-01** — CPM schema extension: `variables[]` array with Zod
   validation. Migration from prior version (via
   epic_AUTOSAVE_AND_RECOVERY_02's harness).
2. **CVS-02** — Variables editor modal: table UI, 8 type inputs,
   uniqueness validation, delete-with-reference-warning, undoable
   commands.
3. **CVS-03** — Expression grammar module
   (`src-renderer/lib/expressionGrammar.ts`): tokens, operators,
   functions, parse + validate against a variables list.
4. **CVS-04** — Monaco `acmn-expr` language registration + the
   reusable `SentryExpressionEditor` component. Autocomplete
   provider for variables / operators / functions. Inline error
   rendering.
5. **CVS-05** — Human task property panel "Form fields" section:
   referenced variables picker, label override, order.

**Scaffolding files touched:**

- `src-renderer/lib/validation.ts` — CPM Zod schema gets
  `variables`.
- `src-renderer/lib/expressionGrammar.ts` — new.
- `src-renderer/features/caseVariables/CaseVariablesEditor.tsx` —
  new.
- `src-renderer/features/propertyPanel/SentryExpressionEditor.tsx` —
  new (consumed by multiple other editors).
- `src-renderer/features/propertyPanel/HumanTaskProperties.tsx` —
  form fields section added (file owned by epic_PROPERTY_PANEL_05).
- `src-renderer/features/propertyPanel/CasePlanModelProperties.tsx` —
  "Case variables" button added (file owned by
  epic_PROPERTY_PANEL_05).
- `src-main/storage/migrations.ts` — variables migration entry.

**Chain constraint:** CVS-01 first (schema). CVS-02 and CVS-03 can
overlap. CVS-04 depends on CVS-03. CVS-05 depends on CVS-04.

**Estimated total effort:** 3–4 days.
