# Epic: APP_CHROME_AND_SETTINGS

**Status:** NEW
**Owner:** human
**Created:** 2026-04-21
**Last Updated:** 2026-04-21

---

## 1. Purpose

Make the Designer feel like a finished desktop application. The
features in this epic aren't what the user came to ACMN Designer to
do — they're what's *missing* if they aren't present.

That means: a native application menu with standard shortcuts, a
Ctrl+K command palette for power users, a Help menu linking to the
standard and user guide, a settings dialog for app-level preferences
(auto-save interval, theme, default project location, Logic Engine
credentials), and application logging to the OS-standard user data
directory.

---

## 2. User Story

As a **solution architect** used to desktop apps,
I want File / Edit / View / Help menus, standard keyboard shortcuts,
and a Ctrl+K command palette,
So that the Designer behaves like any other professional tool I use
and I can invoke commands by keyboard instead of hunting the UI.

As a **Designer maintainer debugging a user's issue**,
I want structured logs written to a predictable directory,
So that I can ask the user for a log file and diagnose problems
without guessing at application state.

---

## 3. Scope

### In Scope

- **Native application menu.**
  - **File:** New Project, Open Project..., Open Recent →,
    separator, Save (Ctrl+S), Save As... (Ctrl+Shift+S),
    separator, Import →, Export →, separator, Close Project,
    Exit.
  - **Edit:** Undo, Redo, separator, Cut, Copy, Paste, Delete,
    separator, Select All, separator, Preferences... (opens
    settings dialog).
  - **View:** Zoom In, Zoom Out, Fit to Viewport, Reset Zoom,
    separator, Toggle Property Panel, Toggle Palette, Toggle
    Project Tree, separator, Toggle Developer Tools (only when
    debug flag enabled).
  - **Test:** Run Test, Step, Pause, Stop, separator, Save
    Scenario, Load Scenario.
  - **Publish:** Open Publish Dialog, Show Last Package in
    Folder.
  - **Help:** ACMN Standard Docs, Designer User Guide, Keyboard
    Shortcut Reference, separator, Report an Issue, About ACMN
    Designer.
- **Zoom controls** (wired to the View menu):
  - Zoom In, Zoom Out, Fit to Viewport, 100% reset. Keyboard
    shortcuts: Ctrl++ / Ctrl+- / Ctrl+0 / Ctrl+1.
- **Command palette** (Ctrl+K / Cmd+K):
  - Fuzzy search over:
    - Commands (Save, Save As, Publish, New Project, etc.).
    - Elements on the active canvas (by name).
    - Palette items (element types).
    - Domain context library entries.
  - Keyboard-first: ↑/↓ to navigate, Enter to execute.
- **Help menu links.** Open in the user's default browser:
  - ACMN Standard: `https://acmnstandard.org/v1.0.11/`.
  - Designer User Guide: initially a local HTML page shipped
    with the installer; v0.2+ can move to a hosted site.
  - Keyboard Shortcut Reference: modal in-app with all registered
    shortcuts.
  - Report an Issue: opens `https://github.com/<repo>/issues/new`
    template (URL configurable per build).
  - About: modal dialog with version, acmnVersion, commit hash,
    license summary.
- **Settings dialog.** Modal opened via Edit → Preferences or
  Ctrl+,.
  - **General:** default project location (folder picker),
    recently-opened-projects limit (integer, default 10).
  - **Editor:** auto-save interval (seconds, default 30, min 5),
    property panel width (read-only display — set via drag).
  - **Appearance:** theme (Light / Dark / System), font scale
    (S / M / L).
  - **Logic Engine** (optional): base URL, auth token
    (encrypted at rest via OS keychain per NFR-035).
  - **Published Domain Contexts folder:** path (folder picker)
    for the "Published" tier (epic_DOMAIN_CONTEXT_07).
  - **Advanced:** log level (debug / info / warn / error), reset
    to defaults button.
- **Keyboard shortcut reference modal.** Lists all registered
  shortcuts in categorised sections (File, Edit, Canvas,
  Test, etc.). Read-only in v0.1; custom binding is v0.2+.
