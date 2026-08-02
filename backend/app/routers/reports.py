import os
import uuid
from typing import List, Any
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.report_model import Report
from app.schemas.report_schema import ReportResponse,StatusUpdateRequest
# Import directly from ai_service
from app.services.ai_service import analyze_infrastructure_image as analyze_ai_image

from app.services.pdf_service import generate_report_pdf
from app.utils.exif import extract_exif_gps
from app.utils.geo import calculate_haversine_distance
from app.utils.hashing import generate_image_hash

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
DEDUPLICATION_RADIUS_METERS = 50.0  # 50 meters clustering threshold

ALLOWED_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB Limit


async def validate_and_read_image(file: UploadFile) -> bytes:
    """Validates image MIME type and 10MB size limit before returning bytes."""
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Only JPEG, PNG, and WEBP images are accepted."
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 10MB limit. Please upload a smaller photo."
        )

    return contents


def _get_field(obj: Any, key: str, default: Any) -> Any:
    """Safely reads attributes from either dicts or Pydantic/dataclass objects."""
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


@router.post("/", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    file: UploadFile = File(...),
    latitude: float | None = Form(None),
    longitude: float | None = Form(None),
    db: Session = Depends(get_db)
):
    # 0. Image Format & Size Validation
    contents = await validate_and_read_image(file)

    # 1. Generate Perceptual Image Hash
    img_hash = generate_image_hash(contents)

    # 2. Check for EXACT/NEAR-EXACT Image Hash Duplicate across database
    existing_hash_report = db.query(Report).filter(
        Report.image_hash == img_hash,
        Report.status != "RESOLVED"
    ).first()

    if existing_hash_report:
        current_upvotes = int(getattr(existing_hash_report, "upvotes", 1) or 1) + 1
        severity = int(getattr(existing_hash_report, "severity_score", 5) or 5)

        setattr(existing_hash_report, "upvotes", current_upvotes)
        setattr(existing_hash_report, "priority_score", severity + (current_upvotes - 1))

        db.commit()
        db.refresh(existing_hash_report)
        return existing_hash_report

    # 3. LOCATION LOGIC: Prioritize EXIF location from photo metadata
    exif_lat, exif_lon = extract_exif_gps(contents)

    if exif_lat is not None and exif_lon is not None:
        latitude, longitude = exif_lat, exif_lon

    # 4. Reject if no location could be determined
    if latitude is None or longitude is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No location data found in photo. Please allow location permissions or upload a photo taken with GPS enabled."
        )

    # 5. SPATIAL DE-DUPLICATION CHECK (50-meter radius)
    active_reports = db.query(Report).filter(Report.status != "RESOLVED").all()

    for existing_report in active_reports:
        existing_lat = float(getattr(existing_report, "latitude", 0.0))
        existing_lon = float(getattr(existing_report, "longitude", 0.0))

        dist = calculate_haversine_distance(
            latitude, longitude,
            existing_lat, existing_lon
        )

        if dist <= DEDUPLICATION_RADIUS_METERS:
            current_upvotes = int(getattr(existing_report, "upvotes", 1) or 1) + 1
            severity = int(getattr(existing_report, "severity_score", 5) or 5)

            setattr(existing_report, "upvotes", current_upvotes)
            setattr(existing_report, "priority_score", severity + (current_upvotes - 1))

            db.commit()
            db.refresh(existing_report)
            return existing_report

    # 6. Save uploaded image to local storage
    file_ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    image_url = f"/uploads/{unique_filename}"

    # 7. Analyze image using Vision AI Service
    mime_type = file.content_type or "image/jpeg"
    ai_result = analyze_ai_image(contents, mime_type)

    is_valid = _get_field(ai_result, "is_valid_civic_issue", True)
    category = _get_field(ai_result, "category", "Other")
    severity_score = int(_get_field(ai_result, "severity_score", 5))
    summary = str(_get_field(ai_result, "summary", "Infrastructure issue reported."))

    # 8. AI Guardrail: Reject non-civic photos
    if not is_valid:
        if os.path.exists(file_path):
            os.remove(file_path)

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded photo does not appear to contain a valid public civic infrastructure issue."
        )

    # 9. Save new unique report into Database
    new_report = Report(
        image_url=image_url,
        image_hash=img_hash,
        latitude=latitude,
        longitude=longitude,
        category=category,
        severity_score=severity_score,
        summary=summary,
        is_valid_civic_issue=is_valid,
        upvotes=1,
        priority_score=severity_score,
        status="OPEN"
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return new_report


def inspect_is_coroutine(fn: Any) -> bool:
    """Helper to check if AI function call is async or sync."""
    import asyncio
    return asyncio.iscoroutinefunction(fn)


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


@router.get("/{report_id}/pdf")
def download_report_pdf(report_id: int, db: Session = Depends(get_db)):
    """Generate and download an official municipal work order PDF for a report."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {report_id} not found."
        )

    pdf_bytes = generate_report_pdf(report)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=civic_work_order_{report_id}.pdf"
        }
    )

@router.patch("/{report_id}/status", response_model=ReportResponse)
def update_report_status(
    report_id: int,
    payload: StatusUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Update the operational status of a civic report (OPEN -> IN_PROGRESS -> RESOLVED).
    Transitions are unrestricted to allow reopening or status adjustments.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {report_id} not found."
        )

    report.status = payload.status # type: ignore
    db.commit()
    db.refresh(report)

    return report