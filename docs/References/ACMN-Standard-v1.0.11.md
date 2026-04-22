# ACMN Standard — v1.0.11 Working Draft (text reference)

> **Source:** `ACMN-Standard-v1_0_11-Working-Draft.docx` (acmnstandard.org)
> **Purpose:** Reference copy of the ACMN standard for use inside the Designer project (LLM-friendly markdown). This is the extracted text only — the original `.docx` contains UML class diagrams (core metamodel, agent properties, wire/port, sentry, evaluation node, domain context, case lifecycle) and visual notation figures that are not included here. When a section refers to "the UML diagram above" or "the figure shown," consult the original document or the published spec at https://acmnstandard.org for the diagram.
>
> This file is checked into the Designer repository as developer documentation. Do not edit — regenerate from the authoritative `.docx`.

---

*ACMN 1.0 — Working Draft*

**Agentic Case Management Notation**

ACMN

Version 1.0 — First Working Draft

April 2026

*An open standard extending CMMN (Case Management Model and Notation) with native primitives for AI agent orchestration.*

acmnstandard.org

Status: Working Draft — Not yet submitted for standardisation

# 1. Scope

This specification defines the Agentic Case Management Notation (ACMN), a notation for modelling case management processes that include autonomous AI agents as first-class participants alongside human actors. ACMN extends the Case Management Model and Notation (CMMN) 1.1 standard, published by the Object Management Group (OMG), by adding elements for agent orchestration, tool integration, confidence-driven progression, and domain context management.

ACMN preserves CMMN’s core concepts and terminology — cases, stages, sentries, milestones, case files, human tasks, and discretionary items — and adds new elements where CMMN provides no equivalent: agent nodes, tool nodes, guardrail nodes, handoff nodes, typed data wires, and domain contexts.

The scope of this specification includes:

- The ACMN metamodel: the elements, their attributes, and their relationships.

- State models: the lifecycle of cases, plan items, and agent instances.

- The sentry model: on-parts, if-parts, composition operators, and evaluation semantics.

- The milestone model: criteria types, achievement, revocation, and snapshot semantics.

- The wire model: typed data flow, buffering, transforms, and activation coupling.

- The event model: event types, delivery scopes, and subscription semantics.

- The domain context model: vocabulary, schemas, rules, and context mapping.

- The visual notation: the graphical representation of ACMN elements on a design surface.

This specification does not define a runtime implementation, serialisation format, API, or tooling. Implementations of ACMN are free to make their own technology choices for execution, persistence, and user interface, provided they conform to the metamodel and semantics defined herein.

# 2. Normative references

- OMG Case Management Model and Notation (CMMN) Version 1.1, formal/2016-12-01

- OMG Decision Model and Notation (DMN) Version 1.4, formal/2023-12-01

- OMG Unified Modeling Language (UML) Version 2.5.1, formal/2017-12-05

- OMG Business Process Model and Notation (BPMN) Version 2.0.2, formal/2013-12-10

- Eric Evans, Domain-Driven Design: Tackling Complexity in the Heart of Software, 2003

- Model Context Protocol (MCP) Specification, Anthropic, 2024

# 3. Terms and definitions

Terms defined by CMMN 1.1 retain their CMMN definitions. The following additional terms are defined by ACMN:

**Agent: **An autonomous AI participant in a case that reasons across multiple turns, uses tools, builds confidence, and collaborates with other agents and human actors. An agent is implemented by a large language model (LLM) but is specified in the notation as a set of behavioural properties independent of any specific model or provider.

**Confidence: **A numeric score (0.0 to 1.0) representing an agent’s self-assessed certainty in its conclusions. Confidence is recalculated after each agent turn and has a trajectory (rising, falling, oscillating, stable) computed over a sliding window.

**Case intake: **The process of receiving a signal from an external source and instantiating a case. In its simplest form, a connector node wires directly to a case plan model. For complex scenarios, an agent node can be wired between the connector and the case to add classification, data extraction, and routing intelligence.

**Case variable: **A flat, individually addressable, typed value that tracks the operational state of a case instance. Case variables are distinct from case file items: variables are simple values (string, number, boolean, date, enum) used for sentry expressions, human task forms, and dashboard display; case file items are complex, schema-validated domain data objects used for agent reasoning.

**Cognitive mode: **A metadata annotation on a stage indicating the type of reasoning expected: gather, analyse, draft, review, or decide. Cognitive modes are informational and do not alter execution semantics, but may be used by implementations to guide agent prompt assembly.

**Connector node: **A plan item that represents an external signal source. Connectors monitor external systems (email inboxes, webhooks, file directories, databases, APIs, event subscriptions) and emit structured signals through their output ports. Connectors are the entry point for case intake.

**Decision model: **A collection of decision tables within a domain context that codify how specific decisions are made in the domain. Decision models provide structured, auditable decision logic that agents can reference during reasoning.

**Decision table: **A tabular representation of decision logic with input columns (conditions), output columns (results), and rows (rules). Each row defines: when these input conditions are met, produce these outputs. Decision tables follow DMN semantics for hit policies and expression evaluation.

**Domain context: **A bounded context (in the Domain-Driven Design sense) that provides vocabulary, entity schemas, value object schemas, domain rules, decision models, and other domain-specific elements for a business domain. A case is bound to exactly one domain context.

**Evaluation: **An independent quality assessment of an agent’s output against defined criteria. Evaluation differs from guardrail checking (which tests binary constraints) and from self-reflection (which uses the same agent). An evaluation produces per-criterion scores and natural language feedback that can be returned to the agent for revision.

**Guardrail: **A constraint applied to agent output before it is committed to the case file. A guardrail evaluates output against rules and produces a pass, fail, or review result.

**Handoff: **A structured transfer of context from one case participant (agent or human) to another, comprising selected case file items, reasoning traces, and confidence history.

**Port: **A named, typed connection point on a plan item. Ports are either input ports (receiving data) or output ports (producing data). Ports have a schema defining the expected data structure.

**Tool: **An external capability that agents may invoke during case execution. Tools have defined input and output schemas and are resolved through a tool registry at runtime.

**Turn: **A single cycle of agent execution: context assembly, LLM invocation, response parsing, and state update. An agent may execute multiple turns within a case.

**Wire: **A typed, directed data connection between an output port on one plan item and an input port on another. Wires carry data, may buffer values, and may include inline transforms.

**Working memory: **An agent’s private scratchpad state that persists across turns within a single agent instance but is not visible to other agents or the case file.

# 4. Notation overview

## 4.1 Relationship to CMMN

ACMN is a proper superset of CMMN 1.1. Every valid CMMN model is a valid ACMN model. ACMN adds new element types and extends existing CMMN elements with additional attributes, but does not remove, rename, or alter the semantics of any CMMN element.

The relationship is analogous to how SysML extends UML: the base notation is preserved and new capabilities are added through a defined extension mechanism. Implementations that support ACMN should be capable of importing and rendering CMMN 1.1 models, treating them as ACMN models with no extension elements present.

## 4.2 Four-layer taxonomy

ACMN elements are organised into four layers:

**Layer 1 — CMMN inherited: **Elements defined by CMMN 1.1 and preserved in ACMN. Case, case plan model, stage, milestone, sentry, case file, human task, process task, discretionary item, plan fragment, and all CMMN decorators and markers.

**Layer 2 — Agent primitives: **New plan item types for AI agent participation. Agent node, tool node, guardrail node, handoff node, evaluation node, connector node. These have no CMMN equivalent and represent ACMN’s primary extension of the notation.

**Layer 3 — Context layer: **Elements for data flow and domain management. Data wires (five types), ports (input/output with typed schemas), domain context, and domain context mapping. These provide the connective tissue between agents, tools, and the case file.

**Layer 4 — Runtime semantics: **Specifications for execution behaviour that implementations must conform to. Case instance lifecycle, agent instance lifecycle, sentry evaluation order, wire buffering semantics, event delivery scopes, and state persistence scope model.

# 5. CMMN inherited elements

The following elements are inherited from CMMN 1.1. Their definitions, attributes, and lifecycle semantics are as specified in the CMMN standard unless explicitly extended below.

## 5.1 Case

A case is the top-level modelling element. A case defines a case plan model and a case file. In ACMN, a case is additionally bound to a domain context (see Section 9).

**NOTE: ***CMMN defines the case as containing a case plan model, case file, case roles, and input/output parameters. ACMN preserves all of these and adds the domain context binding.*

## 5.2 Case plan model

The case plan model is the container for all plan items within a case. It defines the top-level scope for stages, tasks, milestones, sentries, and — in ACMN — agent nodes, tool nodes, guardrail nodes, and wires. The case plan model is rendered as a bounded rectangle on the visual design surface.

## 5.3 Stage

A stage is a plan item that acts as a container for other plan items. Stages may be nested (a stage within a stage). In CMMN, stages define a scope for planning. In ACMN, stages are additionally annotated with a cognitive mode.

### 5.3.1 Cognitive mode (ACMN extension)

Each stage MAY have a cognitive mode attribute with one of the following values:

| **Mode** | **Semantics** |
| --- | --- |
| gather | The stage’s agents are collecting information: querying tools, retrieving documents, receiving input. Agent confidence is typically low and rising. |
| analyse | The stage’s agents are reasoning about gathered information: comparing, evaluating, classifying, assessing. Agent confidence should be actively tracked. |
| draft | The stage’s agents are producing output artefacts: recommendations, reports, communications. Output is subject to guardrail evaluation. |
| review | The stage’s agents or human actors are reviewing prior work. This stage typically contains guardrail nodes and human tasks for approval. |
| decide | The stage’s agents or human actors are making a final determination. Milestones in this stage represent case outcomes. |

Cognitive modes are metadata annotations. They do not alter the execution semantics of the stage. Implementations MAY use cognitive modes to influence agent prompt assembly, tool scoping, or visual rendering.

## 5.4 Case file

The case file is the shared data store within a case. It contains case file items, each of which has a name, a type (referencing a domain entity or value object schema), and a multiplicity. All case participants — agents, human actors, and tools — may read from the case file. Write access is governed by the participant’s context scope (see Section 6.1.4).

