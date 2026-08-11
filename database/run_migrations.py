"""Apply additive database migrations required by the running backend."""

from pathlib import Path

from database.connection import engine


MIGRATIONS_DIR = Path(__file__).resolve().parent
MIGRATION_FILES = ("draft_migration.sql",)


def main() -> None:
    with engine.begin() as connection:
        for filename in MIGRATION_FILES:
            migration_path = MIGRATIONS_DIR / filename
            sql = migration_path.read_text(encoding="utf-8")
            connection.exec_driver_sql(sql)
            print(f"Migração aplicada: {filename}")


if __name__ == "__main__":
    main()
