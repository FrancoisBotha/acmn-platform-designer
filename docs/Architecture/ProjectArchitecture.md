# ACMN Platform — Project Architecture (Designer Context)

This document describes where the **Designer** fits within the broader ACMN Platform, so anyone working on the Designer understands its boundaries and its relationships to the other subsystems.

---

## 1. The ACMN Platform system

The ACMN Platform is an open-source reference implementation of the ACMN Standard. It is composed of **five subsystems**, each a separately deployable process or application. Subsystems communicate through well-defined contracts — gRPC between backend services, REST + WebSocket between frontends and backends, and local file I/O for the Designer's single-user mode.

```
┌──────────────────────────────────────────────────────────────────────┐
│                        ACMN Platform                                 │
│                                                                      │
│  ┌──────────────┐              ┌──────────────┐                      │
│  │              │              │              │                      │
│  │   Designer   │              │  Workbench   │                      │
│  │  (Electron)  │              │   (Web)      │                      │
│  │              │              │              │                      │
│  └──────┬───────┘              └──────┬───────┘                      │
│         │                             │                              │
│         │ REST / gRPC (v0.2+)         │ REST / WebSocket             │
│         │                             │                              │
│  ┌──────▼─────────────────────────────▼──────┐                       │
│  │                                           │                       │
│  │         Communication Engine              │                       │
│  │  (API gateway, connectors, MCP, webhooks) │                       │
│  │                                           │                       │
│  └──────┬────────────────────────┬───────────┘                       │
│         │                        │                                   │
│         │ gRPC                   │ gRPC                              │
│         │                        │                                   │
│  ┌──────▼────────────┐   ┌───────▼─────────┐                         │
│  │                   │   │                 │                         │
│  │ Execution Engine  │◄──│  Logic Engine   │                         │
│  │   (Java + DB)     │   │ (Python + LLMs) │                         │
│  │                   │   │                 │                         │
│  └───────────────────┘   └─────────────────┘                         │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## 2. The five subsystems

### 2.1 Designer (Electron desktop app)
**Scope.** Visual authoring tool for case plan models, connectors, and domain contexts. Runs on the designer's workstation. Single-user.

**Stack.** Electron, React, TypeScript, React Flow (canvas), shadcn/ui (components), Tailwind CSS.

**Storage.** Local filesystem. `.acmn` project folders contain JSON files for case plan models, domain contexts, test scenarios, and a project manifest.

**External calls (v0.1).** None. Fully local.

**External calls (v0.2+).** Calls Communication Engine REST API to authenticate, fetch domain context registry, and publish case plan models.

### 2.2 Workbench (web app)
**Scope.** Day-to-day interface for non-designer users. Three user types:
- **Normal Users** — execute human tasks assigned to them.
- **Supervisors** — plus view intake queue, open cases, case detail, execution history.
- **Admin** — plus manage user accounts and user groups (agent tasks can be assigned to groups for pick-up).

**Stack.** React, TypeScript, shadcn/ui. Served as a static web app.

**External calls.** Communication Engine REST (CRUD) and WebSocket (live updates).

### 2.3 Communication Engine (Node.js)
**Scope.** External connectivity, API gateway, real-time communication.
- Hosts connector node instances (email, webhook, file watch, schedule, database, event, API).
- Loads third-party connector adapter packages (wraps Node-RED nodes).
- Implements MCP client for tool invocation.
- Exposes REST and WebSocket endpoints to Designer and Workbench.
- Publishes events to/from external systems.

**Stack.** Node.js, Express, MCP SDK.

**External calls.** gRPC to Execution Engine, gRPC to Logic Engine.

### 2.4 Execution Engine (Java / Spring Boot)
**Scope.** Case lifecycle management, state persistence, runtime orchestration.
- Implements the full case instance lifecycle and the ACMN runtime semantics.
- Manages stages, sentries, milestones, case variables, case file, wires, event bus.
- Owns the database — only subsystem with direct DB access.
- Evaluates decision tables and DMN logic.
- Persists audit trail.

**Stack.** Java 21, Spring Boot, PostgreSQL (production) or H2 (desktop). JHipster-scaffolded.

**External calls.** gRPC to Logic Engine for agent turns.

### 2.5 Logic Engine (Python / FastAPI)
**Scope.** LLM abstraction and AI reasoning.
- Unified LLM invocation via LiteLLM (Anthropic, OpenAI, Google, Azure, local).
- Context assembly following the eight-layer priority model (standard Section 6.1.10).
- Reasoning strategies: react, plan_execute, reflect, debate.
- Confidence scoring and trajectory computation.
- Guardrail evaluation (rule-based, LLM-based, hybrid).
- Evaluation node processing.
- Intake classification.

**Stack.** Python 3.12, FastAPI, LiteLLM, Pydantic.

**External calls.** LLM provider APIs.

## 3. Where the Designer fits

The Designer is **one of two frontends**. The separation is deliberate:

- **Designer** is a **design-time tool**. It produces artefacts (case plan models, domain contexts) that get deployed to the running system. It is used sporadically — during the design phase of a case, during iteration. It does not need to be always-on or multi-user.

- **Workbench** is a **run-time tool**. Humans use it constantly as part of their day job to pick up tasks, review cases, and monitor execution. It is always-on, multi-user, and tightly coupled to the running Execution Engine.

This separation mirrors how development and operations are separated in most software systems: designers ship artefacts that operators run. Splitting them into two applications means each can optimise for its audience without compromise — the Designer can be a focused, offline-capable desktop app; the Workbench can be a lightweight always-on web app.

## 4. The Designer's contract with the rest of the platform

The Designer produces **two kinds of artefacts**:

### 4.1 Case plan models
A case plan model is a JSON document describing a complete orchestration: plan items (agents, tools, guardrails, evaluators, handoffs, human tasks), connectors, wires, stages, milestones, sentries, case variables, and the bound domain context. This JSON is written to disk in v0.1. In v0.2+ it is deployed via REST to the Communication Engine, which forwards it via gRPC to the Execution Engine, which registers it for case instantiation.

### 4.2 Domain contexts
A domain context is a JSON document describing vocabulary, schemas, rules, and decision tables for a business domain. In v0.1, domain contexts are either copies forked from a local library, or created from scratch and saved to disk. In v0.2+, domain contexts can be installed from package registries (npm-style) and published to organisational registries.

### 4.3 The contract
In both v0.1 (mock) and v0.2+ (real), the Designer calls a set of typed TypeScript interfaces defined in `src/contracts/`. The v0.1 mock implements these by reading/writing local files. The v0.2+ real implementation translates them to REST calls. See `Architecture.md` for the full contract definition.

## 5. Deployment topology

### v0.1 — Standalone desktop
```
Designer (Electron) ───► Local filesystem
```
The Designer runs standalone. No backend required. Projects live on disk.

### v0.2+ — Connected to platform
```
Designer (Electron) ───► Communication Engine (REST) ───► Execution Engine
                                                   └────► Logic Engine
