from datetime import datetime

from sqlalchemy import text
from sqlalchemy.orm import Session


def get_admin_by_username(db: Session, username: str):
    result = db.execute(
        text("""
            SELECT id, username, password_hash, is_active
            FROM admins
            WHERE LOWER(username) = LOWER(:username)
        """),
        {"username": username},
    )
    return result.mappings().first()


def create_session(
    db: Session,
    *,
    admin_id: int,
    token_hash: str,
    expires_at: datetime,
):
    result = db.execute(
        text("""
            INSERT INTO admin_sessions (admin_id, token_hash, expires_at)
            VALUES (:admin_id, :token_hash, :expires_at)
            RETURNING id, admin_id, created_at, expires_at
        """),
        {
            "admin_id": admin_id,
            "token_hash": token_hash,
            "expires_at": expires_at,
        },
    )
    return result.mappings().one()


def get_active_admin_id_by_token_hash(db: Session, token_hash: str):
    result = db.execute(
        text("""
            SELECT s.admin_id
            FROM admin_sessions s
            JOIN admins a ON a.id = s.admin_id
            WHERE s.token_hash = :token_hash
              AND s.revoked_at IS NULL
              AND s.expires_at > now()
              AND a.is_active = TRUE
        """),
        {"token_hash": token_hash},
    )
    return result.scalar_one_or_none()


def revoke_session(db: Session, token_hash: str):
    db.execute(
        text("""
            UPDATE admin_sessions
            SET revoked_at = COALESCE(revoked_at, now())
            WHERE token_hash = :token_hash
        """),
        {"token_hash": token_hash},
    )
