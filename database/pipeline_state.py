from sqlalchemy import text

CREATE_TABLE_SQL = """
    CREATE TABLE IF NOT EXISTS pipeline_state (
        step         VARCHAR(50) PRIMARY KEY,
        fingerprint  TEXT NOT NULL,
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )
"""


def ensure_table(conn) -> None:
    conn.execute(text(CREATE_TABLE_SQL))


def read_state(conn) -> dict:
    ensure_table(conn)
    rows = conn.execute(text("SELECT step, fingerprint FROM pipeline_state")).all()
    return {step: fingerprint for step, fingerprint in rows}


def write_state(conn, state: dict) -> None:
    ensure_table(conn)
    for step, fingerprint in state.items():
        conn.execute(
            text("""
                INSERT INTO pipeline_state (step, fingerprint)
                VALUES (:step, :fingerprint)
                ON CONFLICT (step) DO UPDATE
                SET fingerprint = EXCLUDED.fingerprint,
                    updated_at = now()
            """),
            {"step": step, "fingerprint": fingerprint},
        )
