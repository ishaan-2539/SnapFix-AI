# 🏛️ SnapFix AI — Municipal Backend Engine

> An AI-powered, spatially-aware civic infrastructure intelligence and dispatch engine built with **FastAPI**, **Google Gemini Vision AI**, **OpenStreetMap/Overpass**, **SQLAlchemy**, and **ReportLab**.

---

## 📌 Overview

**SnapFix AI**'s backend is a production-grade municipal engine that automates civic hazard detection, triage, spatial deduplication, and field dispatch. When a citizen uploads a photo of a public infrastructure hazard — a pothole, water leak, broken streetlight, illegal dumping — the backend runs it through a multi-stage pipeline:

1. **Ingestion Validation** — enforces format (`JPEG`/`PNG`/`WEBP`) and a 10MB size limit before doing any work.
2. **Spatial & Metadata Parsing** — extracts embedded EXIF GPS coordinates, falling back to client-supplied device geolocation.
3. **Vision AI Hazard Analysis** — Gemini Flash classifies the issue, scores *visual-only* severity (1–6), extracts structured hazard telemetry, and filters out non-infrastructure spam before it ever touches the database.
4. **Perceptual Hash Deduplication** — an exact/near-exact image-hash match against active reports short-circuits the pipeline and upvotes the existing ticket instead of creating a new one.
5. **Confidence-Gated Spatial Deduplication** — when AI confidence is high enough, reports of the same category within a 15-meter radius are merged rather than duplicated.
6. **Live Spatial Context Enrichment** — queries OpenStreetMap's Overpass API for the nearest school, hospital, and major road around the incident, with multi-endpoint failover and retry/backoff.
7. **Deterministic Priority Engine** — combines the AI's visual severity with the real-world context above into a final, fully explainable 0–10 priority score.
8. **Persistent Cloud Storage** — uploads the photo to Supabase Storage (with local-disk fallback if that call fails, so a storage hiccup never blocks report creation).
9. **Municipal Work Order Generation** — renders field-ready PDF dispatch documents on demand via ReportLab.

---

## 📐 System Architecture & Request Flow

```
[ Client Upload ]
        |
        v
1. Ingestion Validation
   (Format, Size <= 10MB)
        |
        v
2. Geolocation Resolution
   (EXIF GPS -> Payload GPS)
        |
        v
3. Gemini Vision AI Engine
   (Category, Visual Severity,
    Hazards, Guardrail Check)
        |
        v
   Valid civic hazard? --[NO]--> 400 Bad Request (Guardrail Filter)
        |
      [YES]
        v
4. Perceptual Hash Match
   (Same image already seen?)
        |
   Match found? --[YES]--> Merge, recalc priority, return
        |
      [NO]
        v
5. Spatial Dedup Check
   (confidence-gated, 15m radius, same category)
        |
   Cluster found? --[YES]--> Merge, recalc priority, return
        |
      [NO]
        v
6. Fetch Spatial Context
   (Overpass: nearest school / hospital / major road)
        |
        v
7. Deterministic Priority Engine
   (full breakdown computed & stored)
        |
        v
8. Upload to Supabase Storage
   (falls back to local disk on failure)
        |
        v
9. Persist Report & Return 201
```

---

## 🚀 Key Features & Capabilities

### 1. 🤖 Multimodal Vision AI Inspection

* Powered by Google's `gemini-flash-latest` model, called with structured JSON output enforced via `response_mime_type`.
* Auto-categorizes issues into predefined municipal buckets (`Pothole`, `Trash/Garbage`, `Water Leak`, `Damaged Streetlight`, `Road Damage`, `Broken Sidewalk`, `Other`).
* Assigns a **visual-only** severity score from **1–6**, and is explicitly prompted *not* to factor in location, traffic, nearby schools/hospitals, report count, or any other context — that reasoning is reserved entirely for the deterministic priority engine downstream, keeping the two concerns cleanly separated and each independently auditable.
* Extracts structured forensic telemetry: specific hazards, affected user groups, repair complexity, a recommended action, and a model confidence score.
* Retries up to 3 times with linear backoff, and falls back to a static demo-safe payload if Gemini is unreachable or rate-limited — a submission never hard-fails because of an upstream AI outage.

### 2. 🛡️ Non-Civic Guardrail Filter

