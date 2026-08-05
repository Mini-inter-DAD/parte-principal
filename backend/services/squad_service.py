from backend.repositories import player_repository, squad_repository, user_repository
from backend.services.errors import BusinessRuleError, ConflictError, NotFoundError
from backend.services.position_rules import can_play_in_position, same_position
from backend.services.player_service import serialize_player


def list_squad(db, user_id: int):
    if user_repository.get_user(db, user_id) is None:
        raise NotFoundError("User not found")
    rows = squad_repository.list_user_players(db, user_id)

    players = []
    for row in rows:
        data = serialize_player(row)
        data.update({
            "squad_position": row["squad_position"],
            "is_starter": row["is_starter"],
            "acquired_at": row["acquired_at"],
        })
        players.append(data)
    return players


def substitute_players(
    db,
    *,
    user_id: int,
    starter_player_id: int,
    bench_player_id: int,
):
    if starter_player_id == bench_player_id:
        raise BusinessRuleError("Starter and bench player must be different")
    if user_repository.get_user(db, user_id) is None:
        raise NotFoundError("User not found")

    rows = squad_repository.list_players_for_substitution(
        db,
        user_id,
        [starter_player_id, bench_player_id],
    )
    starter = rows.get(starter_player_id)
    bench = rows.get(bench_player_id)
    if starter is None or bench is None:
        raise NotFoundError("Both players must belong to the user's squad")
    if not starter["is_starter"]:
        raise ConflictError("The selected player is not a starter")
    if bench["is_starter"]:
        raise ConflictError("The selected player is not on the bench")

    squad_position = starter["squad_position"] or starter["position"]
    if not can_play_in_position(bench["position"], squad_position):
        raise BusinessRuleError("The bench player is not compatible with this position")
    squad_repository.substitute_players(
        db,
        user_id,
        starter_player_id,
        bench_player_id,
        squad_position,
    )
    db.commit()
    return {
        "message": "Substituição realizada com sucesso",
        "starter_out": starter_player_id,
        "starter_in": bench_player_id,
    }


def assign_position(
    db,
    *,
    user_id: int,
    player_id: int,
    target_position: str,
):
    target_position = target_position.strip().upper()
    if user_repository.get_user(db, user_id) is None:
        raise NotFoundError("User not found")
    if player_id <= 0:
        raise NotFoundError("Player not found")

    rows = squad_repository.list_players_for_position_assignment(
        db,
        user_id,
        player_id,
    )
    player = rows.get(player_id)
    if player is None:
        raise NotFoundError("Player is not in the user's squad")
    if not can_play_in_position(player["position"], target_position):
        raise BusinessRuleError("The player is not compatible with this position")

    replaced_player_ids = [
        current_id
        for current_id, current in rows.items()
        if current_id != player_id
        and current["is_starter"]
        and same_position(current["squad_position"], target_position)
    ]
    if player["is_starter"] and same_position(player["squad_position"], target_position):
        return {
            "message": "O jogador já está nesta posição",
            "player_id": player_id,
            "target_position": target_position,
            "replaced_player_id": None,
        }

    squad_repository.assign_player_to_position(
        db,
        user_id,
        player_id,
        target_position,
        replaced_player_ids,
    )
    db.commit()
    return {
        "message": "Posição atribuída com sucesso",
        "player_id": player_id,
        "target_position": target_position,
        "replaced_player_id": replaced_player_ids[0] if len(replaced_player_ids) == 1 else None,
    }


def move_to_bench(db, *, user_id: int, player_id: int):
    if user_repository.get_user(db, user_id) is None:
        raise NotFoundError("User not found")
    player = squad_repository.get_user_player_for_update(db, user_id, player_id)
    if player is None:
        raise NotFoundError("Player is not in the user's squad")

    squad_repository.move_player_to_bench(db, user_id, player_id)
    db.commit()
    return {
        "message": "Jogador movido para a reserva",
        "player_id": player_id,
    }


def set_starter(db, *, user_id: int, player_id: int, is_starter: bool, squad_position=None):
    if user_repository.get_user(db, user_id) is None:
        raise NotFoundError("User not found")
    if player_repository.get_player(db, player_id) is None:
        raise NotFoundError("Player not found")
    if is_starter and squad_position and not can_play_in_position(
        player_repository.get_player(db, player_id)["position"],
        squad_position,
    ):
        raise BusinessRuleError("The player is not compatible with this position")
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
