import logging
import time
from typing import Any

import httpx

from app.core.config import settings
from app.utils.geo import calculate_haversine_distance

logger = logging.getLogger("snapfix_ai.spatial")

# These are the road classes we currently treat as
# higher-importance roads for civic prioritization.
MAJOR_ROAD_CLASSES = {
    "motorway": 5,
    "trunk": 5,
    "primary": 4,
    "secondary": 3,
    "tertiary": 2,
}

# Maximum number of nearby features returned per category.
MAX_FEATURES_PER_CATEGORY = 5


def _build_overpass_query(latitude: float, longitude: float) -> str:
    """
    Build a focused Overpass query around a single incident.

    We intentionally query only the infrastructure context
    relevant to SnapFix's priority engine:
      - schools
      - hospitals
      - major roads
    """

    radius = settings.OVERPASS_SEARCH_RADIUS_METERS

    return f"""
[out:json][timeout:15];

(
  nwr["amenity"="school"](around:{radius},{latitude},{longitude});
  nwr["amenity"="hospital"](around:{radius},{latitude},{longitude});

  way["highway"~"^(motorway|trunk|primary|secondary|tertiary)$"]
      (around:{radius},{latitude},{longitude});
);

out center tags;
"""


def _extract_coordinates(element: dict[str, Any]) -> tuple[float, float] | None:
    """
    Extract coordinates from an Overpass element.

    Nodes contain lat/lon directly.
    Ways and relations returned using `out center` contain
    a center object.
    """

    if element.get("type") == "node":
        lat = element.get("lat")
        lon = element.get("lon")

        if lat is not None and lon is not None:
            return float(lat), float(lon)

    center = element.get("center")

    if isinstance(center, dict):
        lat = center.get("lat")
        lon = center.get("lon")

        if lat is not None and lon is not None:
            return float(lat), float(lon)

    return None


def _classify_element(element: dict[str, Any]) -> str | None:
    """
    Convert raw OpenStreetMap tags into SnapFix context categories.
    """

    tags = element.get("tags") or {}

    if tags.get("amenity") == "school":
        return "school"

    if tags.get("amenity") == "hospital":
        return "hospital"

    highway = tags.get("highway")

    if highway in MAJOR_ROAD_CLASSES:
        return "major_road"

    return None


def _format_feature(
    element: dict[str, Any],
    feature_type: str,
    latitude: float,
    longitude: float,
) -> dict[str, Any] | None:
    """
    Convert an Overpass element into a compact SnapFix feature.
    """

    coordinates = _extract_coordinates(element)

    if coordinates is None:
        return None

    feature_lat, feature_lon = coordinates

    distance = calculate_haversine_distance(
        latitude,
        longitude,
        feature_lat,
        feature_lon,
    )

    tags = element.get("tags") or {}

    feature: dict[str, Any] = {
        "type": feature_type,
        "osm_type": element.get("type"),
        "osm_id": element.get("id"),
        "name": tags.get("name"),
        "distance_meters": round(distance, 1),
        "latitude": round(feature_lat, 7),
        "longitude": round(feature_lon, 7),
    }

    if feature_type == "major_road":
        highway = tags.get("highway")

        if isinstance(highway, str):
            feature["road_class"] = highway
            feature["road_importance"] = MAJOR_ROAD_CLASSES.get(highway, 0)
        else:
            feature["road_class"] = None
            feature["road_importance"] = 0

        if tags.get("ref"):
            feature["road_reference"] = tags.get("ref")
    return feature


def _empty_context(error: str | None = None) -> dict[str, Any]:
    """
    Safe fallback when the external spatial service is unavailable.

    Phase 2.2 will treat this as "no contextual evidence"
    rather than allowing an external API outage to break
    civic report submission.
    """

    result = {
        "available": False,
        "source": "OpenStreetMap / Overpass",
        "search_radius_meters": settings.OVERPASS_SEARCH_RADIUS_METERS,
        "nearby_schools": [],
        "nearby_hospitals": [],
        "nearby_major_roads": [],
        "nearest_school": None,
        "nearest_hospital": None,
        "nearest_major_road": None,
    }

    if error:
        result["error"] = error

    return result