ACMN extends the case file with schema validation: case file items are validated against the domain context’s entity and value object schemas on write. Invalid writes are rejected by the runtime.

### 5.4.1 Case variables (ACMN extension)

ACMN introduces case variables as a complement to case file items. While case file items store complex domain data (entities and value objects validated against schemas), case variables store simple, individually addressable values that track the operational state of a case instance.

Each case plan model declares its variables. A variable has the following properties:

| **Property** | **Type** | **Description** |
| --- | --- | --- |
| **name** | String | Variable name. Unique within the case plan model. Used in sentry expressions and form references. |
| **type** | VariableType | One of: string, integer, float, boolean, date, datetime, enum, currency. No complex or nested types. |
| **enumValues** | List<String>? | For enum-typed variables: the permitted values (e.g., ["low", "normal", "high", "urgent"] for a Priority variable). |
| **defaultValue** | Any? | Default value assigned at case creation. If omitted and required is true, the value must be provided by the intake process. |
| **required** | Boolean | Whether this variable must have a value before the case can transition from created to active. Default: false. |
| **label** | String? | Human-readable label for display in forms and dashboards. If omitted, the name is used. |
| **readOnly** | Boolean | If true, the variable can only be set at case creation or by the runtime (not by agents or human tasks). Useful for case identifiers. Default: false. |

### 5.4.2 Setting case variables

Case variables can be set by four mechanisms:

- **Intake: **Connector field mappings or intake agent output can populate initial variable values at case creation.

- **Agent output: **An agent’s output may include variable updates. The agent’s promotion_rules (Section 6.1.9) define which variables the agent can set.

- **Human task: **When a human task presents a form (Section 5.7), the human’s input updates the referenced variables.

- **Wire transform: **A wire transform can map an agent’s output to a case variable.

When a case variable is updated, the implementation SHALL: record the previous value, the new value, the actor who made the change, and the timestamp in the audit trail. Variable changes MAY trigger sentry re-evaluation (see Section 5.6).

### 5.4.3 Case variables in sentry expressions

Sentry if-part expressions (Section 5.6) MAY reference case variables by name. This enables straightforward guard conditions:

- ApprovedByManager == true

- TotalEstimatedDamage > PolicyCoverageLimit

- Priority == "urgent" AND AssignedAssessor != null

- ReviewDeadline < now()

ACMN adds a case variable on-part type to the sentry model: a sentry can be triggered when a specific case variable is created or updated. This enables patterns like “when the manager sets ApprovedByManager, evaluate the exit sentry.”

### 5.4.4 Case variables vs case file items

Case variables and case file items serve complementary purposes and both are present in a case:

| **Aspect** | **Case variables** | **Case file items** |
| --- | --- | --- |
| **Structure** | Flat, individually addressable values | Complex, nested, schema-validated objects |
| **Purpose** | Track operational state and case progression | Store domain data the case works on |
| **Size** | Small (individual values) | Large (documents, entities, evidence) |
| **Schema** | Simple primitive types + enum | Domain entity and value object schemas |
| **Agent use** | Context metadata (always included) | Reasoning material (selectively included) |
| **Human use** | Form fields in human tasks | Reference documents and evidence |
| **Sentry use** | Simple variable comparisons | Complex path expressions |
| **Dashboard use** | Summary columns in case lists | Detail views when case is opened |
| **Examples** | ClaimNumber, ApprovedByManager, Priority, TotalDamage, ReviewDeadline | Claim entity, Policy entity, DamagePhotos, AssessmentReport |

## 5.5 Milestone

A milestone is a plan item that represents a verifiable state in the case’s progression. CMMN defines milestones as plan items that complete when their entry sentry is satisfied. ACMN preserves this definition and extends it significantly.

### 5.5.1 Milestone criteria types (ACMN extension)

ACMN defines three milestone criteria types:

**Assertion: **A boolean expression evaluated against the case file state. The milestone is achieved when the expression evaluates to true. This is equivalent to CMMN’s milestone semantics.

**Confidence: **A threshold on an agent’s confidence score, optionally combined with a trajectory requirement. The milestone is achieved when the specified agent’s confidence meets or exceeds the threshold AND the trajectory matches (e.g., rising or stable). This has no CMMN equivalent.

**Composite: **A combination of assertion and confidence criteria, optionally requiring human validation. The milestone is achieved when all constituent criteria are satisfied. This has no CMMN equivalent.

### 5.5.2 Milestone achievement and snapshots (ACMN extension)

When a milestone is achieved, the implementation SHALL record: the timestamp of achievement, the identity of the participant whose action triggered achievement, the confidence score of the triggering agent (if applicable), and a snapshot of the complete case state at the moment of achievement.

The snapshot is a serialised copy of: all case file items, all agent instance states (working memory, confidence, turn count), all milestone states, and all wire buffer contents. The snapshot is immutable once created.

### 5.5.3 Milestone revocation (ACMN extension)

A milestone MAY define a revocation condition — a sentry that, if satisfied after the milestone has been achieved, causes the milestone to revert to the available state. When a milestone is revoked:

- All milestones achieved after the revoked milestone are also revoked (cascading revocation).

- The case state is restored from the revoked milestone’s snapshot.

- The revocation reason is added to the case file as a special case file item visible to agents.

- The stage containing the revoked milestone is re-activated with its entry sentry re-evaluated.

**NOTE: ***Milestone revocation enables agents to recover from incorrect conclusions when new evidence arrives. The audit trail retains a complete record of the revoked work, marked with a rollback indicator.*

## 5.6 Sentry

A sentry is a guard condition on a plan item or stage. A sentry is composed of an on-part (what event or state change triggers evaluation) and an optional if-part (what condition must be true for the sentry to be satisfied). ACMN preserves CMMN’s sentry model and extends it.

### 5.6.1 On-part types (ACMN extension)

CMMN defines two on-part types: plan item on-parts (triggered by plan item transitions) and case file item on-parts (triggered by case file changes). ACMN adds four additional on-part types:

| **On-part type** | **Trigger condition** |
| --- | --- |
| **Plan item** | (CMMN) A plan item transitions to a specified state (e.g., completed, terminated, failed). |
| **Case file item** | (CMMN) A case file item is created, updated, or deleted. |
| **Case variable** | (ACMN) A case variable is created or updated. Enables sentries to trigger on simple state changes such as an approval flag being set. |
| **Confidence** | (ACMN) An agent’s confidence score crosses a specified threshold or changes trajectory. |
| **Budget** | (ACMN) Token consumption for an agent or case reaches a specified threshold (e.g., 80%, 90%, 100% of budget). |
| **Timer** | (ACMN) A specified duration has elapsed since a reference point (case creation, stage entry, milestone achievement). |
| **Event** | (ACMN) A named event is published on the event bus matching the on-part’s event type filter. |

### 5.6.2 Sentry composition (ACMN extension)

ACMN introduces composition operators that combine multiple sentries into compound conditions:

**all_of: **All composed sentries must be satisfied. Equivalent to logical AND.

**any_of: **At least one composed sentry must be satisfied. Equivalent to logical OR.

**sequence: **Sentries must be satisfied in the specified order. The second sentry is only evaluated after the first is satisfied.

**unless: **The primary sentry is satisfied AND the negation sentry is NOT satisfied. Used for exclusion conditions.

Composition operators may be nested. Implementations SHALL evaluate composed sentries in the following priority order when multiple sentries have pending on-parts: plan item, case file item, confidence, budget, timer, event.

## 5.7 Human task

A human task is a plan item that requires a human actor to perform work. ACMN preserves CMMN’s human task semantics and extends them with case variable integration for form generation.

### 5.7.1 Human task forms (ACMN extension)

A human task MAY reference a set of case variables that define the task’s user interface. When a human task activates, the implementation generates a form from the referenced variables:

- **Form fields: **Each referenced case variable becomes a form field. The variable’s type determines the control: boolean renders as a checkbox, enum renders as a dropdown, date renders as a date picker, string renders as a text input, currency renders as a formatted number input.

- **Read-only context: **Variables referenced as read-only are displayed but not editable, providing context for the human’s decision (e.g., showing the Claim Number and Total Damage while the human decides on the Approval).

- **Conditional fields: **A human task MAY define visibility conditions on form fields: “show RejectionReason only when ApprovedByManager is false.” Conditions reference other case variables.

- **Submission: **When the human submits the form, the implementation updates the referenced case variables with the submitted values and records the update in the audit trail.

**NOTE: ***Implementations MAY provide richer form designers for complex human tasks. The case variable mechanism defines the minimum: a declarative form that the platform can generate automatically from variable references, with no custom form design required.*

## 5.8 Discretionary item

A discretionary item is a plan item that case participants may choose to activate. In CMMN, only human actors activate discretionary items through the planning table. In ACMN, agents MAY also activate discretionary items, subject to their tool access and context scope permissions.

## 5.9 Plan item decorators

CMMN defines a set of decorators — visual markers and behavioural properties — that modify how plan items participate in stage and case completion, activation, and repetition. ACMN preserves all CMMN decorators and extends their applicability to ACMN extension elements.

### 5.9.1 Decorator definitions

| **Decorator** | **Marker** | **Semantics** |
| --- | --- | --- |
| **Required** | ! | The plan item MUST complete (or terminate) before its containing stage or case plan model can complete. A stage with three plan items, two marked required, cannot complete until both required items have reached a terminal state — even if the third item is still available or active. |
| **Repetition** | # | The plan item can be instantiated multiple times within its containing stage. When a repeatable plan item completes, a new instance MAY be created if the plan item’s entry sentry is satisfied again. This enables iterative patterns without milestone revocation: an agent node marked with repetition can execute, complete, and execute again when new data arrives. |
| **AutoComplete** | ■ | Applies to stages and the case plan model only. When set, the container automatically completes when all its required plan items have reached a terminal state, without needing an explicit exit sentry. When not set, the container stays active until its exit sentry is satisfied, even if all work is done. Default: not set (explicit exit sentry required). |
| **Manual activation** | ▷ | The plan item does not activate automatically when its entry sentry is satisfied. Instead, it transitions to an enabled state and waits for explicit activation by a case participant. In CMMN, only human actors perform manual activation. In ACMN, agents MAY also manually activate plan items, subject to their context scope permissions. |
| **Planning table** | ⊞ | Applies to stages and the case plan model. The planning table defines which discretionary items are available for activation within the container. Discretionary items not listed in the planning table cannot be activated. In ACMN, the planning table also governs which discretionary items agents can see and choose to activate. |

