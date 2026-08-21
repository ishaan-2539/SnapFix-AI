# 🏛️ SnapFix AI — Municipal Backend Engine

> An AI-powered, spatially-aware civic infrastructure intelligence and dispatch engine built with **FastAPI**, **Google Gemini Vision AI**, **OpenStreetMap/Overpass**, **SQLAlchemy**, **Supabase Auth**, and **ReportLab**.

---

## 📌 Overview

**SnapFix AI**'s backend is a production-grade municipal engine that automates civic hazard detection, triage, spatial deduplication, and field dispatch. When a citizen uploads a photo of a public infrastructure hazard — a pothole, water leak, broken streetlight, illegal dumping — the backend runs it through a multi-stage pipeline:

1. **Ingestion Validation** — enforces format (`JPEG`/`PNG`/`WEBP`) and a 10MB size limit before doing any work.
2. **Spatial & Metadata Parsing** — extracts embedded EXIF GPS coordinates, falling back to client-supplied device geolocation.
3. **Perceptual Hash Dedup (Tier 1)** — computes a perceptual image hash immediately after location resolution and checks it against every active report within a 30m radius using Hamming distance, *before* spending an AI call — a resubmitted photo short-circuits the pipeline entirely.
4. **Vision AI Hazard Analysis + Spatial Context (parallelized)** — Gemini classification and the OpenStreetMap/Overpass spatial lookup are dispatched **concurrently** via `asyncio.gather`, since neither depends on the other's output. This roughly halves end-to-end latency compared to running them sequentially.
5. **Non-Civic Guardrail** — Gemini filters out non-infrastructure spam before it ever touches the database.
6. **Confidence-Gated Spatial Deduplication (Tier 2)** — when AI confidence is high enough, reports of the same category within a 15-meter radius are merged rather than duplicated.
7. **Deterministic Priority Engine** — combines the AI's visual severity with the real-world spatial context into a final, fully explainable 0–10 priority score.
8. **Persistent Cloud Storage** — uploads the photo to Supabase Storage (with local-disk fallback if that call fails, so a storage hiccup never blocks report creation).
9. **Municipal Work Order Generation** — renders field-ready PDF dispatch documents on demand via ReportLab.

Reports can be submitted anonymously (guest) or by an authenticated citizen — either way the pipeline behaves identically, but a logged-in submission is tagged with the submitter's account so it shows up under `/reports/mine`.

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
3. Perceptual Hash Match (Tier 1)
   (30m radius, Hamming distance <= 10)
        |
   Match found? --[YES]--> Merge, recalc priority, return
        |
      [NO]
        v
4. Gemini Vision AI  <-> Overpass Spatial Context
   (dispatched concurrently via asyncio.gather)
        |
        v
   Valid civic hazard? --[NO]--> 400 Bad Request (Guardrail Filter)
        |
      [YES]
        v
5. Spatial Dedup Check (Tier 2)
   (confidence-gated >= 0.80, 15m radius, same category)
        |
   Cluster found? --[YES]--> Merge, recalc priority, return
        |
      [NO]
        v
6. Deterministic Priority Engine
   (full breakdown computed & stored)
        |
        v
7. Upload to Supabase Storage
   (falls back to local disk on failure)
        |
        v
