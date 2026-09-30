# Draw Board

A drawing canvas by **Wrakeeb**. Draw on your own or invite people into a live room. No accounts, sign-in, or AI.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fw-rakeeb%2Fdraw-board&project-name=draw-board&repository-name=draw-board)

## Deploy

Import `w-rakeeb/draw-board` in Vercel. Keep Root Directory at the repository root. `vercel.json` supplies the Vite framework, `yarn install --frozen-lockfile`, `yarn build`, and output directory `excalidraw-app/build`. The drawing editor needs no backend. For live rooms, deploy the included server and set `VITE_APP_COLLABORATION_SERVER`: follow [the collaboration setup](BACKEND_SETUP.md).

[![Deploy room server to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/w-rakeeb/draw-board)

## Drawing features

- Infinite canvas, freehand drawing, shapes, arrows, connectors, text, sticky notes, eraser, images, frames, and embeds.
- Groups, alignment, fills, lasso selection, grid, snapping, search, zoom, pan, keyboard shortcuts, undo and redo.
- Local reusable shape libraries with file import/export, Mermaid diagrams, dark/light/system themes, and translations.
- Browser autosave, `.drawboard` drawing files, `.drawboardlib` library files, PNG/SVG exports, embedded editable drawing data, and clipboard.
- Offline use after the app and required assets are cached.
- Live collaboration by invite link, shared images, cursors and nicknames, view following, simultaneous edits, and reconnect recovery. Live rooms require the configured room server and internet access.

Private drawings and image files stay in browser storage until you export them. Room drawings are encrypted and shared with participants, with a temporary relay snapshot. Browser storage and temporary rooms can be cleared, so save a file for important work. Existing drawing/library files and embedded PNG/SVG scenes from earlier versions remain importable.

The app uses bundled fonts on its own host. Opening an embed or an external link intentionally accesses that destination. Live collaboration connects only to the server you configure. There are no original-provider account, AI, storage, or telemetry requests in the drawing flow.

## Develop

Use Node.js 22 or 24 and Yarn Classic 1.22.22.

```sh
npx --yes yarn@1.22.22 install --frozen-lockfile
npx --yes yarn@1.22.22 start
```

```sh
npx --yes yarn@1.22.22 build
npx --yes yarn@1.22.22 test:typecheck
```

On this Windows workspace, `Start Draw Board.cmd` starts the local editor. Branding is in `excalidraw-app/branding.tsx`; app menus and startup are under `excalidraw-app/`.

## Browser help

If Brave blocks text measurement, disable aggressive fingerprinting protection for this site. Save a drawing file before clearing browser data. Report bugs at this repository's Issues page.

## Source license

Draw Board customization and product branding by Wrakeeb. The editor derives from the MIT-licensed Excalidraw open-source project at commit `a52cd20`. Original copyright, license, and third-party/font notices are retained in the source; the website's visible identity is Draw Board.