- **Logging.**
  - Log directory: `%APPDATA%\ACMN Designer\logs\` on Windows.
  - Rolling file logger: 10 MB per file, retain last 5.
  - Log levels: debug / info / warn / error (configurable via
    settings or `ACMN_LOG_LEVEL` env var).
  - Structured entries: timestamp (ISO 8601), level, module,
    optional project / cpm / user identifiers, message.
  - Unhandled exceptions capture with stack trace, both main and
    renderer processes.
  - Renderer → main log forwarding via IPC so a single log file
    captures the whole app.
- **Theme support.**
  - Light / Dark / System themes applied via Tailwind class
    toggles and shadcn/ui theme tokens.
  - System-follow respects OS theme and reacts to changes
    without restart.

### Out of Scope

- Custom keyboard shortcut configuration. v0.2+.
- Plugin model / extensibility. v0.3+.
- Telemetry / crash reporting to a central service. v0.2+.
- Auto-update via electron-updater. v0.2+.
- Multi-window support.
- Detailed in-app user guide content. v0.1 ships a stub that
  links to the standard + a couple of how-to pages.
- Accessibility configuration (font size override beyond the
  three-option scale). OS-level settings apply naturally.

---

## 4. Functional Requirements

- **FR-013** — Support zoom controls (zoom in, zoom out, fit to
  viewport, 100% reset) with keyboard shortcuts and mouse-wheel
  zoom.
- **FR-130** — Provide a command palette invoked by Ctrl+K /
  Cmd+K, with fuzzy search over commands (save, publish, new),
  elements on canvas (by name), and palette items.
- **FR-131** — Provide a native application menu (File, Edit,
  View, Test, Publish, Help) with standard keyboard shortcuts.
- **FR-132** — Provide a Help menu linking to ACMN Standard
  documentation, Designer user guide, keyboard shortcut
  reference, and About dialog.
- **FR-133** — Provide a settings dialog for default project
  location, auto-save interval, theme (Light / Dark / System),
  telemetry opt-in (v0.2+), LLM provider credentials for the
  local Logic Engine (optional, for rich test mode).

---

## 5. Non-Functional Requirements

- **NFR-035** — Never store LLM provider API keys in plaintext.
  Credentials encrypted via OS keychain (Windows Credential
  Manager; macOS Keychain / Linux Secret Service in v0.2+).
- **NFR-040** — Keyboard shortcuts for all frequent operations
  following OS-standard conventions (Ctrl+S, Ctrl+Z,
  Ctrl+Shift+Z, Ctrl+C/V, Ctrl+K, Delete).
- **NFR-042** — Support OS-level font size and display scaling
  preferences without UI breakage.
- **NFR-043** — Support OS-level colour theme (light / dark) with
  an option to override within the app's settings.
- **NFR-044** — User-facing error messages in plain language with
  a suggested action and, where applicable, documentation
  reference.
- **NFR-070** — Write application logs to the OS-standard user
  data directory (`%APPDATA%\ACMN Designer\logs\` on Windows).
- **NFR-071** — Rotate log files at 10 MB per file, retaining the
  last 5 files.
- **NFR-072** — Support configurable log levels (debug / info /
  warn / error) via environment variable or settings file.
- **NFR-073** — Include structured context in log entries:
  timestamp, log level, module, optional user / project
  identifiers.
- **NFR-074** — Capture unhandled exceptions and write them to
  the log file with full stack traces, without crashing
  silently.

---

## 6. UI/UX Notes

- **Menu behaviour.** Standard Electron native menu. Disabled
  states on menu items reflect current app state (e.g., Save
  disabled when no project is dirty; Undo disabled when undo
  stack empty).
- **Command palette.** Modal centred, 640 px wide, opens on
  Ctrl+K. Input at top, results list below. Categories as
  section headers ("Commands", "Elements", "Palette", "Domain
  Contexts"). Empty-state suggests "Type to search".
- **Settings dialog.** Tabbed left nav (General / Editor /
  Appearance / Logic Engine / Published Domain Contexts /
  Advanced). Changes apply immediately where possible; restart-
  required settings surface a notice.
- **Keyboard shortcut reference modal.** Two-column layout,
  categorised, scrollable.
- **About dialog.** Contains app version, acmnVersion, build
  time, commit hash (from build-time env), third-party
  licences link, license: Apache 2.0.
- **Theme switch.** Instant when changed in settings — no reload
  required.

---

## 7. Data Model Impact

- **Settings file.** JSON file at `%APPDATA%\ACMN Designer\
  settings.json` storing:
  ```json
  {
    "schemaVersion": "1",
    "general": {
      "defaultProjectLocation": "...",
      "recentProjectsLimit": 10
    },
    "editor": {
      "autoSaveIntervalSeconds": 30,
      "propertyPanelWidth": 400
    },
    "appearance": {
      "theme": "system" | "light" | "dark",
      "fontScale": "s" | "m" | "l"
    },
    "logicEngine": {
      "baseUrl": "http://localhost:8080",
      "authTokenRef": "keychain:acmn-designer/logic-engine"
    },
    "domainContexts": {
      "publishedFolder": "..."
    },
    "advanced": {
      "logLevel": "info"
    }
  }
  ```
- **Log files** rolled at 10 MB each; at most 5 kept. Format:
  JSONL (one JSON object per line) to make structured parsing
  easy.
- **OS keychain entries** for Logic Engine credentials via a
  library like `keytar`.

---

## 8. Integration Impact

- **Main process.** Native menu registered on app ready via
  Electron's `Menu`. Accelerators wired. Menu state updated in
  response to renderer events (Save enabled / disabled, Undo /
  Redo availability, active CPM name in title).
- **IPC additions.** `settings:get`, `settings:set`,
  `settings:reset`, `logs:openFolder`, `logs:getRecentPath`.
- **Command palette in renderer.** New feature module
  `src-renderer/features/commandPalette/`.
- **Logger.** Structured logger in `src-main/logger.ts` used by
  every IPC handler, LocalBackend method, and the simulator.
  Renderer has a thin logger that forwards to main via a
  `log:write` IPC channel. Default uses `electron-log` or a
  custom implementation — decide at ticket time.
- **OS keychain.** `keytar` dependency (permissive licence).
  Lazy-loaded on first Logic Engine credentials usage.
- **Theme plumbing.** Tailwind dark-mode class applied to
  document.documentElement; shadcn tokens already support both
  themes. A tiny `ThemeProvider` reads settings and subscribes
  to OS theme changes.
- **Menu-driven actions from Import/Export/Publish epics.**
  This epic registers the menu entries; handlers belong to
  their respective epics.

---

## 9. Acceptance Criteria

- [ ] Native application menu present with all listed
  File/Edit/View/Test/Publish/Help items.
- [ ] Every menu item has the expected keyboard accelerator
  displayed to its right.
- [ ] Ctrl+K opens the command palette; fuzzy search returns
  relevant commands, on-canvas elements, palette items, and
  domain contexts.
- [ ] Enter on a search result executes the associated action
  (e.g., "Save" saves; clicking on an element focuses it and
  opens its property panel).
- [ ] Edit → Preferences opens the settings dialog with all
  listed tabs and controls.
- [ ] Changing the theme applies instantly; System mode follows
  OS changes without restart.
- [ ] Changing the auto-save interval propagates to the
  auto-save loop from epic_AUTOSAVE_AND_RECOVERY_02.
- [ ] Logic Engine credentials stored via OS keychain — the
  settings.json file contains only a keychain reference.
- [ ] Log files appear under `%APPDATA%\ACMN Designer\logs\`
  and roll at 10 MB. At most 5 files are retained.
- [ ] Unhandled exceptions in both main and renderer are logged
  with stack traces.
- [ ] Help → Keyboard Shortcut Reference opens a modal listing
  all registered shortcuts.
- [ ] Help → ACMN Standard Docs opens the external URL in the
  user's default browser.
- [ ] About dialog shows version, acmnVersion, build commit
  hash, license.
- [ ] Invalid settings values (e.g., auto-save interval < 5 s)
  are rejected with an inline error.

---

## 10. Risks & Unknowns

- **Menu entries for features from other epics.** The native
  menu references actions owned by Import/Export, Publish, Test
  mode. Menu stays as a thin dispatcher: it invokes handlers
  registered by those epics. If those epics aren't ready when
  this epic starts, menu items exist but show a "feature not
  yet available" state — keep cross-epic coupling loose.
- **System-theme follow-on-change.** Requires listening to
  Electron's `nativeTheme.on('updated')`. Watch for edge cases
  (OS dark mode toggled while app is focused).
- **Credential storage on Windows.** Windows Credential Manager
  has a per-user scope — fine for v0.1. Document that switching
  user accounts loses stored creds.
- **Log file size / PII.** Avoid logging user-entered sentry
  expressions, persona text, or document payloads. Log level
  metadata and structural fields only. Code review checkpoint.
- **Open question — command palette scoring.** Basic fuzzy
  scoring is fine; don't over-engineer. If usability is poor
  in a specific scenario, iterate.
- **Open question — menu accelerator conflicts.** Ctrl+K is
  already the command palette; also used by some OS conventions
  for "clear console" — acceptable trade-off for our users.

---

## 11. Dependencies

- **Upstream:**
  - epic_SPIKE1_FOUNDATION_00 (app shell).
  - epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE_01 (IPC plumbing
    pattern, file I/O for settings).
  - epic_AUTOSAVE_AND_RECOVERY_02 (auto-save interval is driven
    from settings).
  - epic_CANVAS_INTERACTION_03 (Undo/Redo menu entries reflect
    stack state).
- **Downstream:** every other epic relies on the logger. Menu
  entries link to Import/Export, Publish, Test mode.

---

## 12. References

- **prd:** `docs/Product Requirements Document/PRD.md` (§6.2
  top-bar modes; various UX affordances)
- **architecture:** `docs/Architecture/Architecture.md` (§10
  security, §13 observability)
- **functional requirements:** `docs/Functional Requirements/FunctionalRequirements.md`
- **non-functional requirements:** `docs/Non-Functional Requirements/NonFunctionalRequirements.md`

---

## 13. Implementation Notes

**Complexity:** M

**Suggested ticket breakdown (6 tickets):**

1. **ACS-01** — Native application menu with all items listed in
   §3. Accelerators. Enabled/disabled state propagation from
   renderer via IPC.
2. **ACS-02** — Settings store (`src-main/settings/`), IPC
   handlers, `settings.json` read/write (atomic, via the epic
   03 helper). Schema-versioned. Tabs in settings dialog.
3. **ACS-03** — Command palette UI + registry. Categories:
   Commands, Elements, Palette, Domain Contexts. Fuzzy search.
4. **ACS-04** — Logger infrastructure: main-side structured
   file logger with rotation, renderer→main log forwarding,
   `ACMN_LOG_LEVEL` env var, settings integration, exception
   capture hooks.
5. **ACS-05** — Theme system: Tailwind dark class, System/Light/
   Dark settings, follow `nativeTheme.on('updated')`.
6. **ACS-06** — Help menu entries: keyboard shortcut reference
   modal, About dialog, external URL actions, user-guide stub
   page shipped with installer.

**Scaffolding files touched:**

- `src-main/main.ts` — menu registration, settings bootstrap,
  logger bootstrap.
- `src-main/menu.ts` — new.
- `src-main/settings/settingsStore.ts` — new.
- `src-main/logger.ts` — new.
- `src-main/ipc/settings.ts` — new.
- `src-main/ipc/logs.ts` — new.
- `src-renderer/features/commandPalette/*` — new folder.
- `src-renderer/features/settings/*` — new folder.
- `src-renderer/lib/logger.ts` — renderer-side logger (forwards
  via IPC).
- `src-renderer/ThemeProvider.tsx` — new.
- `package.json` — `keytar` dependency (pinned).

**Chain constraint:** ACS-02 settings store first — ACS-04
(logger) and ACS-05 (theme) read from it. ACS-01 menu can
develop in parallel.

**Estimated total effort:** 4–5 days.
