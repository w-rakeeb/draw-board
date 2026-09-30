# Backend setup

Vercel import builds the full drawing editor. Drawing, text, images, files, local autosave, Mermaid, themes, and encrypted snapshot links need no backend account.

Live collaboration needs a relay and, for persistent rooms and images, your Firebase project. AI needs a compatible AI backend. No backend has been deployed or paid resource provisioned.

## Collaboration relay

The complete server is included in `services/collaboration/`, adapted from the MIT-licensed [excalidraw-room](https://github.com/excalidraw/excalidraw-room). The original license is preserved. Runtime dependencies were updated and npm audit reported zero vulnerabilities.

For local use:

```sh
npm ci --prefix services/collaboration
npm run build --prefix services/collaboration
```

Set `PORT=3002`, then run `npm start --prefix services/collaboration`. Put `VITE_APP_WS_SERVER_URL=http://localhost:3002` in the frontend's ignored `.env.development.local`.

Alternatively, run `docker compose -f docker-compose.collaboration.yml up --build`. This binds the local relay to `127.0.0.1` only.

The supplied `render.yaml` prepares a separate Docker web service from this same repository. Choose a hosting plan yourself and supply `CORS_ORIGIN` as your Vercel site's exact HTTPS origin. The Dockerfile uses Node.js 22, a locked install, and a non-root runtime user.

After hosting the relay, set `VITE_APP_WS_SERVER_URL` in Vercel to its HTTPS URL and redeploy the frontend. The relay forwards encrypted room updates and keeps membership in memory. It does not store drawings itself. Multiple instances require a shared Socket.IO adapter.

## Firebase persistence and room images

Create your own Firebase project with Firestore and Storage. The included `firebase-project/` directory supplies the compatibility reference. Configure your deployment origins and review the rules and quotas before opening the service publicly.

Set the Vercel variable `VITE_APP_FIREBASE_CONFIG` to your Firebase browser configuration JSON and redeploy. Use the actual project and bucket values supplied by Firebase. Browser configuration is public; server credentials must never go into `VITE_*` variables.

The upstream public Firebase settings remain as compatibility defaults. Independent operation requires your own project. Drawings are encrypted in the browser; the room key stays in the room URL fragment. Anyone with the room link can join.

## AI

Text-to-diagram and wireframe-to-code retain their original integrations. Configure `VITE_APP_AI_BACKEND` to a compatible service implementing the SSE protocol used by `excalidraw-app/components/AI.tsx`:

- `POST /v1/ai/text-to-diagram/chat-streaming`
- `POST /v1/ai/diagram-to-code/generate-streaming`

Keep provider API keys in the backend's private environment. The original AI endpoint failed from this separate app during verification, so it is not shipped as a working default. Without configuration, the UI explains that AI generation is not configured.

Excalidraw+ accounts, billing, and proprietary workspace storage remain separate services and are not recreated by the open-source source code.

## Encrypted snapshot links

Export to Link works immediately without Firebase or a scene API. It puts a compressed AES-GCM encrypted snapshot, including referenced images, in the URL fragment. The fragment is not included in HTTP requests to Vercel. Opening the link restores the scene through the editor's normal importer.

Snapshot links are longer than the original stored short links. The app caps them at one million URL characters; messaging apps may have lower limits. Share an `.excalidraw` file for large drawings. To use stored short links, configure a compatible scene API via `VITE_APP_BACKEND_V2_GET_URL` and `VITE_APP_BACKEND_V2_POST_URL`, then set `VITE_APP_SHARE_LINK_MODE=backend` and redeploy.
