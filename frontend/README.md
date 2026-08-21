# SnapFix AI — Frontend Application

An AI-powered civic issue reporting and municipal operations platform tailored for modern urban governance. **SnapFix AI** bridges the gap between citizens and city administration: citizens capture infrastructure anomalies (potholes, garbage heaps, broken streetlights, water leaks), while municipal teams get a real-time, AI-prioritized command center for triage, departmental routing, and spatial dispatch.

Built directly against the SnapFix AI backend's API contract, including its AI forensic telemetry fields (hazards, affected users, repair complexity, recommended action, model confidence) and its full priority-score breakdown, both surfaced throughout the citizen and municipal experiences.

---

## Architecture Overview

SnapFix AI is a single-page application containing two operational portals, a public landing/map experience, and a Supabase-backed auth layer that gates the municipal side.

```
              +----------------------+
              |    SnapFix AI App    |
              |   (AuthProvider)     |
              +----------+-----------+
                         |
        +----------------+----------------+----------------+
        |                |                |                |
        v                v                v                v
+---------------+ +-------------+ +------------------+ +-----------+
| Public Landing| |   Citizen   | |   Municipal Ops   | |  /login   |
| & Map         | |   Portal    | |     Command        | | (dual-   |
| Routes: /, /map| |Route: /app | |   Route: /ops       | |  mode)   |
+---------------+ +------+------+ +---------+----------+ +-----------+
                         |                   |
                         v                   v
                 +---------------+   +------------------+
                 | Light Shell   |   | Dark Ink Shell   |
                 |---------------|   |------------------|
                 | 5-Step Wizard |   | RequireRole gate |
                 | LocalStorage  |   | Real-time KPIs   |
                 | + Profile     |   | Interactive Map  |
                 | Geo Picker    |   | Recharts Charts  |
                 +---------------+   +------------------+
```

### Key Architectural Patterns

**1. Dual-Shell Interface Architecture**
- **Citizen Workspace (`CitizenLayout`):** A light, accessible, mobile-first shell — a fixed sidebar on desktop, a bottom navigation tab bar on mobile.
- **Municipal Command (`MunicipalLayout`):** A dark, high-contrast (`ink-950`) layout built for data density and multi-monitor operations centers, gated behind `RequireRole`.

**2. Supabase Auth with Role-Based Routing**
- `AuthContext` wraps the whole app and exposes `session`, `role`, `signIn`, and `signOut`, backed by `@supabase/supabase-js`.
- Role is read from `session.user.app_metadata.role` (defaulting to `"citizen"` when unset) — the same claim the backend checks, so the frontend gate and the backend's `require_municipal` dependency can never disagree about who's allowed to do what.
- `RequireRole` wraps the `/ops` route tree: an unauthenticated visitor or a citizen account is redirected to `/login`; only a `municipal_staff` account renders `MunicipalLayout`.
- `/login` is a single page with two modes (citizen / municipal) rather than two separate routes, since both flows share the same Supabase email/password form and only differ in the post-login redirect and role check.
- The citizen portal (`/app`) deliberately stays **ungated** — reporting and browsing never require an account, preserving the original no-login-required citizen experience. Logging in as a citizen is optional and unlocks the `Profile` page and server-tracked "my reports."

**3. Dual Report-Tracking Model (Guest + Authenticated)**
- The backend is still happy to accept anonymous submissions, so `useMyReports` continues to persist submitted report IDs in `localStorage` (`snapfix.myReportIds`) for guests.
- Logged-in citizens additionally get `GET /reports/mine`, a server-side source of truth keyed off their Supabase user ID — no localStorage dependency, and it survives switching devices.

**4. Forensic Telemetry & Priority Breakdown Display**
- Beyond category and severity, the backend returns structured AI forensic data per report — detected hazards, potentially affected user groups, repair complexity, model confidence, and a recommended action. The `ForensicTags` component renders this as scannable badge groups and a highlighted recommendation card.
- The deterministic priority score is no longer just a number: `PriorityBreakdown` renders the backend's full modifier-by-modifier `priority_breakdown` JSON (school/hospital/road proximity, community corroboration) as a readable, auditable panel on `OpsReportDetails`, so a municipal officer can see *why* a report ranks where it does, not just that it does.

**5. Unified Visual Language (Severity Tiers)**
Incident severity is normalized across both apps using a 3-tier system computed from the backend's `severity_score`:
- **High (8–10):** `#dc2626` (Red)
- **Medium (4–7):** `#d97706` (Orange)
- **Low (1–3):** `#16a34a` (Green)

**6. Resilient Error Normalization (`extractErrorMessage`)**
API responses are wrapped in a central utility that parses both standard `detail` string responses and FastAPI's Pydantic array validation error structures (`loc`/`msg` pairs), guaranteeing user-friendly toast error messages instead of raw API errors.