* Automatically identifies and blocks non-infrastructure uploads (selfies, pets, documents, indoor rooms, private property).
* Returns a structured `400 Bad Request` before persisting any invalid data.

### 3. 📍 Geolocation Resolution Pipeline

* Prioritizes EXIF metadata extracted directly from the photo — harder to spoof than a manually placed pin.
* Falls back to browser/device GPS coordinates supplied in the request payload.
* Rejects requests missing both EXIF and payload location data with a clear `400`.

### 4. 🗺️ Dual-Layer De-Duplication & Clustering

* **Layer A (Perceptual Hash Matching):** Compares an `imagehash`-generated perceptual hash against every active (non-`RESOLVED`) report. An exact match merges instantly, regardless of category or confidence.
* **Layer B (15m Confidence-Gated Geospatial Proximity):** Only runs when the AI's classification confidence is `>= 0.80`, to stop low-confidence guesses from accidentally merging unrelated incidents. Checks whether an active report of the *same category* exists within a 15-meter Haversine radius.
* **Merge behavior:** Instead of a new row, the backend increments `upvotes`, re-fetches spatial context, and recalculates `priority_score` — so an issue that keeps getting reported climbs the priority queue on its own.

### 5. 🌐 Live Spatial Context via OpenStreetMap/Overpass

* Queries the Overpass API for `amenity=school`, `amenity=hospital`, and major-classification highways (`motorway`/`trunk`/`primary`/`secondary`/`tertiary`) within a configurable radius (default 1km) of the incident.
* Tries multiple Overpass mirror endpoints in sequence, retrying transient failures (`429`/`502`/`503`/`504`, timeouts, connection errors) with backoff before moving to the next endpoint.
* Returns the nearest feature of each type plus distance, sorted, and gracefully degrades to an "unavailable" context object (rather than failing the request) if every endpoint is down — a third-party outage never blocks a citizen's report from being filed.

### 6. ⭐ Deterministic Priority Engine

* Pure, side-effect-free function: `calculate_priority_score(severity_score, spatial_context, corroborating_reports)`.
* Applies tiered proximity modifiers for school and hospital distance (critical vs. moderate thresholds), a road-importance-weighted modifier for nearby major roads, and a capped community-corroboration bonus for repeat reports.
* Every modifier is clamped and the final score is normalized to **0–10**.
* Returns a structured `breakdown` object alongside the score — every distance, every modifier, every input — persisted to the database as JSON so the reasoning behind *any* priority score remains inspectable after the fact, not just at calculation time.

### 7. 🔄 Dedicated Status Lifecycle Sub-Resource

* `PATCH /api/v1/reports/{id}/status` manages operational states (`OPEN`, `IN_PROGRESS`, `RESOLVED`) via a Pydantic `Literal`, giving automatic `422` validation on invalid values.
* Transitions are unrestricted — an issue can be reopened if a repair fails, matching how municipal work actually happens.

### 8. 📄 Field-Ready Work Order PDF Generator

* Uses `ReportLab` to stream binary PDFs on demand, formatting hazard metadata, the report image, severity, and coordinates into a dispatch-ready document.

---

## 🛠️ Tech Stack

