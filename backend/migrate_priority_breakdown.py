from sqlalchemy import inspect, text

from app.core.database import engine


TABLE_NAME = "reports"

COLUMN_NAME = "priority_breakdown"
COLUMN_TYPE = "TEXT"


def migrate():
    inspector = inspect(engine)

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

    print("Connected to database successfully.")
    print(f"Existing columns in '{TABLE_NAME}':")

    for column in sorted(existing_columns):
        print(f"  - {column}")

    if COLUMN_NAME in existing_columns:
        print(f"\nAlready exists: {COLUMN_NAME}")
        return

    with engine.begin() as connection:
        sql = text(
            f'ALTER TABLE "{TABLE_NAME}" '
            f'ADD COLUMN "{COLUMN_NAME}" {COLUMN_TYPE}'
        )

        connection.execute(sql)

    print(f"\nAdded column: {COLUMN_NAME}")
    print("Priority breakdown migration complete.")


if __name__ == "__main__":
    migrate()