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
![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render)
![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=for-the-badge&logo=vercel)
![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase)

</div>

---

# 🌍 Overview

SnapFix AI is a modern **AI-powered civic issue management platform** designed to bridge the communication gap between citizens and municipal authorities.

Citizens report infrastructure issues — potholes, garbage accumulation, damaged streetlights, water leaks, road damage — by uploading a single photograph. The platform then runs that submission through a full intelligence pipeline: it validates the image is a genuine civic issue, extracts or confirms its location, classifies and scores it with Google's Gemini Vision AI, checks whether it's a duplicate of an already-reported issue nearby, pulls real-world geographic context (nearby schools, hospitals, and major roads) from OpenStreetMap to calculate a deterministic operational priority, and finally surfaces it to municipal teams through a dedicated operations dashboard.

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
- tracks status from submission through resolution

The result is a system that's faster than manual review and — because every priority score comes with a visible breakdown of *why* — more auditable than a black-box model would be.

---

# ✨ Key Features

## 👥 Citizen Portal

### 📸 AI-Powered Issue Reporting

Citizens upload a photo through a guided multi-step reporting wizard. The backend automatically:

- verifies the image depicts a genuine civic issue
- classifies it into one of seven municipal categories
- scores visual severity
- extracts specific hazards (e.g. exposed wiring, blocked drainage, vehicle collision risk)
- identifies who's likely affected (pedestrians, cyclists, motorists, children, etc.)
- estimates repair complexity and recommends an immediate action
- writes a concise, formal municipal incident summary

### 🗺️ Intelligent Location Detection

Location is resolved in priority order:

1. Embedded EXIF GPS metadata (harder to spoof than a manual pin)
2. Browser/device geolocation fallback

If neither is available, the submission is rejected with a clear message rather than silently accepting bad data.

### 📋 Personal Report Tracking

Citizens can revisit reports they've submitted through a lightweight "My Reports" view, persisted across sessions without requiring an account.

### 📄 PDF Work Order Generation

Every report — citizen-facing or municipal — can be exported as a formatted PDF containing the issue summary, category, severity, coordinates, photo, and current status.

### 🌍 Interactive Public Map

An interactive Leaflet map lets citizens explore active reports across the city, with severity-tiered markers and clustering.

---

## 🏛️ Municipal Operations Dashboard

### 📊 Operational Dashboard

A live triage queue and KPI overview: total reports, open/in-progress/resolved counts, average severity, and category breakdown.

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

Google's Gemini Vision model (`gemini-flash-latest`) is used for what vision models are actually good at — *reading an image* — and nothing more. The prompt explicitly instructs the model to score only what's visually observable (severity 1–6) and to leave every contextual judgment (proximity to a school, traffic importance, how many people reported it) to SnapFix's own deterministic engine. This separation matters: it stops the AI from silently inflating severity because "it's probably near a school" when it has no way to actually know that — and it means every contextual multiplier applied later is inspectable and defensible, not an AI guess.

Gemini also acts as a guardrail: non-civic images (selfies, pets, indoor scenes, unrelated photos) are flagged and rejected with a `400` before they ever reach the database. If the Gemini API fails or rate-limits, a demo-safe fallback response keeps the submission flow alive rather than hard-failing the request.

---

# 🚀 What Makes SnapFix AI Different?

Most civic reporting apps just collect complaints into a list. SnapFix AI does three things that go meaningfully further:

## 📍 Hybrid Duplicate Detection

Two independent layers work together:
- **Perceptual image hashing** — catches the same photo (or a near-identical one) submitted more than once, regardless of location precision.
- **Geospatial clustering** — merges reports of the same category within a 15-meter radius, but only when the AI's classification confidence clears a threshold, so low-confidence guesses can't accidentally merge two unrelated issues.

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
- The **entire calculation is normalized to 0–10** and returned alongside a structured `breakdown` object — every modifier, every distance, every input — so the final score is never a mystery.

If OpenStreetMap is temporarily unreachable, the engine treats that as "no contextual evidence" and falls back gracefully — a report never fails to submit because a third-party API is down. The service also tries multiple Overpass mirror endpoints with retry/backoff before giving up.

## 🏙️ Dual-Portal Experience

A light, mobile-first **Citizen Portal** (`/app`) for reporting and tracking, and a dark, data-dense **Municipal Command Center** (`/ops`) for triage and analytics — each built for a genuinely different user, not the same admin panel with different CSS.

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
              +-----------+----------+
                         |
                  REST API (Axios)
                         v
              +----------------------+
              |   FastAPI Backend    |
              |-----------------------|
              | Request Validation    |
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
                                              v
                                        +-----------+
                                        | Supabase  |
                                        | Storage   |
                                        | (photos)  |
                                        +-----------+
```

---

# 🔄 End-to-End Workflow

```text
Citizen uploads image
        │
        ▼
File Validation (Size • Format • MIME)
        │
        ▼
