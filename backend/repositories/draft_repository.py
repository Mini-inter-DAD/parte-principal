from sqlalchemy import text
from sqlalchemy.orm import Session


def list_user_overalls(db: Session, user_id: int):
    result = db.execute(
        text("""
            SELECT p.overall
            FROM user_players up
            JOIN players p ON p.id = up.player_id
            WHERE up.user_id = :user_id
            ORDER BY up.is_starter DESC, p.overall DESC, p.name ASC
            LIMIT 11
        """),
        {"user_id": user_id},
    )
    return [row["overall"] for row in result.mappings().all()]


def create_match(
    db: Session,
    *,
    user_id: int,
    user_ovr: int,
    opponent_name: str,
    opponent_ovr: int,
    user_score: int,
    opponent_score: int,
    result: str,
    coins_earned: int,
):
    created = db.execute(
        text("""
            INSERT INTO matches (
                user_id, user_ovr, opponent_name, opponent_ovr,
                user_score, opponent_score, result, coins_earned
            )
            VALUES (
                :user_id, :user_ovr, :opponent_name, :opponent_ovr,
                :user_score, :opponent_score, :result, :coins_earned
            )
            RETURNING id, user_id, user_ovr, opponent_name, opponent_ovr,
                      user_score, opponent_score, result, coins_earned, played_at
        """),
        {
            "user_id": user_id,
            "user_ovr": user_ovr,
            "opponent_name": opponent_name,
            "opponent_ovr": opponent_ovr,
            "user_score": user_score,
            "opponent_score": opponent_score,
            "result": result,
            "coins_earned": coins_earned,
        },
    )
    return created.mappings().one()


def list_history(db: Session, user_id: int, limit: int = 20):
    result = db.execute(
        text("""
            SELECT id, user_ovr, opponent_name, opponent_ovr,
                   user_score, opponent_score, result, coins_earned, played_at
            FROM matches
            WHERE user_id = :user_id
            ORDER BY played_at DESC, id DESC
            LIMIT :limit
        """),
        {"user_id": user_id, "limit": limit},
    )
    return result.mappings().all()
