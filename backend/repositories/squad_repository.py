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


def list_players_for_substitution(db: Session, user_id: int, player_ids: list[int]):
    result = db.execute(
        text("""
            SELECT up.player_id, up.is_starter, up.squad_position, p.position
            FROM user_players up
            JOIN players p ON p.id = up.player_id
            WHERE up.user_id = :user_id
              AND up.player_id IN (:starter_player_id, :bench_player_id)
            FOR UPDATE OF up
        """),
        {
            "user_id": user_id,
            "starter_player_id": player_ids[0],
            "bench_player_id": player_ids[1],
        },
    )
    return {row["player_id"]: row for row in result.mappings().all()}


def substitute_players(
    db: Session,
    user_id: int,
    starter_player_id: int,
    bench_player_id: int,
    squad_position: str | None,
):
    db.execute(
        text("""
            UPDATE user_players
            SET is_starter = FALSE, squad_position = NULL
            WHERE user_id = :user_id AND player_id = :player_id
        """),
        {"user_id": user_id, "player_id": starter_player_id},
    )
    db.execute(
        text("""
            UPDATE user_players
            SET is_starter = TRUE, squad_position = :squad_position
            WHERE user_id = :user_id AND player_id = :player_id
        """),
        {
            "user_id": user_id,
            "player_id": bench_player_id,
            "squad_position": squad_position,
        },
    )


def initialize_default_starters(db: Session, user_id: int):
    db.execute(
        text("""
            WITH defaults AS (
                SELECT up.id, p.position
                FROM user_players up
                JOIN players p ON p.id = up.player_id
                WHERE up.user_id = :user_id
                ORDER BY up.acquired_at ASC, up.id ASC
                LIMIT 11
            )
            UPDATE user_players up
            SET is_starter = TRUE,
                squad_position = defaults.position
            FROM defaults
            WHERE up.id = defaults.id
        """),
        {"user_id": user_id},
    )


def list_players_for_position_assignment(
    db: Session,
    user_id: int,
    player_id: int,
):
    result = db.execute(
        text("""
            SELECT up.player_id, up.is_starter, up.squad_position, p.position
            FROM user_players up
            JOIN players p ON p.id = up.player_id
            WHERE up.user_id = :user_id
              AND (
                  up.player_id = :player_id
                  OR up.is_starter = TRUE
              )
            FOR UPDATE OF up
        """),
        {
            "user_id": user_id,
            "player_id": player_id,
        },
    )
    return {row["player_id"]: row for row in result.mappings().all()}


def assign_player_to_position(
    db: Session,
    user_id: int,
    player_id: int,
    target_position: str,
    replaced_player_ids: list[int],
):
    for replaced_player_id in replaced_player_ids:
        db.execute(
            text("""
                UPDATE user_players
                SET is_starter = FALSE, squad_position = NULL
                WHERE user_id = :user_id AND player_id = :player_id
            """),
            {"user_id": user_id, "player_id": replaced_player_id},
        )
    db.execute(
        text("""
            UPDATE user_players
            SET is_starter = FALSE, squad_position = NULL
            WHERE user_id = :user_id AND player_id = :player_id
        """),
        {"user_id": user_id, "player_id": player_id},
    )
    db.execute(
        text("""
            UPDATE user_players
            SET is_starter = TRUE, squad_position = :target_position
            WHERE user_id = :user_id AND player_id = :player_id
        """),
        {
            "user_id": user_id,
            "player_id": player_id,
            "target_position": target_position,
        },
    )


def get_user_player_for_update(db: Session, user_id: int, player_id: int):
    result = db.execute(
        text("""
            SELECT up.player_id, up.is_starter, up.squad_position, p.position
            FROM user_players up
            JOIN players p ON p.id = up.player_id
            WHERE up.user_id = :user_id AND up.player_id = :player_id
            FOR UPDATE OF up
        """),
        {"user_id": user_id, "player_id": player_id},
    )
    return result.mappings().first()


def move_player_to_bench(db: Session, user_id: int, player_id: int):
    result = db.execute(
        text("""
            UPDATE user_players
            SET is_starter = FALSE, squad_position = NULL
            WHERE user_id = :user_id AND player_id = :player_id
            RETURNING player_id, is_starter, squad_position
        """),
        {"user_id": user_id, "player_id": player_id},
    )
    return result.mappings().first()
