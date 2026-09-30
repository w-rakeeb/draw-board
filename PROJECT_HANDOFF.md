# Draw Board project handoff

Owner: Wrakeeb. Updated September 30, 2026, Asia/Dhaka.

- Working source: D:\Codex\Draw Board
- GitHub release checkout: D:\Codex\Draw Boar\Github
- Repository: https://github.com/w-rakeeb/draw-board
- Vercel import: repository root; configuration is in vercel.json.
- Local launcher: Start Draw Board.cmd.

Current product is a simple local drawing site. AI, collaboration, sharing/backend connections, sign-up/sign-in, paid product prompts, upstream social/help links, and promotional sidebar tabs were removed. The app retains local drawing/editing, images, frames, exports, libraries, Mermaid, themes, translation, browser autosave, and cached offline use. Drawing files use .drawboard and library files use .drawboardlib; older formats remain importable.

Original-provider cloud configuration and service setup artifacts were removed from the release. Fonts are served from the site's own files. Visible branding, metadata, help links, menus, and exported file labels belong to Draw Board / Wrakeeb. Internal editor names, legacy import compatibility, and mandatory upstream license notices remain in the source.

Edit the working source, verify, then copy changed source into the separate GitHub checkout. Exclude .git, node_modules, build, work, and private local configuration. Remove only explicitly retired tracked files; never mirror-delete the user's directories. Retired cloud files are archived locally in the ignored work/retired-cloud folder for rollback.

Verification evidence is under work and summarized in VERIFICATION.md. No Vercel deployment is performed here; publishing commits updates the user's connected Vercel project if they have imported this repository.
