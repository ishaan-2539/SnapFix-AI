# SnapFix AI — Frontend Application

An AI-powered civic issue reporting and municipal operations platform tailored for modern urban governance. **SnapFix AI** bridges the gap between citizens and city administration: citizens capture infrastructure anomalies (potholes, garbage heaps, broken streetlights, water leaks), while municipal teams get a real-time, AI-prioritized command center for triage, departmental routing, and spatial dispatch.

Built directly against the SnapFix AI backend's API contract, including its AI forensic telemetry fields (hazards, affected users, repair complexity, recommended action, model confidence) surfaced throughout the citizen and municipal experiences.

---

## Architecture Overview

SnapFix AI is a single-page application containing two operational portals and a public landing/map experience.

```
              +----------------------+
              |    SnapFix AI App    |
              +----------+-----------+
                         |
        +----------------+----------------+
        |                |                |
        v                v                v
+---------------+ +-------------+ +------------------+
| Public Landing| |   Citizen   | |   Municipal Ops   |
| & Map         | |   Portal    | |     Command       |
| Routes: /, /map| |Route: /app | |   Route: /ops     |
+---------------+ +------+------+ +---------+----------+
                         |                   |
                         v                   v
                 +---------------+   +------------------+
                 | Light Shell   |   | Dark Ink Shell   |
                 |---------------|   |------------------|
                 | 5-Step Wizard |   | Real-time KPIs   |
                 | LocalStorage  |   | Interactive Map  |
                 | Geo Picker    |   | Recharts Charts  |
                 +---------------+   +------------------+
```

### Key Architectural Patterns

**1. Dual-Shell Interface Architecture**
- **Citizen Workspace (`CitizenLayout`):** A light, accessible, mobile-first shell — a fixed sidebar on desktop, a bottom navigation tab bar on mobile.
- **Municipal Command (`MunicipalLayout`):** A dark, high-contrast (`ink-950`) layout built for data density and multi-monitor operations centers.

**2. Stateless Backend Integration & Client-Side Persistence (`useMyReports`)**
- The backend is stateless and has no user authentication.
- A custom hook (`useMyReports`) persists submitted report IDs in `localStorage` (`snapfix.myReportIds`), giving citizens an instant "My Reports" view across sessions without an account.

**3. Forensic Telemetry Display (`ForensicTags`)**
- Beyond category and severity, the backend returns structured AI forensic data per report — detected hazards, potentially affected user groups, repair complexity, model confidence, and a recommended action.
- The `ForensicTags` component renders this as scannable badge groups and a highlighted recommendation card, so a citizen or municipal officer gets the AI's full reasoning at a glance, not just a severity number.

**4. Unified Visual Language (Severity Tiers)**
Incident severity is normalized across both apps using a 3-tier system computed from the backend's `severity_score`:
- **High (8–10):** `#dc2626` (Red)
- **Medium (4–7):** `#d97706` (Orange)
- **Low (1–3):** `#16a34a` (Green)

