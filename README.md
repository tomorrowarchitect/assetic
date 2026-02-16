Assetic — App Icon Generator

A tiny, client-side web app that generates an Xcode AppIcon.appiconset (zip) for iOS / iPadOS / macOS / watchOS / tvOS / visionOS.

Features
- Client-side only: images are processed in the browser (no upload).
- Produces correctly-named PNGs and a Contents.json ready for Xcode.
- Optional visionOS solid image stack export (best-effort).

Quick start
- Preview locally: `npm run serve:docs` (or `node scripts/serve-docs.js`).
- Open http://localhost:5173/docs/ in a browser, drop an image, and click "Generate ZIP".

Notes for contributors
- App implementation lives in `docs/` (HTML, CSS, vanilla JS). The main logic is `docs/app.js`.
- There is no build step or frontend framework — keep changes small and dependency-free unless explicitly approved.
- `package.json` currently only provides `serve:docs`.

License
- ISC (see package.json)
