from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from backend.repositories import admin_repository
from backend.services.admin_service import hash_session_token
from backend.services import admin_service, user_service
from backend.services.errors import BusinessRuleError
from database.connection import get_db


def current_user_id(authorization: str | None = Header(default=None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = authorization.removeprefix("Bearer ")
    if not token.startswith("user:"):
        raise HTTPException(status_code=401, detail="Invalid token")
    # Token de usuário é stateless: apenas "user:<id>" (sem expiração),
    # então o id é extraído direto do token.
    try:
        user_id = int(token.removeprefix("user:"))
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    if user_id <= 0:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user_id


def extract_bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Invalid token")
    return token


def current_admin_id(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> int:
    token = extract_bearer_token(authorization)
    admin_id = admin_repository.get_active_admin_id_by_token_hash(
        db,
        hash_session_token(token),
    )
    if admin_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired admin session")
    return admin_id


def authenticate(db, *, username: str, password: str) -> dict:
    normalized_username = username.strip()
    if not normalized_username:
        raise BusinessRuleError("Invalid username or password")

    admin = admin_repository.get_admin_by_username(db, normalized_username)
    user = user_service.get_user_by_username(db, normalized_username)

    if admin is not None and user is not None:
        raise BusinessRuleError("Invalid username or password")

    if admin is not None:
        result = admin_service.authenticate_admin(
            db,
            username=normalized_username,
            password=password,
        )
        return {
            **result,
            "account_type": "admin",
        }

    if user is not None:
        result = user_service.authenticate(
            db,
            username=normalized_username,
            password=password,
        )
        return {
            **result,
            "account_type": "user",
        }

    raise BusinessRuleError("Invalid username or password")
