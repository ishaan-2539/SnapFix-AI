import math
from typing import Optional
from sqlalchemy.orm import Session
from app.models.report_model import Report


def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates the great-circle distance between two points on Earth in METERS.
    """
    R = 6371000.0  # Earth's radius in meters

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return R * c


def check_spatial_deduplication(
    db: Session, lat: float, lng: float, radius_meters: float = 50.0
) -> Optional[Report]:
    """
    Checks if an active (OPEN or IN_PROGRESS) report exists within `radius_meters` (default 50m).
    Returns the existing report if found within range, otherwise returns None.
    """
    active_reports = db.query(Report).filter(Report.status.in_(["OPEN", "IN_PROGRESS"])).all()

    for report in active_reports:
        # Safely extract latitude and longitude from SQLAlchemy model attributes
        rep_lat = float(getattr(report, "latitude", 0.0))
        rep_lng = float(getattr(report, "longitude", 0.0))

        distance = calculate_haversine_distance(lat, lng, rep_lat, rep_lng)
        if distance <= radius_meters:
            return report

    return None