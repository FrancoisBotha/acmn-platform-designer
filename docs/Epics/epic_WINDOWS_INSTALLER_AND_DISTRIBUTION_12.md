# Epic: WINDOWS_INSTALLER_AND_DISTRIBUTION

**Status:** NEW
**Owner:** human
**Created:** 2026-04-21
**Last Updated:** 2026-04-21

---

## 1. Purpose

Ship the Designer. Every epic up to this point produces software a
user can run from a dev checkout; this epic produces a signed
Windows installer that a user can download and install on a clean
Windows 11 machine, with confidence that it comes from us and not
from a malware repackager.

The spike produced an unsigned `.exe` as proof-of-concept. This
epic productionises that pipeline: `electron-builder` configured
for NSIS, per-user install path so no admin elevation is required,
code signing with an EV certificate for SmartScreen reputation,
deterministic builds via pinned dependencies, and a license
compliance sweep to confirm we're shipping only permissive
dependencies.

---

## 2. User Story

As a **first-time user** on a fresh Windows 11 machine,
I want to download the ACMN Designer installer, run it, and have the
Designer ready to use within about a minute — without needing admin
rights and without a SmartScreen warning,
So that my onboarding is friction-free and trustworthy.

As a **release engineer**,
I want the build to be fully reproducible from a git tag — same
inputs produce the same `.exe` — so that I can cut patch releases
confidently and diff between versions.

---

## 3. Scope

### In Scope

