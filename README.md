<div align="center">

# 🚀 SnapFix AI

### AI-Powered Civic Issue Reporting & Municipal Operations Platform

Transforming civic issue reporting through **Computer Vision**, **Geospatial Intelligence**, and **Modern Full-Stack Engineering**.

---

![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38BDF8?style=for-the-badge&logo=tailwindcss)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-blue?style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql)
![OpenStreetMap](https://img.shields.io/badge/OpenStreetMap-Overpass_API-7EBC6F?style=for-the-badge&logo=openstreetmap)
![Supabase](https://img.shields.io/badge/Auth_%26_Storage-Supabase-3ECF8E?style=for-the-badge&logo=supabase)
![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render)
![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=for-the-badge&logo=vercel)

</div>

---

# 🌍 Overview

SnapFix AI is a modern **AI-powered civic issue management platform** designed to bridge the communication gap between citizens and municipal authorities.

Citizens report infrastructure issues — potholes, garbage accumulation, damaged streetlights, water leaks, road damage — by uploading a single photograph. The platform then runs that submission through a full intelligence pipeline: it validates the image is a genuine civic issue, extracts or confirms its location, classifies and scores it with Google's Gemini Vision AI, checks whether it's a duplicate of an already-reported issue nearby, pulls real-world geographic context (nearby schools, hospitals, and major roads) from OpenStreetMap to calculate a deterministic operational priority, and finally surfaces it to municipal teams through a dedicated, authenticated operations dashboard.

This isn't a simple "photo in, ticket out" form. It's an **end-to-end civic intelligence workflow** — from a citizen's phone camera to a municipal work order.

---

# 🎯 Vision

Cities receive thousands of infrastructure complaints every day. Unfortunately, many of these reports are:

- duplicated multiple times by different citizens
- manually classified by overworked staff
- prioritized on gut feeling rather than data
- difficult to track once submitted
- slow to reach the responsible department

SnapFix AI aims to modernize this process through artificial intelligence and deterministic, explainable automation — not a black box, but a system that can show its work.

---

# ❗ Problem Statement

Traditional civic reporting systems suffer from several challenges:

- Manual categorization of reports
- Duplicate complaints creating unnecessary workload
- Prioritization that ignores real-world context (a pothole outside a hospital isn't the same urgency as one on a quiet residential street, but most systems treat them identically)
- Poor visibility into issue status for citizens
- Limited analytical insight for decision-makers
- Fragmented communication between citizens and municipal departments
- No accountability mechanism when a report simply sits unaddressed

These inefficiencies lead to delayed resolutions, wasted resources, and reduced public trust.

---

# 💡 Solution

SnapFix AI automates the parts of municipal triage that are repetitive and error-prone for humans, while keeping humans in control of the actual decisions.

Every uploaded report passes through a pipeline that:

- validates the image is a genuine public infrastructure issue (and rejects selfies, pets, and unrelated photos)
- classifies the issue and scores its *visual* severity
- resolves the incident's real-world location from photo EXIF metadata or device GPS
- checks for duplicates using both perceptual image hashing and geospatial proximity
- pulls live spatial context from OpenStreetMap — is this near a school, a hospital, a major road?
- computes a final, explainable operational priority score from that context
- generates a downloadable, field-ready PDF work order
- visualizes every open incident on an interactive map
- tracks status from submission through resolution, behind role-based municipal access

The result is a system that's faster than manual review and — because every priority score comes with a visible breakdown of *why* — more auditable than a black-box model would be.

---

# ✨ Key Features

## 👥 Citizen Portal

### 📸 AI-Powered Issue Reporting

Citizens upload a photo through a guided multi-step reporting wizard, either as a guest or while signed in. The backend automatically:

- verifies the image depicts a genuine civic issue
- classifies it into one of seven municipal categories
- scores visual severity
- extracts specific hazards (e.g. exposed wiring, blocked drainage, vehicle collision risk)
- identifies who's likely affected (pedestrians, cyclists, motorists, children, etc.)
- estimates repair complexity and recommends an immediate action
- writes a concise, formal municipal incident summary

The AI classification (Gemini) and the OpenStreetMap spatial lookup now run **in parallel** rather than one after the other, cutting typical submission latency roughly in half.

### 🗺️ Intelligent Location Detection

Location is resolved in priority order:

1. Embedded EXIF GPS metadata (harder to spoof than a manual pin)
2. Browser/device geolocation fallback

If neither is available, the submission is rejected with a clear message rather than silently accepting bad data.

### 🔐 Optional Citizen Accounts

Citizens can browse and report entirely as guests — no account required, matching the platform's original zero-friction design. Signing in (via Supabase Auth) additionally unlocks a **Profile** page and a server-side "My Reports" list (`GET /reports/mine`) that survives switching devices, on top of the existing device-local tracking.

### 📋 Personal Report Tracking

Citizens can revisit reports they've submitted through a lightweight "My Reports" view — device-persisted for guests, and server-persisted for signed-in accounts.

### 📄 PDF Work Order Generation

Every report — citizen-facing or municipal — can be exported as a formatted PDF containing the issue summary, category, severity, coordinates, photo, and current status.

### 🌍 Interactive Public Map

An interactive Leaflet map lets citizens explore active reports across the city, with severity-tiered markers and clustering.

---

## 🏛️ Municipal Operations Dashboard

### 🔒 Authenticated, Role-Gated Access

The `/ops` command center now sits behind Supabase-issued JWTs. A route guard (`RequireRole`) on the frontend and a `require_municipal` dependency on the backend both check the same `app_metadata.role == "municipal_staff"` claim — a claim only settable via the Supabase dashboard/admin API, not by the user themselves — so the two layers can never disagree about who's allowed to update a report's status.

### 📊 Operational Dashboard

A live triage queue and KPI overview: total reports, open/in-progress/resolved counts, average severity, and category breakdown.

### ⭐ Visible Priority Breakdown

The deterministic priority engine's full modifier breakdown (school/hospital/road proximity, community corroboration) is now rendered directly in the municipal case view via `PriorityBreakdown` — previously it was computed and stored but never shown in the UI.

### 🗺️ GIS Operations Map

A dedicated full-screen map for spatial situational awareness, with status filtering.

### 📈 Analytics & Insights

Recharts-powered dashboards covering category distribution, resolution trends, and departmental performance.

### 🔄 Incident Lifecycle Management

```
OPEN → IN_PROGRESS → RESOLVED
```

Status transitions are unrestricted, so an issue can be reopened if a repair fails — matching how municipal work actually happens.

---

# 🤖 AI Intelligence

Google's Gemini Vision model (`gemini-3.5-flash-lite`) is used for what vision models are actually good at — *reading an image* — and nothing more. The prompt explicitly instructs the model to score only what's visually observable (severity 1–6) and to leave every contextual judgment (proximity to a school, traffic importance, how many people reported it) to SnapFix's own deterministic engine. This separation matters: it stops the AI from silently inflating severity because "it's probably near a school" when it has no way to actually know that — and it means every contextual multiplier applied later is inspectable and defensible, not an AI guess.

Gemini also acts as a guardrail: non-civic images (selfies, pets, indoor scenes, unrelated photos) are flagged and rejected with a `400` before they ever reach the database. If the Gemini API fails or rate-limits, a demo-safe fallback response keeps the submission flow alive rather than hard-failing the request. The Gemini call now runs concurrently with the Overpass spatial lookup instead of after it, since the two are independent.

---

# 🚀 What Makes SnapFix AI Different?

Most civic reporting apps just collect complaints into a list. SnapFix AI does several things that go meaningfully further:

## 📍 Hybrid, Two-Tier Duplicate Detection

Two independent layers work together, run in sequence:
- **Tier 1 — Perceptual image hashing (30m radius):** Runs immediately after location resolution, *before* any AI call — catches the same photo (or a near-identical one) resubmitted from roughly the same spot, cheaply and instantly.
- **Tier 2 — Confidence-gated geospatial clustering (15m radius):** Merges reports of the same category within a 15-meter radius, but only when the AI's classification confidence clears a threshold, so low-confidence guesses can't accidentally merge two unrelated issues.

A matched duplicate doesn't create a second ticket — it increments the existing report's upvote count and recalculates its priority.

## ⭐ Deterministic, Explainable Priority Engine

This is the core piece of engineering in the project. Rather than asking an LLM to output a single priority number (which is unauditable and inconsistent), SnapFix computes it deterministically:

```
final_priority = base_severity
                + school_proximity_modifier
                + hospital_proximity_modifier
                + major_road_proximity_modifier
                + community_corroboration_modifier
```

- **Spatial context** is pulled live from OpenStreetMap's Overpass API — the nearest school, hospital, and major road within a 1km radius, with a tiered modifier based on how close they are and (for roads) how significant they are.
- **Community corroboration** rewards issues that multiple citizens independently confirm, capped so a single viral report can't blow past the scale on its own.
- The **entire calculation is normalized to 0–10** and returned alongside a structured `breakdown` object — every modifier, every distance, every input — so the final score is never a mystery. This breakdown is now fully visible in the municipal UI, not just stored.

If OpenStreetMap is temporarily unreachable, the engine treats that as "no contextual evidence" and falls back gracefully — a report never fails to submit because a third-party API is down. The service also tries multiple Overpass mirror endpoints with retry/backoff before giving up.

## 🔐 Role-Based Dual-Portal Experience

A light, mobile-first **Citizen Portal** (`/app`) for reporting and tracking — open to guests and optional accounts alike — and a dark, data-dense, **auth-gated Municipal Command Center** (`/ops`) for triage and analytics. Both are built on the same Supabase identity so an account's role can never be spoofed client-side.

## ⚡ Parallelized Submission Pipeline

AI classification and spatial context enrichment used to run one after another; they now run concurrently via `asyncio.gather`, since neither depends on the other — a meaningful, measured latency improvement on every submission.

---

# 🏗️ System Architecture

```
                +----------------+
                |    Citizens    |
                +--------+-------+
                         |
                   Upload Image
                         v
              +----------------------+
              |  React Frontend (SPA)|
              |-----------------------|
              | Citizen Portal        |
              | Municipal Dashboard   |
              | Interactive Maps      |
              | Analytics             |
              | Supabase Auth Client  |
              +-----------+----------+
                         |
                  REST API (Axios, bearer JWT)
                         v
              +----------------------+
              |   FastAPI Backend    |
              |-----------------------|
              | Request Validation    |
              | JWT / Role Verification|
              | Report Pipeline       |
              | Priority Engine       |
              | PDF Generation        |
              +-----------+----------+
                         |
     +-------------+-----+-----+-------------+
     |             |           |             |
     v             v           v             v
+---------+  +-----------+ +----------+ +-----------+
| Gemini  |  | EXIF +    | | OSM /    | | PostgreSQL|
| Vision  |  | Perceptual| | Overpass | | (Supabase)|
| AI      |  | Hashing   | | API      | |           |
+---------+  +-----------+ +----------+ +-----+-----+
                                              |
                              +---------------+---------------+
                              v                               v
                        +-----------+                  +-------------+
                        | Supabase  |                  | Supabase    |
                        | Storage   |                  | Auth (JWKS) |
                        | (photos)  |                  |             |
                        +-----------+                  +-------------+
```

---

# 🔄 End-to-End Workflow

```text
Citizen uploads image (guest or authenticated)
        │
        ▼
File Validation (Size • Format • MIME)
        │
        ▼
Location Resolution (EXIF → Browser GPS)
        │
        ▼
Tier 1 Dedup: Perceptual Hash Check (30m radius)
        │
        ▼
Gemini Vision Analysis  ⇄  Overpass Spatial Context   (run in parallel)
        │
        ▼
Tier 2 Dedup: Geospatial Clustering (15m radius, confidence-gated)
        │
        ▼
Deterministic Priority Score Calculated (with full breakdown)
        │
        ▼
Photo Uploaded to Supabase Storage
        │
        ▼
Report Persisted to PostgreSQL (tagged with reporter_id if signed in)
        │
        ▼
Municipal Dashboard (role-gated) → Status Updates → Resolved
```

---

# 🛠️ Technology Stack

## Frontend

| Technology | Purpose |
|------------|---------|
| React 19 | Component-based UI |
| TypeScript | Type safety |
| Vite | Dev server & production build |
| Tailwind CSS v4 | Utility-first styling |
| React Router v7 | Client-side routing |
| Supabase JS | Auth session & role management |
| Axios | Backend communication |
| Framer Motion | Animations |
| React Hook Form | Form handling |
| Leaflet + React Leaflet | Interactive maps |
| Recharts | Municipal analytics |
| Lucide React | Icon system |

## Backend

| Technology | Purpose |
|------------|---------|
| FastAPI | REST API framework |
| SQLAlchemy | ORM |
| Pydantic v2 | Validation & serialization |
| Uvicorn | ASGI server |
| PostgreSQL (Supabase) | Production database |
| SQLite | Local development database |
| Supabase Auth (JWKS, `pyjwt`) | JWT verification, role-based access |
| httpx | Overpass API client with retry/backoff |
| ReportLab | PDF generation |
| Pillow + imagehash | Perceptual image hashing |
| google-generativeai | Gemini Vision integration |
| supabase-py | Persistent photo storage |

## Spatial Intelligence

- Interactive Leaflet maps (frontend)
- EXIF GPS extraction
- Browser geolocation fallback
- Haversine distance calculations
- Live OpenStreetMap/Overpass queries for schools, hospitals, and major roads — run concurrently with AI classification
- Multi-endpoint failover with retry/backoff for spatial context lookups

---

# 📂 Project Structure

```text
SnapFix-AI/
│
├── frontend/
│   ├── src/
│   │   ├── components/       # layout, map, ops, report, ui, RequireRole
│   │   ├── pages/             # citizen/ (incl. Profile), ops/, Login, public pages
│   │   ├── hooks/
│   │   ├── context/           # AuthContext, ToastContext
│   │   ├── lib/                # api, supabase client, utils, mapIcons
│   │   ├── types/
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── app/
│   │   ├── core/               # config.py, database.py, auth.py (JWT/JWKS)
│   │   ├── routers/           # reports.py, analytics.py
│   │   ├── models/            # report_model.py (incl. reporter_id)
│   │   ├── schemas/           # report_schema.py (incl. pagination)
│   │   ├── services/          # ai_service, priority_engine,
│   │   │                      # spatial_context_service, pdf_service,
│   │   │                      # storage_service
│   │   └── utils/             # exif.py, geo.py, hashing.py
│   ├── uploads/                # local fallback only — primary storage is Supabase
│   ├── requirements.txt
│   └── main.py
│
└── README.md
```

---

# 📡 API Overview

## Reports

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/reports/` | Optional | Submit new civic issue (guest or signed-in) |
| GET | `/api/v1/reports/` | None | Retrieve reports, paginated (`items`/`total`/`page`/`size`/`pages`) |
| GET | `/api/v1/reports/mine` | Required | Reports submitted by the current signed-in citizen |
| GET | `/api/v1/reports/{id}` | None | Report details |
| PATCH | `/api/v1/reports/{id}/status` | Required (`municipal_staff`) | Update issue status |
| GET | `/api/v1/reports/{id}/pdf` | None | Download work order PDF |

## Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/analytics/stats` | Summary KPIs — totals, status breakdown, average severity, category breakdown |
| GET | `/api/v1/analytics/map-pins` | Lightweight report payloads for map rendering, sorted by priority |

## Health

| Method | Endpoint |
|--------|----------|
| GET | `/health` |

Used for deployment health checks — verifies both the API process and the database connection.

---

# 🗄️ Database Design

The `reports` table is the core of the system. Each row stores:

- image URL (Supabase Storage) and perceptual hash
- `reporter_id` — the Supabase auth user ID of the submitter, nullable to preserve guest submissions
- AI classification, visual severity, and structured forensic telemetry (hazards, affected users, repair complexity, recommended action, model confidence)
- geographic coordinates
- final deterministic priority score **and** its full breakdown (stored as JSON, so past decisions remain explainable even after the fact, and are now rendered in the municipal UI)
- upvote count, status, and timestamp

Production runs on PostgreSQL via Supabase; local development defaults to SQLite for zero-setup onboarding — the ORM layer means the same model code runs against either. Authentication and role claims are also backed by the same Supabase project, so there's a single source of truth for both data and identity.

---

# 🧩 Engineering Highlights

- Deterministic, auditable priority scoring instead of an opaque AI-generated number — now fully visible in the municipal UI
- Live geospatial enrichment via OpenStreetMap/Overpass, with multi-endpoint failover, run concurrently with AI classification
- Two-tier duplicate detection (cheap perceptual-hash pass before any AI call, then confidence-gated geospatial clustering)
- Strict separation of concerns: Gemini scores *what it can see*, SnapFix's own engine scores *context*
- Supabase Auth with JWKS-based JWT verification and `app_metadata`-backed roles — no shared secret, no client-editable permissions
- Cloud object storage for photos (Supabase Storage) so uploads survive Render's ephemeral filesystem and free-tier sleep cycles, with automatic local-disk fallback if Supabase is unreachable
- Automated PDF work order generation
- Paginated report listing to keep large report volumes fast on both citizen and municipal views
- Reusable, tiered frontend component architecture for two distinct user experiences

---

# 🚀 Getting Started

## Prerequisites

**Frontend:** Node.js 18+, npm
**Backend:** Python 3.10+, pip, venv
**AI:** Google Gemini API key
**Auth/Storage/DB:** A Supabase project

## 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/SnapFix-AI.git
cd SnapFix-AI
```

## 2. Backend Setup

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file:

```env
PROJECT_NAME="SnapFix AI"
DATABASE_URL="sqlite:///./civic_sense.db"
GEMINI_API_KEY="YOUR_API_KEY"

# Supabase Storage — persistent photo storage (survives Render restarts)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_or_secret_key"
SUPABASE_STORAGE_BUCKET="report-images"

# Supabase Auth — JWT verification uses the JWKS endpoint derived from SUPABASE_URL
SUPABASE_JWT_SECRET=""

# Optional — Overpass spatial intelligence tuning (sensible defaults ship in code)
OVERPASS_SEARCH_RADIUS_METERS=1000
```

```bash
uvicorn app.main:app --reload
```

Backend: `http://localhost:8000` · Swagger docs: `http://localhost:8000/docs`

## 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
```

```bash
npm run dev
```

App: `http://localhost:5173`

To test the municipal side, set `app_metadata.role = "municipal_staff"` on a test user from the Supabase dashboard (Auth → Users) — this can't be self-assigned by a client.

---

## 🚀 Live Demo

- **Frontend:** https://snap-fix-ai-gamma.vercel.app/
- **Backend API:** https://snapfix-ai-aury.onrender.com

> **Note:** The backend runs on Render's free tier and may take 30–90 seconds to wake up after inactivity. Uploaded photos are stored in **Supabase Storage**, not on the backend's local disk, so they persist across restarts, sleep cycles, and redeploys. The production database is **PostgreSQL** on Supabase, accessed through its connection pooler. Auth is handled entirely by **Supabase Auth**.

---

# 📷 Screenshots

## Landing Page
<img src="docs/screenshots/landing.png" width="900">

## Citizen Dashboard
<img src="docs/screenshots/citizen-dashboard.png" width="900">

## Report Wizard
<img src="docs/screenshots/report-wizard.png" width="900">

## Municipal Dashboard
<img src="docs/screenshots/municipal-dashboard.png" width="900">

## Operations Map
<img src="docs/screenshots/operations-map.png" width="900">

## Analytics
<img src="docs/screenshots/analytics.png" width="900">

---

# 🔮 Future Improvements

> ✅ Already shipped since the initial build: **PostgreSQL migration** (Supabase, replacing SQLite in production), **cloud object storage for photos** (Supabase Storage), **live OpenStreetMap spatial context**, a **deterministic, explainable priority engine** with a full audit breakdown now **visible in the municipal UI**, **Supabase-based authentication & role-based access control**, a **two-tier duplicate detection pipeline**, a **parallelized AI + spatial pipeline**, and **paginated report listing**.

Potential next steps:

- **Automated complaint escalation** — if a report sits past a calculated SLA window (e.g. severity-weighted, so a 1-week threshold for a minor issue but much shorter for a hospital-adjacent hazard) without a status change, automatically file it as a formal, timestamped complaint against the responsible department, distinct from the original report and visible in a dedicated escalations queue.
- **Multi-language support** — a language layer so citizens who aren't comfortable in English, or who speak a regional Indian language, can report and read status updates in their own language. Likely either UI string localization (i18n) for the interface plus on-the-fly translation of AI-generated summaries, or accepting spoken/typed descriptions in a regional language and translating them server-side before they hit the pipeline.
- **Priority/severity-triggered notifications** — push or SMS/email alerts to the relevant municipal department the moment a report's priority score crosses a configurable threshold (e.g. anything scoring 8+ near a school), instead of relying on staff to notice it in the queue.
- Redis caching for repeated Overpass lookups
- WebSocket-based live dashboard updates
- Push notifications for citizen-facing status changes
- Mobile application
- Background task queue for AI/spatial calls (currently synchronous within the request, just parallelized against each other)
- Automated test suite (there is currently no test suite at all — the earlier manual verification scripts have been removed)
- GIS heatmaps
- Administrative audit logs
- Offline reporting
- Horizontal scalability improvements — see below

---

# 📈 Scalability — Growing From a Hackathon Demo to a City-Wide System

The current architecture is intentionally simple: a single FastAPI process per Render instance, a synchronous-per-request pipeline (even though AI + spatial calls are now parallelized *within* a request), and a single Postgres database. That's the right call for a hackathon build, but it will not hold up unmodified at real city scale (tens of thousands of daily reports, city-wide concurrent usage). The honest gaps and the concrete path to closing each one:

**1. The request pipeline does too much synchronous work per submission.**
Right now, a citizen's HTTP request stays open for the entire duration of the Gemini call, the Overpass call, the dedup queries, and the image upload. Under load, that ties up a worker per in-flight submission.
→ **Fix:** Move the pipeline to a background task queue (Celery + Redis, or FastAPI's `BackgroundTasks` for a lighter first step, or something like Cloud Tasks/SQS for a managed queue). The API should accept the upload, persist a `PENDING` row immediately, return `202 Accepted`, and let a worker pool run the AI/spatial/dedup pipeline asynchronously. The frontend already polls for status changes on submission (`SubmittingStep.tsx`), so this is a natural extension, not a rewrite.

**2. Every duplicate check is a full table scan.**
`Tier 1` and `Tier 2` dedup currently iterate over every active (non-`RESOLVED`) report in Python and compute Haversine/Hamming distance in application code. That's fine at hundreds of open reports; it falls over at tens of thousands.
→ **Fix:** Push this into the database. PostgreSQL with PostGIS gives you indexed spatial queries (`ST_DWithin`) instead of an application-level loop — a report within 15m becomes an indexed range query, not an O(n) scan. For the perceptual hash comparison, either pre-filter with a PostGIS bounding-box query before computing Hamming distance, or maintain a spatial index keyed by geohash/grid-cell so only nearby candidates are ever pulled into memory.

**3. Single-instance, single-region deployment.**
One Render web service and one Supabase Postgres instance is a single point of failure and a single latency floor for the whole country, let alone a city with millions of residents.
→ **Fix:** Horizontally scale the API layer behind a load balancer (multiple stateless FastAPI instances — the app is already stateless per-request once auth is JWT-based, which helps a lot here), and consider read replicas or regional Postgres for read-heavy endpoints like `/analytics` and `/map-pins`, which don't need to hit the primary.

**4. The Overpass API is a shared public resource with rate limits.**
Every single report currently fires a live Overpass query. At city scale that will get the app rate-limited or blocked outright.
→ **Fix:** Cache spatial context aggressively. Nearby schools/hospitals/roads don't move — cache Overpass results by geohash cell (e.g. ~150m buckets) with a long TTL (weeks, not minutes) in Redis, and only hit Overpass on a cache miss. This also directly fixes the current per-request latency cost of a live third-party call.

**5. Gemini calls are billed and rate-limited per-project.**
At real city volume, per-image AI calls become both a cost and a throughput bottleneck.
→ **Fix:** Batch where possible, apply the perceptual-hash dedup check *before* the AI call (already true today, and worth keeping strict about), and consider a cheaper pre-filter model or heuristic (blur/EXIF sanity check) to reject obviously invalid uploads before they ever reach Gemini.

**6. Photo storage and delivery.**
Supabase Storage works well at moderate volume, but city-scale image delivery (thousands of citizens loading map thumbnails simultaneously) benefits from a CDN layer in front of storage, plus generating and serving resized thumbnails for map/list views instead of full-resolution originals.

**7. No horizontal partitioning strategy for multi-city deployment.**
If this expands beyond one city, a single shared `reports` table with no city/tenant boundary becomes a scaling *and* an operational problem (one city's load noisy-neighboring another's).
→ **Fix:** Introduce a `city_id`/tenant boundary early — even if it's a single column with an index today — so the system can later shard by city or region without a painful migration.

**In short:** the architecture is correct in spirit — deterministic scoring, clean separation of concerns, graceful degradation when third parties fail — but the load-bearing pieces that need to change for city scale are moving the pipeline off the request/response cycle, pushing dedup and spatial lookups into indexed database queries instead of application loops, and caching the third-party spatial data that doesn't change minute-to-minute. None of that requires rearchitecting the product — it's an infrastructure and query-pattern evolution on top of what's already built.

---

# 🤝 Contributing

Contributions, suggestions, and feedback are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push your branch
5. Open a Pull Request

---

# 📜 License

This project is licensed under the **MIT License**.

---

# 👨‍💻 Author

Developed by **Ishaan Nautiyal, Vaibhav Bisht, Aashi Jindal, Devanshi Bisht**

Built with a passion for AI, cybersecurity, and modern software engineering.

---

# ⭐ Why This Project Matters

Infrastructure issues affect millions of people every day, yet the systems used to report and resolve them often remain slow, fragmented, and heavily manual.

SnapFix AI demonstrates how computer vision, live geospatial data, and deterministic decision engineering can combine into a platform that speeds up civic issue triage while staying explainable — every priority score can be traced back to the exact modifiers that produced it. It's built to support human decision-making, not replace it.

---

<div align="center">

### ⭐ If you found this project interesting, consider giving it a star!

Built using **FastAPI**, **React**, **TypeScript**, **Gemini AI**, **Leaflet**, **OpenStreetMap**, **Supabase**, and **Modern Full-Stack Engineering**.

</div>