### 5.9.2 Plan item lifecycle with decorators

The decorators modify the standard plan item lifecycle defined by CMMN. The key interactions are:

**Required + stage completion: **When a stage’s autoComplete is set, the stage evaluates completion by checking whether all plan items marked required have reached a terminal state (completed, terminated, or failed). Non-required plan items are ignored in this evaluation. If autoComplete is not set, the stage relies on its exit sentry regardless of required item status.

**Manual activation + entry sentry: **A plan item with manual activation transitions through: available → enabled (when entry sentry is satisfied) → active (when a participant explicitly activates it). Without manual activation, the transition is: available → active (immediately when entry sentry is satisfied). The enabled state is where the plan item waits for a participant’s decision.

**Repetition + completion: **When a repeatable plan item completes, the implementation evaluates its entry sentry again. If satisfied (which may occur immediately if the sentry’s conditions are still true, or later when new data arrives), a new instance is created. The repetition counter tracks how many instances have been created. Implementations MAY define a maximum repetition count to prevent infinite loops.

**Manual activation + agents (ACMN): **An agent participating in a stage can examine the planning table to discover available discretionary items with manual activation. The agent MAY choose to activate a discretionary item if its context scope grants access. This enables adaptive case management: an agent decides, based on its analysis, that an optional investigation sub-stage should be activated.

### 5.9.3 Decorator applicability

Not all decorators apply to all element types. The following table defines which decorators are applicable to each CMMN and ACMN element type. A checkmark indicates the decorator is applicable; an empty cell indicates it is not.

| **Element** | **Plan table** | **Entry sentry** | **Exit sentry** | **Auto complete** | **Manual activation** | **Required** | **Repetition** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Case plan model** | ✓ |  |  | ✓ |  |  |  |
| **Stage** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Human task** |  | ✓ | ✓ |  | ✓ | ✓ | ✓ |
| **Milestone** |  | ✓ |  |  |  | ✓ | ✓ |
| **Event listener** |  |  |  |  |  |  |  |
| **Case file item** |  |  |  |  |  |  |  |

**ACMN extension elements: **The following table extends the applicability matrix for ACMN-specific plan item types:

| **Element** | **Plan table** | **Entry sentry** | **Exit sentry** | **Auto complete** | **Manual activation** | **Required** | **Repetition** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Agent node** |  | ✓ | ✓ |  | ✓ | ✓ | ✓ |
| **Tool node** |  |  |  |  |  |  |  |
| **Guardrail node** |  |  |  |  |  | ✓ |  |
| **Evaluation node** |  | ✓ |  |  |  | ✓ |  |
| **Handoff node** |  | ✓ |  |  |  | ✓ |  |
| **Connector node** |  |  |  |  |  |  |  |

### 5.9.4 ACMN applicability notes

**Agent node: **Supports all decorators except planning table and autoComplete (which are container-only). Entry and exit sentries control when the agent activates and terminates. Manual activation enables patterns where the case design makes an agent available but a human or another agent decides whether to actually deploy it. Required ensures the agent must complete its work before the stage can close. Repetition is essential for iterative patterns: an agent can execute, terminate, and be re-instantiated when new evidence arrives — without requiring a milestone revocation.

**Tool node: **Tool nodes are capability declarations, not executable plan items. They do not participate in the plan item lifecycle and no decorators apply. Tools are invoked by agents, not activated by the runtime.

**Guardrail node: **Guardrail nodes are evaluated reactively when agent output is produced, not activated through the plan item lifecycle. The required decorator is applicable: a required guardrail means the stage cannot complete unless the guardrail has been evaluated at least once (ensuring that the guardrail wasn’t bypassed by an agent that produced no output).

**Evaluation node: **Entry sentry controls when the evaluation node becomes active (typically satisfied when the upstream agent produces its first output). Required ensures evaluation must complete (pass or exhaust retries) before the stage can close.

**Handoff node: **Entry sentry controls when the handoff becomes available. Required ensures the handoff must execute before the stage completes — useful when a stage’s purpose is to prepare and deliver a handoff bundle to the next stage’s participants.

**Connector node: **Connector nodes sit outside the case plan model and do not participate in the plan item lifecycle. No decorators apply. Connectors are always-on listeners managed by the implementation’s infrastructure, not by the case lifecycle.

## 5.10 Case intake (ACMN extension)

CMMN does not define how cases are created — cases are assumed to be instantiated by external action. ACMN introduces a composable case intake model that uses connector nodes to receive external signals and, optionally, agent nodes to add intelligence. Case intake uses the same elements that exist within cases (agent nodes, evaluation nodes, guardrails, human tasks), composed upstream of the case plan model on the design surface.

### 5.10.1 Composable intake model

ACMN defines case intake as a composition of existing elements, not as a separate subsystem. The simplest intake is a connector node wired directly to the case plan model. The most complex intake adds agent evaluation, guardrails, and human review — using the same elements that appear inside cases. This means there is nothing new for case designers to learn when they move from simple to evaluated intake:

**Simple intake: **Connector → Case. A connector node monitors an external source and every qualifying signal creates a case. Field mapping rules on the connector define how signal data maps to case input. No AI, no classification, fully deterministic.

**Evaluated intake: **Connector → Agent → Case. An agent node sits between the connector and the case plan model. The agent classifies the signal, extracts structured data, and determines whether a case should be created. The agent node is a standard agent node (Section 6.1) with persona, reasoning strategy, and confidence model.

**Rich intake: **Connector → Agent → Evaluator → Case. An evaluation node checks the agent’s classification quality. A guardrail node enforces rules (“never create cases for automated notifications”). A human task handles low-confidence classifications. All using elements already defined in Sections 6.1–6.5.

**NOTE: ***The queuing infrastructure required for reliable signal processing is transparent to the user. Implementations SHALL queue signals internally between the connector and downstream elements, handling retries, ordering, and delivery guarantees. The queue is infrastructure, not a design element — it does not appear on the canvas.*

### 5.10.2 Connector node

The connector node is a new plan item type (fully defined in Section 6.6) that represents an external signal source. It monitors an external system and emits structured signals through its output port. Connectors are positioned upstream of the case plan model on the design surface.

ACMN defines the following built-in connector types:

| **Connector type** | **Semantics** |
| --- | --- |
| **Email** | Monitors an email inbox. Configurable filters: sender patterns, subject patterns, folder, attachment presence. Each matching email is emitted as a signal. |
| **Webhook** | Exposes an HTTP endpoint. External systems POST data to this endpoint. Each request is emitted as a signal. |
| **File watch** | Monitors a directory or object storage path for new files. Each new file is emitted as a signal. |
| **Schedule** | Polls an external system on a defined schedule (cron expression). Each qualifying result is emitted as a signal. |
| **Database** | Polls a database table or view for new or changed rows. Configurable query, poll interval, and change detection column. |
| **Event** | Subscribes to the ACMN event bus. Enables cross-domain case spawning: an event in one domain triggers case creation in another. |
| **API** | Exposes a REST endpoint for programmatic case creation by external systems. |

Implementations MAY support additional connector types beyond the built-in set. Implementations MAY provide an adapter mechanism for loading third-party connector packages, extending the connector catalogue without modifying the platform core.

### 5.10.3 Direct intake (connector to case)

In the simplest intake pattern, a connector node’s output port is wired directly to the case plan model. Every signal that passes the connector’s filter rules creates a case. The connector defines:

- **Filter rules: **Conditions that signals must meet before triggering case creation. Signals that fail the filter are discarded. For an email connector: sender pattern, subject pattern, presence of attachments. For a file watch: file name pattern, minimum file size.

- **Field mapping: **How signal data maps to the case’s input schema. Each mapping pairs a field in the signal (email subject, webhook payload field, file name, database column) to a field in the target case plan model’s input. Mapping may include static values and simple expressions.

- **Target case plan model: **The case plan model to instantiate. For direct intake, this is always a single, fixed case plan model.

Direct intake is fully deterministic. No LLM invocation occurs. Every qualifying signal produces exactly one case. This is appropriate for well-structured intake sources where the signal format is known and every signal represents a valid case.

### 5.10.4 Evaluated intake (connector to agent to case)

When signals are ambiguous, unstructured, or may represent multiple case types, an agent node is wired between the connector and the case plan model. The agent node receives the connector’s output and performs classification, data extraction, and routing:

- **Classification: **The agent determines the case type (“this email is an onboarding request” vs “this is a payslip query” vs “this is not relevant”). The agent may reference decision tables from the domain context for structured classification.

- **Data extraction: **The agent extracts structured data from the unstructured signal (employee name, start date, department from an email body). The extracted data is validated against the target case plan model’s input schema.

- **Routing: **When the connector serves multiple case types, the agent selects the appropriate case plan model based on classification.

- **Rejection: **The agent may determine that a signal does not warrant case creation. Rejected signals are logged but no case is created.

Because the upstream agent is a standard agent node, all agent capabilities are available: confidence scoring (with trajectory), reasoning strategies (react, plan_execute, reflect), tool access (the agent can call tools to enrich the signal data), and working memory (the agent can reference recent classifications for deduplication).

Additional elements can be composed into the intake pipeline using standard ACMN wiring:

- **Evaluation node: **Wired after the agent to assess classification quality. If the evaluation fails, feedback is returned to the agent for re-classification (the standard evaluation loop from Section 6.5).

- **Guardrail node: **Wired after the agent to enforce intake-specific rules (“never create cases for signals from automated systems”, “reject signals with no identifiable subject”).

- **Human task: **Wired to the agent’s low-confidence output or the guardrail’s review output, providing human review for borderline classifications before case creation.