* **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
* **Database ORM:** [SQLAlchemy](https://www.sqlalchemy.org/) — PostgreSQL in production (Supabase), SQLite for local development
* **Data Validation:** [Pydantic v2](https://docs.pydantic.dev/)
* **AI Engine:** Google Generative AI (`google-generativeai`, `gemini-flash-latest`)
* **Spatial Intelligence:** `httpx` client against OpenStreetMap's Overpass API, custom Haversine distance utilities
* **Object Storage:** Supabase Storage (`supabase-py`), with local-disk fallback
* **Document Generation:** [ReportLab](https://www.reportlab.com/)
* **Image Processing & Hashing:** Pillow (PIL), `imagehash`

---

## 🗂️ Project Directory Structure

```text
backend/
├── app/
│   ├── core/
│   │   ├── config.py               # Settings: DB URL, API keys, Overpass tuning
│   │   └── database.py             # SQLAlchemy engine & session setup
│   ├── models/
│   │   └── report_model.py         # Report ORM model
│   ├── schemas/
│   │   └── report_schema.py        # AI output schema, API response schema, status update
│   ├── services/
│   │   ├── ai_service.py           # Gemini Vision integration, retries, fallback
│   │   ├── priority_engine.py      # Deterministic contextual priority calculation
│   │   ├── spatial_context_service.py  # Overpass API client, multi-endpoint failover
│   │   ├── pdf_service.py          # ReportLab work order generator
│   │   └── storage_service.py      # Supabase Storage upload
│   ├── utils/
│   │   ├── exif.py                 # EXIF GPS extraction
│   │   ├── geo.py                  # Haversine distance formula
│   │   └── hashing.py              # Perceptual image hashing
│   └── routers/
│       ├── reports.py              # Report submission, retrieval, status, PDF
│       └── analytics.py            # Municipal stats & map-pin endpoints
├── tests/
│   ├── test_priority_engine.py     # Manual verification scripts for the priority engine
│   ├── test_spatial_context.py     # Manual verification for Overpass integration
│   └── test_overpass_raw.py        # Raw Overpass query inspection
├── uploads/                        # Local fallback storage only — primary is Supabase Storage
├── main.py                         # Application entrypoint, CORS, router registration
├── requirements.txt
└── .env.example
```

> **Note on `tests/`:** these are manual verification scripts (they `print()` results for inspection rather than using `assert`/pytest fixtures) — useful for sanity-checking the priority engine and Overpass integration during development, but not yet a CI-runnable automated test suite.

---

## 💾 Database Schema

### `reports` Table

| Column | Type | Constraints / Default | Description |
| --- | --- | --- | --- |
| `id` | `Integer` | Primary Key, Autoincrement | Unique report ID |
| `image_url` | `String` | Nullable=False | Public Supabase Storage URL (falls back to `/uploads/...` if storage is unreachable) |
| `image_hash` | `String` | Nullable=True, Indexed | Perceptual image hash |
| `latitude` / `longitude` | `Float` | Nullable=False | Coordinates |
| `category` | `String` | Nullable=False, Indexed | AI-classified category |
| `severity_score` | `Integer` | Nullable=False | Visual-only severity, 1–6 |
| `summary` | `Text` | Nullable=False | AI-generated municipal summary |
| `is_valid_civic_issue` | `Boolean` | Default=True | Guardrail flag |
| `ai_confidence` | `Float` | Nullable=True | Gemini's confidence in its own classification |
| `hazards` | `Text` | Nullable=True | JSON array of specific visible hazards |
| `affected_users` | `Text` | Nullable=True | JSON array of affected user groups |
| `repair_complexity` | `String` | Nullable=True | `Minor` / `Moderate` / `Major` |
| `recommended_action` | `Text` | Nullable=True | AI-recommended immediate action |
| `upvotes` | `Integer` | Default=1 | Cluster/corroboration count |
| `priority_score` | `Float` | Default=0.0 | Final deterministic 0–10 priority |
| `priority_breakdown` | `Text` | Nullable=True | JSON audit trail of every modifier that produced `priority_score` |
| `status` | `String` | Default="OPEN", Indexed | `OPEN` / `IN_PROGRESS` / `RESOLVED` |
| `created_at` | `DateTime` | `server_default=now()` | Timestamp |

`hazards`, `affected_users`, and `priority_breakdown` are stored as `TEXT` (JSON-serialized) for cross-compatibility between SQLite and PostgreSQL, and are deserialized back into native Python types by a Pydantic `model_validator` on the response schema.

---

## ⚙️ Prerequisites & Installation

### Prerequisites

* **Python:** 3.10 or higher
* **Google Gemini API Key:** via [Google AI Studio](https://aistudio.google.com/)
* *(Optional, for production-parity local testing)* A Supabase project for Postgres + Storage

### Setup Steps

1. **Clone and enter the backend directory**
   ```bash
   git clone https://github.com/your-username/SnapFix-AI.git
   cd SnapFix-AI/backend
   ```

2. **Create a virtual environment**
   ```bash
   # Linux / macOS
   python3 -m venv .venv
   source .venv/bin/activate

   # Windows (PowerShell)
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

3. **Install dependencies**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Configure environment variables** — create `backend/.env`:
   ```env
   PROJECT_NAME="SnapFix AI Engine"
   GEMINI_API_KEY="your_gemini_api_key_here"

   # Local dev default — swap for a Postgres/Supabase URL in production
   DATABASE_URL="sqlite:///./civic_sense.db"

   # Supabase Storage — persistent photo storage
   # Without these, uploads silently fall back to local disk (see storage_service.py)
   SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_or_secret_key"
   SUPABASE_STORAGE_BUCKET="report-images"

   # Optional — Overpass spatial intelligence tuning (sensible defaults ship in code)
   OVERPASS_SEARCH_RADIUS_METERS=1000
   OVERPASS_CONNECT_TIMEOUT_SECONDS=10
   OVERPASS_READ_TIMEOUT_SECONDS=30
   ```

5. **Run the development server**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

   * API: `http://127.0.0.1:8000`
   * Swagger UI: `http://127.0.0.1:8000/docs`
   * ReDoc: `http://127.0.0.1:8000/redoc`

---

## 📡 Complete API Reference

### 1. Submit Civic Report

`POST /api/v1/reports/`

**Content-Type:** `multipart/form-data`

**Request Parameters**
* `file`: Image binary (`JPEG`, `PNG`, `WEBP` — max 10MB)
* `latitude` *(optional)*: Device GPS latitude fallback
* `longitude` *(optional)*: Device GPS longitude fallback

**Responses**
* `201 Created` — New ticket created, or an existing cluster upvoted and re-prioritized.
* `400 Bad Request` — Missing geolocation, non-civic photo, unsupported format, or file over 10MB.

---

### 2. Update Report Status

`PATCH /api/v1/reports/{report_id}/status`

**Content-Type:** `application/json`

```json
{ "status": "IN_PROGRESS" }
```
*(Permitted values: `"OPEN"`, `"IN_PROGRESS"`, `"RESOLVED"`)*

**Responses**
* `200 OK` — Full updated `ReportResponse`.
* `404 Not Found` — Report ID does not exist.
* `422 Unprocessable Entity` — Invalid status value.

---

### 3. List All Reports

`GET /api/v1/reports/` → `200 OK`, array of reports ordered by `id DESC`.

### 4. Fetch Single Report

`GET /api/v1/reports/{report_id}` → `200 OK` single `ReportResponse`, or `404`.

### 5. Download Work Order PDF

`GET /api/v1/reports/{report_id}/pdf` → `200 OK` binary PDF stream, or `404`.

### 6. Municipal Analytics — Summary Stats

`GET /api/v1/analytics/stats`

**Response** — `200 OK`:
```json
{
  "total_reports": 0,
  "open_reports": 0,
  "in_progress_reports": 0,
  "resolved_reports": 0,
  "average_severity_score": 0.0,
  "category_breakdown": { "Pothole": 0 }
}
```

### 7. Municipal Analytics — Map Pins

`GET /api/v1/analytics/map-pins`

Returns a lightweight array of reports (id, coordinates, category, severity, priority, upvotes, status, summary, image URL) sorted by `priority_score` descending — purpose-built for map rendering rather than the full report payload.

### 8. Health Check

`GET /health` → `{"status": "healthy", "database": "connected"}`

---

## 🧪 Testing & Validation Guide

### 1. Interactive Swagger UI

Open `http://127.0.0.1:8000/docs` to exercise every endpoint interactively.

### 2. Priority Engine & Spatial Context Verification

```bash
python -m tests.test_priority_engine
python -m tests.test_spatial_context
```
These print calculated priority breakdowns for a set of hand-crafted scenarios (quiet-street pothole, hospital-adjacent hazard, school-adjacent hazard) for manual sanity-checking — not asserted pytest cases.

### 3. Status Endpoint via cURL

**Valid (`200 OK`):**
```bash
curl -X PATCH 'http://127.0.0.1:8000/api/v1/reports/1/status' \
  -H 'Content-Type: application/json' \
  -d '{"status": "IN_PROGRESS"}'
```

**Invalid (`422 Unprocessable Entity`):**
```bash
curl -X PATCH 'http://127.0.0.1:8000/api/v1/reports/1/status' \
  -H 'Content-Type: application/json' \
  -d '{"status": "INVALID_STATUS"}'
```

---

## 📄 License

This project is licensed under the **MIT License**.

## 📄 Documentation & Interactive API

Once the server is running:
* **Interactive Docs:** `http://localhost:8000/docs`
* **ReDoc Format:** `http://localhost:8000/redoc`