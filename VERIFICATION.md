# Verification

Verified on September 30, 2026 (Asia/Dhaka).

## Source and build

- Editor pinned to the live excalidraw.com source version: a52cd200927a975322934b42b966133232724bad. Confirmed using the live site's version metadata and the upstream Git commit.
- TypeScript check passed with no errors.
- Lint passed for the customized TypeScript/React files.
- Production build passed and generated the installable PWA assets.
- 89 focused tests passed across scene restoration, file/image export, shape libraries, freehand drawing, and the new encrypted snapshot-link tests.
- Collaboration server compiled successfully. Its locked dependency audit reported zero vulnerabilities.

## Browser checks

- Desktop editor and original tool layout render with Draw Board branding.
- Rectangle drawing, text editing, freehand paths, undo/redo, zoom, library, browser autosave, and reload passed.
- Mobile controls at 390 x 844 and dark mode passed.
- No uncaught JavaScript exceptions in the core drawing flows.
- Actual .excalidraw, PNG, and SVG files downloaded through the UI; embedded scene data was present.
- Encrypted snapshot links restored the scene in an isolated browser, including from the production build.
- Two isolated browsers exchanged edits through the included local collaboration relay. This validates relay integration, not a publicly hosted service or ownership of Firebase resources.
- Cached production app reloaded with the network disabled and saved new text offline.

## Deployment limits

- Vercel production hosting has not been deployed in this task; the user requested a GitHub import-ready release.
- Drawing, browser saving, exports, Mermaid, and encrypted snapshot sharing need no additional backend configuration.
- Public collaboration needs the included companion server hosted and its URL configured. Independent persistent room/image storage needs the user's own Firebase project.
- AI generation needs a compatible AI backend. The upstream AI endpoint failed from this fork, so it is unconfigured by default with an explicit UI message.
- Excalidraw+ accounts and paid workspace storage are external proprietary services.
- Snapshot links differ from stored short links: they carry the encrypted drawing in the URL fragment and may be too long for some messaging apps.

Local test logs, browser screenshots, and test scripts are under the ignored work directory in the working source copy.