**NOTE: ***The intake agent operates before any case exists. It cannot access case file items, milestones, or sentries because there is no case yet. Its context consists of: the raw signal from the connector, the domain vocabulary, applicable decision tables, and its own working memory (which may include recent classification history for deduplication). After case instantiation, the agent’s reasoning trace and the original signal are attached to the new case’s audit trail as the case’s provenance record.*

### 5.10.5 Visual notation

Connector nodes are rendered upstream (to the left) of the case plan model on the design surface. A connector node uses a rounded rectangle with a distinct icon indicating the connector type (envelope for email, lightning bolt for webhook, folder for file watch, clock for schedule, database cylinder for database poll). The connector’s output port connects either directly to the case plan model boundary (direct intake) or to an agent node positioned between the connector and the case (evaluated intake).

In live monitoring mode, the connector shows a pulse indicator when signals are being received, a count of signals processed, and the connector’s health status (connected, polling, error).

# 6. ACMN extension elements

The following plan item types are defined by ACMN and have no CMMN equivalent. Five operate within the case plan model (agent, tool, guardrail, evaluation, handoff) and one operates upstream of it (connector).

## 6.1 Agent node

An agent node is a plan item that represents an autonomous AI participant in a case. An agent node defines the behavioural specification for an agent instance that will be created at runtime when the node’s entry sentry is satisfied.

The agent node has nine property groups:

### 6.1.1 Identity

| **Property** | **Type** | **Description** |
| --- | --- | --- |
| **id** | String | Unique identifier within the case plan model. |
| **name** | String | Human-readable name displayed on the design surface. |
| **persona** | String | Natural language description of the agent’s role, expertise, and behavioural guidelines. Included in the agent’s system prompt. |
| **description** | String? | Optional longer description for documentation purposes. |

### 6.1.2 Model configuration

| **Property** | **Type** | **Description** |
| --- | --- | --- |
| **model** | String | Model identifier (e.g., “claude-sonnet-4-20250514”). Resolved by the implementation’s model gateway. |
| **temperature** | Float? | Sampling temperature. Default determined by implementation. |
| **max_context_tokens** | Integer? | Maximum tokens in the assembled context window. Exceeding this triggers priority-based truncation. |
| **max_output_tokens** | Integer? | Maximum tokens in the model’s response. |

### 6.1.3 Tool access

| **Property** | **Type** | **Description** |
| --- | --- | --- |
| **allowed_tools** | List<String> | Tool IDs this agent may invoke. The agent’s effective tool set is the intersection of: allowed_tools ∩ stage tool scope ∩ domain tool catalogue. |
| **tool_policy_overrides** | Map<String, Policy>? | Per-tool invocation policy overrides (auto, confirm_first, supervised). Overrides the tool’s default policy for this agent. |

### 6.1.4 Context scope

| **Property** | **Type** | **Description** |
| --- | --- | --- |
| **readable_case_file_items** | List<String>│"all" | Which case file items the agent can see in its context window. |
| **writable_case_file_items** | List<String>│"all" | Which case file items the agent can write to. |
| **thread_visibility** | Enum | own (sees only its own turns), stage (sees all turns in current stage), case (sees all turns in the case). |

### 6.1.5 Reasoning strategy

| **Property** | **Type** | **Description** |
| --- | --- | --- |
| **strategy** | Enum | react (single LLM call per turn), plan_execute (planning phase then step execution), reflect (output + self-evaluation), debate (multi-perspective synthesis). |
| **max_turns** | Integer? | Maximum number of turns before the agent is terminated. Default: no limit. |
| **reflection_criteria** | String? | Criteria for the reflect strategy’s self-evaluation pass. Required if strategy is reflect. |

### 6.1.6 Confidence model

| **Property** | **Type** | **Description** |
| --- | --- | --- |
| **initial_confidence** | Float | Confidence score assigned when the agent instance is created. Default: 0.5. |
| **trajectory_window** | Integer | Number of recent turns used to compute confidence trajectory. Default: 5. |
| **oscillation_threshold** | Float? | If confidence swings by more than this amount between consecutive turns, trajectory is classified as oscillating. |

### 6.1.7 Input/output ports

An agent node MAY define named input ports and named output ports. Each port has a name and a type (referencing a domain entity schema, value object schema, or built-in type). Ports are the connection points for data wires (see Section 7).

An agent node also has two implicit ports that are always present: an error output port (emitting structured error information when the agent encounters an unrecoverable problem) and a handoff output port (emitting a handoff context bundle when the agent requests escalation).

### 6.1.8 Lifecycle

| **Property** | **Type** | **Description** |
| --- | --- | --- |
| **on_activate** | Action? | Action to execute when the agent instance is created. Typically: initialise working memory. |
| **on_terminate** | Enum | archive (preserve full state for forensics) or discard (retain summary only). Default: archive. |
| **idle_timeout** | Duration? | If the agent receives no new input for this duration, it is suspended. |

### 6.1.9 State persistence

| **Property** | **Type** | **Description** |
| --- | --- | --- |
| **turn_retention** | Enum | full (retain complete turn data in working memory), summary (retain AI-generated summary), result_only (retain only structured output). Default: summary. |
| **promotion_rules** | List<Rule>? | Rules for promoting agent state to the case file after each turn or on termination. |

### 6.1.10 Context assembly

When an agent executes a turn, the implementation assembles a context window from multiple layers. This section defines the assembly order and truncation priority that implementations SHALL follow.

The context window is assembled from the following layers, listed from highest to lowest priority:

| **#** | **Layer** | **Contents** |
| --- | --- | --- |
| 1 | **System** | The agent’s persona, reasoning strategy instructions, and any strategy-specific prompts (reflection criteria for reflect, debate framing for debate). This layer defines who the agent is. |
| 2 | **Domain** | Domain vocabulary (the glossary of terms), applicable decision tables (filtered by the current stage’s cognitive mode), and domain rules presented as constraints. This layer establishes the language and rules the agent reasons within. |
| 3 | **Case variables** | All case variables with their current values. Small and always relevant — the agent always knows the case identifier, status flags, approval states, and key metrics. |
| 4 | **Wire inputs** | Data delivered to the agent’s input ports via wires, including buffered values and transform results. This is the immediate trigger for the current turn. |
| 5 | **Evaluation feedback** | If this turn is a retry after an evaluation failure: the evaluation scores, failed criteria, and natural language feedback from the previous attempt. |
| 6 | **Case file items** | Case file items matching the agent’s readable_case_file_items scope. Milestone states (achieved, available, revoked). The current stage context (stage name, cognitive mode). |
| 7 | **Conversation** | The agent’s own turn history, governed by thread_visibility and turn_retention settings. If thread_visibility is stage, includes other agents’ turns within the current stage. If case, includes all agents’ turns. |
| 8 | **Working memory** | The agent’s private scratchpad from prior turns. Retained summaries, intermediate reasoning, and notes the agent has written to itself. |

### 6.1.10.1 Truncation

When the assembled context exceeds the agent’s max_context_tokens, the implementation SHALL truncate by removing content from the lowest-priority layer first. The truncation order (from first removed to last removed) is:

- Working memory — oldest entries removed first.

- Conversation history — oldest turns removed first, preserving the most recent turns.

- Case file items — items least recently accessed by this agent removed first.

- Evaluation feedback — only removed if the context is still too large after removing all lower-priority content.

The implementation SHALL NOT truncate layers 1–4 (system, domain, case variables, wire inputs). These layers are always included in full. If layers 1–4 alone exceed max_context_tokens, the implementation SHALL log a warning and proceed with the system and domain layers only.

**NOTE: ***The priority order ensures that an agent never forgets its persona, its domain language, the current case state, or the data that triggered this turn. It may forget old conversation history or working memory notes, which is acceptable — these are the least critical for the current turn’s reasoning.*

### 6.1.10.2 Domain memory (informative)

Implementations MAY maintain domain memory — knowledge accumulated across completed cases within a domain context, such as resolution patterns, case summary embeddings, and performance metrics. When domain memory is supported, the implementation MAY include retrieved domain knowledge as an additional layer between the domain layer (2) and the case variables layer (3) during context assembly.

The mechanism for domain memory storage, retrieval, and relevance ranking is an implementation choice. The standard does not prescribe a specific approach (vector embeddings, keyword search, or other retrieval methods).

## 6.2 Tool node

A tool node is a plan item that represents an external capability available to agents within the case. A tool node is not a task that executes — it is a declaration that a tool exists and is available for agent invocation.

| **Property** | **Type** | **Description** |
| --- | --- | --- |
| **tool_id** | String | Unique identifier. Resolved by the implementation’s tool registry. |
| **name** | String | Human-readable name. |
| **description** | String | Natural language description of the tool’s purpose. Included in agent prompts. |
| **input_schema** | JSON Schema | Expected input parameters. |
| **output_schema** | JSON Schema | Expected output format. |
| **invocation_policy** | Enum | auto (invoke without approval), confirm_first (require human approval before invocation), supervised (invoke but hold result for human review). |

## 6.3 Guardrail node

A guardrail node is a plan item that defines a constraint on agent output. When an agent produces output, the implementation SHALL evaluate all applicable guardrails before committing the output to the case file.

| **Property** | **Type** | **Description** |
| --- | --- | --- |
| **name** | String | Human-readable name. |
| **rules** | List<Rule> | Constraint rules. Each rule has a condition expression and a violation action (reject, flag_for_review, annotate). |
| **scope** | Enum | agent (applies to a specific agent), stage (applies to all agents in a stage), case (applies to all agents in the case). |
| **evaluation_mode** | Enum | rule_based (evaluate condition expressions), llm_based (use an LLM to evaluate the rule in natural language), hybrid (rule-based with LLM fallback for ambiguous cases). |

## 6.4 Handoff node

A handoff node is a plan item that defines how context is transferred between case participants. When an agent or human task triggers a handoff, the handoff node assembles a context bundle from the specified sources and delivers it to the target participant.

