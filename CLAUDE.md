# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Purpose
- Small, static, browser-only tool that generates an Xcode AppIcon.appiconset (zip) entirely client-side.

Quick commands
- Start local preview server: `npm run serve:docs` (runs `node scripts/serve-docs.js`).
- Run server directly: `node scripts/serve-docs.js` — serves `./docs` at http://localhost:5173/ and http://localhost:5173/docs/
- Open UI in browser: visit `http://localhost:5173/docs/` and test by dropping an image.
- Tests: `npm test` — currently a placeholder and will exit with error (package.json has no test runner configured).
  - To run a single test once a test runner is added:
    - Node built-in runner: `node --test path/to/test.js`
    - Jest (if added): `npx jest path/to/test -t "test name"`
    - Add an npm `test` script when you standardize on a runner.
- Lint/build: none configured. If ESLint or a bundler is added, expose `npm run lint` / `npm run build` in package.json.

High-level architecture (big picture)
- Type: single-page, static, client-side web app. No backend logic or API.
- Distribution: the `docs/` directory is the app (HTML, CSS, vanilla JS). The repository ships a ready-to-serve static site.
- Development server: a tiny Node static server at `scripts/serve-docs.js` (serves files from `docs/`).
- Key runtime libraries are loaded from CDN in the browser (JSZip, FileSaver) — there is no bundler or npm dependency for the browser code.

Where to look first (important files / entry points)
- docs/index.html — UI shell; loads `docs/app.js` and external libs (see JSZip/FileSaver includes) (docs/index.html:94-96).
- docs/app.js — main application logic and image-generation pipeline (ICON_DEFINITIONS, canvas drawing, ZIP/Contents.json generation).
  - ICON definitions: `ICON_DEFINITIONS` (docs/app.js:5)
  - Canvas scaling/cropping: `drawToCanvas` (docs/app.js:145)
  - Main ZIP + Contents.json builder: `generateAppIconZip` (docs/app.js:266)
  - visionOS solid image stack generator: `addSolidImageStackToZip` (docs/app.js:407)
- scripts/serve-docs.js — local static server (scripts/serve-docs.js:6).
- package.json — tiny metadata and `serve:docs` script (package.json:6).
- docs/style.css — styling for the UI.
- .devcontainer/* and .vscode/* — development environment / tooling (devcontainer includes Copilot + claude-code extensions).

Runtime / data flow (short)
- User supplies an image via file input / drag-drop (docs/app.js:192).
- The image is loaded as an ImageBitmap or canvas (`loadImageBitmap`) and prepared for resizing.
- `ICON_DEFINITIONS` defines which idioms/sizes/scales to generate.
- For each target the code draws a canvas (center-crop or contain), converts to PNG blob, and adds it to a JSZip archive.
- `Contents.json` is generated alongside the PNGs so Xcode recognises the set; optional `AppIcon.solidimagestack` is produced for visionOS.
- ZIP is offered for download using FileSaver (`saveAs`).

Where to make common changes
- To change sizes or add platforms: edit `ICON_DEFINITIONS` in `docs/app.js` (docs/app.js:5).
- To change cropping/resizing behaviour: edit `drawToCanvas` (docs/app.js:145).
- To change ZIP/Contents.json format or filenames: edit `generateAppIconZip` (docs/app.js:266).
- UI changes: edit `docs/index.html` and `docs/style.css`; wire new controls in `docs/app.js`.

Testing & CI
- There are currently no tests or CI workflows. When adding logic that should be unit-tested, extract pure functions (parsing sizes, filename generation, scaling calculations) into testable modules and add a test runner + `npm test` script.
- Example single-test commands depend on the chosen runner (see Quick commands above).

Devcontainer & local environment
- A `.devcontainer/` configuration is included and pre-installs Copilot + claude-code extensions for a reproducible developer environment.
- Use the Dev Containers / Codespaces flow for consistent testing and to exercise the VNC/Chrome tooling used by the repo.

Behavioral constraints for automated edits (for Claude Code instances)
- Preserve output filenames and Contents.json structure unless the change is deliberate and accompanied by tests and README/CLAUDE.md updates.
- Do not introduce a frontend framework or large build system without explicit user approval — the app is intentionally framework-free.
- If you add dependencies, update `package.json`, `package-lock.json`, and `.devcontainer` (if required), and document changes in README + CLAUDE.md.

Useful file references (short)
- docs/app.js:5 — ICON_DEFINITIONS (sizes / platforms)
- docs/app.js:145 — drawToCanvas (scaling/cropping)
- docs/app.js:266 — generateAppIconZip (zip + Contents.json)
- docs/app.js:407 — addSolidImageStackToZip (visionOS optional export)
- scripts/serve-docs.js:6 — PORT / ROOT and static-server behavior
- package.json:6 — npm scripts

If you change developer commands
- Add/update npm scripts and mirror them in this CLAUDE.md and README.md.

If anything is unclear, read the three files above first (docs/index.html, docs/app.js, scripts/serve-docs.js) before making edits.