from sqlalchemy.exc import IntegrityError

from backend.repositories import market_repository, player_repository, user_repository
from backend.services.errors import BusinessRuleError, ConflictError, NotFoundError
from backend.services.player_formatters import source_nationality
from backend.services.player_pricing import calculate_player_price
from backend.services.player_service import serialize_player
from backend.services.search_utils import compact_search


def section_for_overall(overall: int) -> str:
    if overall >= 90:
        return "Estrelas"
    if overall >= 85:
        return "Destaques da Copa"
    return "Veteranos"


def list_market(
    db,
    *,
    query=None,
    country=None,
    position=None,
    overall_min=None,
    overall_max=None,
    price_min=None,
    price_max=None,
    section=None,
    limit=100,
):
    if overall_min is not None and overall_max is not None and overall_min > overall_max:
        raise BusinessRuleError("overall minimum cannot be greater than maximum")
    if price_min is not None and price_max is not None and price_min > price_max:
        raise BusinessRuleError("price minimum cannot be greater than maximum")

    players = []
    normalized_query = compact_search(query) if query else ""
    for player in market_repository.list_market_players(
        db,
        name=None,
        country=source_nationality(country) if country else None,
        position=position,
        overall_min=overall_min,
        overall_max=overall_max,
        limit=1000,
    ):
        if normalized_query and normalized_query not in compact_search(player["name"]):
            continue
        data = serialize_player(player)
        data["section"] = section_for_overall(data["overall"])
        if price_min is not None and data["price"] < price_min:
            continue
        if price_max is not None and data["price"] > price_max:
            continue
        if not section or data["section"].lower() == section.lower():
            players.append(data)
    return players[:limit]


def list_sections():
    return ["Estrelas", "Destaques da Copa", "Veteranos"]


def buy_player(db, *, user_id: int, player_id: int):
    try:
        user = user_repository.get_user(db, user_id, for_update=True)
        if user is None:
            raise NotFoundError("User not found")

        player = player_repository.get_player(db, player_id)
        if player is None:
            raise NotFoundError("Player not found")

        if market_repository.user_owns_player(db, user_id, player_id):
            raise ConflictError("User already owns this player")

        price = calculate_player_price(player["overall"])
        if user["coins"] < price:
            raise BusinessRuleError("Insufficient coins")

        updated_user = user_repository.update_coins(
            db,
            user_id,
            user["coins"] - price,
        )
        market_repository.add_player_to_user(db, user_id, player_id)
        market_repository.register_transaction(db, user_id, player_id, price)
        db.commit()

        return {
            "message": "Player purchased successfully",
            "user_id": user_id,
            "player_id": player_id,
            "price_paid": price,
            "coins": updated_user["coins"],
        }
    except (NotFoundError, ConflictError, BusinessRuleError):
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError("Player could not be added to the squad") from exc
