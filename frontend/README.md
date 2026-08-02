# SnapFix AI — Frontend Application

An AI-powered civic issue reporting and municipal operations platform tailored for modern urban governance. **SnapFix AI** bridges the gap between citizens and city administration: citizens capture infrastructure anomalies (e.g., potholes, garbage heaps, broken streetlights, water leaks), while municipal teams access a real-time, AI-prioritized command center for triage, departmental routing, and spatial dispatch.

Built directly against the `CivicSense` API specification, ensuring strict adherence to data models, error handling schemas, and state transitions.

---

## Architecture Overview

SnapFix AI is architected as a single-page application (SPA) containing two operational portals and a public landing experience.

```
                                  +-----------------------+
                                  |    SnapFix AI App     |
                                  +-----------+-----------+
                                              |
            +---------------------------------+---------------------------------+
            |                                 |                                 |
+-----------v-----------+         +-----------v-----------+         +-----------v-----------+
|  Public Landing & Map |         |    Citizen Portal     |         | Municipal Ops Command |
|  Routes: `/`, `/map`  |         |     Route: `/app`     |         |     Route: `/ops`     |
+-----------------------+         +-----------+-----------+         +-----------+-----------+
                                              |                                 |
                                  +-----------v-----------+         +-----------v-----------+
                                  | Light Shell Layout    |         | Dark Ink Shell Layout |
                                  | - 5-Step Report Wizard|         | - Real-time KPI Queue |
                                  | - Local Storage Sync  |         | - Interactive Leaflet |
                                  | - Geo-Location Picker |         | - Recharts Analytics  |
                                  +-----------------------+         +-----------------------+

```

### Key Architectural Patterns

1. **Dual-Shell Interface Architecture**
* **Citizen Workspace (`CitizenLayout`):** Designed with a light, accessible, mobile-first shell featuring a fixed standard sidebar on desktop and a bottom navigation tab bar on mobile devices.


* **Municipal Command (`MunicipalLayout`):** Tailored for dense data density using a dark high-contrast (`ink-950`) layout optimized for multi-monitor operations centers.




2. **Stateless Backend Integration & Client-Side Persistence (`useMyReports`)**
* The underlying API is completely stateless and omits user authentication.


* The frontend uses a custom hook (`useMyReports`) operating over `localStorage` (`snapfix.myReportIds`) to persist submitted report IDs across sessions, providing citizens with an instant "My Reports" view.




3. **Unified Visual Language (Severity Tiers)**
* Incident severity is normalized across both citizen and municipal apps using a 3-tier system (`low`, `medium`, `high`) computed from the backend's `severity_score` (1–10):


* **High (8–10):** `#dc2626` (Red / Danger)


* **Medium (4–7):** `#d97706` (Orange / Warning)


* **Low (1–3):** `#16a34a` (Green / Success)






4. **Resilient Error Normalization (`extractErrorMessage`)**
* API responses are wrapped in a central utility that parses both standard detail string responses and FastAPI Pydantic array validation error structures (`loc` / `msg` pairs), guaranteeing user-friendly toast error messaging.





---

## Repository Directory Structure

