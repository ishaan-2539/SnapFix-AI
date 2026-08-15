from sqlalchemy import inspect, text

from app.core.database import engine


TABLE_NAME = "reports"

COLUMNS = {
    "ai_confidence": "DOUBLE PRECISION",
    "hazards": "TEXT",
    "affected_users": "TEXT",
    "repair_complexity": "VARCHAR(50)",
    "recommended_action": "TEXT",
}


def migrate():
    inspector = inspect(engine)

    # Verify the table actually exists.
    tables = inspector.get_table_names()

    if TABLE_NAME not in tables:
        raise RuntimeError(
            f"Table '{TABLE_NAME}' does not exist in the connected database. "
            f"Available tables: {tables}"
        )

    existing_columns = {
        column["name"]
        for column in inspector.get_columns(TABLE_NAME)
    }

    print(f"Connected to database successfully.")
    print(f"Existing columns in '{TABLE_NAME}':")
    for column in sorted(existing_columns):
        print(f"  - {column}")

    with engine.begin() as connection:
        for column_name, column_type in COLUMNS.items():

            if column_name in existing_columns:
                print(f"Already exists: {column_name}")
                continue

            sql = text(
                f'ALTER TABLE "{TABLE_NAME}" '
                f'ADD COLUMN "{column_name}" {column_type}'
            )

            connection.execute(sql)

            print(f"Added column: {column_name}")

    print("\nForensic telemetry migration complete.")


if __name__ == "__main__":
    migrate()