import os
import uuid
import json
from typing import List, Any
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
import logging
from app.services.storage_service import upload_report_image

from app.core.database import get_db
from app.models.report_model import Report
from app.schemas.report_schema import ReportResponse,StatusUpdateRequest
from app.services.spatial_context_service import fetch_spatial_context
from app.services.priority_engine import calculate_priority_score
# Import directly from ai_service
from app.services.ai_service import analyze_infrastructure_image as analyze_ai_image

from app.services.pdf_service import generate_report_pdf
from app.utils.exif import extract_exif_gps
from app.utils.geo import calculate_haversine_distance
from app.utils.hashing import generate_image_hash

router = APIRouter()

logger = logging.getLogger(__name__)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
DEDUPLICATION_RADIUS_METERS = 15.0  # 15 meters clustering threshold
MIN_SPATIAL_DEDUP_CONFIDENCE = 0.80

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
    # ------------------------------------------------------------------
    # Step 0: Image Format & Size Validation
    # ------------------------------------------------------------------
    contents = await validate_and_read_image(file)

    # ------------------------------------------------------------------
    # Step 1: Location Resolution (EXIF GPS or Client Fallback)
    # ------------------------------------------------------------------
    exif_lat, exif_lon = extract_exif_gps(contents)

    if exif_lat is not None and exif_lon is not None:
        latitude, longitude = exif_lat, exif_lon

    if latitude is None or longitude is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No location data found in photo. Please allow location permissions or upload a photo taken with GPS enabled."
        )

    # ------------------------------------------------------------------
    # Step 2: AI Inspection & Guardrail Gatekeeper
    # ------------------------------------------------------------------
    mime_type = file.content_type or "image/jpeg"
    ai_result = analyze_ai_image(contents, mime_type)

    is_valid = _get_field(
        ai_result,
        "is_valid_civic_issue",
        True
    )

    category = _get_field(
        ai_result,
        "category",
        "Other"
    )

    # Visual severity only.
    # Contextual priority will be calculated later in Phase 2.
    severity_score = int(
        _get_field(
            ai_result,
            "base_severity",
            3
        )
    )

    summary = str(
        _get_field(
            ai_result,
            "summary",
            "Infrastructure issue reported."
        )
    )

    # ---------------------------------------------------------
    # AI FORENSIC TELEMETRY
    # ---------------------------------------------------------

    ai_confidence = float(
        _get_field(
            ai_result,
            "confidence",
            0.5
        )
    )

    hazards = _get_field(
        ai_result,
        "hazards",
        []
    )

    affected_users = _get_field(
        ai_result,
        "affected_users",
        []
    )

    repair_complexity = str(
        _get_field(
            ai_result,
            "repair_complexity",
            "Moderate"
        )
    )

    recommended_action = str(
        _get_field(
            ai_result,
            "recommended_action",
            "Inspect and schedule appropriate municipal maintenance."
        )
    )

    # ---------------------------------------------------------
    # CONTEXTUAL PRIORITY ENGINE
    # ---------------------------------------------------------
    # Gemini determines visual severity.
    # SnapFix deterministically determines final priority
    # using real-world spatial context.

    spatial_context = fetch_spatial_context(
        latitude,
        longitude,
    )

    priority_result = calculate_priority_score(
        severity_score=severity_score,
        spatial_context=spatial_context,
    )

    priority_score = float(
        priority_result["priority_score"]
    )
    priority_breakdown_json = json.dumps(
        priority_result.get("breakdown", {})
    )
    print(
    "\n"
    "============================================================\n"
    "🔥 SNAPFIX PRIORITY ENGINE RESULT\n"
    "============================================================\n"
    f"Base severity:   {severity_score}\n"
    f"Final priority:  {priority_score}\n"
    f"Breakdown:       {priority_result.get('breakdown')}\n"
    "============================================================\n"
    )
    # PostgreSQL TEXT columns store these arrays as JSON strings.
    hazards_json = json.dumps(hazards)
    affected_users_json = json.dumps(affected_users)

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded photo does not appear to contain a valid public civic infrastructure issue."
        )

    # ------------------------------------------------------------------
    # Step 3: Generate Perceptual Image Hash
    # ------------------------------------------------------------------
    img_hash = generate_image_hash(contents)

    # ------------------------------------------------------------------
    # Step 4: Exact/Near-Exact Hash Deduplication (Same Hash)
    # ------------------------------------------------------------------
    existing_hash_report = db.query(Report).filter(
        Report.image_hash == img_hash,
        Report.status != "RESOLVED"
    ).first()

    if existing_hash_report:
        current_upvotes = int(
            getattr(existing_hash_report, "upvotes", 1) or 1
        ) + 1

        existing_severity = int(
            getattr(existing_hash_report, "severity_score", 5) or 5
        )

        existing_lat = float(
            getattr(existing_hash_report, "latitude", 0.0)
        )

        existing_lon = float(
            getattr(existing_hash_report, "longitude", 0.0)
        )

        existing_spatial_context = fetch_spatial_context(
            existing_lat,
            existing_lon,
        )

        priority_result = calculate_priority_score(
            severity_score=existing_severity,
            spatial_context=existing_spatial_context,
            corroborating_reports=current_upvotes,
        )

        setattr(
            existing_hash_report,
            "upvotes",
            current_upvotes,
        )

        setattr(
            existing_hash_report,
            "priority_score",
            float(priority_result["priority_score"]),
        )

        setattr(
            existing_hash_report,
            "priority_breakdown",
            json.dumps(priority_result["breakdown"]),
        )

        db.commit()
        db.refresh(existing_hash_report)

        return existing_hash_report

    # ------------------------------------------------------------------
    # Step 5: SPATIAL DE-DUPLICATION CHECK
    # ------------------------------------------------------------------
    # Only perform spatial clustering when the AI classification is
    # sufficiently confident. Low-confidence classifications are allowed
    # to become new reports rather than accidentally merging unrelated
    # incidents.

    if ai_confidence >= MIN_SPATIAL_DEDUP_CONFIDENCE:

        category_matched_reports = db.query(Report).filter(
            Report.status != "RESOLVED",
            Report.category == category
        ).all()

        for existing_report in category_matched_reports:
            existing_lat = float(getattr(existing_report, "latitude", 0.0))
            existing_lon = float(getattr(existing_report, "longitude", 0.0))

            dist = calculate_haversine_distance(
                latitude,
                longitude,
                existing_lat,
                existing_lon
            )

            if dist <= DEDUPLICATION_RADIUS_METERS:
                current_upvotes = int(
                    getattr(existing_report, "upvotes", 1) or 1
                ) + 1

                existing_severity = int(
                    getattr(existing_report, "severity_score", 5) or 5
                )

                existing_spatial_context = fetch_spatial_context(
                    existing_lat,
                    existing_lon,
                )

                priority_result = calculate_priority_score(
                    severity_score=existing_severity,
                    spatial_context=existing_spatial_context,
                    corroborating_reports=current_upvotes,
                )

                setattr(
                    existing_report,
                    "upvotes",
                    current_upvotes,
                )

                setattr(
                    existing_report,
                    "priority_score",
                    float(priority_result["priority_score"]),
                )

                setattr(
                    existing_report,
                    "priority_breakdown",
                    json.dumps(priority_result["breakdown"]),
                )

                db.commit()
                db.refresh(existing_report)

                return existing_report

    # ------------------------------------------------------------------
    # Step 6: Upload photo to Supabase Storage (Only for NEW unique issues)
    # ------------------------------------------------------------------
    file_ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"

    try:
        image_url = upload_report_image(contents, unique_filename, mime_type)
    except Exception as e:
        # Same philosophy as ai_service.py's fallback: a storage hiccup
        # should not take down report creation entirely. Fall back to
        # local disk so the demo keeps working; this copy just won't
        # survive a Render restart, same as before this fix.
        logger.error(f"Supabase Storage upload failed ({e}); falling back to local disk.")
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        with open(file_path, "wb") as f:
            f.write(contents)
        image_url = f"/uploads/{unique_filename}"

    # ------------------------------------------------------------------
    # Step 7: Create & Persist New Ticket
    # ------------------------------------------------------------------
    new_report = Report(
        image_url=image_url,
        image_hash=img_hash,
        latitude=latitude,
        longitude=longitude,

        category=category,

        # Visual severity from Gemini.
        # NOT final contextual priority.
        severity_score=severity_score,

        summary=summary,
        is_valid_civic_issue=is_valid,

        # AI forensic telemetry
        ai_confidence=ai_confidence,
        hazards=hazards_json,
        affected_users=affected_users_json,
        repair_complexity=repair_complexity,
        recommended_action=recommended_action,

        upvotes=1,

        # Final deterministic contextual priority.
        priority_score=priority_score,
        priority_breakdown=priority_breakdown_json,

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