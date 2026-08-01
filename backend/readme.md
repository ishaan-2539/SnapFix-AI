# 🏙️ CivicSense AI — Backend Engine

> **AI-Powered Civic Infrastructure Management & Spatial Deduplication API**
> 
> CivicSense AI bridges the gap between public reporting and municipal action using Vision AI, automated EXIF location extraction, dual-layer deduplication, and automated work-order generation.

---

## 🌟 Key Capabilities

* 🤖 **Groq Vision AI Analysis:** Automated classification, severity scoring (1–10), and actionable summary generation from uploaded infrastructure images.
* 📍 **EXIF Location Auto-Extraction:** Reads embedded GPS metadata from uploaded photo headers to pin the exact location where the photo was taken (with fallback support for home uploads).
* 📐 **50m Haversine Spatial Deduplication:** Calculates real-time geographical distance between reports. Nearby reports automatically increment upvotes and boost overall `priority_score` instead of cluttering the database with duplicates.
* 🖼️ **Perceptual Image Hashing (`dhash`):** File-level duplicate detection preventing identical re-uploads across varying location coordinates.
* 🛡️ **AI Non-Civic Spam Filter:** Auto-rejects non-civic photos (e.g., selfies, pets, random objects) and cleans up storage instantly.
* 📄 **Municipal Work Order PDF Engine:** Generates downloadable, print-ready PDF work orders complete with AI severity metrics, evidence thumbnails, and Google Maps links.
* 📊 **City Command Analytics:** Dedicated endpoints delivering high-level municipal statistics and geo-clustered map pin payloads optimized for frontend rendering.

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
* Groq API Key

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
Fill in your `GROQ_API_KEY` and PostgreSQL `DATABASE_URL`.

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
│   ├── services/       # Groq AI Vision & PDF Generator Services
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