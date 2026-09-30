# Draw Board

An Excalidraw whiteboard customized by **Wrakeeb**. This is the full open-source application and editor, with the original tool layout and drawing behavior preserved.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fw-rakeeb%2Fdraw-board&project-name=draw-board&repository-name=draw-board)

## Import into Vercel

Click **Deploy with Vercel**, or import `w-rakeeb/draw-board` from your Vercel dashboard. Keep the **Root Directory** at the repository root. The included `vercel.json` sets:

| Setting          | Value                            |
| ---------------- | -------------------------------- |
| Framework        | Vite                             |
| Install command  | `yarn install --frozen-lockfile` |
| Build command    | `yarn build`                     |
| Output directory | `excalidraw-app/build`           |

No environment variables are required for drawing, typing, browser-local saving, exports, Mermaid diagrams, or encrypted snapshot links. Live collaboration and AI need separately configured services; see [Backend setup](BACKEND_SETUP.md).

## Features

- Infinite canvas, hand-drawn shapes, arrows, connectors, freehand drawing, text, sticky notes, eraser, and images.
- Frames, web embeds, laser pointer, fill, lasso selection, groups, alignment, grid, snapping, search, and command palette.
- Undo/redo, zoom and pan, dark/light/system themes, responsive touch layout, keyboard shortcuts, and translations.
- Browser autosave, `.excalidraw` files, PNG/SVG exports with embedded scene data, clipboard, custom shape libraries, and Mermaid diagrams.
- Encrypted snapshot links include your drawing and referenced images and work without a storage backend. Large scenes should be shared as files; messaging apps may truncate long links.
- The original encrypted collaboration and AI integrations remain in the app and require your own configured services.
- Offline-capable PWA after the required app/assets have been loaded and cached.

## Service dependencies and ownership

The website and editor belong to your deployment. A copy of the frontend does **not** create a copy of Excalidraw's cloud infrastructure or the proprietary Excalidraw+ service.

Collaboration and AI start unconfigured with an explicit message. Compatibility and catalog settings remain public browser configuration, not server credentials:

| Capability | Default service |
| --- | --- |
| Collaboration relay | Configure your own; server source is included in `services/collaboration/` |
| Encrypted share links | Self-contained encrypted snapshots by default; stored short links are configurable |
| Room persistence and image files | Upstream Firebase project from `.env.production` |
| Public shape-library catalog | `https://libraries.excalidraw.com` |
| AI generation | Configure a compatible AI backend |
| Some font loading | Upstream font CDN with local fallbacks |

Catalogs, legacy storage, and fonts are third-party dependencies. They are not Wrakeeb-owned backends. Snapshot links keep the encrypted payload and key in the URL fragment without a scene-storage request. Collaboration sends encrypted content to its configured services. AI sends the requested prompt or image to its backend and is not end-to-end encrypted.

For independent operation, configure your own compatible services via Vercel environment variables, then redeploy:

- `VITE_APP_WS_SERVER_URL`: compatible [excalidraw-room](https://github.com/excalidraw/excalidraw-room) Socket.IO relay.
- `VITE_APP_FIREBASE_CONFIG`: JSON browser configuration for your own Firebase project. The upstream `firebase-project/` directory provides the matching rules and service layout.
- `VITE_APP_BACKEND_V2_GET_URL` and `VITE_APP_BACKEND_V2_POST_URL`: optional compatible scene-storage API. Set `VITE_APP_SHARE_LINK_MODE=backend` for stored short links.
- `VITE_APP_LIBRARY_URL` and `VITE_APP_LIBRARY_BACKEND`: optional alternative catalog/backend.
- `VITE_APP_AI_BACKEND`: compatible streaming AI backend.

`VITE_*` variables are public browser values; never put a private API key or service-account credential in them. Rebuild after changes because Vite substitutes these settings at build time.

Excalidraw+ links remain clearly labeled and open the original provider's service. Paid accounts, subscriptions, and commercial workspace storage are not implemented by this open-source fork. Upstream analytics injection and upstream Sentry reporting have been disabled.

## Local development

Requires Node.js 22 or 24 and Yarn Classic 1.22.22 (pinned in `packageManager`).

```sh
corepack enable
yarn install --frozen-lockfile
yarn start
```

If Corepack is unavailable, use `npx --yes yarn@1.22.22 install --frozen-lockfile` and `npx --yes yarn@1.22.22 start`.

```sh
yarn build
yarn test:typecheck
yarn test:app --run
```

For settings specific to your computer, create an ignored `.env.local`. Do not commit private configuration.

## Branding and source

- Name, author, repository, and mark: `excalidraw-app/branding.tsx`.
- Welcome screen: `excalidraw-app/components/AppWelcomeScreen.tsx`.
- Browser metadata: `excalidraw-app/index.html`.
- PWA and build: `excalidraw-app/vite.config.mts`.
- Vercel configuration: `vercel.json`.

Based on [Excalidraw](https://github.com/excalidraw/excalidraw), upstream commit `a52cd20`. The original MIT license and third-party notices are retained. Draw Board customization by Wrakeeb.
