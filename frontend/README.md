# SnapFix AI — Frontend

An AI-powered civic issue reporting platform for Indian cities. Citizens
photograph problems (potholes, water leaks, broken streetlights…); AI
analyzes and categorizes them; municipalities get a prioritized, map-based
operations queue.

Built against `CivicSense_API_Contract.md` — every field, endpoint, and
error shape in this app matches that contract exactly.

## Tech stack

React 19 · Vite · TypeScript · Tailwind CSS v4 · React Router · Axios ·
React Leaflet (+ clustering) · Recharts · Framer Motion · Lucide Icons

## Getting started

```bash
npm install
cp .env.example .env      # point VITE_API_BASE_URL at your backend if not localhost:8000
npm run dev                # http://localhost:5173
```

The backend (CivicSense/SnapFix AI FastAPI server) must be running at the
URL in `VITE_API_BASE_URL` — default `http://127.0.0.1:8000` — with CORS
enabled (confirmed permissive per the API contract).

## Build

```bash
npm run build     # type-checks with tsc, then builds to dist/
npm run preview   # serve the production build locally
```

## App structure

- **`/`** — Public landing page (hero, live stats, how it works, features, map preview)
- **`/map`** — Standalone public city map
- **`/app`** — Citizen application
  - `/app` — Home dashboard (contribution, community stats, nearby activity)
  - `/app/report` — Report wizard (photo → location → review → submit → success)
  - `/app/map` — Interactive city map (search, filters, clustering, GPS)
  - `/app/reports` — My Reports (tracked locally per device — the API has no auth/user model)
  - `/app/reports/:id` — Report details / case file
- **`/ops`** — Municipal "Mission Control" application
  - `/ops` — Operations dashboard (KPIs, incident queue, map, AI insights, department teaser)
  - `/ops/map` — Full-screen operations map
  - `/ops/analytics` — Charts: category breakdown, severity distribution, trend over time
  - `/ops/departments` — Department performance (computed live from report data)
  - `/ops/reports/:id` — Municipal report review

## Notes on the API contract

- `image_hash` is intentionally **not** used anywhere in the frontend — it's
  documented as backend-only.
- Error handling branches on `typeof detail` (`string` vs. array) exactly as
  documented, via `extractErrorMessage()` in `src/lib/api.ts`.
- Duplicate-merge submissions (`upvotes > 1`) are handled explicitly in the
  Report Wizard's success step and surfaced as a toast — the user is never
  told their report was rejected.
- There is no pagination or auth in the contract, so "My Reports" is tracked
  client-side via `localStorage` (report IDs submitted from this browser).
