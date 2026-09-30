# Draw Board project handoff

Owner: Wrakeeb. Requested September 30, 2026, Asia/Dhaka.

- Working source: D:\Codex\Draw Board
- GitHub release source: D:\Codex\Draw Boar\Github (preserves the exact requested path)
- Repository target: https://github.com/w-rakeeb/draw-board
- Import into Vercel from the repository root; configuration is in vercel.json.
- Full Excalidraw OSS app was used, rather than recreating its drawing engine or using an older npm snapshot.
- Upstream commit: a52cd20.
- Branding is Draw Board / Made by Wrakeeb. No final custom domain was specified.
- Network-backed features retain configurable upstream service dependencies. See README.md for the ownership and deployment distinction.

Edit the working source, verify, then intentionally copy source changes to the separate GitHub checkout. Exclude .git, node_modules, build output, work, and local configuration when copying. Never mirror-delete the user's folders.

Validation evidence is kept locally under work. Final validation and successful GitHub upload are recorded in VERIFICATION.md. The separate release checkout passed its own fresh install and production build.

The live website version was verified and the editor is pinned to a52cd200927a975322934b42b966133232724bad. Snapshot sharing was made independent of an external scene API. The included relay is under services/collaboration; see BACKEND_SETUP.md. No Vercel website or backend service was deployed by this task.
