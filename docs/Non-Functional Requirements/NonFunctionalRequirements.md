# ACMN Designer — Non-Functional Requirements

| ID | Sub-System | Description | Status | Epic |
|----|------------|-------------|--------|------|
| NFR-001 | Designer | The system shall cold-start (from application launch to welcome screen interactive) in under 3 seconds on a reference workstation (Intel i5 8th gen or equivalent, 16 GB RAM, SSD). | Draft | epic_SPIKE1_FOUNDATION |
| NFR-002 | Designer | The system shall open a typical project (≤5 case plan models, ≤50 total elements) in under 2 seconds from click to editable canvas. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE |
| NFR-003 | Designer | The system shall open a large project (≤20 case plan models, ≤500 total elements) in under 5 seconds. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE |
| NFR-004 | Designer | The system shall maintain 60 FPS canvas interaction (pan, zoom, drag) on case plan models with up to 100 elements on the reference workstation. | Draft | epic_CANVAS_INTERACTION |
| NFR-005 | Designer | The system shall maintain at least 30 FPS canvas interaction on case plan models with up to 300 elements. | Draft | epic_CANVAS_INTERACTION |
| NFR-006 | Designer | The system shall respond to property panel input with under 50 ms latency (keystroke to rendered validation result). | Draft | epic_PROPERTY_PANEL |
| NFR-007 | Designer | The system shall complete auto-save operations in under 500 ms for projects with ≤100 elements, without blocking user input. | Draft | epic_AUTOSAVE_AND_RECOVERY |
| NFR-008 | Designer | The system shall complete publish (pre-flight validation + packaging) in under 5 seconds for case plan models with ≤50 elements. | Draft | epic_PUBLISH_MODE_AND_PACKAGING |
| NFR-009 | Designer | The system shall consume no more than 500 MB of RAM when idle with a typical project open, and no more than 1 GB when actively editing or running a test. | Draft | epic_SPIKE1_FOUNDATION |
| NFR-010 | Designer | The system shall not consume measurable CPU when idle with a project open and no user interaction for 60 seconds. | Draft | epic_SPIKE1_FOUNDATION |
| NFR-020 | Designer | The system shall support Windows 10 (21H2+) and Windows 11 on x64 architecture as the primary target platform. | Draft | epic_WINDOWS_INSTALLER_AND_DISTRIBUTION |
| NFR-021 | Designer | The system shall be distributable as a signed Windows installer (.exe) built with electron-builder, producing an NSIS-based installer. | Draft | epic_WINDOWS_INSTALLER_AND_DISTRIBUTION |
| NFR-022 | Designer | The system shall install to the user's Program Files or AppData directory without requiring administrator privileges for per-user installation. | Draft | epic_WINDOWS_INSTALLER_AND_DISTRIBUTION |
| NFR-023 | Designer | The system shall install in under 60 seconds on the reference workstation. | Draft | epic_WINDOWS_INSTALLER_AND_DISTRIBUTION |
| NFR-024 | Designer | The system installer shall be no larger than 250 MB. | Draft | epic_WINDOWS_INSTALLER_AND_DISTRIBUTION |
| NFR-025 | Designer | The system shall support macOS 13+ (Ventura) on Apple Silicon and Intel in v0.2+. | Draft | — (v0.2+) |
| NFR-026 | Designer | The system shall support Debian/Ubuntu (20.04 LTS+) via .AppImage and .deb packages in v0.2+. | Draft | — (v0.2+) |
| NFR-027 | Designer | The system shall support display resolutions from 1280×720 to 4K with a responsive UI that reflows at smaller widths. | Draft | epic_SPIKE1_FOUNDATION |
| NFR-028 | Designer | The system shall support HiDPI displays with crisp rendering at 1.25×, 1.5×, 2×, and 3× scaling factors. | Draft | epic_SPIKE1_FOUNDATION |
| NFR-030 | Designer | The system shall run with nodeIntegration disabled, contextIsolation enabled, and sandbox enabled on all BrowserWindows. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE |
| NFR-031 | Designer | The system shall expose IPC from main to renderer only via contextBridge, with a minimal, typed API surface. The renderer shall not have direct access to the ipcRenderer object or Node.js APIs. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE |
| NFR-032 | Designer | The system shall set a Content Security Policy header of default-src 'self' on the renderer to prevent remote code execution. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE |
| NFR-033 | Designer | The system shall not load remote code at runtime. All application code shall ship in the installer. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE |
| NFR-034 | Designer | The system shall validate all file paths received from user dialogs against path traversal attacks before performing filesystem operations. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE |
| NFR-035 | Designer | The system shall never store LLM provider API keys in plaintext. Credentials shall be encrypted using the OS keychain (Windows Credential Manager, macOS Keychain, Linux Secret Service). | Draft | epic_APP_CHROME_AND_SETTINGS |
| NFR-036 | Designer | The system installer shall be signed with a code-signing certificate before public distribution. An EV certificate is preferred for Windows SmartScreen reputation. | Draft | epic_WINDOWS_INSTALLER_AND_DISTRIBUTION |
| NFR-037 | Designer | The system shall verify the integrity of auto-update packages using the publisher's signature before applying updates (v0.2+). | Draft | — (v0.2+) |
| NFR-040 | Designer | The system shall provide keyboard shortcuts for all frequent operations, following OS-standard conventions (Ctrl+S save, Ctrl+Z undo, Ctrl+Shift+Z redo, Ctrl+C/V copy/paste, Ctrl+K command palette, Delete for selection). | Draft | epic_APP_CHROME_AND_SETTINGS |
| NFR-041 | Designer | The system shall meet WCAG 2.1 Level AA accessibility standards for the renderer UI, including colour contrast, keyboard navigation, and screen reader compatibility. | Draft | epic_PROPERTY_PANEL |
| NFR-042 | Designer | The system shall support OS-level font size and display scaling preferences without UI breakage. | Draft | epic_APP_CHROME_AND_SETTINGS |
| NFR-043 | Designer | The system shall support OS-level colour theme (light/dark) with an option to override within the app's settings. | Draft | epic_APP_CHROME_AND_SETTINGS |
| NFR-044 | Designer | The system shall present all user-facing error messages in plain language, including a suggested action and, where applicable, a reference to documentation. | Draft | epic_APP_CHROME_AND_SETTINGS |
| NFR-045 | Designer | The system shall provide inline help tooltips for all property panel fields, explaining the purpose and expected format. | Draft | epic_PROPERTY_PANEL |
| NFR-046 | Designer | The system shall enable a new user to complete their first case plan model (connector + agent + case) in under 15 minutes with access to the user guide. | Draft | epic_APP_CHROME_AND_SETTINGS |
| NFR-050 | Designer | The system's project file format (project.acmn.json, .cpm.json, .domain.json) shall be human-readable JSON with 2-space indentation for diff-ability and version control compatibility. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE |
| NFR-051 | Designer | The system's project files shall include a schema version field enabling forward-compatible parsing. | Draft | epic_AUTOSAVE_AND_RECOVERY |
| NFR-052 | Designer | The system shall provide a forward-migration path when loading project files from earlier schema versions, preserving the original file as .backup. | Draft | epic_AUTOSAVE_AND_RECOVERY |
| NFR-053 | Designer | The system shall refuse to open project files from schema versions newer than the current application, with a clear message directing the user to update the application. | Draft | epic_AUTOSAVE_AND_RECOVERY |
| NFR-054 | Designer | The system shall write project files atomically (write to temp file, rename to target) to prevent corruption on unexpected exit. | Draft | epic_AUTOSAVE_AND_RECOVERY |
| NFR-055 | Designer | The system shall maintain a rolling backup of the last 3 autosaves per project, enabling recovery from a corrupted save. | Draft | epic_AUTOSAVE_AND_RECOVERY |
| NFR-060 | Designer | The system shall be architected with a clearly separated BackendContract interface, enabling the backend implementation to be swapped between LocalBackend (v0.1) and RemoteBackend (v0.2+) without changes to UI code. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE |
| NFR-061 | Designer | The system's codebase shall be written entirely in TypeScript with strict mode enabled, targeting zero any types outside of IPC serialisation boundaries. | Draft | epic_SPIKE1_FOUNDATION |
| NFR-062 | Designer | The system shall have unit test coverage of at least 70% on pure TypeScript modules (validation, storage, state reducers) by the v0.1 release. | Draft | epic_WINDOWS_INSTALLER_AND_DISTRIBUTION |
| NFR-063 | Designer | The system shall have end-to-end test coverage of the primary user journey (new project → design → test → publish) via Playwright, running in CI on every commit to main. | Draft | epic_WINDOWS_INSTALLER_AND_DISTRIBUTION |
| NFR-064 | Designer | The system shall follow an npm-compatible versioning scheme, with the Designer's version in sync with the ACMN Platform version it supports. | Draft | epic_WINDOWS_INSTALLER_AND_DISTRIBUTION |
| NFR-065 | Designer | The system's source code shall be published under Apache License 2.0. | Draft | epic_WINDOWS_INSTALLER_AND_DISTRIBUTION |
| NFR-066 | Designer | The system shall use dependencies with permissive licences only (MIT, Apache 2.0, BSD, ISC). GPL and AGPL dependencies shall not be introduced. | Draft | epic_WINDOWS_INSTALLER_AND_DISTRIBUTION |
| NFR-067 | Designer | The system shall pin all dependency versions in package.json (no caret ranges for direct dependencies) to guarantee reproducible builds. | Draft | epic_WINDOWS_INSTALLER_AND_DISTRIBUTION |
| NFR-070 | Designer | The system shall write application logs to the OS-standard user data directory (%APPDATA%\\ACMN Designer\\logs on Windows). | Draft | epic_APP_CHROME_AND_SETTINGS |
| NFR-071 | Designer | The system shall rotate log files at 10 MB per file, retaining the last 5 files. | Draft | epic_APP_CHROME_AND_SETTINGS |
| NFR-072 | Designer | The system shall support configurable log levels (debug, info, warn, error) via environment variable or settings file. | Draft | epic_APP_CHROME_AND_SETTINGS |
| NFR-073 | Designer | The system shall include structured context in log entries: timestamp, log level, module, and optional user/project identifiers. | Draft | epic_APP_CHROME_AND_SETTINGS |
| NFR-074 | Designer | The system shall capture unhandled exceptions and write them to the log file with full stack traces, without crashing silently. | Draft | epic_APP_CHROME_AND_SETTINGS |
| NFR-075 | Designer | The system shall support optional anonymous crash reporting via Sentry in v0.2+, disabled by default, requiring explicit opt-in in settings. | Draft | — (v0.2+) |
| NFR-080 | Designer | The system shall support projects containing up to 50 case plan models without degradation of open/save performance. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE |
| NFR-081 | Designer | The system shall support individual case plan models containing up to 500 plan items and 1000 wires without degradation of canvas interaction. | Draft | epic_WIRE_MANAGEMENT |
| NFR-082 | Designer | The system shall handle domain contexts containing up to 200 vocabulary terms, 50 schemas, 30 rules, and 20 decision tables without performance degradation. | Draft | epic_DOMAIN_CONTEXT |
| NFR-083 | Designer | The system shall handle test runs containing up to 500 recorded events without slowing the console panel. | Draft | epic_TEST_MODE_AND_SIMULATOR |
| NFR-090 | Designer | The system shall operate fully offline in v0.1, requiring no network connection for any feature including test mode (using deterministic mocked agent responses). | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE |
| NFR-091 | Designer | The system shall detect network connectivity and gracefully disable network-dependent features when offline in v0.2+. | Draft | — (v0.2+) |
| NFR-092 | Designer | The system shall cache the domain context library locally (v0.2+) to support offline browsing and work on previously-fetched contexts. | Draft | — (v0.2+) |
| NFR-100 | Designer | The system shall not transmit any user data to Anthropic, Electron, or any third party without explicit opt-in. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE |
| NFR-101 | Designer | The system shall not require a user account or registration to use core features in v0.1. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE |
| NFR-102 | Designer | The system shall store all user data locally in the user's chosen project folders and the OS-standard user data directory. | Draft | epic_BACKEND_CONTRACT_AND_PROJECT_LIFECYCLE |
| NFR-103 | Designer | The system shall provide a clear uninstall path that removes the application binaries but preserves user project folders. | Draft | epic_WINDOWS_INSTALLER_AND_DISTRIBUTION |
| NFR-104 | Designer | The system shall not include any form of digital rights management (DRM) or activation licensing. | Draft | epic_WINDOWS_INSTALLER_AND_DISTRIBUTION |
| NFR-110 | Designer | The system shall support localisation of user-facing strings via i18n resource files, with English (en-AU and en-US) as the initial supported locales. | Draft | epic_APP_CHROME_AND_SETTINGS |
| NFR-111 | Designer | The system shall support right-to-left (RTL) layout for future Arabic and Hebrew locales (v0.3+). | Draft | — (v0.3+) |
| NFR-112 | Designer | The system shall display dates, times, and numbers according to the user's OS locale settings. | Draft | epic_APP_CHROME_AND_SETTINGS |
| NFR-120 | Designer | The system's UI shall remain responsive during all background operations (autosave, validation, publish packaging) via async IPC and non-blocking main-process operations. | Draft | epic_AUTOSAVE_AND_RECOVERY |
| NFR-121 | Designer | The system shall indicate background activity (spinners, progress bars) for any operation exceeding 500 ms. | Draft | epic_APP_CHROME_AND_SETTINGS |
| NFR-122 | Designer | The system shall support graceful cancellation of long-running operations (publish, import) without corrupting project state. | Draft | epic_PUBLISH_MODE_AND_PACKAGING |
| NFR-130 | Designer | The system shall target Electron 30 or later, tracking stable Electron releases within one minor version of current. | Draft | epic_SPIKE1_FOUNDATION |
| NFR-131 | Designer | The system shall receive security patches for supported Electron versions within 2 weeks of upstream release. | Draft | epic_WINDOWS_INSTALLER_AND_DISTRIBUTION |
| NFR-132 | Designer | The system's supported Node.js version (main process) shall match the Node.js version bundled with the target Electron release. | Draft | epic_SPIKE1_FOUNDATION |