8. Persist Report (tagged with reporter_id if authenticated) & Return 201
```

---

## 🚀 Key Features & Capabilities

### 1. 🤖 Multimodal Vision AI Inspection

* Powered by Google's `gemini-3.5-flash-lite` model, called with structured JSON output enforced via `response_mime_type`.
* Auto-categorizes issues into predefined municipal buckets (`Pothole`, `Trash/Garbage`, `Water Leak`, `Damaged Streetlight`, `Road Damage`, `Broken Sidewalk`, `Other`).
* Assigns a **visual-only** severity score from **1–6**, and is explicitly prompted *not* to factor in location, traffic, nearby schools/hospitals, report count, or any other context — that reasoning is reserved entirely for the deterministic priority engine downstream, keeping the two concerns cleanly separated and each independently auditable.
* Extracts structured forensic telemetry: specific hazards, affected user groups, repair complexity, a recommended action, and a model confidence score.
* Retries with backoff and falls back to a static demo-safe payload on non-retryable errors (quota exhaustion, invalid model, bad API key) — a submission never hard-fails because of an upstream AI outage.
* Runs **concurrently** with the Overpass spatial context lookup rather than after it, since the two calls are independent — this is the single biggest latency win in the pipeline.

### 2. 🛡️ Non-Civic Guardrail Filter

* Automatically identifies and blocks non-infrastructure uploads (selfies, pets, documents, indoor rooms, private property).
* Returns a structured `400 Bad Request` before persisting any invalid data.

### 3. 📍 Geolocation Resolution Pipeline

* Prioritizes EXIF metadata extracted directly from the photo — harder to spoof than a manually placed pin.
* Falls back to browser/device GPS coordinates supplied in the request payload.
* Rejects requests missing both EXIF and payload location data with a clear `400`.

### 4. 🗺️ Dual-Layer De-Duplication & Clustering

* **Tier 1 (Perceptual Hash Matching, 30m radius):** Runs *before* the AI/spatial calls, immediately after location resolution. Compares an `imagehash`-generated perceptual hash against every active (non-`RESOLVED`) report within 30 meters using Hamming distance (threshold `<= 10`), picking the closest match. Catches the same photo — or a near-identical one — resubmitted from roughly the same spot, without spending an AI call on it.
* **Tier 2 (15m Confidence-Gated Geospatial Proximity):** Only runs when the AI's classification confidence is `>= 0.80`, to stop low-confidence guesses from accidentally merging unrelated incidents. Checks whether an active report of the *same category* exists within a 15-meter Haversine radius.
* **Merge behavior:** Instead of a new row, the backend increments `upvotes`, re-fetches spatial context, and recalculates `priority_score` — so an issue that keeps getting reported climbs the priority queue on its own.

### 5. 🌐 Live Spatial Context via OpenStreetMap/Overpass

* Queries the Overpass API for `amenity=school`, `amenity=hospital`, and major-classification highways (`motorway`/`trunk`/`primary`/`secondary`/`tertiary`) within a configurable radius (default 1km) of the incident.
* Tries multiple Overpass mirror endpoints in sequence, retrying transient failures (`429`/`502`/`503`/`504`, timeouts, connection errors) with backoff before moving to the next endpoint.
* Returns the nearest feature of each type plus distance, sorted, and gracefully degrades to an "unavailable" context object (rather than failing the request) if every endpoint is down — a third-party outage never blocks a citizen's report from being filed.

### 6. ⭐ Deterministic Priority Engine

* Pure, side-effect-free function: `calculate_priority_score(severity_score, spatial_context, corroborating_reports)`.
* Applies tiered proximity modifiers for school and hospital distance (critical vs. moderate thresholds), a road-importance-weighted modifier for nearby major roads, and a capped community-corroboration bonus for repeat reports.
* Every modifier is clamped and the final score is normalized to **0–10**.
* Returns a structured `breakdown` object alongside the score — every distance, every modifier, every input — persisted to the database as JSON so the reasoning behind *any* priority score remains inspectable after the fact, not just at calculation time. This breakdown is now also **surfaced directly in both the citizen and municipal frontends** via the `PriorityBreakdown` component, not just stored.

### 7. 🔐 Authentication & Role-Based Access Control

* Backed by **Supabase Auth**. The backend never sees passwords — it verifies Supabase-issued JWTs against Supabase's public JWKS endpoint (`ES256`, `PyJWKClient`), so there's no shared secret to manage on the API side.
* Two dependency flavors:
  * `get_current_user_optional` — never raises; returns `None` for guests. Used on `POST /reports/` so anonymous submissions keep working exactly as before.
  * `get_current_user` — requires a valid token, `401`s otherwise. Used on `GET /reports/mine`.
  * `require_municipal` — requires a valid token **and** an `app_metadata.role == "municipal_staff"` claim, `403`s otherwise. `app_metadata` is only settable via the Supabase dashboard/admin API, so a citizen account can't self-promote by editing their own profile. Used to gate `PATCH /reports/{id}/status`.
* Every submitted report is tagged with `reporter_id` (the JWT `sub` claim) when the submitter is logged in, and left `NULL` for guest submissions — both paths remain fully supported.

### 8. 📄 Field-Ready Work Order PDF Generator

* Uses `ReportLab` to stream binary PDFs on demand, formatting hazard metadata, the report image, severity, and coordinates into a dispatch-ready document.

### 9. 📃 Paginated Report Listing

* `GET /reports/` now returns a paginated envelope (`items`, `total`, `page`, `size`, `pages`) instead of a flat array, so the citizen and municipal UIs can page through large report volumes instead of fetching everything at once.

---

## 🛠️ Tech Stack

* **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
* **Database ORM:** [SQLAlchemy](https://www.sqlalchemy.org/) — PostgreSQL in production (Supabase), SQLite for local development
* **Data Validation:** [Pydantic v2](https://docs.pydantic.dev/)
* **Authentication:** Supabase Auth — JWT verification via JWKS (`pyjwt[crypto]`), role claims in `app_metadata`
* **AI Engine:** Google Generative AI (`google-generativeai`, `gemini-3.5-flash-lite`)
* **Spatial Intelligence:** `httpx` client against OpenStreetMap's Overpass API, custom Haversine distance utilities
* **Object Storage:** Supabase Storage (`supabase-py`), with local-disk fallback
* **Document Generation:** [ReportLab](https://www.reportlab.com/)
* **Image Processing & Hashing:** Pillow (PIL), `imagehash`
* **Concurrency:** `asyncio.gather` to parallelize the Gemini and Overpass calls per request

---

## 🗂️ Project Directory Structure

```text
backend/
├── app/
│   ├── core/
│   │   ├── auth.py                 # Supabase JWT verification, role-gating dependencies
│   │   ├── config.py               # Settings: DB URL, API keys, Supabase, Overpass tuning
│   │   └── database.py             # SQLAlchemy engine & session setup
│   ├── models/
│   │   └── report_model.py         # Report ORM model (incl. reporter_id)
│   ├── schemas/
│   │   └── report_schema.py        # AI output schema, API response schema, pagination, status update
│   ├── services/
│   │   ├── ai_service.py           # Gemini Vision integration, retries, fallback
│   │   ├── priority_engine.py      # Deterministic contextual priority calculation
│   │   ├── spatial_context_service.py  # Overpass API client, multi-endpoint failover
│   │   ├── pdf_service.py          # ReportLab work order generator
│   │   └── storage_service.py      # Supabase Storage upload
│   ├── utils/
│   │   ├── exif.py                 # EXIF GPS extraction
│   │   ├── geo.py                  # Haversine distance formula
│   │   └── hashing.py              # Perceptual image hashing & Hamming distance
│   └── routers/
│       ├── reports.py              # Report submission, retrieval, /mine, status, PDF
│       └── analytics.py            # Municipal stats & map-pin endpoints
├── uploads/                        # Local fallback storage only — primary is Supabase Storage
├── main.py                         # Application entrypoint, CORS, router registration
├── requirements.txt
└── .env.example
```

> **Note on testing:** there is currently no automated test suite in the repository. The manual verification scripts that used to live in `tests/` (ad-hoc sanity checks for the priority engine and Overpass integration) have been removed. See the Testing section below for how to exercise the API in their absence.

---

## 💾 Database Schema

### `reports` Table

| Column | Type | Constraints / Default | Description |
| --- | --- | --- | --- |
| `id` | `Integer` | Primary Key, Autoincrement | Unique report ID |
| `image_url` | `String` | Nullable=False | Public Supabase Storage URL (falls back to `/uploads/...` if storage is unreachable) |
| `image_hash` | `String` | Nullable=True, Indexed | Perceptual image hash |
| `latitude` / `longitude` | `Float` | Nullable=False | Coordinates |
| `reporter_id` | `String` | Nullable=True, Indexed | Supabase auth user ID (JWT `sub` claim) of the submitter. `NULL` for guest submissions — the platform intentionally still supports anonymous reporting. |
| `category` | `String` | Nullable=False, Indexed | AI-classified category |
| `severity_score` | `Integer` | Nullable=False | Gemini's *visual-only* severity, 1–6 |
| `summary` | `Text` | Nullable=False | AI-generated incident summary |
| `is_valid_civic_issue` | `Boolean` | Default=True | Guardrail result |
| `ai_confidence` | `Float` | Nullable=True | Model confidence score |
| `hazards` / `affected_users` | `Text` (JSON) | Nullable=True | Structured forensic telemetry |
| `repair_complexity` | `String` | Nullable=True | Minor / Moderate / Major |
| `recommended_action` | `Text` | Nullable=True | AI-recommended immediate action |
| `upvotes` | `Integer` | Default=1 | Corroboration count from merged duplicates |
| `priority_score` | `Float` | Nullable=False, Default=0.0 | Final deterministic 0–10 priority |
| `priority_breakdown` | `Text` (JSON) | Nullable=True | Full modifier-by-modifier explanation |
| `status` | `String` | Default="OPEN", Indexed | `OPEN` / `IN_PROGRESS` / `RESOLVED` |
| `created_at` | `DateTime` | `server_default=now()` | Timestamp |

`hazards`, `affected_users`, and `priority_breakdown` are stored as `TEXT` (JSON-serialized) for cross-compatibility between SQLite and PostgreSQL, and are deserialized back into native Python types by a Pydantic `model_validator` on the response schema.

---

## ⚙️ Prerequisites & Installation

### Prerequisites

* **Python:** 3.10 or higher
* **Google Gemini API Key:** via [Google AI Studio](https://aistudio.google.com/)
* **A Supabase project** — used for Postgres, Storage, *and* Auth (JWKS-based JWT verification)

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

   # Supabase Auth — JWT verification uses Supabase's public JWKS endpoint
   # (derived from SUPABASE_URL above), so no shared secret is required for
   # verification itself. SUPABASE_JWT_SECRET is reserved for any future
   # non-JWKS auth flows.
   SUPABASE_JWT_SECRET=""

   # Optional — Overpass spatial intelligence tuning (sensible defaults ship in code)
   OVERPASS_SEARCH_RADIUS_METERS=1000
   OVERPASS_CONNECT_TIMEOUT_SECONDS=3
   OVERPASS_READ_TIMEOUT_SECONDS=6
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
**Auth:** Optional — works for both guests and logged-in citizens. If an `Authorization: Bearer <token>` header is present and valid, the report is tagged with the submitter's `reporter_id`.

**Request Parameters**
* `file`: Image binary (`JPEG`, `PNG`, `WEBP` — max 10MB)
* `latitude` *(optional)*: Device GPS latitude fallback
* `longitude` *(optional)*: Device GPS longitude fallback

**Responses**
* `201 Created` — New ticket created, or an existing cluster upvoted and re-prioritized.
* `400 Bad Request` — Missing geolocation, non-civic photo, unsupported format, or file over 10MB.

---

### 2. List All Reports (Paginated)

`GET /api/v1/reports/?page=1&size=20` → `200 OK`

```json
{
  "items": [ /* ReportResponse[] */ ],
  "total": 0,
  "page": 1,
  "size": 20,
  "pages": 0
}
```

### 3. Get My Reports

`GET /api/v1/reports/mine`

**Auth:** Required — `401` if the request has no valid Supabase JWT.

Returns every report where `reporter_id` matches the authenticated user's `sub` claim, ordered by `id DESC`.

### 4. Fetch Single Report

`GET /api/v1/reports/{report_id}` → `200 OK` single `ReportResponse`, or `404`.

### 5. Update Report Status

`PATCH /api/v1/reports/{report_id}/status`

**Content-Type:** `application/json`
**Auth:** Required — must belong to an account with `app_metadata.role == "municipal_staff"`, or the request is rejected with `403`.

```json
{ "status": "IN_PROGRESS" }
```
*(Permitted values: `"OPEN"`, `"IN_PROGRESS"`, `"RESOLVED"`)*

**Responses**
* `200 OK` — Full updated `ReportResponse`.
* `401 Unauthorized` — Missing or invalid token.
* `403 Forbidden` — Valid token, but not a municipal account.
* `404 Not Found` — Report ID does not exist.
* `422 Unprocessable Entity` — Invalid status value.

---

### 6. Download Work Order PDF

`GET /api/v1/reports/{report_id}/pdf` → `200 OK` binary PDF stream, or `404`.

### 7. Municipal Analytics — Summary Stats

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

### 8. Municipal Analytics — Map Pins

`GET /api/v1/analytics/map-pins`

Returns a lightweight array of reports (id, coordinates, category, severity, priority, upvotes, status, summary, image URL) sorted by `priority_score` descending — purpose-built for map rendering rather than the full report payload.

### 9. Health Check

`GET /health` → `{"status": "healthy", "database": "connected"}`

---

## 🧪 Testing & Validation Guide

> There is no automated or manual test suite in the repository right now — the earlier `tests/` folder (manual verification scripts for the priority engine and Overpass integration) has been removed. Until a real `pytest`-based suite is added, use the following to validate behavior manually.

### 1. Interactive Swagger UI

Open `http://127.0.0.1:8000/docs` to exercise every endpoint interactively. Use the "Authorize" button with a Supabase-issued bearer token to test the `/mine` and status-update endpoints.

### 2. Status Endpoint via cURL

**Valid (`200 OK`, municipal token):**
```bash
curl -X PATCH 'http://127.0.0.1:8000/api/v1/reports/1/status' \
  -H 'Authorization: Bearer <municipal_staff_jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"status": "IN_PROGRESS"}'
```

**Invalid status (`422 Unprocessable Entity`):**
```bash
curl -X PATCH 'http://127.0.0.1:8000/api/v1/reports/1/status' \
  -H 'Authorization: Bearer <municipal_staff_jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"status": "INVALID_STATUS"}'
```

**Wrong role (`403 Forbidden`):**
```bash
curl -X PATCH 'http://127.0.0.1:8000/api/v1/reports/1/status' \
  -H 'Authorization: Bearer <citizen_jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"status": "IN_PROGRESS"}'
```

---

## 📄 License

This project is licensed under the **MIT License**.

## 📄 Documentation & Interactive API

Once the server is running:
* **Interactive Docs:** `http://localhost:8000/docs`
* **ReDoc Format:** `http://localhost:8000/redoc`
