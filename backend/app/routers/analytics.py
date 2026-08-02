from typing import Any, Dict, List
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.report_model import Report

router = APIRouter()


@router.get("/stats", response_model=Dict[str, Any])
def get_city_analytics(db: Session = Depends(get_db)):
    """
    Returns high-level summary statistics for the municipal overview dashboard.
    """
    total_reports = db.query(Report).count()
    open_reports = db.query(Report).filter(Report.status == "OPEN").count()
    in_progress_reports = db.query(Report).filter(Report.status == "IN_PROGRESS").count()
    resolved_reports = db.query(Report).filter(Report.status == "RESOLVED").count()

    # Calculate average severity score safely
    avg_severity_query = db.query(func.avg(Report.severity_score)).scalar()
    avg_severity = round(float(avg_severity_query), 2) if avg_severity_query is not None else 0.0

    # Category breakdown query
    category_counts = (
        db.query(Report.category, func.count(Report.id))
        .group_by(Report.category)
        .all()
    )
    
    category_breakdown = {cat: count for cat, count in category_counts if cat}

    return {
        "total_reports": total_reports,
        "open_reports": open_reports,
        "in_progress_reports": in_progress_reports,
        "resolved_reports": resolved_reports,
        "average_severity_score": avg_severity,
        "category_breakdown": category_breakdown
    }


@router.get("/map-pins", response_model=List[Dict[str, Any]])
def get_map_pins(db: Session = Depends(get_db)):
    """
    Returns lightweight report payloads tailored for frontend map libraries (Leaflet / Mapbox).
    """
    reports = db.query(Report).order_by(Report.priority_score.desc()).all()
    
    pins = []
    for report in reports:
        pins.append({
            "id": getattr(report, "id"),
            "latitude": float(getattr(report, "latitude", 0.0) or 0.0),
            "longitude": float(getattr(report, "longitude", 0.0) or 0.0),
            "category": str(getattr(report, "category", "")),
            "severity_score": int(getattr(report, "severity_score", 0) or 0),
            "priority_score": int(getattr(report, "priority_score", 0) or 0),
            "upvotes": int(getattr(report, "upvotes", 1) or 1),
            "status": str(getattr(report, "status", "OPEN")),
            "summary": str(getattr(report, "summary", "")),
            "image_url": str(getattr(report, "image_url", "") or "")
        })

    return pins