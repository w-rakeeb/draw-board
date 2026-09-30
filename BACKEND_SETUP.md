# Live collaboration setup

Draw Board's editor runs on Vercel. Its live rooms use the separate server included in `services/collaboration`. Visitors only need an invite link; they never need an account. There is no AI service, Firebase project, or account backend.

## Put it online

1. Import [w-rakeeb/draw-board](https://github.com/w-rakeeb/draw-board) into Vercel using the repository root. Deploy the editor and copy its public HTTPS origin, such as `https://your-draw-board.vercel.app`.
2. Use [Deploy the room server on Render](https://render.com/deploy?repo=https://github.com/w-rakeeb/draw-board). The included `render.yaml` selects a Free Docker web service. Set `CORS_ORIGIN` to the exact Vercel origin from step 1, without a trailing slash or path. Multiple origins can be comma-separated.
3. After the server is live, copy its HTTPS URL. Opening `/` should show `Draw Board collaboration` and `status: ok`.
4. In Vercel → Project Settings → Environment Variables, add `VITE_APP_COLLABORATION_SERVER` with that server URL for Production. Add it to Preview only if you also allow the exact preview origin on the server. Redeploy the frontend: Vite embeds this setting during the build.
5. Open Draw Board → Share → Start a shared room. Open the invite link in a second browser and draw in both. Each browser should see both drawings and the other person's cursor.

The hosting owner needs Vercel and Render accounts. People using your drawing site do not. No online room server has been provisioned by this repository update.

This setup keeps the Socket.IO relay in one continuously running process on Render, separate from the Vercel frontend. [Render supports WebSocket services](https://render.com/docs/websocket). The Free plan can sleep when idle and take about a minute to wake; the app retries connections automatically. See [Render's free service limits](https://render.com/docs/free). Choose a paid always-on instance later if you want to avoid cold starts; this template does not select one.

## Local use

Run `Start Collaboration Server.cmd`, then `Start Draw Board.cmd`. The development configuration connects the editor on port 3001 to the relay on port 3002. Keep both windows running.

Alternatively:

```sh
npm ci --prefix services/collaboration
npm run build --prefix services/collaboration
npm start --prefix services/collaboration
npx --yes yarn@1.22.22 start
```

Server variables: `PORT` defaults to 3002. `CORS_ORIGIN` must be supplied in production; development allows the two localhost origins on port 3001. Use HTTPS for both public services so secure room keys and clipboard access work.

## How rooms work

Scenes, images, names, selections, cursor positions, and viewport following are encrypted with AES-GCM in each browser. The key stays in the invite URL fragment. The server sees room IDs, socket IDs, and encrypted packets; it never receives the encryption key. Anyone with the full invite link can view and edit. Do not share it beyond your intended group.

The relay caches the latest encrypted room drawing in memory for late joiners. It expires empty rooms after 24 hours. Restarts, redeploys, and idle shutdowns erase that cache. Connected browsers can republish their current drawing after reconnecting. A room is not permanent cloud storage: save a `.drawboard` file to keep a reliable copy.

Private browser autosave is paused inside a room. Joining a room preserves the private draft instead of adding it to the shared canvas. Leaving lets you restore your private drawing or keep the shared drawing as your new local draft. Refreshing a room link rejoins without replacing the stored private draft.

The included single-instance relay allows 20 people per room, 256 cached rooms, 16 MB per encrypted drawing, and 128 MB of total snapshot cache. Large images count toward the drawing limit. It validates room membership, packet sizes, origin, and message rates. Do not horizontally scale this implementation without shared room membership and cache storage.
