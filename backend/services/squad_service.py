from backend.repositories import player_repository, squad_repository, user_repository
from backend.services.errors import NotFoundError
from backend.services.player_service import serialize_player


def list_squad(db, user_id: int):
    if user_repository.get_user(db, user_id) is None:
        raise NotFoundError("User not found")
    players = []
    for row in squad_repository.list_user_players(db, user_id):
        data = serialize_player(row)
        data.update({
            "squad_position": row["squad_position"],
            "is_starter": row["is_starter"],
            "acquired_at": row["acquired_at"],
        })
        players.append(data)
    return players


def set_starter(db, *, user_id: int, player_id: int, is_starter: bool, squad_position=None):
    if user_repository.get_user(db, user_id) is None:
        raise NotFoundError("User not found")
    if player_repository.get_player(db, player_id) is None:
        raise NotFoundError("Player not found")
    updated = squad_repository.update_starter(
        db,
        user_id,
        player_id,
        is_starter,
        squad_position,
    )
    if updated is None:
        raise NotFoundError("Player is not in the user's squad")
    db.commit()
    return dict(updated)
