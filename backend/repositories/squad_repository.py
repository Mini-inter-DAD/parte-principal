from sqlalchemy import text
from sqlalchemy.orm import Session


def list_user_players(db: Session, user_id: int):
    result = db.execute(
        text("""
            SELECT p.id, p.ea_id, p.name, p.country, p.position, p.overall,
                   p.club, p.photo_url, p.dominant_foot, p.height, p.price,
                   up.squad_position, up.is_starter, up.acquired_at
            FROM user_players up
            JOIN players p ON p.id = up.player_id
            WHERE up.user_id = :user_id
            ORDER BY up.is_starter DESC, p.overall DESC, p.name ASC
        """),
        {"user_id": user_id},
    )
    return result.mappings().all()


def update_starter(
    db: Session,
    user_id: int,
    player_id: int,
    is_starter: bool,
    squad_position: str | None,
):
    result = db.execute(
        text("""
            UPDATE user_players
            SET is_starter = :is_starter,
                squad_position = :squad_position
            WHERE user_id = :user_id AND player_id = :player_id
            RETURNING user_id, player_id, is_starter, squad_position
        """),
        {
            "user_id": user_id,
            "player_id": player_id,
            "is_starter": is_starter,
            "squad_position": squad_position,
        },
    )
    return result.mappings().first()