| **Property** | **Type** | **Description** |
| --- | --- | --- |
| **source_items** | List<String> | Case file items to include in the handoff bundle. |
| **include_reasoning** | Boolean | Whether to include the source agent’s reasoning trace. Default: true. |
| **include_confidence** | Boolean | Whether to include the source agent’s confidence history. Default: true. |
| **summary_prompt** | String? | If provided, an LLM generates a summary of the handoff context using this prompt, rather than including raw data. |

## 6.5 Evaluation node

An evaluation node is a plan item that independently assesses an agent’s output against quality criteria before that output is committed to the case file or delivered downstream via wires. Unlike guardrail nodes (which check binary constraints), evaluation nodes perform qualitative assessment: Is this analysis thorough? Does the recommendation address all evidence? Is the reasoning sound?

The evaluation node creates a feedback loop: when evaluation fails, the evaluator produces structured feedback that is routed back to the producing agent as input for its next turn, enabling the agent to revise and resubmit. This cycle continues until the evaluation passes or the retry limit is reached.

**NOTE: ***Guardrails answer “does this output violate a rule?” Evaluators answer “is this output good enough?” Both are necessary. Guardrails enforce hard constraints (compliance, safety). Evaluators enforce quality expectations (completeness, accuracy, coherence). A well-designed case applies both: guardrails first (reject violations immediately), then evaluators (assess quality of compliant output).*

### 6.5.1 Evaluation node properties

| **Property** | **Type** | **Description** |
| --- | --- | --- |
| **name** | String | Human-readable name (e.g., “Assessment quality check”). |
| **criteria** | List<Criterion> | Quality criteria the output is assessed against. Each criterion has a name, a natural language description, and a weight (relative importance). See Section 6.5.2. |
| **evaluator** | EvaluatorConfig | How evaluation is performed. See Section 6.5.3. |
| **max_retries** | Integer | Maximum number of evaluation-feedback-retry cycles before the evaluation node escalates. Default: 3. |
| **feedback_template** | String? | Optional template for formatting evaluation feedback before it is sent back to the producing agent. If omitted, the raw evaluation result is used. |
| **on_exhausted** | Enum | Action when max_retries is exhausted: escalate (send to human via escalation wire), accept_best (forward the highest-scoring attempt), fail (block output and terminate the producing agent). Default: escalate. |

### 6.5.2 Evaluation criteria

Each criterion defines one dimension of quality. Multiple criteria provide a structured assessment rubric:

| **Property** | **Type** | **Description** |
| --- | --- | --- |
| **name** | String | Criterion name (e.g., “Completeness”, “Evidence support”, “Consistency”). |
| **description** | String | Natural language description of what constitutes a pass for this criterion. This is included in the evaluator’s prompt. |
| **weight** | Float | Relative importance (0.0 to 1.0). Weights across all criteria SHOULD sum to 1.0. Used to compute a composite evaluation score. |
| **threshold** | Float | Minimum score (0.0 to 1.0) for this criterion to pass. Default: 0.7. |

The overall evaluation passes when all criteria meet their individual thresholds. Implementations MAY additionally compute a weighted composite score across all criteria.

### 6.5.3 Evaluator configuration

The evaluator property specifies how the evaluation is performed. ACMN defines four evaluator types:

**LLM evaluator (default): **An LLM assesses the output against the criteria descriptions. The evaluator assembles a prompt containing the agent’s output, the evaluation criteria, relevant case context, and instructions to produce a per-criterion score and natural language feedback. The model used for evaluation SHOULD differ from the producing agent’s model to provide independent assessment.

**Agent evaluator: **A separate agent node is designated as the evaluator. The agent output is delivered to the evaluator agent via a wire, and the evaluator agent’s output is parsed for pass/fail and feedback. This is the most flexible option — the evaluator agent can use tools, query the case file, and apply domain expertise.

**Human evaluator: **The output is routed to a human task for review. The human provides a pass/fail decision and optional feedback. This is the slowest but highest-fidelity evaluation method.

**Composite evaluator: **Combines multiple evaluator types. For example: LLM evaluation first, with human evaluation triggered only when the LLM evaluator’s confidence in its assessment is below a threshold. This enables efficient scaling — most outputs are evaluated automatically, with human review only for borderline cases.

### 6.5.4 Ports and wiring

An evaluation node has four ports:

| **Port** | **Direction** | **Purpose** |
| --- | --- | --- |
| **input** | Input | Receives the output from the agent being evaluated. Connected via a data wire from the agent’s output port. |
| **approved** | Output | Forwards output that has passed evaluation. Connected to downstream agents, case file wires, or milestones. |
| **feedback** | Output | Sends evaluation feedback back to the producing agent’s input port on evaluation failure. This creates the feedback loop. |
| **escalation** | Output | Activated when max_retries is exhausted and on_exhausted is set to escalate. Connects to a human task or more capable agent. |

On the design surface, the evaluation node appears between the producing agent and its downstream consumers. The feedback wire from the evaluation node back to the producing agent creates a visible loop that communicates the retry semantics.

### 6.5.5 Evaluation lifecycle

When an agent produces output on a port connected to an evaluation node, the following sequence occurs:

- The agent’s output is delivered to the evaluation node’s input port.

- The evaluator assesses the output against all criteria, producing a per-criterion score and natural language feedback.

- If all criteria pass their thresholds: the output is forwarded via the approved port. The evaluation trace records a pass.

- If any criterion fails: the evaluation feedback (including which criteria failed, the scores, and the natural language feedback) is delivered to the producing agent via the feedback port. The agent’s retry counter is incremented.

- The producing agent receives the feedback as input on its next turn. The feedback is presented distinctly from other inputs — implementations SHOULD format it as: “Your previous output was evaluated and did not meet the following criteria: [feedback]. Please revise your output.”

- The agent produces revised output, which is again delivered to the evaluation node. The cycle repeats from step (b).

- If the retry counter exceeds max_retries, the on_exhausted action is taken: escalate (output sent to escalation port), accept_best (the attempt with the highest composite score is forwarded via approved port), or fail (output blocked, agent terminated).

The complete evaluation history — every attempt, its per-criterion scores, the feedback provided, and the final outcome — SHALL be recorded in the audit trail as part of the evaluation node’s trace log.

### 6.5.6 Relationship to guardrails

Guardrail nodes and evaluation nodes serve complementary purposes and may both be applied to the same agent’s output. When both are present, implementations SHALL apply them in the following order:

- Domain rules (Section 9.4) are evaluated first. If any domain rule rejects the output, evaluation does not occur.

- Guardrail nodes are evaluated second. If any guardrail rejects the output, evaluation does not occur.

- Evaluation nodes are evaluated last, only on output that has passed all guardrails.

This ordering ensures that fundamentally non-compliant output is rejected immediately (guardrails) without wasting evaluation resources, while compliant-but-insufficient output enters the evaluation-feedback loop for iterative improvement.

## 6.6 Connector node

A connector node is a plan item that represents an external signal source for case intake. Unlike other plan items, connector nodes are positioned upstream of the case plan model on the design surface — they model how cases are created, not what happens within a case.

Connector nodes are passive listeners: they monitor an external system and emit structured signals through their output port when qualifying events occur. A connector node does not perform classification, extraction, or routing — those capabilities are provided by agent nodes wired downstream of the connector (see Section 5.10).

### 6.6.1 Connector node properties

| **Property** | **Type** | **Description** |
| --- | --- | --- |
| **name** | String | Human-readable name (e.g., “Payroll inbox”, “HR webhook”, “Onboarding folder”). |
| **connectorType** | ConnectorType | The type of external system: email, webhook, file_watch, schedule, database, event, api. See Section 5.10.2. |
| **connectionConfig** | Map | Type-specific connection parameters. For email: server, credentials reference, folder, polling interval. For webhook: endpoint path, authentication. For file watch: directory path, file pattern. For database: connection string, query, poll interval, change detection column. |
| **filterRules** | List<Rule>? | Optional rules applied to incoming signals. Signals that fail the filter are discarded silently. Evaluated before any downstream processing. |
| **fieldMapping** | List<Mapping>? | For direct intake (connector wired directly to case plan model): maps signal fields to case input fields. Each mapping pairs a source field path to a target field path, with optional static values and expressions. |
| **targetCasePlanModel** | CasePlanModelRef? | For direct intake: the case plan model to instantiate. Required when the connector is wired directly to the case plan model. Not used when an agent node handles routing. |
| **maxDailySignals** | Integer? | Optional limit on signals processed per day. Prevents runaway processing from misconfigured connectors or noisy sources. |
| **active** | Boolean | Whether this connector is currently listening. Default: true. |
| **adapterPackage** | String? | For third-party connectors: the package identifier providing the connector adapter implementation. If omitted, the connector uses a built-in adapter. |

### 6.6.2 Ports

A connector node has one output port:

- **signal: **Emits a structured object containing the signal data (email body, webhook payload, file contents, database row, etc.), signal metadata (timestamp, source identifier, signal type), and any fields extracted by the field mapping rules.

Connector nodes have no input ports. They are source-only elements — data flows out of connectors, never into them.

### 6.6.3 Third-party connector adapters

Implementations MAY support loading third-party connector adapters from package registries. The adapter mechanism allows the connector catalogue to be extended without modifying the platform core. An adapter package provides: a connector type identifier, a configuration schema (used to generate the property panel in the editor), and a runtime implementation that connects to the external system and emits signals.

Implementations that support third-party connector adapters SHOULD present them in the editor palette as a distinct category, clearly indicating their community-contributed origin. Third-party adapters may have compatibility limitations depending on their source ecosystem.

**NOTE: ***The adapter mechanism enables implementations to leverage existing integration ecosystems. By wrapping connectors from established automation platforms, an ACMN implementation can offer a broad catalogue of integrations for email, databases, SaaS platforms, IoT protocols, and cloud services without building each connector from scratch.*

# 7. Wire model

Wires are typed, directed data connections between ports on plan items. Wires are an ACMN extension with no CMMN equivalent. They complement (not replace) the case file: wires model directed point-to-point data flow between specific plan items, while the case file models shared ambient state.

## 7.1 Wire types