```
The Designer authenticates against the Communication Engine and publishes case plan models to the live platform. Local work continues to be possible — the Designer is always capable of working offline against local files.

### Production platform deployment
```
Docker Compose or Electron desktop bundle
├── Communication Engine (Node.js)
├── Execution Engine (Java + PostgreSQL)
└── Logic Engine (Python)
```
The backend subsystems are deployed together via Docker Compose for teams, or bundled into an Electron desktop package for single-user/evaluation deployments. The Designer and Workbench are separate front-ends that connect to this backend.

## 6. Glossary

- **Case plan model** — the top-level artefact designed in the Designer. A case plan model defines the structure and behaviour of a class of cases.
- **Case instance** — a running instance of a case plan model. Created by the Execution Engine when an intake signal arrives.
- **Domain context** — a reusable package of vocabulary, schemas, rules, and decision tables that defines the semantic framework for a case.
- **Connector** — a plan item that ingests signals from external sources (email, webhook, file watch, etc.) and triggers case creation.
- **Agent node** — a plan item that represents an AI agent with a persona, tools, context scope, and reasoning strategy.
- **Wire** — a typed connection between ports on plan items. Wire types: data, confidence-gated, escalation, event, case file.
- **Sentry** — a guard condition governing when a plan item or stage activates or completes.
- **Milestone** — a verifiable state in case progression. Achievement records a snapshot enabling rollback.
- **Stage** — a container for plan items with a cognitive mode (gather, analyse, draft, review, decide).
- **Case variable** — a flat, typed value tracking operational case state (distinct from case file items).
- **Case file** — the shared data store containing schema-validated domain objects.

## 7. References

- `PRD.md` — product requirements for the Designer.
- `Architecture.md` — internal architecture of the Designer application.
- `FunctionalRequirements.md` — functional requirements for the Designer (Sub-System: Designer).
- `NonFunctionalRequirements.md` — non-functional requirements for the Designer.
- ACMN Platform `FunctionalRequirements.md` — platform-wide functional requirements.
- ACMN Standard v1.0 Working Draft — notation and semantics.
