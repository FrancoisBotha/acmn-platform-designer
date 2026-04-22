# Epic: TEST_MODE_AND_SIMULATOR

**Status:** NEW
**Owner:** human
**Created:** 2026-04-21
**Last Updated:** 2026-04-21

---

## 1. Purpose

Let users see their case plan models run — without needing the
Execution Engine. The spike delivered a canvas; the property panel
and variables make the model expressive; this epic makes it
*executable* at design time.

Test mode injects a test signal into a connector, runs the case
through an in-process simulator living in the main process, and
paints live state onto the canvas and into the console while it
executes. It is the closest the Designer gets to being an IDE —
"write, run, inspect, fix, repeat" — without any backend server
involvement.

---

## 2. User Story

As a **solution architect**,
I want to inject a sample email signal into my connector and step
through the case, watching agents take turns, confidence meters
update, milestones achieve, and sentry expressions trigger,
So that I can catch design mistakes before I publish and know the
case will behave the way I expect.

As a **technical business analyst**,
I want to save a test scenario — signal plus mocked agent responses
— and replay it to verify that my changes haven't regressed the
behaviour,
So that I have some repeatable confidence every time I ship.

---

## 3. Scope

### In Scope

- **Test mode UI** — the Test tab from epic_CANVAS_INTERACTION is
  wired to a full layout:
  - Left panel: active test scenario details (injected signal
    JSON, mocked responses), a case variables watcher showing live
    values, a milestones watcher showing state transitions.
  - Centre: the canvas (same React Flow instance as Design mode)
    with state overlays.
  - Right panel (replaces Design-mode property panel): simulation
    console with four tabs — Reasoning trace, Wire activity,
    Sentry evaluations, Audit log.
  - Top bar: Run / Pause / Resume / Stop / Step controls; scenario
    picker; save-scenario action.
- **Signal injection.** User selects a connector on the canvas,
  clicks "Inject signal", picks from saved test scenarios or enters
  ad-hoc signal data in a form (schema from the connector's
  configured signal type).
- **In-process simulator** (main process, under `src-main/simulator/`).
  Implements the case lifecycle subset needed for design-time
  testing:
  - Case lifecycle: init → active → complete / failed.
  - Stage lifecycle: available → active → complete (on entry /
    exit sentry).
  - Sentry evaluation (uses the expression grammar from
    epic_CASE_VARIABLES_AND_SENTRIES).
  - Milestone achievement (on criteria met).
  - Wire delivery with the configured buffering strategy.
  - Agent turns: either a real local Logic Engine call (if
    configured and running) or a deterministic mock from the test
    scenario.
  - Guardrail and evaluator execution (mocked per test scenario).
  - Event bus for connector signals.
- **Live state overlays on canvas.**
  - Active stages: highlighted border.
  - Agents: confidence meter fills as turns progress; turn count
    badge.
  - Milestones: colour by state (neutral / green / red).
  - Wires: pulse animation when signals are delivered.
  - Connector: pulse when a signal is received.
- **Console panel tabs.**
  - *Reasoning trace*: per-agent-turn transcript (prompt, response,
    tool calls).
  - *Wire activity*: ordered list of wire-delivery events with
    payload previews.
  - *Sentry evaluations*: each sentry expression's evaluation
    history (expression, variables at the time, result).
  - *Audit log*: coarse-grained case-level events (stage entered,
    milestone achieved, case completed).
- **Step through / continuous execution.**
  - Step: execute one agent turn or one sentry evaluation, then
    pause.
  - Run: execute continuously until case completes, fails, or
    user pauses.
  - Pause: freeze execution at the next safe point (after the
    current turn).
  - Resume / Stop: pick up or cancel a paused run.
- **Test scenarios** stored as `*.test.json` in
  `test-scenarios/`. Contents:
  - Target CPM id.
  - Target connector id.
  - Signal payload.
  - Mocked agent / tool / guardrail / evaluator responses (for
    offline deterministic playback).
  - Expected outcomes for assertion (optional).
- **Save test scenario.** Button captures the current run's signal
  and mocked responses into a new `.test.json` file.
- **Load scenario.** Opens a scenario in Test mode; re-hydrates
  signal + mocks and is ready to run.
