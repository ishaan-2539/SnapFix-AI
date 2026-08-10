# 🏛️ SnapFix AI — Municipal Backend Engine

> An AI-powered, spatial-aware civic infrastructure intelligence and dispatch engine built with **FastAPI**, **Google Gemini Vision AI**, **SQLAlchemy**, and **ReportLab**.

---

## 📌 Overview

**SnapFix AI** is a production-grade municipal backend designed to automate civic hazard detection, triage, spatial deduplication, and field dispatch workflows. When citizens capture and upload photos of public infrastructure hazards—such as potholes, water leaks, broken streetlights, or illegal dumping—SnapFix AI processes the input through a multi-stage pipeline:

1. **Spatial & Metadata Parsing**: Extracts embedded EXIF GPS coordinates or captures client fallback geolocation.
2. **Vision AI Hazard Analysis**: Employs Google Gemini Flash to classify the hazard, score severity ($1$–$10$), auto-generate municipal summaries, and filter out non-infrastructure spam.
3. **Dual-Layer De-Duplication Engine**: Combines **Perceptual Image Hashing** with **15-meter Haversine Geospatial Distance Calculations** to merge duplicate tickets and increment community upvotes.
4. **Dynamic Priority Scaling**: Recalculates issue priority on every cluster event (`priority_score = severity_score + (upvotes - 1)`).
5. **Lifecycle Workflow Engine**: Tracks issue progression (`OPEN` → `IN_PROGRESS` → `RESOLVED`) through dedicated, type-validated REST endpoints.
6. **Municipal Work Order Generation**: Dynamically renders field-ready PDF work orders complete with location coordinates, hazard photos, and dispatch summaries.

---

## 📐 System Architecture & Request Flow

```text
                           [ Client Upload ]
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │  1. Ingestion Validation  │
                    │  (Format, Size <= 10MB)   │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │ 2. Geolocation Resolution │
                    │ (EXIF GPS -> Payload GPS) │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │  3. Perceptual Hashing    │
                    │  (Generate Image Hash)    │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │ 4. Gemini Vision AI Engine│
                    │ (Inspect, Severity, Summary)
                    └─────────────┬─────────────┘
                                  │
                   Is Valid Civic Hazard?
                 ┌────────────────┴────────────────┐
                 │                                 │
              [ NO ]                            [ YES ]
                 │                                 │
                 ▼                                 ▼
      ┌────────────────────┐          ┌──────────────────────────┐
      │ 400 Bad Request    │          │ 5. Dual-Layer Dedupe     │
      │ (Guardrail Filter) │          │ (Hash Match OR <=15m Geo)│
      └────────────────────┘          └────────────┬─────────────┘
                                                   │
                                      Existing Cluster Found?
                                    ┌──────────────┴──────────────┐
                                    │                             │
                                 [ YES ]                       [ NO ]
                                    │                             │
                                    ▼                             ▼
                        ┌──────────────────────┐      ┌──────────────────────┐
                        │ Merge & Cluster:     │      │ Create New Ticket:   │
                        │ - Upvotes += 1       │      │ - Status = OPEN      │
                        │ - Recalc Priority    │      │ - Severity = 1..10   │
                        └──────────┬───────────┘      └──────────┬───────────┘
                                   │                             │
                                   └──────────────┬──────────────┘
                                                  │
                                                  ▼
                                      ┌──────────────────────┐
                                      │  Database Commit     │
                                      │  Return 201 Created  │
                                      └──────────────────────┘

```

---

## 🚀 Key Features & Capabilities

### 1. 🤖 Multimodal Vision AI Inspection

* Powered by Google's `gemini-1.5-flash` model.
* Auto-categorizes issues into predefined municipal buckets (`Pothole`, `Trash/Garbage`, `Water Leak`, `Damaged Streetlight`, `Road Damage`, `Broken Sidewalk`, `Other`).
* Assigns an objective `severity_score` ($1$ to $10$) and generates an executive summary.
* Built-in retry mechanism with exponential backoff and demo-safe fallback payloads during API rate limits.

### 2. 🛡️ Non-Civic Guardrail Filter

* Automatically identifies and blocks non-infrastructure uploads (e.g., selfies, pets, documents, indoor rooms, private property).
* Returns a structured `400 Bad Request` error before persisting any invalid data.

### 3. 📍 Geolocation Resolution Pipeline

