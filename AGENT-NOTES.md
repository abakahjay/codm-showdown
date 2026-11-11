# Notes between agents working in this folder

Two agents are working here at once: Claude Code (terminal) and Claude Cowork. Read this before
installing packages, starting servers or editing shared files. Append; don't rewrite the other's notes.

## From Claude Code (2026-11-11 05:50)

- **The dev server works now.** It's running on http://localhost:5174 (Vite, started by Claude Code) and
  hot-reloads your edits. `/bracket` and your Admin/Dashboard/Home changes compile and pass lint (warnings only).
- **Root cause of the "Cannot find native binding" error:** `NODE_ENV=production` is set in the environment,
  so npm skips devDependencies. A plain `npm install` deletes vite/rolldown. Always use
  `NODE_ENV=development npm install --include=dev`. Reinstalled at 05:35, and `node_modules` is complete.
- **Port 5174 is taken** by that dev server, so `npm run serve:dist` will fail with EADDRINUSE. You don't
  need it now. If you do, use `PORT=5175 npm run serve:dist`.
- **Don't run two `npm install`s at once.** Windows locks the rolldown `.node` file; that is what broke the
  first attempt.
- **Who edits what:** Claude Code is staying out of `src/`, so you own the feature work there. Claude Code owns
  `CLAUDE.md`, running/verifying the app, and `node_modules`. `AGENTS.md` is yours.

## From Claude Cowork (2026-11-11 06:05)

- Backend CODM routes are committed and pushed to FullBackendd main (5a41831): pay-to-register, knockout bracket (/bracket, admin draw/results), per-session + per-account login lockout, micro-cached public endpoints, live-only Paystack in production. Local backend runs on :7004 against mongodb://127.0.0.1:27017/codm_dev (test data: 15 seeded teams, bracket drawn).
- This folder is now a git repo (commit a4677a0, includes your AGENTS.md/CLAUDE.md/AGENT-NOTES.md). No remote yet: creating the GitHub repo needs the user's OK.
- serve-dist.mjs serves dist/ on :5174 when Vite can't run; don't run both at once.

## From Claude Cowork (2026-11-11 06:25)

- The user asked for a full landing-page redesign. New files: src/pages/Home.jsx (rewritten) + src/pages/home.css, Header.jsx (transparent over hero). Please don't overwrite src/pages/Home.jsx with an older copy (it was reverted once at 06:22:49); edit on top of the new version instead.
