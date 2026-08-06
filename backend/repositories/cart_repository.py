from sqlalchemy import text
from sqlalchemy.orm import Session


def list_cart_items(db: Session, user_id: int, *, for_update: bool = False):
    lock = " FOR UPDATE OF ci" if for_update else ""
    result = db.execute(
        text(f"""
            SELECT p.id, p.ea_id, p.name, p.country, p.position, p.overall,
                   p.club, p.photo_url, p.dominant_foot, p.height, p.price,
                   ci.created_at
            FROM cart_items ci
            JOIN players p ON p.id = ci.player_id
            WHERE ci.user_id = :user_id
            ORDER BY ci.created_at ASC, ci.id ASC{lock}
        """),
        {"user_id": user_id},
    )
    return result.mappings().all()


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


def cart_contains_player(db: Session, user_id: int, player_id: int) -> bool:
    result = db.execute(
        text("""
            SELECT 1
            FROM cart_items
            WHERE user_id = :user_id AND player_id = :player_id
        """),
        {"user_id": user_id, "player_id": player_id},
    )
    return result.first() is not None


def add_item(db: Session, user_id: int, player_id: int):
    db.execute(
        text("""
            INSERT INTO cart_items (user_id, player_id)
            VALUES (:user_id, :player_id)
        """),
        {"user_id": user_id, "player_id": player_id},
    )


def remove_item(db: Session, user_id: int, player_id: int) -> bool:
    result = db.execute(
        text("""
            DELETE FROM cart_items
            WHERE user_id = :user_id AND player_id = :player_id
        """),
        {"user_id": user_id, "player_id": player_id},
    )
    return result.rowcount > 0


def clear_cart(db: Session, user_id: int):
    db.execute(
        text("DELETE FROM cart_items WHERE user_id = :user_id"),
        {"user_id": user_id},
    )


def add_players_to_user(db: Session, user_id: int, player_ids: list[int]):
    db.execute(
        text("""
            INSERT INTO user_players (user_id, player_id)
            VALUES (:user_id, :player_id)
        """),
        [
            {"user_id": user_id, "player_id": player_id}
            for player_id in player_ids
        ],
    )


def register_transactions(db: Session, user_id: int, purchases: list[dict]):
    db.execute(
        text("""
            INSERT INTO transactions (user_id, player_id, price_paid)
            VALUES (:user_id, :player_id, :price_paid)
        """),
        [
            {
                "user_id": user_id,
                "player_id": purchase["player_id"],
                "price_paid": purchase["price_paid"],
            }
            for purchase in purchases
        ],
    )