* Prioritizes EXIF metadata extracted directly from photo headers to prevent location spoofing.
* Gracefully falls back to browser/device GPS coordinates provided in request payloads.
* Rejects requests missing both EXIF and payload location data.

### 4. 🗺️ Dual-Layer De-Duplication & Clustering

* **Layer A (Visual Hash Matching)**: Compares perceptual image hashes against existing active reports.
* **Layer B (15m Haversine Proximity)**: Checks if an active issue (`OPEN` or `IN_PROGRESS`) of similar nature already exists within a 50-meter radius.
* **Clustering Action**: Instead of creating duplicate database records, the backend merges the submission into the existing report, increments `upvotes`, and recalculates `priority_score`.

### 5. 🔄 Dedicated Status Lifecycle Sub-Resource

* Uses a dedicated sub-resource endpoint (`PATCH /api/v1/reports/{id}/status`) to manage operational states (`OPEN`, `IN_PROGRESS`, `RESOLVED`).
* Uses strict Pydantic `Literal` validation for automatic `422 Unprocessable Entity` handling.
* Permits unrestricted transitions (e.g., re-opening an issue if repairs fail).

### 6. 📄 Field-Ready Work Order PDF Generator

* Uses `ReportLab` to stream binary PDFs on-demand.
* Formats hazard metadata, image renders, severity indicators, and map coordinates into official municipal dispatch templates.

---

## 🛠️ Tech Stack