```
snapfix-ai/
├── public/                       # Static public assets
│   └── favicon.svg               # Application branding icon[cite: 1]
├── src/
│   ├── components/               # Modular UI components
│   │   ├── layout/               # Shell containers
│   │   │   ├── CitizenLayout.tsx # Citizen light shell & navigation[cite: 1]
│   │   │   ├── MunicipalLayout.tsx# Municipal dark command sidebar[cite: 1]
│   │   │   └── PublicNav.tsx     # Landing page header bar[cite: 1]
│   │   ├── map/                  # Spatial UI elements
│   │   │   ├── LocationPicker.tsx# Interactive drag/pin coordinate picker[cite: 1]
│   │   │   └── MarkerCard.tsx    # Leaflet popup preview card[cite: 1]
│   │   ├── ops/                  # Municipal dashboard widgets
│   │   │   ├── IncidentCard.tsx  # Prioritized queue item[cite: 1]
│   │   │   └── KpiCard.tsx       # Metrics indicator widget[cite: 1]
│   │   ├── report/               # Reporting wizard sub-components
│   │   │   ├── IssueBadges.tsx   # Status, severity & upvote badges[cite: 1]
│   │   │   ├── PhotoStep.tsx     # Image upload & drag/drop step[cite: 1]
│   │   │   ├── ReportCard.tsx    # Compact incident summary card[cite: 1]
│   │   │   ├── StatusStepper.tsx # Resolution progress tracker[cite: 1]
│   │   │   ├── StepIndicator.tsx # Wizard step-by-step progress header[cite: 1]
│   │   │   ├── SubmittingStep.tsx# Upload progress & status polling[cite: 1]
│   │   │   └── SuccessStep.tsx   # Submission confirmation & duplicate alert[cite: 1]
│   │   └── ui/                   # Primitive design system components
│   │       ├── Badge.tsx         # Color-coded status badge[cite: 1]
│   │       ├── Button.tsx        # Primitive button variants[cite: 1]
│   │       ├── Card.tsx          # Primitive surface wrapper[cite: 1]
│   │       ├── EmptyState.tsx    # Fallback zero-data state view[cite: 1]
│   │       ├── Logo.tsx          # SVG brand logo mark & wordmark[cite: 1]
│   │       └── Skeleton.tsx      # Loading state placeholders[cite: 1]
│   ├── context/
│   │   └── ToastContext.tsx      # Global animated toast notifications provider[cite: 1]
│   ├── hooks/
│   │   └── useMyReports.ts       # LocalStorage tracker for reported issue IDs[cite: 1]
│   ├── lib/
│   │   ├── api.ts                # Axios instance & endpoint service functions[cite: 1]
│   │   ├── mapIcons.ts           # Custom Leaflet marker icons & cluster styles[cite: 1]
│   │   └── utils.ts              # Class merging (cn), date formatting & severity helper[cite: 1]
│   ├── pages/                    # Route page components
│   │   ├── citizen/              # Citizen workspace
│   │   │   ├── CitizenHome.tsx   # Community stats & recent issues feed[cite: 1]
│   │   │   ├── CitizenMap.tsx    # Interactive citizen city map[cite: 1]
│   │   │   ├── MyReports.tsx     # Tracked user submissions list[cite: 1]
│   │   │   ├── ReportDetails.tsx # Public incident view & PDF exporter[cite: 1]
│   │   │   └── ReportWizard.tsx  # Fullscreen 5-step submission workflow[cite: 1]
│   │   ├── ops/                  # Municipal workspace
│   │   │   ├── Departments.tsx   # Category breakdown & department performance[cite: 1]
│   │   │   ├── OperationsDashboard.tsx # Triage command center & live queue[cite: 1]
│   │   │   ├── OpsAnalytics.tsx  # Recharts trends & severity metrics[cite: 1]
│   │   │   ├── OpsMap.tsx        # Full-screen ops map view[cite: 1]
│   │   │   └── OpsReportDetails.tsx # Incident override & status management[cite: 1]
│   │   ├── CityMap.tsx           # Shared base interactive map engine[cite: 1]
│   │   ├── Landing.tsx           # Public hero landing page[cite: 1]
│   │   ├── NotFound.tsx          # 404 handler page[cite: 1]
│   │   └── PublicMap.tsx         # Standalone public map view[cite: 1]
│   ├── types/
│   │   └── api.ts                # TypeScript types mirroring API spec[cite: 1]
│   ├── App.tsx                   # React Router route registry[cite: 1]
│   ├── index.css                 # Tailwind v4 configuration & base styles[cite: 1]
│   └── main.tsx                  # Application entrypoint[cite: 1]
├── .env.example                  # Environment configuration template[cite: 1]
├── .oxlintrc.json                # Oxlint linter settings[cite: 1]
├── index.html                    # Root HTML document[cite: 1]
├── package.json                  # Dependencies & script commands[cite: 1]
├── tsconfig.json                 # TypeScript compiler setup[cite: 1]
└── vite.config.ts                # Vite bundler configuration[cite: 1]

```

---

## Route Matrix

