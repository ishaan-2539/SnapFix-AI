from __future__ import annotations

from typing import Any


MAX_PRIORITY_SCORE = 10.0
MIN_PRIORITY_SCORE = 0.0


def _clamp_score(score: float) -> float:
    """Keep the final priority score within the SnapFix 0–10 range."""
    return round(
        max(MIN_PRIORITY_SCORE, min(MAX_PRIORITY_SCORE, score)),
        1,
    )


def _proximity_modifier(
    distance_meters: float | None,
    *,
    critical_distance: float,
    moderate_distance: float,
    critical_modifier: float,
    moderate_modifier: float,
) -> float:
    """
    Calculate a deterministic proximity modifier.

    Closer infrastructure receives a stronger modifier.
    Anything outside moderate_distance receives no modifier.
    """

    if distance_meters is None:
        return 0.0

    if distance_meters <= critical_distance:
        return critical_modifier

    if distance_meters <= moderate_distance:
        return moderate_modifier

    return 0.0


def calculate_priority_score(
    *,
    severity_score: int | float,
    spatial_context: dict[str, Any] | None = None,
    corroborating_reports: int = 1,
) -> dict[str, Any]:
    """
    Calculate SnapFix's deterministic contextual priority score.

    Gemini provides the visual severity score.
    This engine applies deterministic contextual modifiers.

    Final score is always normalized to 0–10.

    Returns both the final score and an audit-friendly
    breakdown of every modifier.
    """

    context = spatial_context or {}

    # --------------------------------------------------------------
    # 1. Base visual severity
    # --------------------------------------------------------------

    base_severity = float(severity_score)

    # Never allow malformed/excessive AI output to bypass our bounds.
    base_severity = max(0.0, min(10.0, base_severity))

    # --------------------------------------------------------------
    # 2. School proximity
    # --------------------------------------------------------------

    nearest_school = context.get("nearest_school") or {}

    school_distance = nearest_school.get("distance_meters")

    school_modifier = _proximity_modifier(
        school_distance,
        critical_distance=300.0,
        moderate_distance=750.0,
        critical_modifier=1.5,
        moderate_modifier=0.75,
    )

    # --------------------------------------------------------------
    # 3. Hospital proximity
    # --------------------------------------------------------------

    nearest_hospital = context.get("nearest_hospital") or {}

    hospital_distance = nearest_hospital.get("distance_meters")

    hospital_modifier = _proximity_modifier(
        hospital_distance,
        critical_distance=300.0,
        moderate_distance=750.0,
        critical_modifier=1.5,
        moderate_modifier=0.75,
    )

    # --------------------------------------------------------------
    # 4. Major road proximity / importance
    # --------------------------------------------------------------

    nearest_road = context.get("nearest_major_road") or {}

    road_distance = nearest_road.get("distance_meters")
    road_importance = nearest_road.get("road_importance", 0)

    try:
        road_importance = float(road_importance or 0)
    except (TypeError, ValueError):
        road_importance = 0.0

    road_modifier = 0.0

    if road_distance is not None and road_distance <= 150.0:
        if road_importance >= 5:
            road_modifier = 1.5
        elif road_importance >= 3:
            road_modifier = 1.0
        elif road_importance >= 1:
            road_modifier = 0.5

    elif road_distance is not None and road_distance <= 500.0:
        if road_importance >= 5:
            road_modifier = 1.0
        elif road_importance >= 3:
            road_modifier = 0.5


    additional_reports = max(corroborating_reports - 1, 0)

    density_bonus = min(
        additional_reports * 0.5,
        2.0,
    )

    # --------------------------------------------------------------
    # 5. Final deterministic score
    # --------------------------------------------------------------

    final_score = _clamp_score(
        base_severity
        + school_modifier
        + hospital_modifier
        + road_modifier
        +density_bonus
    )
    

    return {
        "priority_score": final_score,
        "breakdown": {
            "base_severity": round(base_severity, 1),
            "school_proximity": {
                "distance_meters": school_distance,
                "modifier": school_modifier,
            },
            "hospital_proximity": {
                "distance_meters": hospital_distance,
                "modifier": hospital_modifier,
            },
            "major_road_proximity": {
                "distance_meters": road_distance,
                "road_importance": road_importance,
                "modifier": road_modifier,
            },
            "community_corroboration": {
                "reports": corroborating_reports,
                "additional_reports": additional_reports,
                "modifier": density_bonus,
            }
        },
    }