- **Test run result** recorded (timestamp, duration, result:
  passed / failed / incomplete) for later use by
  epic_PUBLISH_MODE_AND_PACKAGING's pre-flight.
- **Event streaming from main to renderer** via `AsyncIterable` over
  IPC (chunked batches to keep the channel tidy).

### Out of Scope

- Persistence of test-run history beyond "most recent run result"
  per scenario. No long audit archive.
- Time-travel debugging (rewind to a specific wire event and
  inspect). Deferred.
- Concurrent runs of multiple scenarios.
- Distributed execution (cluster simulation). v0.1 runs everything
  in-process.
- Real LLM API integration. If the Logic Engine isn't running
  locally, deterministic mocks are used — we do not call external
  LLM providers directly from the Designer.
- Load testing or performance benchmarking of the simulator.
- Assertion DSL beyond equality checks on case variables at end-of-
  run. Richer test assertions come later.
- Hot-reload of a CPM while a run is in progress. Edit-and-rerun
  is the workflow.

---

## 4. Functional Requirements

- **FR-100** — In Test mode, display a left panel with the active
  test scenario, injected signal details, and a case-variables
  watcher.
- **FR-101** — Allow the user to inject test signals into connector
  nodes by selecting a saved test scenario or providing ad-hoc
  signal data.
- **FR-102** — Execute the simulated case in the main process using
  an in-process simulator, with agent turns optionally calling a
  locally running Logic Engine or using mocked deterministic
  responses.
- **FR-103** — Display live state overlays on canvas elements in
  Test mode: active stages highlighted, agent confidence meters,
  milestone states (achieved / available / revoked), wire activity
  indicators, connector pulse indicators when receiving signals.
- **FR-104** — Display a simulation console panel with tabs for
  Reasoning trace, Wire activity, Sentry evaluations, and Audit
  log.
- **FR-105** — Support step-through execution (pause after each
  agent turn) and continuous execution (run to completion or next
  breakpoint).
- **FR-106** — Support pausing, resuming, and stopping a running
  test.
- **FR-107** — Allow saving the current test scenario (injected
  signal + mocked responses) to the project's `test-scenarios/`
  folder for reuse.
- **FR-108** — Allow loading a saved test scenario and replaying
  it.
- **FR-109** — Record the result of each test run
  (passed / failed / incomplete) with timestamp and duration for
  the pre-flight check.

---

## 5. Non-Functional Requirements

- **NFR-083** — Handle test runs containing up to 500 recorded
  events without slowing the console panel.
- **NFR-090** — Operate fully offline — test mode must work with
  deterministic mocks when no Logic Engine is available.
- **NFR-120** — UI remains responsive during simulator execution;
  the main process does not block the renderer.
- **NFR-121** — Indicate background activity (progress /
  running-state indicator) for test runs exceeding 500 ms.

---

## 6. UI/UX Notes

- **Mode switch.** Switching to Test does not modify the CPM. It
  freezes Design-mode edits (palette disabled, property panel
  collapses in favour of console).
- **Run controls top bar.** Left-to-right: scenario picker,
  "Inject signal" (if no scenario selected), Run ▶ / Pause ⏸ /
  Stop ⏹, Step ⏯, elapsed time display, event count badge.
- **State overlays** are subtle to avoid obscuring the model.
  Confidence meters sit in the top-right of each agent node as
  small bars; milestone fill colour uses the same palette as the
  property panel; wire pulses are quick, low-opacity highlights.
- **Console panel tabs.** Reasoning trace is the default active
  tab. Each tab has a "clear" button and a "follow" toggle
  (auto-scroll to latest).
- **Save scenario modal.** Triggered from the current run's top
  bar; defaults name to `<connector-name>-<timestamp>.test.json`
  with an optional description field.
- **Failure state.** If the simulator hits an error (unresolved
  variable in a sentry, missing mock for an agent turn), the
  canvas marks the offending element red, the console shows the
  error, and the run transitions to failed.
- **Scenario persistence.** Scenarios appear in the project tree
  sidebar (epic_CANVAS_INTERACTION), clicking opens in Test mode.

---

## 7. Data Model Impact

