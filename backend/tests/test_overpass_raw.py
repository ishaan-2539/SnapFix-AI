import httpx

from app.core.config import settings
from app.services.spatial_context_service import _build_overpass_query


LATITUDE = 28.628
LONGITUDE = 77.2185


query = _build_overpass_query(
    LATITUDE,
    LONGITUDE,
)

print("=" * 60)
print("RAW OVERPASS DIAGNOSTIC")
print("=" * 60)

print("\nEndpoint:")
print(settings.OVERPASS_API_URLS[0])

print("\nQuery:")
print(query)

print("\nSending request...\n")

timeout = httpx.Timeout(
    connect=10.0,
    read=30.0,
    write=10.0,
    pool=10.0,
)

response = httpx.post(
    settings.OVERPASS_API_URLS[0],
    data={"data": query},
    headers={
        "User-Agent": "SnapFix-AI/1.0",
        "Accept": "application/json",
    },
    timeout=timeout,
)

print("HTTP status:", response.status_code)

response.raise_for_status()

payload = response.json()

elements = payload.get("elements", [])

print("Number of raw elements:", len(elements))

print("\nFirst 10 raw elements:")
print("-" * 60)

for element in elements[:10]:
    print(element)

print("\n" + "=" * 60)
print("END DIAGNOSTIC")
print("=" * 60)