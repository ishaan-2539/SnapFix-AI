
---

# 🏛️ SnapFix AI — Municipal Backend Engine

> An AI-powered, spatial-aware civic infrastructure intelligence and dispatch engine built with FastAPI, Google Gemini Vision AI, and SQLAlchemy.

---

## 📌 Executive Summary

**SnapFix AI** transforms municipal issue reporting by replacing manual inspection workflows with automated, vision-driven intelligence and spatial deduplication. Citizens upload photos of infrastructure hazards (potholes, water leaks, broken streetlights, trash dumping), and the engine automatically:

1. **Parses & Extracts Metadata**: Extracts EXIF GPS coordinates and enforces strict size/format validation.
2. **Inspects via Multimodal Vision AI**: Uses Google Gemini Flash to categorize hazards, assess severity ($1$–$10$), auto-generate municipal briefs, and reject non-civic spam images.
3. **Executes Dual-Layer De-Duplication**: Prevents duplicate work orders using a combined engine of **Perceptual Image Hashing** and **50-meter Haversine Geospatial Clustering**.
4. **Boosts Priority & Merges Upvotes**: Dynamically scales priority scores (`priority_score = severity_score + (upvotes - 1)`) when multiple reports cluster around the same hazard.
5. **Generates Dispatch PDFs**: Compiles incident reports into downloadable, field-ready municipal work order PDF documents.
6. **Manages Lifecycle Workflows**: Tracks report status (`OPEN` → `IN_PROGRESS` → `RESOLVED`) via dedicated sub-resource REST endpoints.

---

## 🚀 Key Capabilities

* **🤖 Multimodal AI Visual Inspection**: Powered by Gemini Flash with built-in retry loops, exponential backoff, and demo-safe fallback payloads.
* **📍 EXIF GPS Coordinate Extraction**: Automatically reads embedded photo geolocation to guarantee spatial accuracy, falling back to browser GPS if needed.
* **🛡️ Non-Civic Guardrail Filter**: Rejects non-infrastructure uploads (selfies, pets, indoor photos, documents) at the ingestion boundary.
* **🗺️ Dual-Layer De-Duplication Engine**:
* **Layer A (Image Hashing)**: Detects identical or near-identical image uploads.
* **Layer B (Haversine 50m Clustering)**: Merges distinct photo submissions within a 50-meter radius into a single active ticket while incrementing community upvotes.


* **📄 Dynamic PDF Work Order Service**: Generates official field maintenance PDFs via `ReportLab`.
* **📊 Analytics & Hotspot Tracking**: Real-time aggregation of active issues, category distributions, and top-priority geographic hotspots.

---

## 🛠️ Tech Stack

* **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
* **Database ORM**: [SQLAlchemy](https://www.sqlalchemy.org/)
* **Data Validation**: [Pydantic v2](https://www.google.com/search?q=https://docs.pydantic.dev/)
* **AI Engine**: Google Generative AI (`google-generativeai` / Gemini Flash)
* **Document Engine**: [ReportLab](https://www.reportlab.com/)
* **Image Processing**: Pillow (PIL)
* **Spatial Algorithms**: Custom Haversine Distance Calculator

---

## 📂 Project Directory Structure

```text
backend/
├── app/
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py             # App settings & environment variables
│   │   └── database.py           # SQLAlchemy session & database engine
│   ├── models/
│   │   ├── __init__.py
│   │   └── report_model.py       # Report SQLAlchemy database model
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── report_schema.py      # Pydantic models (Requests, Responses, Status Updates)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── ai_service.py         # Gemini Vision AI integration & retry handler
│   │   └── pdf_service.py        # Municipal work order PDF document generator
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── exif.py               # EXIF GPS metadata extractor
│   │   ├── geo.py                # Haversine spatial clustering algorithms
│   │   └── hashing.py            # Perceptual image hashing helpers
│   └── routers/
│       ├── __init__.py
│       ├── analytics.py          # Municipal metrics & hotspot endpoints
│       └── reports.py            # Core report CRUD & status sub-resource endpoints
├── uploads/                      # Local storage directory for user uploads
├── main.py                       # Application entrypoint, CORS, static mounts
├── requirements.txt              # Dependency specifications
└── .env.example                  # Environment configuration template

```

---

## ⚙️ Prerequisites & Setup

### Prerequisites

* **Python**: `3.10` or higher
* **Google Gemini API Key**: Obtainable via [Google AI Studio](https://aistudio.google.com/)

---

### Installation Steps

1. **Clone the Repository**
```bash
git clone https://github.com/your-username/snapfix-backend.git
cd snapfix-backend

```


2. **Create and Activate a Virtual Environment**
* **Linux/macOS:**
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


4. **Environment Configuration**
Create a `.env` file in the root directory:
```env
PROJECT_NAME="SnapFix AI Engine"
GEMINI_API_KEY="your_actual_gemini_api_key_here"
DATABASE_URL="sqlite:///./snapfix.db"

```


5. **Start the Development Server**
```bash
uvicorn main:app --reload --port 8000

```


* The API server will start at `[http://127.0.0.1:8000](http://127.0.0.1:8000)`
* OpenAPI Swagger documentation will be live at `[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)`



---

## 📡 API Reference Overview

### Core Endpoints Table

| Method | Endpoint | Description | Request Body / Query |
| --- | --- | --- | --- |
| `POST` | `/api/v1/reports/` | Submit image for AI analysis & cluster detection | `multipart/form-data` (`file`, `latitude`, `longitude`) |
| `GET` | `/api/v1/reports/` | Retrieve all submitted reports (sorted newest first) | None |
| `GET` | `/api/v1/reports/{id}` | Retrieve full details for a single report | Path Parameter (`id`) |
| `PATCH` | `/api/v1/reports/{id}/status` | Update issue workflow state (`OPEN`, `IN_PROGRESS`, `RESOLVED`) | `{"status": "IN_PROGRESS"}` |
| `GET` | `/api/v1/reports/{id}/pdf` | Download field work order PDF | Path Parameter (`id`) |
| `GET` | `/api/v1/analytics/` | Municipal stats, breakdown by category/status & hotspots | None |
| `GET` | `/health` | System and Database health check | None |

---

## 🧪 Testing & Interactive Documentation

### Interactive Swagger UI

Access the auto-generated interactive documentation by navigating to:

```text
http://127.0.0.1:8000/docs

```

### Quick Status Update Test via `cURL`

```bash
curl -X 'PATCH' \
  'http://127.0.0.1:8000/api/v1/reports/1/status' \
  -H 'Content-Type: application/json' \
  -d '{"status": "IN_PROGRESS"}'

```

---

## 📄 Documentation & Interactive API
Once the server is running, explore and test the endpoints directly using OpenAPI / Swagger UI:
* **Interactive Docs:** `http://localhost:8000/docs`
* **ReDoc Format:** `http://localhost:8000/redoc`