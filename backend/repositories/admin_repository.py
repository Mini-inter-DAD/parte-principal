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


def list_users_by_month(
    db: Session,
    *,
    month_start: datetime,
    next_month_start: datetime,
):
    result = db.execute(
        text("""
            SELECT id, username, email, coins, created_at
            FROM users
            WHERE created_at >= :month_start
              AND created_at < :next_month_start
            ORDER BY created_at DESC, id DESC
        """),
        {
            "month_start": month_start,
            "next_month_start": next_month_start,
        },
    )
    return list(result.mappings().all())


def count_users(db: Session) -> int:
    result = db.execute(
        text("""
            SELECT COUNT(*)
            FROM users
        """)
    )
    return int(result.scalar_one())


def list_users_paginated(db: Session, *, limit: int, offset: int):
    result = db.execute(
        text("""
            SELECT id, username, email, coins, created_at
            FROM users
            ORDER BY created_at DESC, id DESC
            LIMIT :limit
            OFFSET :offset
        """),
        {"limit": limit, "offset": offset},
    )
    return list(result.mappings().all())


def revoke_session(db: Session, token_hash: str):
    db.execute(
        text("""
            UPDATE admin_sessions
            SET revoked_at = COALESCE(revoked_at, now())
            WHERE token_hash = :token_hash
        """),
        {"token_hash": token_hash},
    )
