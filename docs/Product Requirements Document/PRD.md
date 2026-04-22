# ACMN Designer — Product Requirements Document

**Product:** ACMN Designer
**Version:** 0.1 (Initial Draft)
**Date:** April 2026
**Owner:** Francois
**Status:** Draft

---

## 1. Overview

ACMN Designer is a desktop application for designing **case plan models** — visual orchestrations of AI agents, human tasks, and external connectors that together solve business cases. It is the authoring tool for the ACMN Platform, conforming to the ACMN Standard (acmnstandard.org).

The Designer is where case analysts, solution architects, and technical business users compose cases: dragging agents, tools, stages, and connectors onto a canvas; wiring them together; configuring agent personas and domain contexts; testing the flow with simulated signals; and publishing the finished case plan model to the Execution Engine where it will run against real work.

The Designer is distributed as a Windows-first Electron desktop application. Projects are stored as local folders on disk — open, save, and version like any other file-based tool. The application runs single-user initially; later releases will connect to a central Execution Engine for team collaboration and production deployment.

Delivery begins with a technical spike (see [Spike1.md](spikes/Spike1.md)) that validates the foundational stack — Electron + React + React Flow + shadcn/ui — and proves that every ACMN visual element can be rendered faithfully before the full v0.1 epic is committed to. The spike's findings feed the epic breakdown and ticket estimates for v0.1.

## 2. Goals

**Primary goal:** Enable a solution architect to design, test, and publish a complete case plan model — with connectors, agents, tools, domain context, and human tasks — in under an hour of focused work, without writing code.

**Secondary goals:**

- Make the ACMN standard visually learnable. A new user should understand what an agent, wire, sentry, and milestone are within minutes of opening the palette.
- Stay close to the Node-RED wiring experience users already find intuitive for automation, while adding the structure needed for case management (stages, milestones, domain).
- Support local-first work. Designs live as files on disk; no server dependency for the core design loop.
- Keep a clean contract with the future Execution Engine, so today's mocked backend can be swapped for the real one without rewriting the Designer.

## 3. Non-goals (v0.1)

- Multi-user real-time collaboration. One designer per project at a time in v0.1.
- Version control beyond manual Save As. Git integration is deferred.
- Execution of production cases. The Designer can simulate cases locally but publishing to a real Execution Engine requires the backend to be built.
- Human task execution. Humans complete tasks in the Workbench application, not the Designer.
- Admin features (user accounts, RBAC). The Designer is a single-user tool.

## 4. Target users

### Solution Architect
Designs end-to-end case plan models for their organisation. Understands both the business process and the technical integration. Primary user. Spends hours per day in the Designer when actively shaping a case. Needs the full palette, full property panel, test mode, and publish flow.

### Domain Expert
Curates the domain context — vocabulary, schemas, rules, decision tables. May never touch the canvas. Spends their time in the domain context editor ensuring the domain model is accurate. Their work is consumed by the Solution Architect via domain context references.

### Technical Business Analyst
Reviews and adjusts existing case plan models. Makes surgical changes to agent personas, tweaks sentry expressions, updates case variables. Less likely to design from scratch. Values a clear property panel and validation feedback.

## 5. User stories

### Creating a new project

> *"As a solution architect, I open the Designer and create a new project for processing insurance claims. I pick a folder on my disk, the Designer creates a project structure, and I land on an empty canvas ready to start designing."*

### Designing a case

> *"I drag a connector onto the canvas, then an agent to classify incoming signals. I wire them together. I add a stage containing the assessment workflow. I connect agents, tools, and a human task for escalation. The property panel lets me configure every element without leaving the canvas."*

### Applying a domain context

> *"I open the domain context library, find 'Insurance Claims v3.2' published by our domain team, and drag it onto my case. The vocabulary, schemas, and rules are now available to every agent in the case. I keep the binding as 'reference' so I inherit updates automatically."*

### Testing before publishing

