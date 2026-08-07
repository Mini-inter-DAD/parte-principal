from sqlalchemy import text
from sqlalchemy.orm import Session


def record_user_activity(db: Session, *, user_id: int, event_type: str):
    db.execute(
        text("""
            INSERT INTO user_activity_events (user_id, event_type)
            VALUES (:user_id, :event_type)
        """),
        {"user_id": user_id, "event_type": event_type},
    )
