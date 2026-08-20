import os
import uuid
import json
import asyncio
import time
import math
from typing import List, Any
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
import logging
from app.services.storage_service import upload_report_image

from app.core.auth import require_municipal, get_current_user, get_current_user_optional
from app.core.database import get_db
from app.models.report_model import Report
from app.schemas.report_schema import ReportResponse, PaginatedReportResponse, StatusUpdateRequest
from app.services.spatial_context_service import fetch_spatial_context
from app.services.priority_engine import calculate_priority_score
from app.services.ai_service import analyze_infrastructure_image as analyze_ai_image

from app.services.pdf_service import generate_report_pdf
from app.utils.exif import extract_exif_gps
from app.utils.geo import calculate_haversine_distance
from app.utils.hashing import generate_image_hash, hash_distance

router = APIRouter()

logger = logging.getLogger("snapfix_ai.reports")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
DEDUPLICATION_RADIUS_METERS = 15.0  # 15 meters clustering threshold (Tier 2: category + radius)
MIN_SPATIAL_DEDUP_CONFIDENCE = 0.80

HASH_DEDUP_RADIUS_METERS = 30.0
HASH_DISTANCE_THRESHOLD = 10

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
    db: Session = Depends(get_db),
    user: dict | None = Depends(get_current_user_optional),
):
    reporter_id = user.get("sub") if user else None

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
    # Step 1b: Generate Perceptual Hash + Tier 1 Dedup (Hamming distance)
    # ------------------------------------------------------------------
    img_hash = generate_image_hash(contents)

    hash_candidates = db.query(Report).filter(
        Report.status != "RESOLVED",
        Report.image_hash.isnot(None),
    ).all()

    best_match = None
    best_distance = None

    for candidate in hash_candidates:
        candidate_hash = getattr(candidate, "image_hash", None)
        if not candidate_hash:
            continue

        existing_lat = float(getattr(candidate, "latitude", 0.0))
        existing_lon = float(getattr(candidate, "longitude", 0.0))

        dist_m = calculate_haversine_distance(
            latitude, longitude, existing_lat, existing_lon
        )
        if dist_m > HASH_DEDUP_RADIUS_METERS:
            continue

        try:
            h_dist = hash_distance(img_hash, candidate_hash)
        except ValueError:
            continue

        if h_dist <= HASH_DISTANCE_THRESHOLD:
            if best_distance is None or h_dist < best_distance:
                best_match = candidate
                best_distance = h_dist

    if best_match is not None:
        existing_hash_report = best_match

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
    # Step 2: AI Inspection + Spatial Context — run CONCURRENTLY.
    # ------------------------------------------------------------------
    mime_type = file.content_type or "image/jpeg"

    t0 = time.perf_counter()

    async def timed_ai():
        s = time.perf_counter()
        result = await asyncio.to_thread(analyze_ai_image, contents, mime_type)
        logger.debug("Gemini AI call took %.2fs", time.perf_counter() - s)
        return result

    async def timed_spatial():
        s = time.perf_counter()
        result = await asyncio.to_thread(fetch_spatial_context, latitude, longitude)
        logger.debug("Overpass spatial call took %.2fs", time.perf_counter() - s)
        return result

    ai_result, spatial_context = await asyncio.gather(timed_ai(), timed_spatial())

    t1 = time.perf_counter()
    logger.debug("AI + spatial context (parallel) took %.2fs", t1 - t0)

    is_valid = _get_field(ai_result, "is_valid_civic_issue", True)

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded photo does not appear to contain a valid public civic infrastructure issue."
        )

    category = _get_field(ai_result, "category", "Other")

    severity_score = int(_get_field(ai_result, "base_severity", 3))

    summary = str(_get_field(ai_result, "summary", "Infrastructure issue reported."))

    ai_confidence = float(_get_field(ai_result, "confidence", 0.5))

    hazards = _get_field(ai_result, "hazards", [])

    affected_users = _get_field(ai_result, "affected_users", [])

    repair_complexity = str(_get_field(ai_result, "repair_complexity", "Moderate"))

    recommended_action = str(
        _get_field(
            ai_result,
            "recommended_action",
            "Inspect and schedule appropriate municipal maintenance."
        )
    )

    t2 = time.perf_counter()

    priority_result = calculate_priority_score(
        severity_score=severity_score,
        spatial_context=spatial_context,
    )

    t3 = time.perf_counter()
    logger.debug("Priority engine calc took %.4fs", t3 - t2)
    logger.debug("TOTAL request time so far: %.2fs", t3 - t0)

    priority_score = float(priority_result["priority_score"])
    priority_breakdown_json = json.dumps(priority_result.get("breakdown", {}))

    logger.debug(
        "Priority Engine Result: base_severity=%s, priority_score=%s, breakdown=%s",
        severity_score,
        priority_score,
        priority_result.get("breakdown")
    )

    hazards_json = json.dumps(hazards)
    affected_users_json = json.dumps(affected_users)

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

                setattr(existing_report, "upvotes", current_upvotes)
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

    file_ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"

    try:
        image_url = upload_report_image(contents, unique_filename, mime_type)
    except Exception as e:
        logger.error("Supabase Storage upload failed (%s); falling back to local disk.", e)
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        with open(file_path, "wb") as f:
            f.write(contents)
        image_url = f"/uploads/{unique_filename}"

    new_report = Report(
        image_url=image_url,
        image_hash=img_hash,
        latitude=latitude,
        longitude=longitude,
        reporter_id=reporter_id,
        category=category,
        severity_score=severity_score,
        summary=summary,
        is_valid_civic_issue=is_valid,
        ai_confidence=ai_confidence,
        hazards=hazards_json,
        affected_users=affected_users_json,
        repair_complexity=repair_complexity,
        recommended_action=recommended_action,
        upvotes=1,
        priority_score=priority_score,
        priority_breakdown=priority_breakdown_json,
        status="OPEN"
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return new_report


@router.get("/", response_model=PaginatedReportResponse)
def get_all_reports(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """Retrieve submitted civic reports with pagination."""
    total = db.query(Report).count()
    pages = math.ceil(total / size) if total > 0 else 0
    offset = (page - 1) * size

    items = (
        db.query(Report)
        .order_by(Report.id.desc())
        .offset(offset)
        .limit(size)
        .all()
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": pages,
    }


@router.get("/mine", response_model=List[ReportResponse])
def get_my_reports(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Retrieve reports submitted by the currently authenticated citizen."""
    reporter_id = user.get("sub")
    return (
        db.query(Report)
        .filter(Report.reporter_id == reporter_id)
        .order_by(Report.id.desc())
        .all()
    )


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
    db: Session = Depends(get_db),
    _user: dict = Depends(require_municipal),
):
    """
    Update the operational status of a civic report (OPEN -> IN_PROGRESS -> RESOLVED).
    Restricted to municipal_staff accounts — enforced via JWT role claim.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {report_id} not found."
        )

    report.status = payload.status  # type: ignore
    db.commit()
    db.refresh(report)

    return report