* **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
* **Database ORM**: [SQLAlchemy](https://www.sqlalchemy.org/) with SQLite (`snapfix.db`)
* **Data Validation**: [Pydantic v2](https://www.google.com/search?q=https://docs.pydantic.dev/)
* **AI Engine**: Google Generative AI (`google-generativeai` / Gemini Flash)
* **Document Generation**: [ReportLab](https://www.reportlab.com/)
* **Image Processing & Hashing**: Pillow (PIL), `imagehash`
* **Spatial Calculations**: Custom Haversine distance functions

---

## 🗂️ Project Directory Structure

```text
backend/
├── app/
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py             # Settings, env vars, base paths
│   │   └── database.py           # SQLAlchemy session & DB engine setup
│   ├── models/
│   │   ├── __init__.py
│   │   └── report_model.py       # Report SQLAlchemy ORM model
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── report_schema.py      # Pydantic schemas (Request, Response, Status Update)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── ai_service.py         # Gemini Vision AI integration & backoff logic
│   │   ├── pdf_service.py        # ReportLab PDF work order generator
│   │   └── storage_service.py    # Supabase Storage upload (persistent photo storage)
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── exif.py               # EXIF GPS metadata extraction
│   │   ├── geo.py                # Haversine distance formula
│   │   └── hashing.py            # Perceptual image hashing routines
│   └── routers/
│       ├── __init__.py
│       ├── analytics.py          # Municipal metrics & hotspots router
│       └── reports.py            # Report CRUD & status sub-resource router
├── uploads/                      # Local fallback storage only — used if a Supabase upload fails
├── main.py                       # Application entrypoint, CORS, static mounting
├── requirements.txt              # Project dependencies
└── .env.example                  # Environment template

```

---

## 💾 Database Schema

### `reports` Table

| Column | Type | Constraints / Default | Description |
| --- | --- | --- | --- |
| `id` | `Integer` | `Primary Key`, `Autoincrement` | Unique report ID |
| `image_url` | `String` | `Nullable=False` | Public Supabase Storage URL (falls back to `/uploads/...` if storage is unreachable) |
| `image_hash` | `String` | `Nullable=True`, `Index=True` | Perceptual image hash |
| `latitude` | `Float` | `Nullable=False` | Latitude coordinate |
| `longitude` | `Float` | `Nullable=False` | Longitude coordinate |
| `category` | `String` | `Nullable=False` | AI-classified category |
| `severity_score` | `Integer` | `Nullable=False` | Integer score between 1 and 10 |
| `summary` | `Text` | `Nullable=False` | AI-generated summary |
| `is_valid_civic_issue` | `Boolean` | `Default=True` | Civic guardrail flag |
| `upvotes` | `Integer` | `Default=1` | Cluster count |
| `priority_score` | `Integer` | `Default=severity_score` | Computed priority metric |
| `status` | `String` | `Default="OPEN"` | State (`OPEN`, `IN_PROGRESS`, `RESOLVED`) |
| `created_at` | `DateTime` | `Default=datetime.utcnow` | ISO timestamp |

---

## ⚙️ Prerequisites & Installation

### Prerequisites

* **Python**: Version `3.10` or higher
* **Google Gemini API Key**: Obtainable via [Google AI Studio](https://aistudio.google.com/)

### Setup Steps

1. **Clone the Repository**
```bash
git clone https://github.com/your-username/snapfix-backend.git
cd snapfix-backend

```


2. **Set Up Virtual Environment**
* **Linux / macOS:**
```bash
python3 -m venv .venv
source .venv/bin/activate

```


* **Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1

```




3. **Install Dependencies**
```bash
pip install --upgrade pip
pip install -r requirements.txt

```


4. **Configure Environment Variables**
Create a `.env` file in the `backend/` root directory:
```env
PROJECT_NAME="SnapFix AI Engine"
GEMINI_API_KEY="your_gemini_api_key_here"
DATABASE_URL="sqlite:///./snapfix.db"

# Supabase Storage — persistent photo storage
# Without these, uploads silently fall back to local disk (see storage_service.py)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_or_secret_key"
SUPABASE_STORAGE_BUCKET="report-images"

```


5. **Run Development Server**
```bash
uvicorn main:app --reload --port 8000

```


* API server will be available at `[http://127.0.0.1:8000](http://127.0.0.1:8000)`
* OpenAPI Swagger docs will be live at `[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)`



---

## 📡 Complete API Reference

### 1. Submit Civic Report

`POST /api/v1/reports/`

**Content-Type:** `multipart/form-data`

#### Request Parameters

* `file`: Image binary (`JPEG`, `PNG`, `WEBP` — Max 10MB)
* `latitude` *(optional)*: Device GPS latitude fallback
* `longitude` *(optional)*: Device GPS longitude fallback

#### Responses

* `201 Created` — Unique report created or cluster upvoted.
* `400 Bad Request` — Missing geolocation, non-civic photo, unsupported file format, or file size > 10MB.

---

### 2. Update Report Status

`PATCH /api/v1/reports/{report_id}/status`

**Content-Type:** `application/json`

#### Request Body

```json
{
  "status": "IN_PROGRESS"
}

```

*(Permitted values: `"OPEN"`, `"IN_PROGRESS"`, `"RESOLVED"`)*

#### Responses

* `200 OK` — Returns full updated `ReportResponse`.
* `404 Not Found` — Report ID does not exist.
* `422 Unprocessable Entity` — Invalid status value.

---

### 3. List All Reports

`GET /api/v1/reports/`

#### Responses

* `200 OK` — Array of all reports, ordered by `id DESC`.

---

### 4. Fetch Single Report

`GET /api/v1/reports/{report_id}`

#### Responses

* `200 OK` — Single `ReportResponse` object.
* `404 Not Found` — Report ID does not exist.

---

### 5. Download Work Order PDF

`GET /api/v1/reports/{report_id}/pdf`

#### Responses

* `200 OK` — Binary PDF stream (`application/pdf`).
* `404 Not Found` — Report ID does not exist.

---

### 6. Fetch Municipal Analytics

`GET /api/v1/analytics/`

#### Responses

* `200 OK` — Object containing `total_reports`, `status_breakdown`, `category_breakdown`, and `top_priority_reports`.

---

### 7. Health Check

`GET /health`

#### Responses

* `200 OK` — `{"status": "healthy", "database": "connected"}`

---

## 🧪 Testing & Validation Guide

### 1. Interactive Swagger UI

Open `[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)` in your browser to test all endpoints interactively.

### 2. Testing Status Endpoint via `cURL`

#### Valid Status Update (`200 OK`):

```bash
curl -X 'PATCH' \
  'http://127.0.0.1:8000/api/v1/reports/1/status' \
  -H 'Content-Type: application/json' \
  -d '{"status": "IN_PROGRESS"}'

```

#### Invalid Status Validation Test (`422 Unprocessable Entity`):

```bash
curl -X 'PATCH' \
  'http://127.0.0.1:8000/api/v1/reports/1/status' \
  -H 'Content-Type: application/json' \
  -d '{"status": "INVALID_STATUS"}'

```

---

## 📄 License

This project is licensed under the **MIT License**.

## 📄 Documentation & Interactive API
Once the server is running, explore and test the endpoints directly using OpenAPI / Swagger UI:
* **Interactive Docs:** `http://localhost:8000/docs`
* **ReDoc Format:** `http://localhost:8000/redoc`