> *"I switch to Test mode, inject a sample email signal into the connector, and step through the case. I watch agents take turns, see confidence scores update, observe milestones achieve, and check that my sentry expressions trigger correctly. The simulation console shows me exactly what each agent thought and did."*

### Publishing to production

> *"I switch to Publish mode. The Designer runs pre-flight checks: all ports connected, all agents configured, all sentries valid. I write release notes, choose how existing cases handle the version change, and click Publish. The case plan model is packaged and sent to the Execution Engine."*

### Opening an existing project

> *"I return to the Designer the next day. It remembers my recent projects, shows them on the welcome screen, and one click reopens the case exactly where I left off — with autosaved changes intact."*

## 6. Key features (v0.1)

### 6.1 Project management
- Welcome screen with "New project" and "Open project" actions
- New project wizard: name, location, optional description, optional starter template
- Recent projects list with quick-open
- Project folder structure on disk (.acmn.json manifest, case-plan-models/, domain-contexts/, test-scenarios/)
- Auto-save to disk every 30 seconds and on Save (Ctrl+S) or Save As

### 6.2 Visual canvas
- React Flow–based infinite pannable, zoomable canvas
- Dot grid background, minimap bottom-right
- Undo/redo, multi-select, copy/paste, keyboard shortcuts
- Three modes via top-bar tabs: **Design**, **Test**, **Publish**
- Deployment status indicator showing connected/disconnected from Execution Engine (hidden in v0.1)

### 6.3 Element palette
- Left-side categorised palette: **Plan Items**, **Structure**, **Connectors**, **Domain**
- Built-in connector types (email, webhook, file watch, schedule, database, event, API)
- Domain context library with three tiers: published, installed packages, personal copies
- Drag-and-drop onto canvas creates elements

### 6.4 Property panel
- Right-side context-aware properties panel for the selected element
- Tabbed interface for agent nodes (Identity, Model, Tools, Context, Strategy, Confidence, Ports, Lifecycle, State)
- Inline validation with error highlighting
- Case variable editor accessible from case plan model properties

### 6.5 Wire management
- Drag from output port to input port to create wires
- Port type compatibility enforcement with visual feedback
- Five wire types visually distinguished: data, confidence-gated, escalation, event, case file
- Wire properties panel: buffering strategy, transform, confidence gate threshold

### 6.6 Domain context
- Domain context panel attached to case plan model top edge
- Reference or copy binding with clear explanation of implications
- Browse vocabulary, schemas, rules, decision tables in detail view
- Inline editing for copy-mode contexts

### 6.7 Test mode
- Inject test signals into connectors
- Step through case execution with sandboxed LLM calls
- Live state overlays on canvas: active stages highlighted, agent confidence meters, milestone states
- Test console: reasoning trace, wire activity, sentry evaluations, audit log
- Case variable and milestone panels show live values
- Test scenarios saved as JSON files in the project

### 6.8 Publish mode
- Pre-flight validation: all ports connected, agents configured, connectors valid, variables defined, sentries valid, domain context bound, tests passed
- Version bump with semantic versioning
- Release notes capture
- Existing case migration policy (continue on old version, migrate to new)
- Export as `.acmn` package for interchange

## 7. Backend contract

The Designer operates entirely offline in v0.1, but all persistence and publish operations go through a **contract layer** defined in TypeScript interfaces. This contract will be implemented twice:

**v0.1 (mock implementation):** Local filesystem operations. `openProject()` reads a directory, `saveProject()` writes JSON files, `publishCasePlanModel()` writes a packaged `.acmn` file to disk.

**Future (real implementation):** Calls into the Execution Engine via gRPC or REST. `publishCasePlanModel()` deploys to a running engine, `getDomainContextLibrary()` fetches from a registry, and so on.

By designing against the contract from day one, the Designer can swap implementations without changing its UI code. See `Architecture.md` for the full contract specification. Spike 1 creates the `BackendContract` TypeScript interface as a stub file to establish the pattern, without implementing either backend.

