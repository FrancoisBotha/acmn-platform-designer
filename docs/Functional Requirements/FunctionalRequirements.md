# ACMN Designer — Functional Requirements

| ID | Sub-System | Description | Status | Epic |
|----|------------|-------------|--------|------|
| FR-001 | Designer | The system shall launch as a desktop application on Windows 10 and Windows 11 (x64). | Draft | epic_SPIKE1_FOUNDATION_00 |
| FR-002 | Designer | The system shall present a welcome screen on launch when no project is open, showing options to create a new project or open an existing project. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01 |
| FR-003 | Designer | The system shall display a list of recent projects on the welcome screen with project name, file path, and last modified timestamp. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01 |
| FR-004 | Designer | The system shall allow the user to create a new project via a wizard that captures: project name, project location on disk, optional description, and optional starter template. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01 |
| FR-005 | Designer | The system shall create the project folder structure on disk when a new project is saved: project.acmn.json manifest, case-plan-models/, domain-contexts/, test-scenarios/, assets/, and dist/ directories. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01 |
| FR-006 | Designer | The system shall allow the user to open an existing project by selecting a folder containing a valid project.acmn.json manifest via a native file dialog. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01 |
| FR-007 | Designer | The system shall display the current project name and relative path to the active case plan model in the top-bar breadcrumb. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01 |
| FR-008 | Designer | The system shall support multiple case plan models per project, allowing the user to switch between them via a project tree sidebar. | Draft | epic_CANVAS_INTERACTION_03 |
| FR-009 | Designer | The system shall support closing a project, returning to the welcome screen, with a save prompt if unsaved changes exist. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01 |
| FR-010 | Designer | The system shall render an infinite, pannable, zoomable canvas for designing case plan models using React Flow. | Draft | epic_SPIKE1_FOUNDATION_00 |
| FR-011 | Designer | The system shall display a dot grid on the canvas for visual alignment of elements. | Draft | epic_SPIKE1_FOUNDATION_00 |
| FR-012 | Designer | The system shall display a minimap in the bottom-right corner showing the full workspace with a viewport indicator. | Draft | epic_SPIKE1_FOUNDATION_00 |
| FR-013 | Designer | The system shall support zoom controls (zoom in, zoom out, fit to viewport, 100% reset) with keyboard shortcuts and mouse-wheel zoom. | Draft | epic_APP_CHROME_AND_SETTINGS_08 |
| FR-014 | Designer | The system shall support undo/redo for all canvas operations with keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z) and an undo stack of at least 100 operations. | Draft | epic_CANVAS_INTERACTION_03 |
| FR-015 | Designer | The system shall support multi-select of canvas elements via click+drag marquee and Ctrl+click, enabling bulk operations (move, delete, copy). | Draft | epic_CANVAS_INTERACTION_03 |
| FR-016 | Designer | The system shall support copy/paste of selected elements within the same case plan model and across case plan models within the same project. | Draft | epic_CANVAS_INTERACTION_03 |
| FR-017 | Designer | The system shall auto-save the current project to disk every 30 seconds after the last change. | Draft | epic_AUTOSAVE_AND_RECOVERY_02 |
| FR-018 | Designer | The system shall provide a manual save action via Ctrl+S and File → Save menu. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01 |
| FR-019 | Designer | The system shall support Save As to a different project folder, preserving the current project unchanged. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01 |
| FR-020 | Designer | The system shall indicate unsaved changes in the title bar and top-bar breadcrumb with a modified marker. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01 |
| FR-021 | Designer | The system shall support three canvas modes accessible via tabs in the top bar: Design, Test, and Publish. | Draft | epic_CANVAS_INTERACTION_03 |
| FR-022 | Designer | In Design mode, all elements shall be editable. The user can add, remove, configure, and wire elements. | Draft | epic_CANVAS_INTERACTION_03 |
| FR-023 | Designer | In Test mode, the system shall allow the user to inject test signals and observe case progression with state overlays on the canvas. | Draft | epic_TEST_MODE_AND_SIMULATOR_10 |
| FR-024 | Designer | In Publish mode, the system shall display a publish dialog with pre-flight validation checks and deployment details. | Draft | epic_PUBLISH_MODE_AND_PACKAGING_11 |
| FR-030 | Designer | The system shall display a left-side palette panel organised into sections: Plan Items, Structure, Connectors, and Domain. | Draft | epic_SPIKE1_FOUNDATION_00 |
| FR-031 | Designer | The Plan Items section shall contain draggable entries for: Agent node, Tool node, Guardrail, Evaluator, Handoff, and Human task. | Draft | epic_SPIKE1_FOUNDATION_00 |
| FR-032 | Designer | The Structure section shall contain draggable entries for: Stage, Milestone, and Sentry. | Draft | epic_SPIKE1_FOUNDATION_00 |
| FR-033 | Designer | The Connectors section shall contain draggable entries for built-in connector types: Email, Webhook, File watch, Schedule, Database, Event, and API, each with a type-specific icon. | Draft | epic_SPIKE1_FOUNDATION_00 |
| FR-034 | Designer | The system shall provide a searchable connector catalogue allowing the user to browse and (in v0.2+) install third-party connector packages. | Draft | epic_SPIKE1_FOUNDATION_00 |
| FR-035 | Designer | The Domain section shall display the current domain context with name, version, and summary counts (terms, schemas, rules, decision tables). | Draft | epic_DOMAIN_CONTEXT_07 |
| FR-036 | Designer | The system shall provide a palette search box filtering elements across all sections. | Draft | epic_SPIKE1_FOUNDATION_00 |
| FR-037 | Designer | The system shall support drag-and-drop from the palette onto the canvas to create new elements at the drop location. | Draft | epic_SPIKE1_FOUNDATION_00 |
| FR-040 | Designer | The system shall display a right-side property panel showing the configuration of the currently selected element. | Draft | epic_PROPERTY_PANEL_05 |
| FR-041 | Designer | For an agent node, the property panel shall display tabs for: Identity, Model, Tools, Context, Strategy, Confidence, Ports, Lifecycle, and State. | Draft | epic_PROPERTY_PANEL_05 |
| FR-042 | Designer | The Identity tab for agent nodes shall allow configuration of: name, persona, role, and owner. | Draft | epic_PROPERTY_PANEL_05 |
| FR-043 | Designer | The Model tab for agent nodes shall allow configuration of: model selection, temperature, and max tokens. | Draft | epic_PROPERTY_PANEL_05 |
| FR-044 | Designer | The Tools tab for agent nodes shall display all tool nodes wired to the agent with enable/disable checkboxes and per-tool invocation policy (auto, confirm_first, supervised). | Draft | epic_PROPERTY_PANEL_05 |
| FR-045 | Designer | The Context tab for agent nodes shall allow configuration of: readable case file items, writable case file items, thread visibility, and context scope. | Draft | epic_PROPERTY_PANEL_05 |
| FR-046 | Designer | The Strategy tab for agent nodes shall allow configuration of: reasoning strategy (react, plan_execute, reflect, debate), max turns, and budget. | Draft | epic_PROPERTY_PANEL_05 |
| FR-047 | Designer | The Confidence tab for agent nodes shall allow configuration of the confidence model parameters. | Draft | epic_PROPERTY_PANEL_05 |
| FR-048 | Designer | The Ports tab for agent nodes shall allow configuration of named input and output ports with types and schemas. | Draft | epic_PROPERTY_PANEL_05 |
| FR-049 | Designer | The Lifecycle tab for agent nodes shall allow configuration of entry and exit sentries, and plan item decorators. | Draft | epic_PROPERTY_PANEL_05 |
| FR-050 | Designer | The State tab for agent nodes shall allow configuration of turn retention and promotion rules. | Draft | epic_PROPERTY_PANEL_05 |
| FR-051 | Designer | For a tool node, the property panel shall display fields for: tool ID, name, description, input schema, output schema, and invocation policy. | Draft | epic_PROPERTY_PANEL_05 |
| FR-052 | Designer | For a guardrail node, the property panel shall display fields for: guardrail type, rule definition or prompt, violation action, and port configuration. | Draft | epic_PROPERTY_PANEL_05 |
| FR-053 | Designer | For an evaluation node, the property panel shall display fields for: evaluator type, criteria list with weights and thresholds, max retries, on_exhausted policy, and port configuration. | Draft | epic_PROPERTY_PANEL_05 |
| FR-054 | Designer | For a connector node, the property panel shall display fields for: connector type, connection configuration (type-specific fields), filter rules, field mapping, target case plan model, daily signal limit, and active toggle. | Draft | epic_PROPERTY_PANEL_05 |
| FR-055 | Designer | For a stage, the property panel shall display fields for: stage name, cognitive mode, entry/exit sentries, and decorator configuration. | Draft | epic_PROPERTY_PANEL_05 |
| FR-056 | Designer | For a milestone, the property panel shall display fields for: milestone name, criteria type, criteria expression, and revocation condition. | Draft | epic_PROPERTY_PANEL_05 |
| FR-057 | Designer | For a human task, the property panel shall display fields for: task name, assignee/role, referenced case variables for form generation, conditional visibility rules, and decorator configuration. | Draft | epic_PROPERTY_PANEL_05 |
| FR-058 | Designer | For the domain context panel, the property panel shall display fields for: domain name, version, binding mode (reference/copy), and browsable views of vocabulary, schemas, rules, and decision tables. | Draft | epic_PROPERTY_PANEL_05 |
| FR-059 | Designer | The property panel shall validate all inputs in real time and show inline errors for invalid configurations. | Draft | epic_PROPERTY_PANEL_05 |
| FR-060 | Designer | The property panel shall support closing (collapsing) to give the canvas more space. | Draft | epic_PROPERTY_PANEL_05 |
| FR-070 | Designer | The system shall provide a case variables editor accessible from the case plan model properties. | Draft | epic_CASE_VARIABLES_AND_SENTRIES_06 |
| FR-071 | Designer | The case variables editor shall allow creating, editing, and deleting variables with name, type, default value, required flag, label, readOnly flag, and enum values. | Draft | epic_CASE_VARIABLES_AND_SENTRIES_06 |
| FR-072 | Designer | The system shall support the eight variable types defined in the ACMN standard: string, integer, float, boolean, date, datetime, enum, and currency. | Draft | epic_CASE_VARIABLES_AND_SENTRIES_06 |
| FR-073 | Designer | The system shall validate variable names for uniqueness within the case plan model and reject duplicates. | Draft | epic_CASE_VARIABLES_AND_SENTRIES_06 |
| FR-074 | Designer | The system shall display available case variables in the property panel when a human task is selected, allowing variables to be referenced for form generation. | Draft | epic_CASE_VARIABLES_AND_SENTRIES_06 |
| FR-075 | Designer | The system shall provide a sentry expression editor with syntax highlighting and autocomplete for case variable names and operators. | Draft | epic_CASE_VARIABLES_AND_SENTRIES_06 |
| FR-080 | Designer | The system shall support creating wires by dragging from an output port on one element to an input port on another. | Draft | epic_WIRE_MANAGEMENT_04 |
| FR-081 | Designer | The system shall enforce port type compatibility when creating wires, preventing connections between incompatible port types and showing a visual indicator on incompatible ports. | Draft | epic_WIRE_MANAGEMENT_04 |
| FR-082 | Designer | The system shall visually distinguish the five wire types defined in the ACMN standard: data wire (solid line), confidence-gated wire (solid with diamond gate icon), escalation wire (dashed red), event wire (dotted), and case file wire (double line). | Draft | epic_WIRE_MANAGEMENT_04 |
| FR-083 | Designer | The system shall allow configuring wire properties when a wire is selected: wire type, buffering strategy, transform, and confidence gate threshold. | Draft | epic_WIRE_MANAGEMENT_04 |
| FR-084 | Designer | The system shall support deleting wires via Delete key or right-click menu. | Draft | epic_WIRE_MANAGEMENT_04 |
| FR-085 | Designer | The system shall automatically route wire paths around elements to avoid overlap. | Draft | epic_WIRE_MANAGEMENT_04 |
| FR-090 | Designer | The system shall render the domain context as a panel attached to the top edge of the case plan model boundary, showing domain name, version, binding mode icon, and summary counts. | Draft | epic_DOMAIN_CONTEXT_07 |
| FR-091 | Designer | Clicking the domain context panel shall open a detail view for browsing vocabulary, schemas, rules, and decision tables. | Draft | epic_DOMAIN_CONTEXT_07 |
| FR-092 | Designer | For copy-mode domain contexts, the detail view shall allow inline editing of vocabulary terms, schemas, rules, and decision tables. | Draft | epic_DOMAIN_CONTEXT_07 |
| FR-093 | Designer | For reference-mode domain contexts, the detail view shall be read-only with a clear indicator. | Draft | epic_DOMAIN_CONTEXT_07 |
| FR-094 | Designer | The system shall display a domain context library showing three tiers: published (organisational), installed (from package registries), and personal (user copies). | Draft | epic_DOMAIN_CONTEXT_07 |
| FR-095 | Designer | The system shall allow the user to fork (copy) an existing domain context, creating an independent copy that records its origin for traceability. | Draft | epic_DOMAIN_CONTEXT_07 |
| FR-096 | Designer | The system shall allow the user to create a new domain context from scratch, with editors for vocabulary, schemas, rules, and decision tables. | Draft | epic_DOMAIN_CONTEXT_07 |
| FR-097 | Designer | The system shall support dragging a domain context from the library onto a case plan model to apply or replace its binding, with a confirmation dialog on replace. | Draft | epic_DOMAIN_CONTEXT_07 |
| FR-098 | Designer | The system shall support binding mode selection (reference or copy) when a domain context is applied, with clear explanation of the implications of each mode. | Draft | epic_DOMAIN_CONTEXT_07 |
| FR-099 | Designer | The system shall display package provenance on the domain context panel for contexts installed from a registry. | Draft | epic_DOMAIN_CONTEXT_07 |
| FR-100 | Designer | In Test mode, the system shall display a left panel with the active test scenario, including injected signal details and a case variables watcher. | Draft | epic_TEST_MODE_AND_SIMULATOR_10 |
| FR-101 | Designer | The system shall allow the user to inject test signals into connector nodes by selecting a saved test scenario or providing ad-hoc signal data. | Draft | epic_TEST_MODE_AND_SIMULATOR_10 |
| FR-102 | Designer | The system shall execute the simulated case in the main process using an in-process simulator, with agent turns optionally calling a locally running Logic Engine or using mocked deterministic responses. | Draft | epic_TEST_MODE_AND_SIMULATOR_10 |
| FR-103 | Designer | The system shall display live state overlays on canvas elements in Test mode: active stages highlighted, agent confidence meters, milestone states (achieved, available, revoked), wire activity indicators, and connector pulse indicators when receiving signals. | Draft | epic_TEST_MODE_AND_SIMULATOR_10 |
| FR-104 | Designer | The system shall display a simulation console panel with tabs for Reasoning trace, Wire activity, Sentry evaluations, and Audit log. | Draft | epic_TEST_MODE_AND_SIMULATOR_10 |
| FR-105 | Designer | The system shall support step-through execution (pause after each agent turn) and continuous execution (run to completion or next breakpoint). | Draft | epic_TEST_MODE_AND_SIMULATOR_10 |
| FR-106 | Designer | The system shall support pausing, resuming, and stopping a running test. | Draft | epic_TEST_MODE_AND_SIMULATOR_10 |
| FR-107 | Designer | The system shall allow saving the current test scenario (injected signal + mocked responses) to the project's test-scenarios folder for reuse. | Draft | epic_TEST_MODE_AND_SIMULATOR_10 |
| FR-108 | Designer | The system shall allow loading a saved test scenario and replaying it. | Draft | epic_TEST_MODE_AND_SIMULATOR_10 |
| FR-109 | Designer | The system shall record the result of each test run (passed, failed, incomplete) with timestamp and duration for the pre-flight check. | Draft | epic_TEST_MODE_AND_SIMULATOR_10 |
| FR-110 | Designer | In Publish mode, the system shall display a modal dialog with pre-flight validation checks. | Draft | epic_PUBLISH_MODE_AND_PACKAGING_11 |
| FR-111 | Designer | The pre-flight checks shall verify: all required ports are connected, all agent nodes have a model configured, all connector nodes have valid connection configuration, all case variables are defined, all sentry expressions reference valid variables, the domain context is fully bound, and at least one test run has passed. | Draft | epic_PUBLISH_MODE_AND_PACKAGING_11 |
| FR-112 | Designer | The publish dialog shall allow the user to specify a semantic version bump (major, minor, patch) with the resulting version pre-computed and displayed. | Draft | epic_PUBLISH_MODE_AND_PACKAGING_11 |
| FR-113 | Designer | The publish dialog shall allow the user to enter optional release notes in a multi-line text field. | Draft | epic_PUBLISH_MODE_AND_PACKAGING_11 |
| FR-114 | Designer | The publish dialog shall allow the user to choose how existing running cases handle the version change: continue on old version (default, recommended) or migrate to new version. | Draft | epic_PUBLISH_MODE_AND_PACKAGING_11 |
| FR-115 | Designer | In v0.1, the publish action shall package the case plan model and all referenced domain contexts into a single .acmn archive file, written to the project's dist/ folder. | Draft | epic_PUBLISH_MODE_AND_PACKAGING_11 |
| FR-116 | Designer | In v0.2+, the publish action shall deploy the package to the Execution Engine via the Communication Engine REST API. | Draft | epic_PUBLISH_MODE_AND_PACKAGING_11 |
| FR-117 | Designer | The system shall display publish progress (validating, packaging, deploying) and report success or failure with actionable error messages. | Draft | epic_PUBLISH_MODE_AND_PACKAGING_11 |
| FR-118 | Designer | The system shall maintain a local version history of published case plan models in the project's dist/ folder, retaining all previously published .acmn files. | Draft | epic_PUBLISH_MODE_AND_PACKAGING_11 |
| FR-120 | Designer | The system shall support exporting a case plan model as a standalone JSON file for interchange with other tools. | Draft | epic_IMPORT_EXPORT_INTERCHANGE_09 |
| FR-121 | Designer | The system shall support importing a case plan model from a JSON file, with validation against the current domain context and ACMN schema. | Draft | epic_IMPORT_EXPORT_INTERCHANGE_09 |
| FR-122 | Designer | The system shall support exporting a domain context as a standalone JSON package. | Draft | epic_IMPORT_EXPORT_INTERCHANGE_09 |
| FR-123 | Designer | The system shall support importing a domain context from a JSON file. | Draft | epic_IMPORT_EXPORT_INTERCHANGE_09 |
| FR-130 | Designer | The system shall provide a command palette invoked by Ctrl+K / Cmd+K, with fuzzy search over: commands (save, publish, new), elements on canvas (by name), and palette items. | Draft | epic_APP_CHROME_AND_SETTINGS_08 |
| FR-131 | Designer | The system shall provide a native application menu (File, Edit, View, Test, Publish, Help) with standard keyboard shortcuts. | Draft | epic_APP_CHROME_AND_SETTINGS_08 |
| FR-132 | Designer | The system shall provide a Help menu linking to: ACMN Standard documentation (acmnstandard.org), Designer user guide, keyboard shortcut reference, and About dialog. | Draft | epic_APP_CHROME_AND_SETTINGS_08 |
| FR-133 | Designer | The system shall provide a settings dialog for: default project location, auto-save interval, theme (light/dark/system), telemetry opt-in (v0.2+), and LLM provider credentials for the local Logic Engine (optional, for rich test mode). | Draft | epic_APP_CHROME_AND_SETTINGS_08 |
| FR-140 | Designer | The system shall implement a backend contract interface (BackendContract) that defines all calls between the Designer and the future Execution Engine / Communication Engine. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01 |
| FR-141 | Designer | The system shall provide a LocalBackend implementation of the BackendContract in v0.1, implementing all calls against the local filesystem and in-process simulator. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01 |
| FR-142 | Designer | The system shall provide a RemoteBackend implementation of the BackendContract in v0.2+, implementing all calls against the Communication Engine REST API. | Draft | — (v0.2+) |
| FR-143 | Designer | The system shall select the backend implementation at startup based on configuration (environment variable or settings file), without requiring changes to the UI code. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01 |
| FR-144 | Designer | The system shall expose the backend contract to the renderer process exclusively via Electron IPC, using contextBridge with a typed, minimal API surface. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01 |
| FR-150 | Designer | In v0.2+, the system shall support authenticating against the Communication Engine using OAuth 2.0 / SSO. | Draft | — (v0.2+) |
| FR-151 | Designer | In v0.2+, the system shall display the current user identity in the top bar when authenticated. | Draft | — (v0.2+) |
| FR-152 | Designer | In v0.2+, the system shall support switching between local and remote backends at runtime via a setting, preserving local file-based work. | Draft | — (v0.2+) |
| FR-160 | Designer | The system shall recover unsaved changes on unexpected exit by reloading from an auto-save backup file on next launch, with user confirmation before applying. | Draft | epic_AUTOSAVE_AND_RECOVERY_02 |
| FR-161 | Designer | The system shall detect corrupt project files and present a clear error with options to report, attempt recovery, or open a backup. | Draft | epic_AUTOSAVE_AND_RECOVERY_02 |
| FR-162 | Designer | The system shall validate imported project files against the expected schema version and refuse to open files from incompatible future versions. | Draft | epic_AUTOSAVE_AND_RECOVERY_02 |
| FR-163 | Designer | The system shall support project files from earlier schema versions by applying forward migrations, preserving the original file as a backup. | Draft | epic_AUTOSAVE_AND_RECOVERY_02 |
