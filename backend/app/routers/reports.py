import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.report_model import Report
from app.schemas.report_schema import ReportResponse
from app.services.ai_service import analyze_civic_image
from app.utils.exif import extract_exif_gps
from app.utils.geo import calculate_haversine_distance

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
DEDUPLICATION_RADIUS_METERS = 50.0  # 50 meters clustering threshold


@router.post("/", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    file: UploadFile = File(...),
    latitude: float | None = Form(None),
    longitude: float | None = Form(None),
    db: Session = Depends(get_db)
):
    contents = await file.read()

    # 1. LOCATION LOGIC: Prioritize EXIF location from the photo itself (for delayed gallery uploads)
    exif_lat, exif_lon = extract_exif_gps(contents)

    if exif_lat is not None and exif_lon is not None:
        # Photo contains original embedded GPS metadata
        latitude, longitude = exif_lat, exif_lon

    # 2. Reject if neither photo EXIF nor frontend form provided coordinates
    if latitude is None or longitude is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No location data found in photo. Please allow location permissions or upload a photo taken with GPS enabled."
        )

    # 3. SPATIAL DE-DUPLICATION CHECK (50-meter radius)
    active_reports = db.query(Report).filter(Report.status != "RESOLVED").all()
    
    for existing_report in active_reports:
        existing_lat = float(getattr(existing_report, "latitude"))
        existing_lon = float(getattr(existing_report, "longitude"))

        dist = calculate_haversine_distance(
            latitude, longitude, 
            existing_lat, existing_lon
        )
        
        if dist <= DEDUPLICATION_RADIUS_METERS:
            # Duplicate issue detected nearby! Increment upvotes and priority score instead
            current_upvotes = int(getattr(existing_report, "upvotes", 1) or 1) + 1
            severity = int(getattr(existing_report, "severity_score", 5) or 5)

            setattr(existing_report, "upvotes", current_upvotes)
            setattr(existing_report, "priority_score", severity + (current_upvotes - 1))
            
            db.commit()
            db.refresh(existing_report)
            return existing_report

    # 4. Save uploaded image to local storage
    file_ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    image_url = f"/uploads/{unique_filename}"

    # 5. Analyze image using Vision AI Service
    mime_type = file.content_type or "image/jpeg"
    ai_result = await analyze_civic_image(contents, mime_type)

    # 6. AI Guardrail: Reject non-civic photos
    if not ai_result.is_valid_civic_issue:
        if os.path.exists(file_path):
            os.remove(file_path)
            
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded photo does not appear to contain a valid public civic infrastructure issue."
        )

    # 7. Save new unique report into Database
    new_report = Report(
        image_url=image_url,
        latitude=latitude,
        longitude=longitude,
        category=ai_result.category,
        severity_score=ai_result.severity_score,
        summary=ai_result.summary,
        is_valid_civic_issue=ai_result.is_valid_civic_issue,
        upvotes=1,
        priority_score=ai_result.severity_score,
        status="OPEN"
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return new_report


@router.get("/", response_model=List[ReportResponse])
def get_all_reports(db: Session = Depends(get_db)):
    """Retrieve all submitted civic reports."""
    return db.query(Report).order_by(Report.id.desc()).all()


@router.get("/{report_id}", response_model=ReportResponse)
def get_report_by_id(report_id: int, db: Session = Depends(get_db)):
    """Retrieve a specific report by ID."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {report_id} not found."
        )
    return report