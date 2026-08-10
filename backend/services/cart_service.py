from sqlalchemy.exc import IntegrityError

from backend.repositories import cart_repository, player_repository, user_repository
from backend.services.errors import BusinessRuleError, ConflictError, NotFoundError
from backend.services.player_pricing import calculate_player_price
from backend.services.player_service import serialize_player


def _cart_response(db, user_id: int, user=None) -> dict:
    user = user or user_repository.get_user(db, user_id)
    if user is None:
        raise NotFoundError("Usuário não encontrado")

    items = [
        serialize_player(player)
        for player in cart_repository.list_cart_items(db, user_id)
    ]
    return {
        "user_id": user_id,
        "items": items,
        "total": sum(player["price"] for player in items),
        "coins": user["coins"],
    }


def list_cart(db, user_id: int):
    return _cart_response(db, user_id)


def add_item(db, *, user_id: int, player_id: int):
    try:
        if user_repository.get_user(db, user_id) is None:
            raise NotFoundError("Usuário não encontrado")
        if player_repository.get_player(db, player_id) is None:
            raise NotFoundError("Jogador não encontrado")
        if cart_repository.user_owns_player(db, user_id, player_id):
            raise ConflictError("Você já possui esse jogador")
        if cart_repository.cart_contains_player(db, user_id, player_id):
            raise ConflictError("Jogador já está no carrinho")

        cart_repository.add_item(db, user_id, player_id)
        db.commit()
        return _cart_response(db, user_id)
    except (NotFoundError, ConflictError):
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError("Jogador já está no carrinho") from exc


def remove_item(db, *, user_id: int, player_id: int):
    if user_repository.get_user(db, user_id) is None:
        raise NotFoundError("Usuário não encontrado")
    if not cart_repository.remove_item(db, user_id, player_id):
        db.rollback()
        raise NotFoundError("Jogador não está no carrinho")
    db.commit()
    return _cart_response(db, user_id)


def clear_cart(db, user_id: int):
    user = user_repository.get_user(db, user_id)
    if user is None:
        raise NotFoundError("Usuário não encontrado")
    cart_repository.clear_cart(db, user_id)
    db.commit()
    return _cart_response(db, user_id, user=user)


def checkout(db, user_id: int):
    try:
        # Compra é tudo ou nada: bloqueia o usuário e os itens do carrinho
        # com FOR UPDATE para manter moedas e posse consistentes sob concorrência.
        user = user_repository.get_user(db, user_id, for_update=True)
        if user is None:
            raise NotFoundError("Usuário não encontrado")

        players = cart_repository.list_cart_items(db, user_id, for_update=True)
        if not players:
            raise BusinessRuleError("Carrinho vazio")

        for player in players:
            if cart_repository.user_owns_player(db, user_id, player["id"]):
                raise ConflictError(
                    f"Você já possui o jogador {player['name']}"
                )

        purchases = [
            {
                "player_id": player["id"],
                "price_paid": calculate_player_price(player["overall"]),
            }
            for player in players
        ]
        total = sum(purchase["price_paid"] for purchase in purchases)
        if user["coins"] < total:
            raise BusinessRuleError(
                f"Moedas insuficientes. Saldo atual: {user['coins']}; "
                f"valor total: {total}"
            )

        updated_user = user_repository.update_coins(
            db,
            user_id,
            user["coins"] - total,
        )
        player_ids = [purchase["player_id"] for purchase in purchases]
        cart_repository.add_players_to_user(db, user_id, player_ids)
        cart_repository.register_transactions(db, user_id, purchases)
        cart_repository.clear_cart(db, user_id)
        db.commit()

        return {
            "message": "Compra finalizada com sucesso",
            "user_id": user_id,
            "player_ids": player_ids,
            "total": total,
            "coins": updated_user["coins"],
        }
    except (NotFoundError, ConflictError, BusinessRuleError):
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError("Não foi possível finalizar a compra") from exc
