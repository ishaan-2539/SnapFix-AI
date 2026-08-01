# 📸 SnapFix AI

> **AI-Powered Civic Infrastructure Reporting and Work Order Automation Backend with Spatial Deduplication API**
> 
> SnapFix AI bridges the gap between public reporting and municipal action using Vision AI, automated EXIF location extraction, dual-layer deduplication, and automated work-order generation.

---

## 🌟 Key Capabilities

* 🤖 **Gemini 2.5 Flash Vision AI:** Automated classification into standard municipal categories, hazard severity scoring (1–10), and actionable work order summary generation directly from uploaded infrastructure photos.
* ⚡ **Zero-Downtime Demo Failsafe:** Built-in resilience layer that catches API rate limits, quota caps, or network timeouts and seamlessly injects fallback inspection data—guaranteeing 100% backend uptime during live pitches.
* 📍 **EXIF Location Auto-Extraction:** Reads embedded GPS metadata from uploaded photo headers to pin the exact defect location (with fallback support for custom user inputs).
* 📐 **50m Haversine Spatial Deduplication:** Calculates real-time geographical distance between reports. Nearby reports automatically increment upvotes and boost overall `priority_score` instead of cluttering the database with duplicate entries.
* 🖼️ **Perceptual Image Hashing (dHash):** File-level duplicate detection preventing identical image re-uploads across varying location coordinates.
* 🛡️ **AI Non-Civic Spam Filter:** Auto-rejects non-civic photos (e.g., selfies, pets, random objects) using AI validation guardrails, keeping storage and database records clean.
* 📄 **Municipal Work Order PDF Engine:** Generates downloadable, print-ready PDF work orders complete with AI severity metrics, evidence thumbnails, and direct Google Maps location links.
* 📊 **City Command Analytics:** Dedicated endpoints delivering high-level municipal statistics, triage priorities, and geo-clustered map pin payloads optimized for frontend dashboards.

---

## 🏗️ Architecture Overview

```text
               +---------------------------+
               |   Citizen Photo Upload    |
               +-------------+-------------+
                             |
                             v
               +-------------+-------------+
               |  Perceptual Image Hash    | ---> [Duplicate Hash?] --> Upvote Existing
               +-------------+-------------+
                             |
                             v
               +-------------+-------------+
               |  EXIF / GPS Auto-Extract  |
               +-------------+-------------+
                             |
                             v
               +-------------+-------------+
               |  50m Haversine Clustering | ---> [Within 50m?] ------> Upvote Existing
               +-------------+-------------+
                             |
                             v
               +-------------+-------------+
               |   Groq Vision AI Engine   |
               +-------------+-------------+
                             |
            +----------------+----------------+
            |                                 |
   [Is Valid Civic Issue?]          [Not Valid Civic Issue?]
            |                                 |
            v                                 v
   +--------+--------+               +--------+--------+
   | DB Entry Created|               | Reject & Clean  |
   | Status: OPEN    |               | Storage (400)   |
   +-----------------+               +-----------------+
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
* Python 3.10+
* PostgreSQL Database (e.g., Supabase)
* Gemini API Key

### 2. Environment Setup
Clone the repository and navigate to the backend directory:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Environment Variables
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```
Fill in your `GEMINI_API_KEY` and PostgreSQL `DATABASE_URL`.

### 4. Running the Server
Start the development server with Uvicorn:
```bash
uvicorn app.main:app --reload
```
The server will start at `http://localhost:8000`.

---

## 📑 API Reference Table

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/reports/` | Upload civic issue photo with location fallback & AI verification |
| `GET` | `/api/v1/reports/` | List all active civic reports |
| `GET` | `/api/v1/reports/{id}` | Get detailed report data by ID |
| `GET` | `/api/v1/reports/{id}/pdf` | Download official municipal work order PDF |
| `GET` | `/api/v1/analytics/stats` | Retrieve aggregated city statistics & category breakdown |
| `GET` | `/api/v1/analytics/map-pins` | Get lightweight geo-payload for interactive map pins |

---

## 🛠️ Project Structure

```text
backend/
├── app/
│   ├── core/           # Config & Database Session Management
│   ├── models/         # SQLAlchemy ORM Models
│   ├── routers/        # API Endpoints (Reports & Analytics)
│   ├── schemas/        # Pydantic Schemas
│   ├── services/       # Gemini Flash & PDF Generator Services
│   ├── utils/          # EXIF Parsing, Haversine Math & Image Hashing
│   └── main.py         # Application Entry Point
├── uploads/            # Static File Storage
├── .env.example        # Environment Variable Template
├── requirements.txt    # Production Dependencies
└── README.md           # Documentation
```

---

## 📄 Documentation & Interactive API
Once the server is running, explore and test the endpoints directly using OpenAPI / Swagger UI:
* **Interactive Docs:** `http://localhost:8000/docs`
* **ReDoc Format:** `http://localhost:8000/redoc`