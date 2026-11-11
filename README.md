# CODM Campus Showdown (UMaT)

React + Vite site for the UMaT Call of Duty: Mobile 5v5 tournament. Players register, create or join a
team with an invite code, and pay the GH₵50 entry with Paystack. The API is FullBackendd (`/api/v1/codm`).

## Run locally
1. Start FullBackendd (`npm start` in `Desktop/VS Projects/FullBackendd`, port 7004).
2. Here: `npm install`, then `npm run dev` and open http://localhost:5174

`.env.local` sets `VITE_API_URL` (the backend URL). Never put secret keys in this project: everything
under `VITE_` is shipped to the browser. Paystack's secret key lives only in the backend's `.env`.

## Deploy (Render static site)
Build command `npm install && npm run build`, publish directory `dist`, env `VITE_API_URL=https://fullbackendd.onrender.com`,
and a rewrite rule `/*` → `/index.html` (see render.yaml). Then set `CODM_CLIENT_URL` on the backend to this site's URL.
