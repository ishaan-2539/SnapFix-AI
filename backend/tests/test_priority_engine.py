from app.services.priority_engine import calculate_priority_score


def print_test(name: str, result: dict) -> None:
    print("\n" + "=" * 60)
    print(name)
    print("=" * 60)

    print(f"Final priority: {result['priority_score']}")

    breakdown = result["breakdown"]

    print(f"Base severity: {breakdown['base_severity']}")

    print(
        "School modifier:",
        breakdown["school_proximity"]["modifier"],
    )

    print(
        "Hospital modifier:",
        breakdown["hospital_proximity"]["modifier"],
    )

    print(
        "Road modifier:",
        breakdown["major_road_proximity"]["modifier"],
    )


# --------------------------------------------------------------
# Test 1 — Small pothole on a quiet road
# --------------------------------------------------------------

test_1 = calculate_priority_score(
    severity_score=3,
    spatial_context={
        "nearest_school": None,
        "nearest_hospital": None,
        "nearest_major_road": None,
    },
)

print_test(
    "TEST 1 — Small pothole / no sensitive context",
    test_1,
)


# --------------------------------------------------------------
# Test 2 — Severe issue near hospital + major road
# --------------------------------------------------------------

test_2 = calculate_priority_score(
    severity_score=5,
    spatial_context={
        "nearest_school": None,
        "nearest_hospital": {
            "distance_meters": 137.4,
        },
        "nearest_major_road": {
            "distance_meters": 89.8,
            "road_importance": 3,
        },
    },
)

print_test(
    "TEST 2 — Severe issue / hospital + major road",
    test_2,
)


# --------------------------------------------------------------
# Test 3 — Moderate issue near school
# --------------------------------------------------------------

test_3 = calculate_priority_score(
    severity_score=4,
    spatial_context={
        "nearest_school": {
            "distance_meters": 200,
        },
        "nearest_hospital": None,
        "nearest_major_road": None,
    },
)

print_test(
    "TEST 3 — Moderate issue / near school",
    test_3,
)