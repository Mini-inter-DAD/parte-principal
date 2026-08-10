from backend.repositories import squad_repository, user_repository
from backend.services.errors import BusinessRuleError, ConflictError, NotFoundError
from backend.services.position_rules import (
    can_play_in_slot,
    get_slot_base_position,
    same_slot,
)
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

    squad_position = starter["squad_position"]
    if not squad_position or not can_play_in_slot(bench["position"], squad_position):
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
    target_slot: str,
):
    target_slot = target_slot.strip().upper()
    if get_slot_base_position(target_slot) is None:
        raise BusinessRuleError("Invalid squad slot")
    if user_repository.get_user(db, user_id) is None:
        raise NotFoundError("User not found")
    if player_id <= 0:
        raise NotFoundError("Player not found")

    rows = squad_repository.list_players_for_position_assignment(
        db,
        user_id,
        player_id,
        target_slot,
    )
    player = rows.get(player_id)
    if player is None:
        raise NotFoundError("Player is not in the user's squad")
    if not can_play_in_slot(player["position"], target_slot):
        raise BusinessRuleError("Jogador não pode atuar nessa posição")

    replaced_player_ids = [
        current_id
        for current_id, current in rows.items()
        if current_id != player_id
        and current["is_starter"]
        and same_slot(current["squad_position"], target_slot)
    ]
    starter_count = squad_repository.count_valid_starters(db, user_id)
    if not player["is_starter"] and not replaced_player_ids and starter_count >= 11:
        raise BusinessRuleError(
            "O elenco já possui 11 titulares. Substitua um titular ou envie um deles para a reserva."
        )
    if player["is_starter"] and same_slot(player["squad_position"], target_slot):
        return {
            "message": "O jogador já está nesta posição",
            "player_id": player_id,
            "target_slot": target_slot,
            "target_position": target_slot,
            "replaced_player_id": None,
        }

    updated = squad_repository.assign_player_to_position(
        db,
        user_id,
        player_id,
        target_slot,
        replaced_player_ids,
    )
    verified = squad_repository.get_user_player_for_update(db, user_id, player_id)
    if (
        updated is None
        or verified is None
        or not verified["is_starter"]
        or not same_slot(verified["squad_position"], target_slot)
    ):
        db.rollback()
        raise ConflictError("The player was not assigned to the target position")

    for replaced_player_id in replaced_player_ids:
        replaced = squad_repository.get_user_player_for_update(
            db,
            user_id,
            replaced_player_id,
        )
        if replaced is None or replaced["is_starter"] or replaced["squad_position"] is not None:
            db.rollback()
            raise ConflictError("The previous starter was not moved to the bench")

    db.commit()
    return {
        "message": "Posição atribuída com sucesso",
        "player_id": player_id,
        "target_slot": target_slot,
        "target_position": target_slot,
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
    if is_starter:
        if not squad_position:
            raise BusinessRuleError("Informe uma posição válida para o titular")
        return assign_position(
            db,
            user_id=user_id,
            player_id=player_id,
            target_slot=squad_position,
        )

    return move_to_bench(db, user_id=user_id, player_id=player_id)