| **Wire type** | **Semantics** |
| --- | --- |
| **Data** | Carries typed data from an output port to an input port. The default wire type. |
| **Confidence-gated** | A data wire with an inline gate. Data flows only when the source agent’s confidence meets the gate’s threshold and trajectory requirements. Blocked data may be routed to an alternative target. |
| **Escalation** | Carries handoff context bundles to human tasks or more capable agents. Activated on low confidence, budget exhaustion, guardrail violation, or explicit agent request. |
| **Event** | Carries asynchronous events between plan items via the event bus. Can cross stage boundaries. |
| **Case file** | Explicitly models a plan item reading from or writing to a specific case file item. Optional — agents can always access the case file through their context scope. |

## 7.2 Wire properties

| **Property** | **Type** | **Description** |
| --- | --- | --- |
| **source** | PortRef | node_id.port_name identifying the output port. |
| **target** | PortRef | node_id.port_name identifying the input port. |
| **type** | Enum | data, confidence_gated, escalation, event, case_file. |
| **buffer_strategy** | Enum | latest_wins (retain only most recent value), queue (retain all values in order), accumulate (merge values using a specified strategy). Default: latest_wins. |
| **required** | Boolean | If true, the target plan item cannot activate until data has arrived on this wire, in addition to its entry sentry being satisfied. Default: false. |
| **transform** | Transform? | An optional inline transform: static_mapping (field renaming/restructuring), expression (computed fields), or agent_backed (LLM-powered prose-to-schema conversion). |

## 7.3 Type compatibility

Wires enforce type compatibility between source and target ports. An implementation SHALL validate wire connections at design time using the following rules:

- **Exact match: **The output port type equals the input port type. Always valid.

- **Subtype: **The output port type is a subtype of the input port type (e.g., CollisionClaim is a subtype of Claim). Valid.

- **Supertype: **The output port type is a supertype of the input port type. WARNING — the target may expect fields that the source does not provide.

- **Incompatible: **No subtype/supertype relationship exists. ERROR — a transform is required to connect these ports.

# 8. Event model

ACMN defines an event model for asynchronous communication between case participants and with external systems.

## 8.1 Event structure

An ACMN event has: a unique identifier, a type (from the domain context’s event catalogue), a delivery scope, a source (the plan item, adapter, or system component that published the event), a typed payload (validated against the event type’s schema), a timestamp, and optional correlation and causation identifiers for event tracing.

## 8.2 Delivery scopes

**Case: **The event is delivered only within the originating case instance. This is the default scope.

**Domain: **The event is delivered to all active case instances within the same domain context, subject to subscription filters.

**Organisation: **The event is delivered across all domain contexts. Reserved for system-wide events.

**External: **The event originates from outside the ACMN runtime and enters through an adapter. External events are always targeted to a specific case or domain.

## 8.3 System events

Implementations SHALL publish the following system events on the event bus. These events are case-scoped and cannot be published by agents:

- agent.activated, agent.suspended, agent.terminated

- milestone.achieved, milestone.revoked

- stage.entered, stage.exited

- guardrail.violated

- budget.warning (at configurable thresholds)

- case.rollback

# 9. Domain context model

A domain context defines the semantic framework within which a case operates. It provides the shared language, data structures, and governance rules that ensure all case participants — agents, human actors, and tools — operate with consistent meaning. A case plan model is bound to exactly one domain context.

Domain contexts are reusable, versioned, and distributable. A well-curated domain context (vocabulary, schemas, rules, decision tables) represents significant domain expertise that can be shared across case plan models, across teams, and across organisations through package registries. On the design surface, the domain context is a visible, draggable element that case designers select from a library and apply to their cases.

The domain context model draws on the concept of a bounded context from Domain-Driven Design. ACMN adopts three core ideas from DDD: a shared vocabulary (ubiquitous language), typed schemas for domain data (entities and value objects), and domain-wide invariants (business rules). These three elements are normative. Implementations at conformance Level 3 SHALL support all three.

**NOTE: ***The UML diagram above shows the complete domain context metamodel. The normative requirements below focus on the three core elements: vocabulary, schemas, and domain rules. The remaining elements (domain events, agent templates, tool catalogues, context mapping) are informative — implementations MAY support them but are not required to.*

## 9.1 Domain context properties

| **Property** | **Type** | **Description** |
| --- | --- | --- |
| **id** | UUID | Unique identifier for this domain context. |
| **name** | String | Human-readable domain name (e.g., “Insurance claims”, “Procurement”). |
| **version** | SemVer | Semantic version. Cases are bound to a specific version at creation. |
| **vocabulary** | Vocabulary | Required. The domain’s shared terminology. See Section 9.2. |
| **entitySchemas** | List<Schema> | Required. Typed schemas for domain entities. See Section 9.3. |
| **valueObjectSchemas** | List<Schema> | Required. Typed schemas for domain value objects. See Section 9.3. |
| **domainRules** | List<Rule> | Required. Business invariants for all cases in this domain. See Section 9.4. |
| **decisionModels** | List<DecisionModel>? | Optional. Collections of decision tables codifying domain decision logic. See Section 9.5. |
| **domainEvents** | List<EventType>? | Optional. Catalogue of typed events with payload schemas for this domain. |
| **toolCatalogue** | List<ToolRef>? | Optional. Tools available within this domain context. |
| **packageId** | String? | For published domain contexts: the package registry identifier (e.g., “@acmn-domains/insurance-claims”). Enables installation from package registries. |
| **origin** | Origin? | If this context was copied from another, records the source context’s id, name, and version. Enables traceability back to the original. |
| **description** | String? | Human-readable description of the domain context’s purpose, scope, and intended use. Displayed in library catalogues and package registries. |
| **tags** | List<String>? | Searchable tags for library and registry discovery (e.g., [“insurance”, “claims”, “property-damage”]). |

## 9.2 Vocabulary

The vocabulary is a glossary of domain terms, each with a name and a natural language definition. It establishes the shared language that all case participants use. In an insurance claims domain, the vocabulary defines what “claim,” “claimant,” “settlement,” and “excess” mean precisely, preventing ambiguity when agents reason about these concepts.

### 9.2.1 Vocabulary structure

| **Property** | **Type** | **Description** |
| --- | --- | --- |
| **terms** | Map<String, Def> | Map of term names to definitions. Each definition is a natural language string. |
| **synonyms** | Map<String, String>? | Optional map of synonyms to canonical terms (e.g., “repair shop” → “repairer”). Used by implementations to normalise terminology. |

### 9.2.2 Vocabulary injection

Implementations SHALL make the domain vocabulary available to agents during context assembly. The vocabulary SHOULD be included in the agent’s context before case-specific data, so that the agent understands domain terminology before encountering domain-specific content.

The mechanism of inclusion is an implementation choice. Typical approaches include: formatting the vocabulary as a glossary section in the agent’s system prompt, providing it as a reference document in the agent’s context, or embedding term definitions inline alongside case file items that use those terms.

**NOTE: ***The vocabulary serves a dual purpose. First, it gives agents consistent terminology for reasoning — an agent that knows the domain definition of “excess” won’t confuse it with the everyday meaning. Second, it enables domain-scoped retrieval — when querying domain memory, the vocabulary’s canonical terms produce better matches than ad-hoc terminology.*

## 9.3 Entity and value object schemas

Schemas define the structure of domain data. ACMN distinguishes two kinds, following DDD conventions:

**Entity schema: **Defines an object with identity and lifecycle. Entities have a unique identifier field, and their identity persists across state changes. Examples: Claim, Policy, Claimant, Order, Employee. Entity instances in the case file can be referenced by other entities and tracked across stages.

**Value object schema: **Defines an object without identity, characterised entirely by its attributes. Two value objects with the same attributes are interchangeable. Examples: Address, CostEstimate, DamageItem, DateRange. Value objects are typically embedded within entities.

### 9.3.1 Schema structure

Each schema (entity or value object) defines:

| **Property** | **Type** | **Description** |
| --- | --- | --- |
| **name** | String | The schema name. SHOULD match a term in the domain vocabulary. |
| **fields** | List<Field> | Ordered list of fields. Each field has a name, a type (primitive, schema reference, or list), and a required flag. |
| **identity** | FieldRef? | Entity schemas only. The field that uniquely identifies instances. Value object schemas SHALL NOT have an identity field. |

### 9.3.2 Schema usage

Schemas are referenced in three places within an ACMN model:

- **Case file items. **Each case file item declares its type by referencing a domain schema. Implementations SHALL validate case file writes against the referenced schema. Invalid writes (missing required fields, wrong field types) SHALL be rejected.

- **Port types. **Input and output ports on agent nodes, tool nodes, and other plan items declare their data type by referencing a domain schema. Wire type compatibility (Section 7.3) is evaluated against these schema references.

- **Event payloads. **Domain events (if defined) declare payload schemas. Published events are validated against their event type’s schema.

Schemas support subtype relationships: if schema CollisionClaim extends schema Claim (adding fields specific to collision claims), a port typed as Claim will accept data typed as CollisionClaim (subtype compatibility, per Section 7.3).

## 9.4 Domain rules

Domain rules are business invariants that apply to every case operating within the domain context. They represent governance constraints that are universal to the domain — regulatory requirements, compliance obligations, risk policies, or fundamental business logic that no individual case should override.

### 9.4.1 Rule structure

| **Property** | **Type** | **Description** |
| --- | --- | --- |
| **name** | String | Human-readable rule name. |
| **description** | String | Natural language description of the invariant. |
| **condition** | Expression? | For rule-based evaluation: a boolean expression over case state. If omitted, the rule requires LLM-based evaluation using the description. |
| **action** | Enum | reject (block the agent output), flag_for_review (queue for human review), annotate (allow but attach a warning). |

### 9.4.2 Inheritance semantics

Domain rules are inherited by every case in the domain as guardrails. The inheritance follows a strict additive model:

- **Domain rules cannot be relaxed. **A case plan model cannot remove, weaken, or override a domain rule. If the domain rule says “no settlement can exceed policy coverage limit,” no case design can bypass this constraint.

- **Case-level guardrails are additive. **A case plan model MAY define additional guardrail nodes that apply only to that case. These are evaluated in addition to (not instead of) domain rules.

