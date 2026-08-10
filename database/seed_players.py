import csv
import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy import text

try:
    from database.connection import engine
except ModuleNotFoundError:
    from connection import engine
from backend.services.player_pricing import calculate_player_price

OUTPUT_FILE = PROJECT_ROOT / "output" / "players.json"
ARTIFACT_FILE = PROJECT_ROOT / "artifacts" / "players.json"
PLAYERS_FILE = OUTPUT_FILE if OUTPUT_FILE.exists() else ARTIFACT_FILE
EA_PLAYERS_FILE = PROJECT_ROOT / "data" / "ea_fc26_players.csv"


def calculate_price(overall: int) -> int:
    return calculate_player_price(overall)


def load_ea_positions() -> dict[int, str]:
    with open(EA_PLAYERS_FILE, encoding="utf-8-sig", newline="") as csv_file:
        return {
            int(row["id"]): row["position"].strip().upper()
            for row in csv.DictReader(csv_file)
            if row.get("id") and row.get("position")
        }


def seed_players():

    if not PLAYERS_FILE.exists():
        raise FileNotFoundError(
            "No player data found in output/players.json or artifacts/players.json"
        )

    with open(PLAYERS_FILE, encoding="utf-8") as f:
        players = json.load(f)
    ea_positions = load_ea_positions()

    inserted = 0

    with engine.begin() as conn:

        for player in players:

            player_data = {
                "ea_id": player.get("ea_id"),
                "name": player.get("name"),
                "country": player.get("nationality"),
                "position": ea_positions.get(
                    player.get("ea_id"),
                    player.get("position"),
                ),
                "overall": player.get("overall"),
                "club": player.get("club"),
                "photo_url": player.get("photo"),
                "price": calculate_price(player.get("overall", 70)),
            }

            if player_data["ea_id"] is None:
                existing_id = conn.execute(
                    text("""
                        SELECT id
                        FROM players
                        WHERE ea_id IS NULL
                          AND name = :name
                          AND country = :country
                          AND position = :position
                          AND overall = :overall
                          AND club IS NOT DISTINCT FROM :club
                          AND photo_url IS NOT DISTINCT FROM :photo_url
                        LIMIT 1
                    """),
                    player_data,
                ).scalar()
                if existing_id is not None:
                    conn.execute(
                        text("UPDATE players SET price = :price WHERE id = :id"),
                        {"id": existing_id, "price": player_data["price"]},
                    )
                    inserted += 1
                    continue

            conn.execute(
                text("""
                    INSERT INTO players (
                        ea_id,
                        name,
                        country,
                        position,
                        overall,
                        club,
                        photo_url,
                        price
                    )
                    VALUES (
                        :ea_id,
                        :name,
                        :country,
                        :position,
                        :overall,
                        :club,
                        :photo_url,
                        :price
                    )
                    ON CONFLICT (ea_id) DO UPDATE
                    SET position = EXCLUDED.position,
                        price = EXCLUDED.price
                """),
                player_data
            )

            inserted += 1

    print(f"{inserted} jogadores processados")


if __name__ == "__main__":
    seed_players()
