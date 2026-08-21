import os
import uuid
import json
import asyncio
import time
from typing import List, Any
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
import logging
from app.services.storage_service import upload_report_image

from app.core.auth import require_municipal, get_current_user, get_current_user_optional
from app.core.database import get_db
from app.models.report_model import Report
from app.schemas.report_schema import ReportResponse, StatusUpdateRequest, PaginatedReportResponse
from app.services.spatial_context_service import fetch_spatial_context
from app.services.priority_engine import calculate_priority_score
# Import directly from ai_service
from app.services.ai_service import analyze_infrastructure_image as analyze_ai_image

from app.services.pdf_service import generate_report_pdf
from app.utils.exif import extract_exif_gps
from app.utils.geo import calculate_haversine_distance
from app.utils.hashing import generate_image_hash, hash_distance

router = APIRouter()

logger = logging.getLogger(__name__)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
DEDUPLICATION_RADIUS_METERS = 15.0  # 15 meters clustering threshold (Tier 2: category + radius)
MIN_SPATIAL_DEDUP_CONFIDENCE = 0.80

# Tier 1: perceptual-hash dedup.
#
# The allowed GPS radius now SCALES with how strong the hash match is,
# instead of a single flat cutoff. Rationale: a near-exact visual match
# (same photo, same pothole, same angle) is very strong evidence on its
# own and should tolerate more GPS drift than a borderline match does.
# Consumer/phone GPS in dense urban areas (tall buildings blocking sky
# view) commonly drifts 30-50m+, so a flat 30m radius was rejecting
# legitimate exact-hash duplicates (see report #21 vs #22 — hash distance
# 0, GPS 30.84m apart, flat 30m cutoff silently skipped the match).
#
# dhash is a 64-bit hash. Lower Hamming distance = more visually similar;
# 0 = pixel-identical hash.
HASH_DISTANCE_THRESHOLD = 10  # anything above this is never considered a match, regardless of distance

# Tiers are checked in order from tightest hash-match requirement to
# loosest. Each tuple is (max_hash_distance, allowed_radius_meters).
# Must stay sorted by max_hash_distance ascending.
HASH_DEDUP_TIERS: list[tuple[int, float]] = [
    (3, 100.0),   # near-exact / identical image -> tolerate significant GPS drift
    (6, 65.0),    # strong match -> moderate drift allowed
    (10, 50.0),   # borderline match (still <= HASH_DISTANCE_THRESHOLD) -> tighter radius
]

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


def _spatial_context_from_stored_breakdown(existing_report: Any) -> dict[str, Any]:
    """
    Rebuild a spatial_context-shaped dict from a report's already-computed
    priority_breakdown, instead of re-querying the live Overpass API.

    Why this exists: the dedup path (Tier 1 hash match, Tier 2 category+radius
    match) used to call fetch_spatial_context(existing_lat, existing_lon) again
    every time a duplicate came in, purely to re-run calculate_priority_score()
    with an updated corroboration count. But the existing report's location
    never changes, so its nearby schools/hospitals/roads are IDENTICAL to what
    was already fetched and stored in priority_breakdown when it was first
    created — that live network call was 100% redundant work on every dupe hit.

    Worse, it was a *synchronous* httpx call (not wrapped in asyncio.to_thread
    like the create-path calls are), so it blocked the whole event loop —
    worst case ~(3s connect + 6s read) x 2 retries x 2 endpoints ≈ 36 seconds
    where the ENTIRE API is frozen for every user, not just this request.
    This is almost certainly what's been making dedup feel slow/inconsistent.

    Reconstructing from the stored breakdown makes duplicate submissions
    resolve near-instantly with zero external calls.
    """
    try:
        breakdown = json.loads(
            getattr(existing_report, "priority_breakdown", None) or "{}"
        )
    except (TypeError, ValueError):
        breakdown = {}

    school = breakdown.get("school_proximity") or {}
    hospital = breakdown.get("hospital_proximity") or {}
    road = breakdown.get("major_road_proximity") or {}

    return {
        "nearest_school": (
            {"distance_meters": school.get("distance_meters")}
            if school.get("distance_meters") is not None
            else None
        ),
        "nearest_hospital": (
            {"distance_meters": hospital.get("distance_meters")}
            if hospital.get("distance_meters") is not None
            else None
        ),
        "nearest_major_road": (
            {
                "distance_meters": road.get("distance_meters"),
                "road_importance": road.get("road_importance", 0),
            }
            if road.get("distance_meters") is not None
            else None
        ),
    }