**7. Paginated Report Fetching**
`api.ts` now calls the paginated `GET /reports/` contract (`items`/`total`/`page`/`size`/`pages`) instead of expecting a flat array, so list views can grow into "load more" / paged UIs without re-fetching the entire report table on every load.

---

## Repository Directory Structure

```
frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── CitizenLayout.tsx     # Citizen light shell & navigation
│   │   │   ├── MunicipalLayout.tsx   # Municipal dark command sidebar
│   │   │   └── PublicNav.tsx         # Landing page header bar
│   │   ├── map/
│   │   │   ├── LocationPicker.tsx    # Interactive drag/pin coordinate picker
│   │   │   └── MarkerCard.tsx        # Leaflet popup preview card
│   │   ├── ops/
│   │   │   ├── IncidentCard.tsx      # Prioritized queue item
│   │   │   └── KpiCard.tsx           # Metrics indicator widget
│   │   ├── report/
│   │   │   ├── ForensicTags.tsx      # AI hazard/affected-users/action display
│   │   │   ├── IssueBadges.tsx       # Status, severity & upvote badges
│   │   │   ├── PhotoStep.tsx         # Image upload & drag/drop step
│   │   │   ├── PriorityBreakdown.tsx # Renders the full priority-score modifier breakdown
│   │   │   ├── ReportCard.tsx        # Compact incident summary card
│   │   │   ├── StatusStepper.tsx     # Resolution progress tracker
│   │   │   ├── StepIndicator.tsx     # Wizard step-by-step progress header
│   │   │   ├── SubmittingStep.tsx    # Upload progress & status polling
│   │   │   └── SuccessStep.tsx       # Submission confirmation & duplicate alert
│   │   ├── ui/
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── Logo.tsx
│   │   │   └── Skeleton.tsx
│   │   └── RequireRole.tsx           # Route guard: redirects to /login unless role matches
│   ├── context/
│   │   ├── AuthContext.tsx           # Supabase session, role resolution, signIn/signOut
│   │   └── ToastContext.tsx          # Global animated toast notifications
│   ├── hooks/
│   │   └── useMyReports.ts           # LocalStorage tracker for guest report IDs
│   ├── lib/
│   │   ├── api.ts                    # Axios instance & endpoint service functions
│   │   ├── mapIcons.ts               # Custom Leaflet marker icons & cluster styles
│   │   ├── supabase.ts               # Supabase client instance
│   │   └── utils.ts                  # Class merging (cn), date formatting, severity helper
│   ├── pages/
│   │   ├── citizen/
│   │   │   ├── CitizenHome.tsx       # Community stats & recent issues feed
│   │   │   ├── CitizenMap.tsx        # Interactive citizen city map
│   │   │   ├── MyReports.tsx         # Tracked user submissions (localStorage + /reports/mine)
│   │   │   ├── Profile.tsx           # Logged-in citizen account page (email, member since, sign out)
│   │   │   ├── ReportDetails.tsx     # Public incident view & PDF export
│   │   │   └── ReportWizard.tsx      # Fullscreen 5-step submission workflow
│   │   ├── ops/
│   │   │   ├── Departments.tsx       # Category breakdown & department performance
│   │   │   ├── OperationsDashboard.tsx # Triage command center & live queue
│   │   │   ├── OpsAnalytics.tsx      # Recharts trends & severity metrics
│   │   │   ├── OpsMap.tsx            # Full-screen ops map view
│   │   │   └── OpsReportDetails.tsx  # Incident override, status management & priority breakdown
│   │   ├── CityMap.tsx               # Shared base interactive map engine
│   │   ├── Landing.tsx               # Public hero landing page
│   │   ├── Login.tsx                 # Dual-mode (citizen / municipal) Supabase sign-in
│   │   ├── NotFound.tsx              # 404 handler
│   │   └── PublicMap.tsx             # Standalone public map view
│   ├── types/
│   │   └── api.ts                    # TypeScript types mirroring the API contract (incl. pagination)
│   ├── App.tsx                       # React Router route registry (wrapped in AuthProvider)
│   ├── index.css                     # Tailwind v4 configuration & base styles
│   └── main.tsx                      # Application entrypoint
├── .env.example
├── .oxlintrc.json
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Route Matrix

| Path | Component | Auth | Description |
| --- | --- | --- | --- |
| `/` | `Landing` | Public | Public marketing page with live metrics preview & hero CTA |
| `/map` | `PublicMap` | Public | Standalone public citywide map with incident clustering |
| `/login` | `Login` | Public | Dual-mode (citizen / municipal) Supabase sign-in |
| `/app` | `CitizenHome` | Public | Citizen home dashboard with community stats & activity feed |
| `/app/report` | `ReportWizard` | Public | Full-screen 5-step AI report creation wizard |
| `/app/map` | `CitizenMap` | Public | Interactive map tailored for citizen exploration & filtering |
| `/app/reports` | `MyReports` | Public (enhanced if signed in) | Device-tracked issue reports, plus server-tracked ones if logged in |
| `/app/reports/:id` | `ReportDetails` | Public | Case file view for citizens with PDF export |
| `/app/profile` | `Profile` | Public route, requires session to show data | Signed-in citizen account page |
| `/ops` | `OperationsDashboard` | 🔒 `municipal_staff` | High-priority triage queue & operational command dashboard |
| `/ops/map` | `OpsMap` | 🔒 `municipal_staff` | Full-screen operations map with status filtering |
| `/ops/analytics` | `OpsAnalytics` | 🔒 `municipal_staff` | Category breakdowns & resolution trend charts |
| `/ops/departments` | `Departments` | 🔒 `municipal_staff` | Live performance metrics across municipal divisions |
| `/ops/reports/:id` | `OpsReportDetails` | 🔒 `municipal_staff` | Executive case management, status updates & priority breakdown |

`ReportWizard` deliberately renders outside both layout shells (full-screen), since the submission flow needs the entire viewport on mobile. Every `/ops/*` route is wrapped in `<RequireRole role="municipal_staff">`, which redirects to `/login` if there's no session or the account isn't municipal.

---

## Technology Stack & Dependencies

* **Core Framework:** React 19 (`react`, `react-dom`)
* **Build Tooling:** Vite (`vite`, `@vitejs/plugin-react`)
* **Language:** TypeScript (`typescript`, `@types/react`)
* **Styling:** Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/vite`, `clsx`, `tailwind-merge`)
* **Routing:** React Router v7 (`react-router-dom`)
* **Auth:** Supabase (`@supabase/supabase-js`) — session management, email/password sign-in, role claims
* **Mapping:** Leaflet, React Leaflet, `leaflet.markercluster` / `react-leaflet-cluster`
* **Data Visualization:** Recharts
* **Animations:** Framer Motion
* **Icons:** Lucide React
* **Forms:** React Hook Form
* **HTTP Client:** Axios
* **Linter:** Oxlint

---

## Setup & Local Development

### Prerequisites

* Node.js `v18.0.0` or higher
* npm `v9.0.0` or higher
* A Supabase project (shared with the backend) for auth

### Installation

1. **Enter the frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8000
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-public-key"
   ```
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must point at the **same** Supabase project the backend's `SUPABASE_URL` uses, since role claims and JWTs are validated against that project's JWKS on the backend.

4. **Run the dev server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173`.

To test the municipal side locally, create a user in the Supabase dashboard and set `app_metadata.role = "municipal_staff"` on that account (Auth → Users → edit user → raw `app_metadata`) — it can't be set from the client.

---

## NPM Scripts

| Command | Action |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-checks (`tsc -b`) and builds production assets to `dist/` |
| `npm run preview` | Serves the production bundle locally |
| `npm run lint` | Runs `oxlint` static analysis |

---

## API Contract Alignment

* **Multipart Uploads:** `POST /api/v1/reports/` sends the image with optional `latitude`/`longitude` as `FormData`, with the Supabase access token attached as a bearer header when the user is signed in.
* **Automatic Duplicate Handling:** After submission, the wizard inspects the response — if `upvotes > 1`, the UI treats it as a merge into an existing incident and shows a duplicate-confirmation state instead of an error.
* **Paginated Listing:** `GET /api/v1/reports/` is consumed as `{ items, total, page, size, pages }`, not a flat array.
* **My Reports:** `GET /api/v1/reports/mine` is called (with the bearer token) whenever a session exists, alongside the existing localStorage-tracked guest IDs.
* **Forensic Telemetry & Priority Rendering:** `hazards`, `affected_users`, `repair_complexity`, `recommended_action`, `ai_confidence`, and the structured `priority_breakdown` from the report response are rendered via `ForensicTags` and `PriorityBreakdown` on both the citizen `ReportDetails` and municipal `OpsReportDetails` views.
* **PDF Case File Downloads:** Links directly to `${BASE_URL}/api/v1/reports/:id/pdf`.
* **Status Updates:** `PATCH /api/v1/reports/:id/status` from the ops report detail view, sent with the municipal user's bearer token, with toast-based error handling on invalid transitions or `403`s.
* **Auth-Gated Routing:** `RequireRole` checks `AuthContext`'s `session` and `role` before rendering any `/ops` route, matching the backend's `require_municipal` dependency 1:1.

---
   