- **`electron-builder` configuration** (`electron-builder.yml`):
  - Target: NSIS installer for Windows x64 (and optionally x86 if
    required — default x64 only).
  - `oneClick: false` for a visible install flow with folder
    choice.
  - `perMachine: false` for per-user install by default; supports
    per-machine install when run as admin (preserved behaviour,
    not required).
  - Install path default: `%LOCALAPPDATA%\ACMN Designer\`.
  - Shortcuts: Start Menu, optional desktop (checkbox in
    installer UI).
  - Uninstaller: removes binaries, preserves user project folders
    and settings in `%APPDATA%`.
- **Per-user install.** Installer runs without requesting admin
  elevation in the default path.
- **Installer size target** ≤ 250 MB.
- **Install time target** ≤ 60 seconds on the reference
  workstation.
- **App icon + installer assets.** `resources/icon.ico` (multi-
  resolution), installer header image, license text
  (Apache 2.0), setup wizard branding.
- **Code signing.**
  - EV code-signing certificate usage in the build pipeline
    (certificate and private key injected via environment
    variables — never committed).
  - Signing both the installer and the application binaries
    inside it.
  - Timestamping via a trusted timestamp authority so the
    signature remains valid after the certificate expires.
  - Documentation for the signing workflow in the repo (how to
    set env vars, how to run signed builds locally).
- **Dependency pinning.** Every direct dependency in
  `package.json` uses an exact version (no caret, no tilde, no
  ranges). `pnpm-lock.yaml` committed for transitive lock.
- **License compliance sweep.** CI step runs a license auditor
  (e.g., `license-checker`) and fails the build if any
  dependency is GPL, AGPL, or unknown. Permitted licenses: MIT,
  Apache 2.0, BSD (2/3-clause), ISC, CC0.
- **Source license.** Apache 2.0 — `LICENSE` file at repo root,
  per-file SPDX headers where applicable.
- **Third-party attributions.** Generate a `THIRD_PARTY_LICENSES.md`
  or similar during build, shipped with the installer and
  accessible from the About dialog (link added by
  epic_APP_CHROME_AND_SETTINGS_08).
- **Build pipeline.**
  - Local: `pnpm build` produces a signed `.exe` when signing
    env vars are present, unsigned otherwise.
  - CI: on tagged release, produce signed artefacts and publish
    them as GitHub release assets.
- **Reproducibility.** Same git SHA + same build env → byte-
  identical installer. Documented procedure; aspirational on
  Windows (timestamp-only nondeterminism may persist).
- **Smoke test.** CI runs a smoke test installing the `.exe` on a
  clean Windows runner, launches it, verifies the welcome screen
  renders, uninstalls.
- **Uninstall behaviour.** Preserves user project folders and
  settings by default. Offers a "remove my settings" checkbox on
  uninstall.

### Out of Scope

- macOS installer (`.dmg`) — v0.2+.
- Linux installers (`.AppImage`, `.deb`) — v0.2+.
- Auto-update via `electron-updater` — v0.2+.
- Microsoft Store distribution. Not planned.
- Enterprise MSI packaging. Deferred (can layer on top of NSIS
  later).
- Watermarked / demo builds.
- Crash reporting service integration. v0.2+.
- Certificate procurement — this epic assumes the certificate
  exists. Procurement is a business/administrative task tracked
  separately.

---

## 4. Functional Requirements

This epic has no new user-visible functional requirements — its
surface is in the NFRs below. The installer is, in a sense, a
platform concern rather than a feature.

---

## 5. Non-Functional Requirements

- **NFR-020** — Support Windows 10 (21H2+) and Windows 11 on x64
  architecture as the primary target platform.
- **NFR-021** — Distributable as a signed Windows installer
  (`.exe`) built with `electron-builder`, producing an NSIS-based
  installer.
- **NFR-022** — Install to the user's Program Files or AppData
  directory without requiring administrator privileges for
  per-user installation.
- **NFR-023** — Install in under 60 seconds on the reference
  workstation.
- **NFR-024** — Installer no larger than 250 MB.
- **NFR-036** — Signed with a code-signing certificate before
  public distribution. EV certificate preferred for Windows
  SmartScreen reputation.
- **NFR-065** — Source code published under Apache License 2.0.
- **NFR-066** — Use dependencies with permissive licences only
  (MIT, Apache 2.0, BSD, ISC). GPL and AGPL dependencies
  rejected.
- **NFR-067** — Pin all dependency versions in `package.json`
  (no caret ranges for direct dependencies) to guarantee
  reproducible builds.

---

## 6. UI/UX Notes

- **Installer UI.** Standard NSIS wizard — welcome page, license
  page (Apache 2.0), install path, shortcut options, install
  progress, finish page with "Launch now" checkbox.
- **No custom installer branding** beyond a header image and app
  icon. NSIS default styling is sufficient for v0.1.
- **Uninstaller.** Standard Windows "Apps & features" entry. Runs
  silently by default; offers the "remove my settings" option
  when launched interactively.
- **About dialog** (link from epic_APP_CHROME_AND_SETTINGS_08) shows
  the third-party attributions list.

---

## 7. Data Model Impact

- No application data model changes.
- **Installer metadata:** `electron-builder.yml` defines app id
  (`org.acmnstandard.designer`), product name (`ACMN Designer`),
  publisher (from config). These land in Windows Programs list
  and file attributes.

---

## 8. Integration Impact

- **Build toolchain.** Introduce CI workflow
  (`.github/workflows/release.yml` or equivalent) that:
  - Installs pnpm, installs deps (`pnpm install --frozen-lockfile`).
  - Runs typecheck, unit tests, license audit.
  - Runs `pnpm build` with signing env vars injected from CI
    secrets.
  - Uploads the signed `.exe` as a build artefact and, on
    tagged releases, to GitHub Releases.
- **License audit tool.** `license-checker` (MIT) or equivalent
  as a dev dependency.
- **No runtime integration.** The app itself doesn't change;
  this epic changes only how it's packaged and shipped.

---

## 9. Acceptance Criteria

- [ ] `pnpm build` produces an NSIS `.exe` installer on a clean
  Windows 11 build machine.
- [ ] When the signing env vars are present, the resulting
  installer and the packaged application binaries are signed
  with the configured EV certificate and timestamped.
- [ ] Running the installer on a fresh non-admin Windows 11
  account completes in under 60 seconds and installs to
  `%LOCALAPPDATA%\ACMN Designer\`.
- [ ] No UAC elevation prompt during per-user install.
- [ ] Installer size is ≤ 250 MB.
- [ ] SmartScreen does not show a "Unknown publisher" warning on
  a reputationally-established EV-signed installer. (May take
  initial downloads to build reputation; document this.)
- [ ] Start Menu shortcut launches the app successfully.
- [ ] Uninstalling removes the binaries and the Start Menu
  shortcut; project folders and `%APPDATA%` settings are
  preserved by default.
- [ ] Every direct dependency in `package.json` uses an exact
  version. `pnpm-lock.yaml` is committed.
- [ ] License audit in CI passes — no GPL / AGPL / unknown
  licences present.
- [ ] `THIRD_PARTY_LICENSES.md` is generated at build time,
  bundled with the installer, and linked from the About dialog.
- [ ] `LICENSE` file at repo root contains the Apache 2.0
  licence text.
- [ ] CI smoke test installs the `.exe` on a clean Windows
  runner, launches the app, verifies the welcome screen, and
  uninstalls.
- [ ] Build documentation in repo (`docs/Build.md` or similar)
  explains the signing workflow, env vars, and how to produce
  a local signed build.

---

## 10. Risks & Unknowns

- **Code-signing certificate procurement.** EV certificates are
  not cheap and require organisational verification. This epic
  assumes one is available; if it's not, the epic can deliver
  unsigned builds as an interim with a clear caveat, and signing
  is back-filled when the cert arrives.
- **SmartScreen reputation.** EV certs reduce the lead time for
  SmartScreen trust but don't eliminate it entirely. First few
  downloads may still show a warning. Document this in the
  user-facing install guide.
- **Reproducible builds on Windows.** `electron-builder` can
  produce deterministic output within tight bounds, but
  Windows' signature embedding adds a timestamp that defeats
  pure binary-identical reproduction. Document the caveat.
- **License auditor false positives.** Some packages ship with
  ambiguous license metadata. Maintain an allow-list override
  file for known-safe cases, audited regularly.
- **Install time on older hardware.** The 60 s target is for the
  reference workstation. Slower machines may exceed. Document
  the measurement conditions.
- **`keytar` native module.** `keytar` (used by
  epic_APP_CHROME_AND_SETTINGS_08 for credential storage) is a
  native Node module — must be rebuilt for Electron's Node
  version as part of the build. Confirm the electron-builder
  config handles this.
- **Open question — per-user vs per-machine install UX.** v0.1
  defaults to per-user. Enterprise users may prefer per-machine
  for controlled deployments. Revisit in v0.2 if requested.

---

## 11. Dependencies

- **Upstream:** all feature epics — there's nothing meaningful to
  ship until enough features are in. In practice, this epic can
  start on day one of v0.1 to wire up the build pipeline, with
  the signed-and-productionised output gated on the feature
  epics being complete.
- **Downstream:** v0.2+ cross-platform installers build on top
  of this epic's electron-builder configuration.
- **External:**
  - `electron-builder` (permissive).
  - Code-signing certificate (EV preferred).
  - Timestamp authority (DigiCert, Sectigo, etc.).
  - GitHub Actions or equivalent CI.

---

## 12. References

- **prd:** `docs/Product Requirements Document/PRD.md` (§8
  platform priorities; §10 release plan)
- **architecture:** `docs/Architecture/Architecture.md` (§11
  build and distribution; §12 testing strategy — for the smoke
  test)
- **functional requirements:** `docs/Functional Requirements/FunctionalRequirements.md`
- **non-functional requirements:** `docs/Non-Functional Requirements/NonFunctionalRequirements.md`
- **electron-builder:** https://www.electron.build

---

## 13. Implementation Notes

**Complexity:** M

**Suggested ticket breakdown (5 tickets):**

1. **WIN-01** — `electron-builder.yml` for Windows NSIS:
   per-user install path, install UI config, app metadata,
   Start Menu shortcut, install/uninstall behaviour. `pnpm
   build` produces unsigned `.exe` as baseline.
2. **WIN-02** — Code-signing pipeline: env-var-driven
   certificate injection, installer + binary signing,
   timestamping. Docs (`docs/Build.md`) covering local and CI
   signing.
3. **WIN-03** — License compliance: add `license-checker` (or
   equivalent) as a dev dep; CI job runs it and fails on
   disallowed licences. Generate `THIRD_PARTY_LICENSES.md` at
   build time; bundle with installer.
4. **WIN-04** — Dependency pin audit: sweep `package.json` to
   ensure every direct dep is an exact version. Commit
   `pnpm-lock.yaml`. Add `Apache 2.0` `LICENSE` at repo root
   with SPDX headers in source files.
5. **WIN-05** — CI release workflow: on tagged release, build
   signed installer, run smoke test (install → launch → verify
   welcome screen → uninstall) on Windows runner, upload as
   GitHub release asset. Installer size + install time
   measurement in CI output.

**Scaffolding files touched:**

- `electron-builder.yml` — new.
- `package.json` — dependency pinning, build scripts, product
  metadata.
- `pnpm-lock.yaml` — committed.
- `LICENSE` — new (Apache 2.0 text).
- `resources/icon.ico` — new (multi-resolution).
- `resources/installer-header.png` — new.
- `.github/workflows/release.yml` — new (CI pipeline).
- `docs/Build.md` — new (signing workflow documentation).

**Chain constraint:** WIN-01 first (baseline builder config).
WIN-04 (pinning) can land independently. WIN-02/WIN-03 build on
top of WIN-01. WIN-05 (CI workflow) depends on WIN-01..WIN-03.

**Estimated total effort:** 3–4 days.
