from sqlalchemy import text
from sqlalchemy.orm import Session


INITIAL_STARTER_SLOTS = (
    "GK", "LB", "CB1", "CB2", "RB", "CM1", "CM2", "CM3", "LW", "RW", "ST"
)

INITIAL_SLOT_CANDIDATES = {
    "GK": ("GK",),
    "LB": ("LB", "LWB"),
    "LWB": ("LWB", "LB"),
    "CB": ("CB1", "CB2", "CB3"),
    "DF": ("CB1", "CB2", "CB3"),
    "RB": ("RB", "RWB"),
    "RWB": ("RWB", "RB"),
    "CDM": ("CM1", "CM2", "CM3", "CDM1", "CDM2"),
    "CM": ("CM1", "CM2", "CM3", "CAM", "CDM1", "CDM2"),
    "MC": ("CM1", "CM2", "CM3"),
    "MF": ("CM1", "CM2", "CM3", "CAM"),
    "CAM": ("CAM", "CM1", "CM2", "CM3"),
    "LM": ("LM", "LW"),
    "LW": ("LW", "LM"),
    "RM": ("RM", "RW"),
    "RW": ("RW", "RM"),
    "ST": ("ST", "ST1", "ST2"),
    "CF": ("ST", "ST1", "ST2"),
    "FW": ("ST", "ST1", "ST2"),
}


def _initial_squad_position(position: str, used_slots: set[str]) -> str:
    normalized_position = str(position or "").strip().upper()
    for slot in INITIAL_SLOT_CANDIDATES.get(normalized_position, ()):
        if slot not in used_slots:
            return slot
    for slot in INITIAL_STARTER_SLOTS:
        if slot not in used_slots:
            return slot
    return ""


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


def username_exists_anywhere(db: Session, username: str) -> bool:
    result = db.execute(
        text("""
            SELECT EXISTS (
                SELECT 1
                FROM users
                WHERE LOWER(username) = LOWER(:username)
            )
            OR EXISTS (
                SELECT 1
                FROM admins
                WHERE LOWER(username) = LOWER(:username)
            )
        """),
        {"username": username},
    )
    return bool(result.scalar_one())


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
    used_slots: set[str] = set()
    for index, player_id in enumerate(player_ids):
        position = db.execute(
            text("SELECT position FROM players WHERE id = :player_id"),
            {"player_id": player_id},
        ).scalar_one()
        is_starter = index < 11
        squad_position = _initial_squad_position(position, used_slots) if is_starter else None
        if is_starter and not squad_position:
            raise ValueError("Could not assign a unique initial squad position")
        if squad_position:
            used_slots.add(squad_position)
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
                "is_starter": is_starter,
                "squad_position": squad_position,
            },
        )