@router.post("/", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    file: UploadFile = File(...),
    latitude: float | None = Form(None),
    longitude: float | None = Form(None),
    db: Session = Depends(get_db),
    user: dict | None = Depends(get_current_user_optional),
):
    # None for guest/anonymous submissions — the frontend's axios interceptor
    # only attaches a token when a Supabase session exists, so this is None
    # for anyone not logged in. Never required.
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
    #
    # Runs BEFORE the AI/spatial calls on purpose: if this photo is a
    # near-duplicate of an open report nearby, we bump corroboration and
    # return immediately — Gemini and Overpass never get called for it.
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

        # Check the hash FIRST — it's cheap, has nothing to do with GPS,
        # and tells us which radius tier even applies. Gating on distance
        # before this (the old behavior) meant a perfect hash match could
        # be discarded before it was ever compared, just for landing a
        # few meters past a flat cutoff.
        try:
            h_dist = hash_distance(img_hash, candidate_hash)
        except ValueError:
            # Malformed/legacy hash string — skip rather than fail the request.
            continue

        if h_dist > HASH_DISTANCE_THRESHOLD:
            continue

        # Find the tightest tier this hash distance qualifies for, and use
        # its allowed radius. HASH_DEDUP_TIERS is sorted ascending by
        # max_hash_distance, so the first match is the correct (narrowest
        # applicable) tier.
        allowed_radius = next(
            (radius for max_h_dist, radius in HASH_DEDUP_TIERS if h_dist <= max_h_dist),
            None,
        )
        if allowed_radius is None:
            # Shouldn't happen given HASH_DISTANCE_THRESHOLD == the tiers'
            # max, but fail safe rather than dedup with an undefined radius.
            continue

        existing_lat = float(getattr(candidate, "latitude", 0.0))
        existing_lon = float(getattr(candidate, "longitude", 0.0))

        dist_m = calculate_haversine_distance(
            latitude, longitude, existing_lat, existing_lon
        )
        if dist_m > allowed_radius:
            continue

        # Prefer the closer VISUAL match first (lower h_dist), then the
        # closer physical match as a tiebreaker.
        if (
            best_distance is None
            or h_dist < best_distance[0]
            or (h_dist == best_distance[0] and dist_m < best_distance[1])
        ):
            best_match = candidate
            best_distance = (h_dist, dist_m)

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

        # No live Overpass call here — reuse the spatial data that was
        # already fetched and stored when this report was first created.
        existing_spatial_context = _spatial_context_from_stored_breakdown(
            existing_hash_report
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
    # Neither depends on the other's output, so no reason to serialize them.
    # Skipped entirely above for anything that matched Tier 1.
    # ------------------------------------------------------------------
    mime_type = file.content_type or "image/jpeg"

    t0 = time.perf_counter()

    async def timed_ai():
        s = time.perf_counter()
        result = await asyncio.to_thread(analyze_ai_image, contents, mime_type)
        print(f"⏱️  Gemini AI call took {time.perf_counter() - s:.2f}s")
        return result

    async def timed_spatial():
        s = time.perf_counter()
        result = await asyncio.to_thread(fetch_spatial_context, latitude, longitude)
        print(f"⏱️  Overpass spatial call took {time.perf_counter() - s:.2f}s")
        return result

    ai_result, spatial_context = await asyncio.gather(timed_ai(), timed_spatial())

    t1 = time.perf_counter()
    print(f"⏱️  AI + spatial context (parallel) took {t1 - t0:.2f}s")

    is_valid = _get_field(
        ai_result,
        "is_valid_civic_issue",
        True
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded photo does not appear to contain a valid public civic infrastructure issue."
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
    # spatial_context was already fetched above in parallel with the AI call.

    t2 = time.perf_counter()

    priority_result = calculate_priority_score(
        severity_score=severity_score,
        spatial_context=spatial_context,
    )

    t3 = time.perf_counter()
    print(f"⏱️  Priority engine calc took {t3 - t2:.4f}s (should be near-instant)")
    print(f"⏱️  TOTAL request time so far: {t3 - t0:.2f}s")

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

    # ------------------------------------------------------------------
    # Step 5: SPATIAL DE-DUPLICATION CHECK (Tier 2 — category + radius)
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

                # Same fix as Tier 1 above: reuse the already-stored spatial
                # data instead of re-hitting Overpass synchronously.
                existing_spatial_context = _spatial_context_from_stored_breakdown(
                    existing_report
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
        reporter_id=reporter_id,

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


@router.get("/", response_model=PaginatedReportResponse)
def get_all_reports(
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
):
    """
    Retrieve all submitted civic reports, paginated.

    The frontend (`api.listReports()`) has always requested `page`/`size`
    query params and unwrapped a `{ items, total, page, size, pages }`
    envelope via `PaginatedReportResponse` — this route previously ignored
    both params and returned a bare list, so `data.items` was always
    `undefined` on the client and every caller silently got no reports
    (or crashed, where the caller didn't guard against it).
    """
    page = max(page, 1)
    size = max(min(size, 100), 1)  # guard against 0/negative/absurdly large page sizes

    base_query = db.query(Report).order_by(Report.id.desc())

    total = base_query.count()
    pages = max((total + size - 1) // size, 1)

    items = (
        base_query
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    return PaginatedReportResponse(
        items=items, # type: ignore[arg-type]
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get("/mine", response_model=List[ReportResponse])
def get_my_reports(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """
    Retrieve reports submitted by the currently authenticated citizen.
    Requires login — there's no reporter_id to scope to for guests, who
    keep using the localStorage-tracked list on the frontend instead.

    NOTE: this route must stay registered before /{report_id} below —
    otherwise FastAPI tries to parse "mine" as the int report_id and
    returns a 422 instead of ever reaching this handler.
    """
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