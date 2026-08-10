from sqlalchemy import text
from sqlalchemy.orm import Session


def list_players(
    db: Session,
    *,
    name: str | None = None,
    country: str | None = None,
    position: str | None = None,
    limit: int = 50,
):
    sql = """
        SELECT id, ea_id, name, country, position, overall, club,
               photo_url, dominant_foot, height, price
        FROM players
        WHERE 1 = 1
    """
    params = {"limit": limit}

    if name and name.strip():
        sql += " AND name ILIKE :name"
        params["name"] = f"%{name.strip()}%"
    if country:
        sql += " AND country ILIKE :country"
        params["country"] = country
    if position:
        sql += " AND position ILIKE :position"
        params["position"] = position

    sql += " ORDER BY CASE WHEN ea_id IS NOT NULL THEN 0 ELSE 1 END, overall DESC, name ASC LIMIT :limit"
    return db.execute(text(sql), params).mappings().all()


def search_players(db: Session, *, limit: int = 1000):
    result = db.execute(
        text("""
            SELECT id, ea_id, name, country, position, overall, club,
                   photo_url, dominant_foot, height, price
            FROM players
            ORDER BY CASE WHEN ea_id IS NOT NULL THEN 0 ELSE 1 END,
                     overall DESC, name ASC
            LIMIT :limit
        """),
        {"limit": limit},
    )
    return result.mappings().all()


def get_player(db: Session, player_id: int):
    result = db.execute(
        text("""
            SELECT id, ea_id, name, country, position, overall, club,
                   photo_url, dominant_foot, height, price
            FROM players
            WHERE id = :player_id
        """),
        {"player_id": player_id},
    )
    return result.mappings().first()