## 8. Platform priorities

**Windows-first.** The primary installer target is Windows 10/11 x64. Ship an `.exe` installer built with `electron-builder`. Sign binaries with a code-signing certificate before public release.

**macOS and Linux** will follow. Electron makes these possible with minimal code changes, but installers, icons, and end-to-end testing need to happen per-platform. Deferred to v0.2+.

## 9. Success metrics

- A new user, given a 15-minute introduction, can create a new project, design a three-element case (connector → agent → case plan model), and run it in test mode without assistance.
- An experienced user can design a complete case plan model (10+ elements, 2 stages, 3 milestones) in under an hour.
- Time from "Publish button pressed" to "published package on disk" is under 5 seconds for case plan models with ≤50 elements.
- Auto-save introduces no user-visible latency on projects with ≤100 elements.
- Designer starts (cold launch to empty canvas) in under 3 seconds on a typical developer laptop.

## 10. Release plan

### Spike 1 — Foundation validation (target: May 2026)
A 5-day technical spike that validates the Designer's foundational stack and proves all ACMN visual elements can be rendered faithfully before committing to the full v0.1 build. Produces a runnable Electron app with palette drag-and-drop of every ACMN element type (no wiring, no property panel, no persistence). Deliverables: spike repository, Windows installer, element gallery screenshot, spike report, and follow-on ticket suggestions for the v0.1 epic. See [Spike1.md](spikes/Spike1.md) for the full spike definition.

### v0.1 — Single-user local Designer (target: Q3 2026)
Scope: all of Section 6 except publish-to-real-engine. Publishing writes to local disk only. Backend contract in place, mocked throughout. Epic and ticket breakdown are informed by Spike 1's findings and recommendations. Start date contingent on Spike 1 completion and sign-off.

### v0.2 — Cross-platform + Connected Designer
- macOS and Linux installers
- Connect to real Execution Engine for publish
- Authenticate against organisational identity provider (SSO)
- Fetch domain context library from server-side registry

### v0.3 — Collaboration basics
- Lock/claim a case plan model while editing (prevents concurrent edits)
- Version history viewed server-side
- Comments and review flow

## 11. Open questions

- **Telemetry.** Should the Designer phone home with anonymised usage data to improve UX? (Recommended: opt-in, disabled by default.)
- **Update mechanism.** Auto-update via Electron's autoUpdater (signed releases from GitHub) or manual reinstall? (Recommended: autoUpdater from v0.2.)
- **Plugin model.** Should the palette be extensible by third parties? (Deferred to v0.3+.)
- **File format stability.** The `.acmn.json` manifest and `.cpm.json` case plan model format need to be frozen before public release. What's the migration story when the format evolves?
- **Stage containment UX.** How well React Flow's `parentNode` model supports stage-as-container semantics (drag in/out, nested stages) is investigated by Spike 1 and will be resolved before the v0.1 epic breakdown.
- **Domain context panel rendering.** Whether the panel can be rendered as a React Flow overlay or needs a separate layer above the canvas is investigated by Spike 1.

## 12. References

- ACMN Standard v1.0.11 Working Draft (acmnstandard.org) — local reference copy at [reference/ACMN-Standard-v1.0.11.md](reference/ACMN-Standard-v1.0.11.md)
- ACMN Platform Functional Requirements (../FunctionalRequirements.md)
- Designer Architecture ([Architecture.md](Architecture.md))
- Designer Project Architecture / platform integration ([ProjectArchitecture.md](ProjectArchitecture.md))
- Designer Functional Requirements ([FunctionalRequirements.md](FunctionalRequirements.md))
- Designer Non-Functional Requirements ([NonFunctionalRequirements.md](NonFunctionalRequirements.md))
- **Spike 1 — Designer PoC: App Shell + ACMN Element Rendering** ([spikes/Spike1.md](spikes/Spike1.md))