Location Resolution (EXIF → Browser GPS)
        │
        ▼
Gemini Vision Analysis (category, visual severity, hazards, guardrail check)
        │
        ▼
Perceptual Image Hash Generated
        │
        ▼
Hash-Based Duplicate Check
        │
        ▼
Geospatial Duplicate Check (15m radius, confidence-gated)
        │
        ▼
Spatial Context Fetched (Overpass: nearest school / hospital / major road)
        │
        ▼
Deterministic Priority Score Calculated (with full breakdown)
        │
        ▼
Photo Uploaded to Supabase Storage
        │
        ▼
Report Persisted to PostgreSQL
        │
        ▼
Municipal Dashboard → Status Updates → Resolved
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
- Live OpenStreetMap/Overpass queries for schools, hospitals, and major roads
- Multi-endpoint failover with retry/backoff for spatial context lookups

---

# 📂 Project Structure

```text
SnapFix-AI/
│
├── frontend/
│   ├── src/
│   │   ├── components/       # layout, map, ops, report, ui
│   │   ├── pages/             # citizen/, ops/, public pages
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── lib/
│   │   ├── types/
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── app/
│   │   ├── core/              # config.py, database.py
│   │   ├── routers/           # reports.py, analytics.py
│   │   ├── models/            # report_model.py
│   │   ├── schemas/           # report_schema.py
│   │   ├── services/          # ai_service, priority_engine,
│   │   │                      # spatial_context_service, pdf_service,
│   │   │                      # storage_service
│   │   └── utils/             # exif.py, geo.py, hashing.py
│   ├── tests/                 # priority engine & spatial context checks
│   ├── uploads/                # local fallback only — primary storage is Supabase
│   ├── requirements.txt
│   └── main.py
│
└── README.md
```

---

# 📡 API Overview

## Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/reports/` | Submit new civic issue |
| GET | `/api/v1/reports/` | Retrieve all reports |
| GET | `/api/v1/reports/{id}` | Report details |
| PATCH | `/api/v1/reports/{id}/status` | Update issue status |
| GET | `/api/v1/reports/{id}/pdf` | Download work order PDF |

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
- AI classification, visual severity, and structured forensic telemetry (hazards, affected users, repair complexity, recommended action, model confidence)
- geographic coordinates
- final deterministic priority score **and** its full breakdown (stored as JSON, so past decisions remain explainable even after the fact)
- upvote count, status, and timestamp

Production runs on PostgreSQL via Supabase; local development defaults to SQLite for zero-setup onboarding — the ORM layer means the same model code runs against either.

---

# 🧩 Engineering Highlights

- Deterministic, auditable priority scoring instead of an opaque AI-generated number
- Live geospatial enrichment via OpenStreetMap/Overpass, with multi-endpoint failover
- Dual-layer duplicate detection (perceptual hash + confidence-gated geospatial clustering)
- Strict separation of concerns: Gemini scores *what it can see*, SnapFix's own engine scores *context*
- Cloud object storage for photos (Supabase Storage) so uploads survive Render's ephemeral filesystem and free-tier sleep cycles, with automatic local-disk fallback if Supabase is unreachable
- Automated PDF work order generation
- Reusable, tiered frontend component architecture for two distinct user experiences

---

# 🚀 Getting Started

## Prerequisites

**Frontend:** Node.js 18+, npm
**Backend:** Python 3.10+, pip, venv
**AI:** Google Gemini API key

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
```

```bash
npm run dev
```

App: `http://localhost:5173`

---

## 🚀 Live Demo

- **Frontend:** https://snap-fix-ai-gamma.vercel.app/
- **Backend API:** https://snapfix-ai-aury.onrender.com

> **Note:** The backend runs on Render's free tier and may take 30–90 seconds to wake up after inactivity. Uploaded photos are stored in **Supabase Storage**, not on the backend's local disk, so they persist across restarts, sleep cycles, and redeploys. The production database is **PostgreSQL** on Supabase, accessed through its connection pooler.

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

> ✅ Already shipped since the initial build: **PostgreSQL migration** (Supabase, replacing SQLite in production), **cloud object storage for photos** (Supabase Storage), **live OpenStreetMap spatial context**, and a **deterministic, explainable priority engine** with a full audit breakdown.

Potential next steps:

- Surface the priority breakdown in the municipal UI (it's fully computed and stored, just not yet visualized)
- User authentication & role-based access control
- Redis caching for repeated Overpass lookups
- WebSocket-based live dashboard updates
- Push notifications for status changes
- Mobile application
- Multi-language support
- Background task queue for AI/spatial calls (currently synchronous)
- Automated test suite with real assertions (current tests are manual verification scripts)
- GIS heatmaps
- Administrative audit logs
- Offline reporting

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

Built using **FastAPI**, **React**, **TypeScript**, **Gemini AI**, **Leaflet**, **OpenStreetMap**, and **Modern Full-Stack Engineering**.

</div>