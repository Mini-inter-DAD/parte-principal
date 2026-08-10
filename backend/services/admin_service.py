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