- **Evaluation order. **Domain rules SHALL be evaluated before case-level guardrails. If a domain rule rejects agent output, case-level guardrails are not evaluated — the output is already rejected.

**NOTE: ***The governance hierarchy from broadest to narrowest scope is: domain rules → case-level guardrail nodes → agent-level tool policies. Each layer can add constraints but cannot remove constraints imposed by a broader scope.*

## 9.5 Decision models

A decision model is a collection of decision tables that codify how specific decisions are made within the domain. Decision tables provide structured, deterministic decision logic that agents can reference during reasoning, replacing ad-hoc LLM inference with explicit domain expertise for well-understood decision patterns.

ACMN adopts the decision table concept from the OMG Decision Model and Notation (DMN) standard. ACMN does not adopt DMN’s full specification (Decision Requirements Diagrams, FEEL expression language, business knowledge models); it adopts the decision table as a data structure with DMN-compatible semantics for hit policies and rule evaluation.

### 9.5.1 Decision model structure

| **Property** | **Type** | **Description** |
| --- | --- | --- |
| **name** | String | Human-readable name (e.g., “Claim approval routing”, “Risk classification”). |
| **description** | String | Natural language description of what decision this model codifies. |
| **tables** | List<DecisionTable> | One or more decision tables. A model with multiple tables represents a multi-step decision where the output of one table feeds into another. |
| **applicableStages** | List<CognitiveMode>? | Optional. Cognitive modes during which this decision model is relevant. If specified, the model is only included in agent context during matching stages. Default: all stages. |

### 9.5.2 Decision table structure

| **Property** | **Type** | **Description** |
| --- | --- | --- |
| **name** | String | Table name. |
| **inputs** | List<InputColumn> | Input columns defining the conditions. Each column has a name, a type (referencing a domain schema field or primitive), and an optional label. |
| **outputs** | List<OutputColumn> | Output columns defining the results. Each column has a name, a type, and an optional label. |
| **rules** | List<Rule> | Rows in the table. Each rule specifies input conditions and corresponding output values. Conditions may use comparison operators, ranges, and lists of values. |
| **hitPolicy** | HitPolicy | How to handle rule matching. See Section 9.5.3. Default: UNIQUE. |

### 9.5.3 Hit policies

The hit policy determines the behaviour when evaluating input against the table’s rules. ACMN adopts DMN’s hit policy definitions:

| **Hit policy** | **Semantics** |
| --- | --- |
| **UNIQUE** | Exactly one rule matches. If zero or more than one rule matches, the result is an error. This is the strictest and most predictable policy. |
| **FIRST** | Multiple rules may match. The first matching rule (in table order) determines the output. Rules are prioritised by their position in the table. |
| **PRIORITY** | Multiple rules may match. The rule with the highest-priority output value determines the result. Priority is defined by the output column’s value ordering. |
| **COLLECT** | All matching rules contribute to the output. The results are returned as a list. Optionally, an aggregation function (sum, count, min, max) is applied to the collected values. |
| **ANY** | Multiple rules may match but all matching rules must produce the same output. If outputs differ, the result is an error. |

### 9.5.4 Usage in agent context

Implementations SHALL make relevant decision tables available to agents during context assembly. Decision tables SHOULD be formatted as structured reference material in the agent’s context, presented clearly enough that the agent can apply the table’s logic during reasoning.

An agent reasoning about a claim approval might receive the decision table as:

**NOTE: ***The claim approval routing table in the agent’s context serves the same role as a policy manual on a human adjuster’s desk. The agent consults it when making a determination rather than relying solely on its general knowledge. This makes agent decisions auditable: the audit trail can record not just “the agent recommended approval” but “the agent applied row 3 of the approval routing table, which specifies auto-approval for claims under $5,000 with no fraud indicators.”*

Implementations MAY additionally evaluate decision tables programmatically (without LLM invocation) when all input values are available in the case file and the table’s hit policy produces an unambiguous result. In this case, the decision table functions as a deterministic computation rather than a reference for agent reasoning. This is more efficient and fully auditable, but requires that input values exactly match the table’s input column types.

### 9.5.5 Usage in evaluation

Decision tables may be referenced by evaluation nodes (Section 6.5) as structured scoring rubrics. When an evaluation criterion references a decision table, the evaluator applies the table to assess the agent’s output rather than relying solely on LLM-based quality assessment.

For example, an evaluation criterion “Correct routing” might reference the claim approval routing table. The evaluator checks whether the agent’s recommended action matches the table’s output for the given input values. If the agent recommended “senior review” but the table says “auto-approve” for these inputs, the criterion fails with deterministic, explainable feedback.

This hybrid approach — deterministic evaluation via decision tables for structured criteria, LLM-based evaluation for qualitative criteria — provides the best of both: auditability for rule-based decisions and flexibility for judgement-based assessments.

## 9.6 Domain context reuse

Domain contexts are designed for reuse. A well-defined domain context — with curated vocabulary, validated schemas, proven rules, and tested decision tables — represents significant domain expertise. ACMN defines mechanisms for sharing, versioning, and composing domain contexts across case plan models and across organisations.

### 9.6.1 Binding modes

When a domain context is applied to a case plan model, the binding uses one of two modes:

| **Mode** | **Semantics** |
| --- | --- |
| **Reference** | The case plan model uses the domain context as-is, at a pinned version. Multiple case plan models can reference the same domain context. When the domain context is updated to a new version, case designers choose when to adopt the new version. Running cases remain bound to the version that was current at case creation. |
| **Copy** | The case plan model receives an independent copy of the domain context. The copy can be modified freely — terms added, rules changed, decision tables adjusted — without affecting the original or any other case plan model. The copy records its origin (source context id, name, and version) for traceability. |

Implementations SHALL enforce immutable binding for running cases: once a case instance is created, its domain context version cannot change, regardless of binding mode. New versions of a referenced domain context apply only to cases created after the case plan model is updated to reference the new version.

### 9.6.2 Domain context packaging and distribution

Domain contexts MAY be packaged and distributed through package registries, enabling cross-organisational reuse. A domain context package contains:

- **The domain context definition: **vocabulary, schemas, rules, decision tables, and all metadata.

- **Package metadata: **identifier, version, description, tags, author, licence, and dependencies (if the context references schemas or rules from other domain contexts).

- **Documentation: **Human-readable description of the domain, intended use, and any assumptions or constraints.

The packaging format and registry protocol are implementation choices. The standard defines the semantic requirements:

- A package identifier SHALL be unique within its registry.

- Packages SHALL use semantic versioning (SemVer). Minor version increments add terms, schemas, or rules without removing or changing existing ones. Major version increments may include breaking changes.

- Implementations SHALL verify package integrity on installation.

- When a packaged domain context is installed, it appears in the design environment’s domain context library, available for binding to case plan models.

**NOTE: ***The packaging mechanism enables an ecosystem of shared domain expertise. Industry associations, consulting firms, or open-source communities can publish domain contexts for common business domains (insurance claims processing, employee onboarding, regulatory compliance, procurement, customer service). Case designers install the package, reference or copy the domain context, and begin designing cases with pre-built domain knowledge.*

### 9.6.3 Domain context library

Implementations SHOULD provide a domain context library that organises available contexts for case designers. The library contains:

- **Published contexts: **Domain contexts published by domain experts within the organisation, versioned and available to all case designers. These are the authoritative domain definitions.

- **Installed packages: **Domain contexts installed from external package registries. Clearly distinguished from local contexts by provenance indicator.

- **Personal contexts: **Copies that individual designers have forked and customised. Each records its origin for traceability.

The library is the source from which case designers select domain contexts to apply to their case plan models. In the visual editor, the library appears in the palette and domain contexts can be dragged onto the design surface.

### 9.6.4 Domain context composition

A case plan model is bound to exactly one domain context. When a case requires knowledge from multiple domains (e.g., insurance claims and regulatory compliance), the recommended pattern is to compose a new domain context that incorporates elements from both source contexts, rather than binding multiple contexts to a single case. This avoids ambiguity from overlapping vocabulary or conflicting rules.

Implementations MAY provide tooling to merge elements from multiple source contexts into a new composite context. When merging:

- **Vocabulary: **Terms merge by union. If two source contexts define the same term with different definitions, the merge tool SHALL flag the conflict for manual resolution.

- **Schemas: **Schemas merge by union. If two source contexts define schemas with the same name but different structures, the merge tool SHALL flag the conflict.

- **Rules: **Rules merge by union. All rules from all source contexts apply. When rules conflict (one permits what another prohibits), the stricter constraint takes precedence.

- **Decision tables: **Decision tables do not merge. Each table retains its source context identifier to avoid ambiguity.

### 9.6.5 Visual notation

On the design surface, the domain context is rendered as a panel attached to the top edge of the case plan model boundary. The panel displays:

- **Domain name and version: **e.g., “Insurance Claims v3.2”.

- **Binding mode indicator: **A reference icon (link symbol) or copy icon (fork symbol) indicating whether this is a referenced or copied context.

- **Summary counts: **Number of terms, schemas, rules, and decision tables.

- **Package provenance: **If the context was installed from a package registry, a package icon and the package identifier.

Clicking the domain context panel opens a detail view where the designer can browse vocabulary, review schemas, inspect rules, and view decision tables. For copied contexts, the designer can edit all elements directly. For referenced contexts, the elements are read-only.

In the palette, the domain context library section allows designers to browse, search, and drag domain contexts onto the canvas. Dragging a domain context onto an empty canvas creates a new case plan model with that context applied. Dragging onto an existing case plan model replaces the current context (after confirmation).

## 9.7 Cross-domain relationships (informative)

Domain contexts MAY declare relationships with other domain contexts to enable cross-domain event routing and data transformation. When a case in one domain publishes an event that a case in another domain subscribes to, the event payload may require translation between domain vocabularies and schemas. Implementations MAY provide translation capabilities on cross-domain event subscriptions, such as agent-backed transforms (see Section 7.2) that map between incompatible domain models.

