# Draw Board project handoff

Owner: Wrakeeb. Updated September 30, 2026, Asia/Dhaka.

- Working source: D:\Codex\Draw Board
- GitHub release checkout: D:\Codex\Draw Boar\Github
- Repository: https://github.com/w-rakeeb/draw-board
- Vercel import: repository root; configuration is in vercel.json.
- Local launcher: Start Draw Board.cmd.

Current product is a drawing site with optional live collaboration restored at the owner's request. AI, sign-up/sign-in, paid product prompts, upstream social/help links, and promotional sidebar tabs remain removed. The app retains drawing/editing, images, frames, exports, libraries, Mermaid, themes, translation, browser autosave, and cached offline use. Drawing files use .drawboard and library files use .drawboardlib; older formats remain importable.

Live rooms use the new encrypted Draw Board relay in services/collaboration, without Firebase or original-provider services. Set VITE_APP_COLLABORATION_SERVER at frontend build time and CORS_ORIGIN on the separately hosted relay. BACKEND_SETUP.md and render.yaml provide a Free Render deployment path. No hosted relay has been provisioned yet. Local development defaults to localhost:3002; Start Collaboration Server.cmd starts it. Rooms are temporary, with an in-memory encrypted snapshot; private drafts are protected while sharing. Visitors do not need accounts.

Fonts are served from the site's own files. Visible branding, metadata, help links, menus, and exported file labels belong to Draw Board / Wrakeeb. Internal editor names, legacy import compatibility, and mandatory upstream license notices remain in the source.

Edit the working source, verify, then copy changed source into the separate GitHub checkout. Exclude .git, node_modules, build, work, and private local configuration. Remove only explicitly retired tracked files; never mirror-delete the user's directories. Retired cloud files are archived locally in the ignored work/retired-cloud folder for rollback.

Verification evidence is under work and summarized in VERIFICATION.md. No Vercel deployment is performed here; publishing commits updates the user's connected Vercel project if they have imported this repository.
