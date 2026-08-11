from backend.repositories import player_repository
from backend.services.errors import NotFoundError
from backend.services.player_formatters import (
    format_player_name,
    country_code,
    source_nationality,
    translate_nationality,
)
from backend.services.player_pricing import calculate_player_price
from backend.services.search_utils import compact_search


def serialize_player(player) -> dict:
    data = dict(player)
    data["name"] = format_player_name(data["name"], ea_id=data.get("ea_id"))
    data["nationality_pt"] = translate_nationality(data["country"])
    data["nationality"] = data["nationality_pt"]
    data["country_code"] = country_code(data["country"])
    data["ovr"] = data["overall"]
    data["photo"] = data["photo_url"]
    data["price"] = calculate_player_price(data["overall"])
    return data


def list_players(db, *, name=None, country=None, position=None, limit=50):
    players = player_repository.list_players(
        db,
        name=name,
        country=source_nationality(country) if country else None,
        position=position,
        limit=limit,
    )
    return [serialize_player(player) for player in players]


def get_player(db, player_id: int):
    player = player_repository.get_player(db, player_id)
    if player is None:
        raise NotFoundError("Player not found")
    return serialize_player(player)


def search_players(db, query: str, limit: int = 50):
    normalized_query = compact_search(query)
    if not normalized_query:
        return []

    players = player_repository.search_players(db, limit=1000)
    matches = [
        player
        for player in players
        if normalized_query in compact_search(player["name"])
    ]
    return [serialize_player(player) for player in matches[:limit]]
