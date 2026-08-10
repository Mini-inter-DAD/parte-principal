from datetime import datetime, timedelta, timezone
import hashlib
import secrets

from sqlalchemy.exc import SQLAlchemyError

from backend.repositories import admin_repository, metrics_repository
from backend.services.errors import BusinessRuleError
from backend.services.metrics_service import month_bounds
from backend.services.user_service import verify_password


ADMIN_SESSION_TTL = timedelta(hours=8)


def _normalize_username(username: str) -> str:
    return username.strip().lower()


def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def public_admin(admin) -> dict:
    return {
        "id": admin["id"],
        "username": admin["username"],
    }


def authenticate_admin(db, *, username: str, password: str):
    admin = admin_repository.get_admin_by_username(
        db,
        _normalize_username(username),
    )
    if (
        admin is None
        or not admin["is_active"]
        or not verify_password(password, admin["password_hash"])
    ):
        raise BusinessRuleError("Invalid username or password")

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + ADMIN_SESSION_TTL

    try:
        admin_repository.create_session(
            db,
            admin_id=admin["id"],
            token_hash=hash_session_token(token),
            expires_at=expires_at,
        )
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise

    return {
        "token": token,
        "admin": public_admin(admin),
    }


def logout_admin(db, *, token: str):
    try:
        admin_repository.revoke_session(db, hash_session_token(token))
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise


def get_user_metrics(db, *, month: str):
    month_start, next_month_start = month_bounds(month)
    return {
        "month": month,
        "new_users": metrics_repository.count_new_users(
            db,
            month_start=month_start,
            next_month_start=next_month_start,
        ),
        "mau": metrics_repository.count_mau(
            db,
            month_start=month_start,
            next_month_start=next_month_start,
        ),
    }


def _shift_month(month: str, offset: int) -> str:
    parsed = datetime.strptime(month, "%Y-%m")
    absolute_month = (parsed.year * 12) + parsed.month - 1 + offset
    year, month_index = divmod(absolute_month, 12)
    return f"{year:04d}-{month_index + 1:02d}"


def _last_complete_month() -> str:
    now = datetime.now(timezone.utc)
    current = f"{now.year:04d}-{now.month:02d}"
    return _shift_month(current, -1)


def get_user_dashboard(db, *, month: str):
    # Valida o formato do mês e obtém o intervalo usado nas consultas.
    selected_month_start, next_month_start = month_bounds(month)
    first_month_start = datetime.strptime(_shift_month(month, -7), "%Y-%m")
    history = metrics_repository.get_monthly_user_metrics(
        db,
        first_month_start=first_month_start,
        last_month_start=selected_month_start,
        next_month_start=next_month_start,
    )

    selected = history[-1]
    last_complete = _last_complete_month()
    available_months = [
        _shift_month(last_complete, offset)
        for offset in range(-11, 1)
    ]

    return {
        "monthlyActiveUsers": [
            {"label": item["month"], "value": item["mau"]}
            for item in history
        ],
        "usersCreated": [
            {"label": item["month"], "value": item["new_users"]}
            for item in history
        ],
        "activeUsersTotal": selected["mau"],
        "createdUsersTotal": selected["new_users"],
        "availableMonths": available_months,
    }


def list_users(db, *, month: str):
    month_start, next_month_start = month_bounds(month)
    return admin_repository.list_users_by_month(
        db,
        month_start=month_start,
        next_month_start=next_month_start,
    )
