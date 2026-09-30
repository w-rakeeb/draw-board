# Draw Board verification

Verified September 30, 2026 (Asia/Dhaka), after restoring live collaboration.

## Build and checks

- TypeScript and lint passed for the changed frontend code.
- Production frontend build and PWA generation passed with the local collaboration server configured.
- The separate GitHub release checkout passed a frozen-lockfile install and production build with no private local frontend configuration.
- 92 focused frontend tests passed: reconciliation, restoration, exports, branded file compatibility, invite parsing, and concurrent background convergence.
- Seven server tests passed: health endpoint, WebSocket origin restriction, invalid room rejection, non-member rejection, encrypted relay and late-join cache, envelope validation, and room isolation.
- The server passed a clean locked install and npm audit with zero reported vulnerabilities. Client and server use Socket.IO 4.8.4.

## Collaboration in real browsers

- Isolated browser contexts started and joined rooms through the real UI. Joining preserved the visitor's private draft and did not add it to the room.
- Shared text, freehand paths, simultaneous shape creation, images, deletion tombstones, and background changes converged.
- Nicknames, cursor positions, and avatar-based view following worked. Clicking the avatar again stopped following.
- A third browser loaded the cached encrypted scene. The relay received ciphertext without the drawing text or encryption key.
- A wrong room key showed an error and did not overwrite the valid encrypted snapshot.
- Stopping the server, editing while disconnected, and restarting it caused all three browsers to reconnect and converge with the disconnected changes preserved.
- Room edits left both browsers' stored private drafts unchanged. Leaving could restore the private draft or keep the shared drawing as an autosaved local copy.

## Production browser checks

- The production bundle had no debug API. Text created in one browser appeared in a real .drawboard file exported by another browser.
- A received image was saved to IndexedDB when keeping the room drawing, then restored after reload.
- The sharing dialog closed with Escape. Live collaboration remained reachable from the mobile menu at 390 x 844.
- No original-provider, Firebase, or Sentry requests and no uncaught browser exceptions were observed in the verified flows.
- Wrakeeb / Draw Board branding remains. AI, account prompts, paid promotions, and original-provider links remain removed.

## Hosting status

The relay is included and locally verified. No public room server has been provisioned. BACKEND_SETUP.md and render.yaml provide a separate Free Render deployment path; set VITE_APP_COLLABORATION_SERVER in Vercel and redeploy after the server is live. Without that setting, the app explains that live collaboration is being set up and keeps local drawing usable.

Rooms cache encrypted drawings in memory and expire after 24 hours without participants. Server restarts and idle shutdowns erase the cache. Save a drawing file for durable storage. This relay is intended for one instance.

Local test logs, screenshots, downloads, and browser scripts are under the ignored work folder. Mandatory original copyright/license/font notices and legacy format compatibility remain in source.
