import json

from app.services.spatial_context_service import fetch_spatial_context


# Central Delhi test coordinates.
LATITUDE = 28.628
LONGITUDE = 77.2185


if __name__ == "__main__":
    print("=" * 60)
    print("SnapFix AI — Spatial Context Engine Test")
    print("=" * 60)

    print(f"Latitude:  {LATITUDE}")
    print(f"Longitude: {LONGITUDE}")
    print()

    result = fetch_spatial_context(
        LATITUDE,
        LONGITUDE,
    )

    print(json.dumps(result, indent=2))

    print()
    print("=" * 60)

    if result["available"]:
        print("✅ Overpass spatial context fetch succeeded.")
    else:
        print("❌ Overpass spatial context fetch failed.")

    print("=" * 60)