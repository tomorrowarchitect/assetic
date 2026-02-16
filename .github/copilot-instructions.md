Repository: Assetic — GitHub Copilot instructions

High-level intent
- Assetic is a tiny, static, browser-only app that generates Xcode AppIcon.appiconset archives client-side.
- Keep the code minimal, dependency-free, and framework-less unless the maintainer explicitly asks for a major change.

How Copilot should behave in this repo
- Prefer small, focused suggestions that modify files under `docs/` (UI and app logic) or `scripts/` (dev tooling).
- Do NOT introduce a frontend framework (React/Vue/Angular) or large build system without explicit approval.
- Preserve output filenames and the Contents.json schema used by Xcode. Filename pattern: `AppIcon-<size>@<scale>.png`.
- When changing image-generation logic, suggest adding unit tests for parsing/size calculations and update README + CLAUDE.md.
- If suggesting new npm scripts or dev tooling, include edits to `package.json` and `.devcontainer` when appropriate.

Where to make common edits
- UI markup & controls: `docs/index.html`
- App logic (scaling, ZIP generation): `docs/app.js`
- Local preview server: `scripts/serve-docs.js`

Pull request checklist (what Copilot should add to PR text)
- What changed and why (one-sentence summary)
- Files modified and any new scripts added
- Manual verification steps (e.g. `npm run serve:docs` → drop image → Generate ZIP)
- Tests added or reasons tests were not added
- Update to docs/README or CLAUDE.md if workflow changed

Do not do
- Do not add server-side upload/analytics; the app is intentionally client-only.
- Do not change the AppIcon filenames or Contents.json layout without coordination.

If you need further guidance: prefer keeping the change surface small and document all workflow/script updates in README.md and CLAUDE.md.