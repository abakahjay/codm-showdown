# AGENTS.md

This file provides guidance to Codex (claude.ai/code) when working with code in this repository.

## What this is

Frontend-only React 19 + Vite site for the UMaT "CODM Campus Showdown" (Call of Duty: Mobile 5v5 tournament). Players register, create or join a team via invite code, and pay a GH₵50 entry fee through Paystack. All data lives in a separate backend, **FullBackendd** (`Desktop/VS Projects/FullBackendd`), under `/api/v1/codm`. Changes to API behaviour belong in that repo, not here.

## Commands

- `npm run dev`: dev server on http://localhost:5174 (port is fixed in `package.json`)
- `npm run build`: production build to `dist/`
- `npm run lint`: oxlint (config in `.oxlintrc.json`; `react/rules-of-hooks` is an error)
- `npm run preview`: serve the build on port 5174

There is no test suite. Local dev needs FullBackendd running (`npm start` in that repo, port 7004). Set `VITE_API_URL` in `.env.local` (see `.env.example`); it defaults to `http://localhost:7004`.

## Architecture

- **API layer (`src/lib/api.js`)**: every request goes through `api(path, { method, body, auth, signal })`, which prefixes `${VITE_API_URL}/api/v1/codm`, sends the JWT as a Bearer header from `localStorage` key `codm_token` (no cookies), and throws `ApiError` with the server's `msg`. A 401 with a token clears it and dispatches a `codm:logout` window event. Pass `auth: false` for public endpoints (`/event`, `/teams` list, `/auth/*`). Also home to the `cedis()` and `formatDate()` (Africa/Accra timezone) formatters.
- **Auth (`src/lib/auth.jsx`)**: `AuthProvider` loads the player from `/auth/me` on mount and listens for `codm:logout`. `useAuth()` exposes `player`, `loading`, `signIn({ token, player })`, `signOut`, `refresh`, `setPlayer`. `player.role === "admin"` gates `/admin`.
- **Routing (`src/App.jsx`)**: `Home`, `Login`, `Register` load eagerly; `Dashboard`, `PaymentReturn` and `Admin` are lazy-loaded. Protected routes use `RequireAuth` (with `admin` prop for admin-only), which redirects to `/login` with `state.from`.
- **Event data (`src/lib/hooks.js`)**: `useEvent()` starts from the hard-coded `EVENT_DEFAULTS` and merges in `/event` when the API answers, so the page always shows date, venue, fee and contacts even if the backend is down. Keep `EVENT_DEFAULTS` in sync with the backend's event config. `useReveal()` adds class `in` on scroll-into-view; `useCountdown()` drives the countdown.
- **Payment flow**: `Dashboard` calls `POST /payments/initialize` and redirects to Paystack's `authorizationUrl`. Paystack returns to `/payment/return?reference=…`, where `PaymentReturn` polls `/payments/verify/:reference` (up to 6 tries, 5 s apart, for slow MoMo approvals). The backend verifies with Paystack; the client never marks anything paid itself.
- **Styling**: one global stylesheet, `src/index.css`, with design tokens on `:root` (palette taken from the event flyer, a single orange accent for actions, five type steps, `--radius: 0`). Fonts are self-hosted via `@fontsource` (Anton for display, Barlow Condensed for text). Use plain class names and these tokens; there is no CSS framework.

## Constraints

- Everything under `VITE_` ships to the browser; never put secrets here (the Paystack secret key lives only in the backend's `.env`).
- Deploy is a Render static site defined in `render.yaml` (SPA rewrite `/*` → `/index.html`). Its Content-Security-Policy allows only `'self'` for scripts, fonts and images, and `connect-src` only `'self'` plus `https://fullbackendd.onrender.com`. Adding any external script, font, image host or API origin requires updating that CSP, or it will break in production. The backend's `CODM_CLIENT_URL` must match this site's deployed URL.
