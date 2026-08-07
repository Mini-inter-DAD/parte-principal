import hashlib
import hmac
import secrets

from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from backend.repositories import activity_repository, user_repository
from backend.services.errors import ConflictError, NotFoundError, BusinessRuleError


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
    return f"pbkdf2_sha256$120000${salt.hex()}${digest.hex()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, iterations, salt_hex, digest_hex = encoded.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode(),
            bytes.fromhex(salt_hex),
            int(iterations),
        )
        return hmac.compare_digest(digest.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def public_user(user) -> dict:
    return {
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "coins": user["coins"],
    }


def create_user(db, *, username: str, password: str, email: str | None = None):
    email = email or f"{username}@dreamcup.local"
    try:
        if user_repository.username_exists_anywhere(db, username):
            raise ConflictError("Username already exists")

        user = user_repository.create_user(
            db,
            username=username,
            email=email,
            password_hash=hash_password(password),
        )
        starter_player_ids = user_repository.list_random_starter_player_ids(db)
        if len(starter_player_ids) < 12:
            raise BusinessRuleError(
                "Não há jogadores suficientes com overall entre 60 e 70"
            )
        user_repository.add_players_to_user(db, user["id"], starter_player_ids)
        db.commit()
        return public_user(user)
    except BusinessRuleError:
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError("Username or email already exists") from exc


def authenticate(db, *, username: str, password: str):
    user = user_repository.get_user_by_username(db, username)
    if user is None or not verify_password(password, user["password_hash"]):
        raise BusinessRuleError("Invalid username or password")

    try:
        activity_repository.record_user_activity(
            db,
            user_id=user["id"],
            event_type="login",
        )
        db.commit()
    except SQLAlchemyError:
        db.rollback()

    return {
        "token": f"user:{user['id']}",
        "user": public_user(user),
    }


def get_user(db, user_id: int):
    user = user_repository.get_user(db, user_id)
    if user is None:
        raise NotFoundError("User not found")
    return public_user(user)


def get_user_by_username(db, username: str):
    return user_repository.get_user_by_username(db, username)