| Path | Component | Description |
| --- | --- | --- |
| `/` | `Landing` | Public marketing page with live metrics preview & hero CTA.

 |
| `/map` | `PublicMap` | Standalone public citywide map with incident clustering.

 |
| `/app` | `CitizenHome` | Citizen home dashboard with community stats & activity feed.

 |
| `/app/report` | `ReportWizard` | Full-screen 5-step AI report creation wizard.

 |
| `/app/map` | `CitizenMap` | Interactive map tailored for citizen exploration & filtering.

 |
| `/app/reports` | `MyReports` | View device-tracked issue reports.

 |
| `/app/reports/:id` | `ReportDetails` | Case file view for citizens with PDF export.

 |
| `/ops` | `OperationsDashboard` | High-priority triage queue & operational command dashboard.

 |
| `/ops/map` | `OpsMap` | Full-screen operations map with status filtering.

 |
| `/ops/analytics` | `OpsAnalytics` | Analytical charts detailing category breakdowns & resolution rates.

 |
| `/ops/departments` | `Departments` | Live performance metrics computed across municipal divisions.

 |
| `/ops/reports/:id` | `OpsReportDetails` | Executive case management view with status update capabilities.

 |

---

## Technology Stack & Dependencies

* **Core Framework:** React 19 (`react`, `react-dom`)


* **Build Tooling:** Vite 6 (`vite`, `@vitejs/plugin-react`)


* **Language & Typing:** TypeScript ~6.0 (`typescript`, `@types/react`)


* **Styling & UI:** Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/vite`, `clsx`, `tailwind-merge`)


* **Routing:** React Router v7 (`react-router-dom`)


* **Mapping:** Leaflet 1.9, React Leaflet 5, Leaflet MarkerCluster (`leaflet`, `react-leaflet`, `react-leaflet-cluster`)


* **Data Visualization:** Recharts 3 (`recharts`)


* **Animations:** Framer Motion 12 (`framer-motion`)


* **Icons:** Lucide React (`lucide-react`)


* **Form Management:** React Hook Form (`react-hook-form`)


* **HTTP Client:** Axios (`axios`)


* **Linter:** Oxlint (`oxlint`)



---

## Setup & Local Development

### Prerequisites

* **Node.js:** `v18.0.0` or higher
* **npm:** `v9.0.0` or higher

### Step-by-Step Installation

1. **Clone the repository and enter the directory:**
```bash
cd snapfix-ai

```


2. **Install project dependencies:**
```bash
npm install

```


3. **Configure Environment Variables:**
Copy the `.env.example` file to create your active environment file:
```bash
cp .env.example .env

```


Update `VITE_API_BASE_URL` in `.env` to point to your backend FastAPI server:
```env
# Base URL of the SnapFix AI / CivicSense backend API
VITE_API_BASE_URL=http://127.0.0.1:8000

```


4. **Launch the Local Development Server:**
```bash
npm run dev

```


Access the application at `http://localhost:5173`.



---

## NPM Scripts

| Command | Action |
| --- | --- |
| `npm run dev` | Launches Vite local development server with HMR.

 |
| `npm run build` | Compiles TypeScript (`tsc -b`) and builds production assets to `dist/`.

 |
| `npm run preview` | Locally serves the production bundle from `dist/`.

 |
| `npm run lint` | Runs `oxlint` static code analysis across the codebase.

 |

---

## API Contract Alignment

This frontend directly implements the **SnapFix AI API Specification**:

* **Multipart Uploads:** `POST /api/v1/reports/` transmits images with optional `latitude` and `longitude` fields via standard `FormData`.


* **Automatic De-duplication Handling:** The Report Wizard inspects backend responses upon submission. If `upvotes > 1`, the interface recognizes that the issue was merged into an existing incident record, presenting a clear duplicate alert to the user rather than an error.


* **PDF Case File Downloads:** Directly interfaces with `${BASE_URL}/api/v1/reports/:id/pdf` to export generated documentation.


* **Status Updates:** Includes gracefully handled `PATCH /api/v1/reports/:id/status` endpoints for administrative status changes.