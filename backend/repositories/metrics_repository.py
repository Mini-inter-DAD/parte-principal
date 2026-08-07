from datetime import datetime

from sqlalchemy import text
from sqlalchemy.orm import Session


def count_new_users(
    db: Session,
    *,
    month_start: datetime,
    next_month_start: datetime,
) -> int:
    result = db.execute(
        text("""
            SELECT COUNT(*)
            FROM users
            WHERE created_at >= :month_start
              AND created_at < :next_month_start
        """),
        {
            "month_start": month_start,
            "next_month_start": next_month_start,
        },
    )
    return result.scalar_one()

def count_mau(
    db: Session,
    *,
    month_start: datetime,
    next_month_start: datetime,
) -> int:
    result = db.execute(
        text("""
            SELECT COUNT(DISTINCT user_id)
            FROM user_activity_events
            WHERE occurred_at >= :month_start
              AND occurred_at < :next_month_start
        """),
        {
            "month_start": month_start,
            "next_month_start": next_month_start,
        },
    )
    return result.scalar_one()