- **Test scenario file** (`*.test.json`) new schema:
  ```json
  {
    "schemaVersion": "1",
    "id": "ts_01HR...",
    "name": "New starter email",
    "description": "...",
    "targetCpmId": "cpm_01HP...",
    "targetConnectorId": "conn_01HR...",
    "signal": { ... },
    "mocks": {
      "agents": [ { "agentId", "turns": [ { "prompt", "response", "toolCalls": [...] } ] } ],
      "tools": [ { "toolId", "calls": [ { "input", "output" } ] } ],
      "guardrails": [ { "id", "results": [...] } ],
      "evaluators": [ { "id", "results": [...] } ]
    },
    "expectations"?: { "finalVariables": { ... }, "milestonesAchieved": [ ... ] },
    "lastRun"?: {
      "timestamp": "...",
      "durationMs": 4250,
      "result": "passed" | "failed" | "incomplete"
    }
  }
  ```
- **No changes to CPM schema.**
- **Event stream** (in-memory only) — typed `TestEvent` discriminated
  union: `agent_turn_started`, `agent_turn_completed`,
  `wire_delivered`, `sentry_evaluated`, `milestone_achieved`,
  `stage_entered`, `stage_exited`, `case_completed`, `run_failed`.

---

## 8. Integration Impact

- **LocalBackend extension.** `runTestScenario`, `getTestRunEvents`,
  `cancelTestRun`, `listTestScenarios`, `saveTestScenario`,
  `deleteTestScenario`.
- **Simulator module.** `src-main/simulator/` with: `Simulator`
  class, `CaseInstance`, sentry evaluator, wire deliverer, agent
  turn dispatcher (real Logic Engine vs mock), event emitter.
- **IPC event streaming.** New IPC channels:
  `testRun:start`, `testRun:events`, `testRun:cancel`,
  `testScenario:list`, `testScenario:save`, `testScenario:delete`.
  Events delivered as an async iterable over IPC (buffered
  batches).
- **Renderer state.** New `testStore` (Zustand) holding
  `activeRun`, `events`, `caseState`, `milestonesState`,
  `consoleTab`.
- **Expression grammar reuse.** The simulator's sentry evaluator
  is built on top of
  `src-renderer/lib/expressionGrammar.ts`'s
  parse+validate (shared with the renderer). Evaluation is in the
  main process — the grammar module is consumed on both sides.
- **Mode wiring.** Test-mode tab from epic_CANVAS_INTERACTION is
  populated here.

---

## 9. Acceptance Criteria

- [ ] Switching to Test mode shows the three-panel layout (scenario
  left, canvas centre, console right).
- [ ] Selecting a connector and clicking "Inject signal" opens the
  signal form; submitting triggers a test run.
- [ ] The simulator runs the case; live overlays update on the
  canvas (active stage highlighted, confidence meters, wire
  pulses, milestone colour changes).
- [ ] Step mode pauses after each agent turn; Run mode executes to
  completion.
- [ ] Pause / Resume / Stop all behave correctly.
- [ ] All four console tabs populate with relevant events.
- [ ] Saving the current run produces a `.test.json` file in
  `test-scenarios/`.
- [ ] Loading a saved scenario from the project tree opens Test
  mode with the scenario ready to run.
- [ ] A scenario with mocked agent responses can replay
  deterministically — same result every run.
- [ ] Running a case with an unresolved sentry variable fails
  gracefully, showing the error in the console and flagging the
  element on the canvas.
- [ ] Each test run records `lastRun` metadata on the scenario
  file, visible to pre-flight (epic 10).
- [ ] The console handles 500 recorded events without visible
  slowdown.
- [ ] A real Logic Engine, if configured and running, is
  automatically used for agent turns instead of mocks (integration
  point stubbed OK if Logic Engine isn't ready; fallback to mocks
  is the primary v0.1 path).

---

## 10. Risks & Unknowns

- **Simulator correctness vs Execution Engine.** The simulator
  mimics the Execution Engine but isn't it. Divergence is a real
  risk — the design-time green test may disagree with production.
  Mitigation: share the expression grammar and ACMN schemas
  between simulator and engine; document simulator limitations in
  the console's help.
- **Event volume.** 500 events is the NFR target but real cases
  may produce more. Virtualise the console lists from day one.
- **Mocking granularity.** How fine should agent-turn mocks be?
  v0.1 mocks per turn (one response per prompt). Richer mocks
  (response regexes, conditional logic) come later.
