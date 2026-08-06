from sqlalchemy import text
from sqlalchemy.orm import Session


def create_user(db: Session, *, username: str, email: str, password_hash: str):
    result = db.execute(
        text("""
            INSERT INTO users (username, email, password_hash)
            VALUES (:username, :email, :password_hash)
            RETURNING id, username, email, coins
        """),
        {
            "username": username,
            "email": email,
            "password_hash": password_hash,
        },
    )
    return result.mappings().one()


def get_user(db: Session, user_id: int, *, for_update: bool = False):
    lock = " FOR UPDATE" if for_update else ""
    result = db.execute(
        text(f"""
            SELECT id, username, email, password_hash, coins
            FROM users
            WHERE id = :user_id{lock}
        """),
        {"user_id": user_id},
    )
    return result.mappings().first()


def get_user_by_username(db: Session, username: str):
    result = db.execute(
        text("""
            SELECT id, username, email, password_hash, coins
            FROM users
            WHERE username = :username
        """),
        {"username": username},
    )
    return result.mappings().first()


def update_coins(db: Session, user_id: int, coins: int):
    result = db.execute(
        text("""
            UPDATE users
            SET coins = :coins
            WHERE id = :user_id
            RETURNING id, username, email, coins
        """),
        {"user_id": user_id, "coins": coins},
    )
    return result.mappings().one()


def list_random_starter_player_ids(db: Session, limit: int = 12) -> list[int]:
    result = db.execute(
        text("""
            SELECT id
            FROM players
            WHERE overall BETWEEN 60 AND 70
            ORDER BY RANDOM()
            LIMIT :limit
        """),
        {"limit": limit},
    )
    return list(result.scalars().all())


def add_players_to_user(db: Session, user_id: int, player_ids: list[int]):
    for index, player_id in enumerate(player_ids):
        position = db.execute(
            text("SELECT position FROM players WHERE id = :player_id"),
            {"player_id": player_id},
        ).scalar_one()
        db.execute(
            text("""
                INSERT INTO user_players (
                    user_id, player_id, is_starter, squad_position
                )
                VALUES (
                    :user_id, :player_id, :is_starter, :squad_position
                )
            """),
            {
                "user_id": user_id,
                "player_id": player_id,
                "is_starter": index < 11,
                "squad_position": position if index < 11 else None,
            },
        )
