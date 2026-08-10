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


def get_monthly_user_metrics(
    db: Session,
    *,
    first_month_start: datetime,
    last_month_start: datetime,
    next_month_start: datetime,
):
    result = db.execute(
        text("""
            WITH months AS (
                SELECT generate_series(
                    CAST(:first_month_start AS timestamp),
                    CAST(:last_month_start AS timestamp),
                    INTERVAL '1 month'
                ) AS month_start
            ),
            new_users AS (
                SELECT date_trunc('month', created_at) AS month_start,
                       COUNT(*) AS new_users
                FROM users
                WHERE created_at >= :first_month_start
                  AND created_at < :next_month_start
                GROUP BY 1
            ),
            active_users AS (
                SELECT date_trunc('month', occurred_at)::timestamp AS month_start,
                       COUNT(DISTINCT user_id) AS active_users
                FROM user_activity_events
                WHERE occurred_at >= :first_month_start
                  AND occurred_at < :next_month_start
                GROUP BY 1
            )
            SELECT to_char(months.month_start, 'YYYY-MM') AS month,
                   COALESCE(new_users.new_users, 0) AS new_users,
                   COALESCE(active_users.active_users, 0) AS mau
            FROM months
            LEFT JOIN new_users ON new_users.month_start = months.month_start
            LEFT JOIN active_users ON active_users.month_start = months.month_start
            ORDER BY months.month_start
        """),
        {
            "first_month_start": first_month_start,
            "last_month_start": last_month_start,
            "next_month_start": next_month_start,
        },
    )
    return result.mappings().all()
