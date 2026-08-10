from sqlalchemy import text
from sqlalchemy.orm import Session


def list_market_players(
    db: Session,
    *,
    name: str | None = None,
    country: str | None = None,
    position: str | None = None,
    overall_min: int | None = None,
    overall_max: int | None = None,
    limit: int = 100,
):
    sql = """
        SELECT id, ea_id, name, country, position, overall, club,
               photo_url, dominant_foot, height, price
        FROM players
        WHERE 1 = 1
    """
    params = {"limit": limit}
    filters = [
        (name, " AND name ILIKE :name", "name", lambda value: f"%{value}%"),
        (country, " AND country ILIKE :country", "country", lambda value: value),
        (position, " AND position ILIKE :position", "position", lambda value: value),
    ]
    for value, clause, key, transform in filters:
        if value:
            sql += clause
            params[key] = transform(value)
    if overall_min is not None:
        sql += " AND overall >= :overall_min"
        params["overall_min"] = overall_min
    if overall_max is not None:
        sql += " AND overall <= :overall_max"
        params["overall_max"] = overall_max
    sql += " ORDER BY CASE WHEN ea_id IS NOT NULL THEN 0 ELSE 1 END, overall DESC, price DESC, name ASC LIMIT :limit"
    return db.execute(text(sql), params).mappings().all()


def user_owns_player(db: Session, user_id: int, player_id: int) -> bool:
    result = db.execute(
        text("""
            SELECT 1
            FROM user_players
            WHERE user_id = :user_id AND player_id = :player_id
        """),
        {"user_id": user_id, "player_id": player_id},
    )
    return result.first() is not None


def add_player_to_user(db: Session, user_id: int, player_id: int):
    db.execute(
        text("""
            INSERT INTO user_players (user_id, player_id)
            VALUES (:user_id, :player_id)
        """),
        {"user_id": user_id, "player_id": player_id},
    )


def register_transaction(db: Session, user_id: int, player_id: int, price: int):
    db.execute(
        text("""
            INSERT INTO transactions (user_id, player_id, price_paid)
            VALUES (:user_id, :player_id, :price)
        """),
        {"user_id": user_id, "player_id": player_id, "price": price},
    )