**NOTE: ***This section is informative. The ACMN specification does not prescribe specific patterns for cross-domain relationships. Implementations may draw on Domain-Driven Design’s context mapping patterns (shared kernel, customer-supplier, anti-corruption layer) as design guidance.*

# 10. State models

## 10.1 Case instance lifecycle

A case instance transitions through the following states:

| **State** | **Transition** | **Semantics** |
| --- | --- | --- |
| **Created** | Initial state | Case instance created from a case plan model. Domain context bound. Input data validated. |
| **Active** | Created → Active | Initial sentries evaluated. First stage activated. Agent turn loop begins. |
| **Suspended** | Active → Suspended | All agents idle. Awaiting external event, human input, timer, budget extension, or administrative hold. |
| **Reverted** | Active → Reverted | A milestone has been revoked. Case state is being restored from a snapshot. Transient state. |
| **Active** | Reverted → Active | Snapshot restored. Revocation reason injected. Stage re-activated. |
| **Completing** | Active → Completing | Exit milestone achieved. Agents archived. State promotion rules executing. |
| **Closed** | Completing → Closed | All promotions complete. Audit trail sealed. Case file immutable. |
| **Failed** | Active → Failed | Unrecoverable error. All escalation paths exhausted. |

## 10.2 Agent instance lifecycle

| **State** | **Transition** | **Semantics** |
| --- | --- | --- |
| **Activating** | Initial state | Agent instance created. Working memory initialised. Confidence set to initial_confidence. |
| **Active** | Activating → Active | Agent is executing turns. Context assembled, LLM invoked, responses parsed. |
| **Waiting (tool)** | Active → Waiting | Agent has requested a tool invocation and is awaiting the result. |
| **Waiting (human)** | Active → Waiting | Agent has requested human input (via confirm_first policy or explicit handoff). |
| **Suspended** | Active → Suspended | Agent has no pending work. Idle timeout reached or case suspended. |
| **Terminated** | Any → Terminated | Agent has completed its work, been explicitly stopped, or the case is closing. on_terminate policy executes. |

# 11. State persistence model

ACMN defines six scopes for state, ordered from narrowest to broadest. Each scope has defined lifetime, visibility, and promotion semantics:

**Turn state: **Ephemeral. Exists for the duration of a single agent turn. Contains the assembled context window, pending tool calls, and in-progress response. Never persisted.

**Agent instance state: **Per-agent, per-case. Contains working memory, confidence score, confidence history, turn count, tool results. Persists for the lifetime of the agent instance.

**Case state: **Per-case. Contains the case file, milestone registry, stage states, wire buffers, thread log, audit trail. Persists for the lifetime of the case instance (and beyond, for closed cases).

**Domain memory: **Per-domain context. Contains learned resolution patterns, case summary embeddings (for RAG retrieval), and domain-level agent performance metrics. Persists permanently. Updated at case completion via promotion rules.

**Organisational memory: **Cross-domain. Contains cross-domain patterns and global metrics. Thin layer — most knowledge resides in domain memory. Persists permanently.

**Snapshots: **Per-milestone. Serialised copies of complete case state taken at milestone achievement. Used for rollback on milestone revocation. Persists for the case lifetime plus a configurable retention period.

State promotes outward selectively: turn results may promote to agent state, agent conclusions may promote to the case file, and case outcomes may promote to domain memory. Promotion rules are declared on agent nodes and milestones. Promotion is never automatic — it occurs only where rules are explicitly defined.

# 12. Visual notation

This section defines the reference visual notation for ACMN elements on a design surface. The visual notation preserves CMMN’s visual conventions for inherited elements and defines new visual forms for ACMN extension elements.

Conforming implementations SHALL render elements using shapes that are visually distinguishable according to the categories defined below. Implementations MAY use alternative visual styles, colours, icons, and decorators provided that: the structural relationships (containment, connection directionality, sentry attachment) are preserved; each element category remains visually distinct from all other categories; and the port semantics (filled for required/output, open for optional input) are maintained.

**NOTE: ***The reference notation defines shapes, not styles. Colours, fonts, icon sets, animation behaviours, and interaction patterns are implementation choices. The figures in this section illustrate one possible rendering conformant with the specification.*

## 12.1 CMMN inherited visual elements

| **Element** | **Visual form** | **Notes** |
| --- | --- | --- |
| **Case plan model** | Large rounded rectangle with case name at top | Outermost boundary. All plan items are contained within. |
| **Stage** | Rounded rectangle container with collapse toggle and name bar. Cognitive mode badge in top-right corner. | Contains child plan items. Dashed border when stage is a discretionary item. |
| **Milestone** | Diamond shape | Fill colour indicates state: default when available, green when achieved, red on revocation. |
| **Sentry (entry)** | Small diamond on the left edge of the guarded element | Filled when satisfied, open when pending. |
| **Sentry (exit)** | Small diamond on the right edge of the guarded element | Filled when satisfied, open when pending. |
| **Human task** | Rounded rectangle with person icon | CMMN visual convention preserved. |
| **Discretionary item** | Same as base element but with dashed border | CMMN visual convention preserved. |

## 12.2 ACMN extension visual elements

| **Element** | **Visual form** | **Notes** |
| --- | --- | --- |
| **Agent node** | Rounded rectangle with named input/output ports rendered as small circles on left/right edges. Distinct colour from other plan item types. | Ports: filled circle = required or output, open circle = optional input. Subtitle shows reasoning strategy. |
| **Tool node** | Rounded rectangle with distinct colour. Input port (parameters) and output port (result). | Subtitle indicates tool source (MCP, REST, local). |
| **Guardrail node** | Rounded rectangle with distinct colour. Input port (agent output) and two output ports: pass and fail. | Pass and fail ports use green and red colouring respectively. |
| **Handoff node** | Rounded rectangle with distinct colour. Input port (source state) and output port (context bundle). | Rendered between source and target participants. |
| **Evaluation node** | Rounded rectangle with distinct colour. Four ports: input, approved (output), feedback (output, loops back to agent), escalation (output). | Feedback wire from evaluation node back to agent creates a visible loop on the canvas. Shows attempt count and pass/fail history in live mode. |
| **Connector node** | Rounded rectangle with connector-type icon (envelope, lightning bolt, folder, clock, database cylinder). Output port only (signal). No input ports. | Positioned upstream (left) of the case plan model. Pulse indicator in live mode when receiving signals. |
| **Domain context** | Panel attached to the top edge of the case plan model boundary. Shows domain name, version, binding mode icon (link or fork), and summary counts. | Not a plan item. Companion element providing the knowledge environment. Click to browse vocabulary, schemas, rules, and decision tables. |

## 12.3 Wire visual notation

Each wire type has a distinct visual style to ensure data flow, control flow, and escalation paths are immediately distinguishable on the design surface:

| **Wire type** | **Visual form** | **Notes** |
| --- | --- | --- |
| **Data wire** | Solid line connecting output port to input port, with directional arrowhead. | Default wire type. Carries typed data. |
| **Confidence-gated** | Dashed line with an inline diamond gate showing the threshold value. | Gate diamond indicates open/blocked state. |
| **Escalation** | Dashed line with visually distinct colour (red recommended). | Indicates fallback or escalation path. |
| **Event** | Dotted line. | Asynchronous event delivery. Can cross stage boundaries. |
| **Case file** | Thin solid line connecting a plan item to the case file. | Arrow direction indicates read or write. |

## 12.4 Reference notation figures

The following figures illustrate a conformant rendering of the ACMN visual notation. Implementations MAY use different colours, fonts, and styling while preserving the shape semantics and structural relationships shown.

## 12.5 Complete workspace example

The following figure shows a complete ACMN workspace combining all notation elements: a connector node upstream of the case plan model with a domain context panel, two stages with sentries, agent nodes with typed ports, a tool node, a guardrail node with pass/fail outputs, a human task for escalation, milestones connecting stages, and data wires, escalation wires, and sentry connections.

# 13. Conformance

An implementation conforms to this specification if it satisfies the requirements of one of the following conformance levels:

## 13.1 Level 1: ACMN Core

An implementation at Level 1 SHALL support:

- Cases, case plan models, stages, milestones (assertion type), sentries (plan item and case file item on-parts), human tasks, and discretionary items as defined in CMMN 1.1.

- Agent nodes with identity, model configuration, tool access, and context scope properties.

- Tool nodes with input/output schemas and invocation policies.

- Data wires with basic type validation.

- Case instance lifecycle: created, active, suspended, closed, failed.

- Agent instance lifecycle: activating, active, suspended, terminated.

- Case file with typed items.

## 13.2 Level 2: ACMN Extended

An implementation at Level 2 SHALL support all Level 1 requirements plus:

- Confidence milestones and composite milestones.

- Milestone revocation with snapshot and rollback.

- Sentry composition operators (all_of, any_of, sequence, unless).

- Confidence, budget, timer, and event on-part types.

- All five wire types (data, confidence-gated, escalation, event, case file).

- Wire buffering strategies (latest_wins, queue, accumulate).

- Wire transforms (static_mapping, expression, agent_backed).

- Guardrail nodes.

- Evaluation nodes with criteria-based assessment, feedback loops, and retry limits.

- Handoff nodes.

- Reasoning strategies: react, plan_execute, reflect, debate.

- Event bus with case, domain, and external delivery scopes.

- Case instance lifecycle including reverted and completing states.

- Case intake with connector nodes (direct and evaluated patterns).

## 13.3 Level 3: ACMN Complete

An implementation at Level 3 SHALL support all Level 2 requirements plus:

- Domain context model: vocabulary, entity schemas, value object schemas, domain events, domain rules, agent templates, tool catalogues.

- Context mapping between domain contexts (shared kernel, customer-supplier, anti-corruption layer).

- Six-scope state persistence model with promotion rules.

- Domain memory with embedding-based retrieval.

- Cross-case event patterns (spawning, notification, synchronisation).

- Cognitive mode annotations on stages.

- The complete visual notation as defined in Section 12.

**NOTE: ***ACMN Platform, the reference implementation published at github.com/acmn-platform, targets Level 3 conformance.*

Agentic Case Management NotationPage 2