**5. Resilient Error Normalization (`extractErrorMessage`)**
API responses are wrapped in a central utility that parses both standard `detail` string responses and FastAPI's Pydantic array validation error structures (`loc`/`msg` pairs), guaranteeing user-friendly toast error messages instead of raw API errors.

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
│   │   │   ├── ReportCard.tsx        # Compact incident summary card
│   │   │   ├── StatusStepper.tsx     # Resolution progress tracker
│   │   │   ├── StepIndicator.tsx     # Wizard step-by-step progress header
│   │   │   ├── SubmittingStep.tsx    # Upload progress & status polling
│   │   │   └── SuccessStep.tsx       # Submission confirmation & duplicate alert
│   │   └── ui/
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── EmptyState.tsx
│   │       ├── Logo.tsx
│   │       └── Skeleton.tsx
│   ├── context/
│   │   └── ToastContext.tsx          # Global animated toast notifications
│   ├── hooks/
│   │   └── useMyReports.ts           # LocalStorage tracker for report IDs
│   ├── lib/
│   │   ├── api.ts                    # Axios instance & endpoint service functions
│   │   ├── mapIcons.ts               # Custom Leaflet marker icons & cluster styles
│   │   └── utils.ts                  # Class merging (cn), date formatting, severity helper
│   ├── pages/
│   │   ├── citizen/
│   │   │   ├── CitizenHome.tsx       # Community stats & recent issues feed
│   │   │   ├── CitizenMap.tsx        # Interactive citizen city map
│   │   │   ├── MyReports.tsx         # Tracked user submissions
│   │   │   ├── ReportDetails.tsx     # Public incident view & PDF export
│   │   │   └── ReportWizard.tsx      # Fullscreen 5-step submission workflow
│   │   ├── ops/
│   │   │   ├── Departments.tsx       # Category breakdown & department performance
│   │   │   ├── OperationsDashboard.tsx # Triage command center & live queue
│   │   │   ├── OpsAnalytics.tsx      # Recharts trends & severity metrics
│   │   │   ├── OpsMap.tsx            # Full-screen ops map view
│   │   │   └── OpsReportDetails.tsx  # Incident override & status management
│   │   ├── CityMap.tsx               # Shared base interactive map engine
│   │   ├── Landing.tsx               # Public hero landing page
│   │   ├── NotFound.tsx              # 404 handler
│   │   └── PublicMap.tsx             # Standalone public map view
│   ├── types/
│   │   └── api.ts                    # TypeScript types mirroring the API contract
│   ├── App.tsx                       # React Router route registry
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

| Path | Component | Description |
| --- | --- | --- |
| `/` | `Landing` | Public marketing page with live metrics preview & hero CTA |
| `/map` | `PublicMap` | Standalone public citywide map with incident clustering |
| `/app` | `CitizenHome` | Citizen home dashboard with community stats & activity feed |
| `/app/report` | `ReportWizard` | Full-screen 5-step AI report creation wizard |
| `/app/map` | `CitizenMap` | Interactive map tailored for citizen exploration & filtering |
| `/app/reports` | `MyReports` | Device-tracked issue reports |
| `/app/reports/:id` | `ReportDetails` | Case file view for citizens with PDF export |
| `/ops` | `OperationsDashboard` | High-priority triage queue & operational command dashboard |
| `/ops/map` | `OpsMap` | Full-screen operations map with status filtering |
| `/ops/analytics` | `OpsAnalytics` | Category breakdowns & resolution trend charts |
| `/ops/departments` | `Departments` | Live performance metrics across municipal divisions |
| `/ops/reports/:id` | `OpsReportDetails` | Executive case management with status update capability |

`ReportWizard` deliberately renders outside both layout shells (full-screen), since the submission flow needs the entire viewport on mobile.

---

## Technology Stack & Dependencies

* **Core Framework:** React 19 (`react`, `react-dom`)
* **Build Tooling:** Vite (`vite`, `@vitejs/plugin-react`)
* **Language:** TypeScript (`typescript`, `@types/react`)
* **Styling:** Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/vite`, `clsx`, `tailwind-merge`)
* **Routing:** React Router v7 (`react-router-dom`)
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
   Update `VITE_API_BASE_URL` to point at your backend:
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8000
   ```

4. **Run the dev server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173`.

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

* **Multipart Uploads:** `POST /api/v1/reports/` sends the image with optional `latitude`/`longitude` as `FormData`.
* **Automatic Duplicate Handling:** After submission, the wizard inspects the response — if `upvotes > 1`, the UI treats it as a merge into an existing incident and shows a duplicate-confirmation state instead of an error.
* **Forensic Telemetry Rendering:** `hazards`, `affected_users`, `repair_complexity`, `recommended_action`, and `ai_confidence` from the report response are rendered via `ForensicTags` on both the citizen `ReportDetails` and municipal `OpsReportDetails` views.
* **PDF Case File Downloads:** Links directly to `${BASE_URL}/api/v1/reports/:id/pdf`.
* **Status Updates:** `PATCH /api/v1/reports/:id/status` from the ops report detail view, with toast-based error handling on invalid transitions.

---