def fetch_spatial_context(
    latitude: float,
    longitude: float,
) -> dict[str, Any]:
    """
    Fetch civic-context features around a report location.

    Returns nearby schools, hospitals and major roads sorted
    by distance from the incident.

    The function uses multiple Overpass endpoints for resilience.
    If one endpoint is unavailable, the next endpoint is attempted.

    This function intentionally does NOT calculate the final
    SnapFix priority score. That belongs to Phase 2.2.
    """

    query = _build_overpass_query(latitude, longitude)

    headers = {
        "User-Agent": "SnapFix-AI/1.0 (civic infrastructure research project)",
        "Accept": "application/json",
    }

    max_attempts_per_endpoint = 2

    for endpoint_index, endpoint_url in enumerate(
        settings.OVERPASS_API_URLS,
        start=1,
    ):
        for attempt in range(1, max_attempts_per_endpoint + 1):
            try:
                logger.info(
                    "Fetching spatial context from Overpass endpoint "
                    "%d/%d (attempt %d/%d): %s",
                    endpoint_index,
                    len(settings.OVERPASS_API_URLS),
                    attempt,
                    max_attempts_per_endpoint,
                    endpoint_url,
                )

                timeout = httpx.Timeout(
                    connect=settings.OVERPASS_CONNECT_TIMEOUT_SECONDS,
                    read=settings.OVERPASS_READ_TIMEOUT_SECONDS,
                    write=10.0,
                    pool=10.0,
                )

                with httpx.Client(
                    timeout=timeout,
                    headers=headers,
                ) as client:

                    response = client.post(
                        endpoint_url,
                        data={"data": query},
                    )

                # Temporary Overpass/server failures.
                if response.status_code in {429, 502, 503, 504}:

                    logger.warning(
                        "Overpass endpoint %s returned HTTP %s.",
                        endpoint_url,
                        response.status_code,
                    )

                    if attempt < max_attempts_per_endpoint:
                        wait_seconds = 1 * attempt

                        logger.info(
                            "Retrying same endpoint in %ss.",
                            wait_seconds,
                        )

                        time.sleep(wait_seconds)
                        continue

                    logger.warning(
                        "Endpoint %s exhausted retries. "
                        "Trying next Overpass endpoint.",
                        endpoint_url,
                    )

                    break

                response.raise_for_status()

                payload = response.json()
                elements = payload.get("elements", [])

                schools: list[dict[str, Any]] = []
                hospitals: list[dict[str, Any]] = []
                major_roads: list[dict[str, Any]] = []

                for element in elements:
                    feature_type = _classify_element(element)

                    if feature_type is None:
                        continue

                    feature = _format_feature(
                        element,
                        feature_type,
                        latitude,
                        longitude,
                    )

                    if feature is None:
                        continue

                    if feature_type == "school":
                        schools.append(feature)

                    elif feature_type == "hospital":
                        hospitals.append(feature)

                    elif feature_type == "major_road":
                        major_roads.append(feature)

                schools.sort(
                    key=lambda item: item["distance_meters"]
                )
                hospitals.sort(
                    key=lambda item: item["distance_meters"]
                )
                major_roads.sort(
                    key=lambda item: item["distance_meters"]
                )

                schools = schools[:MAX_FEATURES_PER_CATEGORY]
                hospitals = hospitals[:MAX_FEATURES_PER_CATEGORY]
                major_roads = major_roads[:MAX_FEATURES_PER_CATEGORY]

                logger.info(
                    "Spatial context fetched successfully from %s: "
                    "%d schools, %d hospitals, %d major roads.",
                    endpoint_url,
                    len(schools),
                    len(hospitals),
                    len(major_roads),
                )

                return {
                    "available": True,
                    "source": "OpenStreetMap / Overpass",
                    "search_radius_meters": (
                        settings.OVERPASS_SEARCH_RADIUS_METERS
                    ),

                    "nearby_schools": schools,
                    "nearby_hospitals": hospitals,
                    "nearby_major_roads": major_roads,

                    "nearest_school": (
                        schools[0] if schools else None
                    ),

                    "nearest_hospital": (
                        hospitals[0] if hospitals else None
                    ),

                    "nearest_major_road": (
                        major_roads[0]
                        if major_roads
                        else None
                    ),
                }

            except (httpx.TimeoutException, httpx.ConnectError) as exc:

                logger.warning(
                    "Overpass endpoint %s failed on attempt "
                    "%d/%d: %s",
                    endpoint_url,
                    attempt,
                    max_attempts_per_endpoint,
                    exc,
                )

                if attempt < max_attempts_per_endpoint:
                    wait_seconds = 1 * attempt

                    logger.info(
                        "Retrying endpoint in %ss.",
                        wait_seconds,
                    )

                    time.sleep(wait_seconds)
                    continue

                logger.warning(
                    "Endpoint %s exhausted retries. "
                    "Trying next endpoint.",
                    endpoint_url,
                )

                break

            except httpx.HTTPStatusError as exc:

                logger.error(
                    "Overpass HTTP error from %s: HTTP %s",
                    endpoint_url,
                    exc.response.status_code,
                )

                # Try the next endpoint rather than killing
                # the entire spatial-context operation.
                break

            except Exception as exc:

                logger.exception(
                    "Unexpected spatial context error from %s: %s",
                    endpoint_url,
                    exc,
                )

                # Unexpected failure on one endpoint should not
                # prevent another endpoint from being attempted.
                break

    # Every configured endpoint failed.
    return _empty_context(
        "All Overpass endpoints were temporarily unavailable."
    )