- **Cancellation semantics.** Stopping mid-run must not leave the
  simulator in an inconsistent state. Document "safe pause points"
  (end of turn, end of sentry eval).
- **Agent turn dispatcher — real vs mock fallback.** Detecting
  "Logic Engine is available" cleanly is non-trivial. v0.1 uses a
  settings flag + health ping; if unhealthy, fall back to mocks
  with a visible banner.
- **Open question — hot-reload.** If the user edits the CPM while
  a run is paused, what happens? Proposed: editing Design mode
  while Test mode is active is blocked; the user must stop the
  run first.

---

## 11. Dependencies

- **Upstream:**
  - epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE (baseline contract
    methods + `test-scenarios/` folder).
  - epic_AUTOSAVE_AND_RECOVERY (atomic writes for scenarios).
  - epic_CANVAS_INTERACTION (Test-mode tab placeholder).
  - epic_PROPERTY_PANEL (already informs the user of node state).
  - epic_CASE_VARIABLES_AND_SENTRIES (expression grammar for
    sentry evaluation).
  - epic_DOMAIN_CONTEXT (decision tables and rules consumed by
    the simulator).
  - epic_WIRE_MANAGEMENT (wire buffering strategies consumed by
    the simulator).
- **Downstream:**
  - epic_PUBLISH_MODE_AND_PACKAGING reads `lastRun.result` for
    pre-flight.

---

## 12. References

- **prd:** `docs/Product Requirements Document/PRD.md` (§6.7 test
  mode)
- **architecture:** `docs/Architecture/Architecture.md` (§9 test
  simulator; §4 `runTestScenario`, `getTestRunEvents`,
  `cancelTestRun`)
- **acmn standard:** `docs/References/ACMN-Standard-v1.0.11.md`
  (case, stage, plan item lifecycles)
- **functional requirements:** `docs/Functional Requirements/FunctionalRequirements.md`
- **non-functional requirements:** `docs/Non-Functional Requirements/NonFunctionalRequirements.md`
- **mockups:** `docs/Mockups/04-test-mode.png`

---

## 13. Implementation Notes

**Complexity:** XL (the biggest epic in v0.1)

**Suggested ticket breakdown (8 tickets):**

1. **TMS-01** — Simulator core: case / stage lifecycle, sentry
   evaluator (via expression grammar), milestone achievement,
   wire delivery. Deterministic in isolation (unit-testable
   without UI).
2. **TMS-02** — Agent turn dispatcher: Logic Engine health check
   + fallback to mock responses. Tool / guardrail / evaluator
   mock plumbing.
3. **TMS-03** — Test scenario file (`*.test.json`) Zod schema,
   CRUD via LocalBackend, IPC plumbing, list/save/delete.
4. **TMS-04** — Event streaming: `TestEvent` union, chunked
   async-iterable over IPC, cancellation contract.
5. **TMS-05** — Test mode UI shell: three-panel layout, mode
   switch behaviour (Design disabled), run controls top bar.
6. **TMS-06** — Live canvas overlays (active stages, confidence
   meters, milestone colours, wire pulses, connector pulses).
7. **TMS-07** — Console panel: four tabs (Reasoning / Wire /
   Sentry / Audit), virtualised lists, follow toggle,
   clear button.
8. **TMS-08** — Signal injection form (ad-hoc + scenario-backed),
   save-scenario modal, scenario load flow from project tree,
   `lastRun` result recording.

**Scaffolding files touched:**

- `src-main/simulator/*` — new folder with many files.
- `src-main/backend/localBackend.ts` — add test scenario methods.
- `src-main/ipc/testScenario.ts` — new.
- `src-main/ipc/testRun.ts` — new (event streaming).
- `src-main/preload.ts` — expose `window.acmn.test.*`.
- `src-renderer/state/testStore.ts` — new.
- `src-renderer/features/test/*` — new folder.
- `src-renderer/features/canvas/CanvasView.tsx` — conditional
  overlay rendering based on mode.
- `src-main/main.ts` — IPC handler registration.

**Chain constraint:** TMS-01 must merge before TMS-02 (dispatcher
plugs into the core). TMS-03 and TMS-04 can overlap.
TMS-05..TMS-08 depend on TMS-03/04; UI ticket order flexible.

**Estimated total effort:** 8–10 days. Consider splitting into two
sub-epics if scheduling is tight.
